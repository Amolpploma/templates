const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
    constructor(dbPath) {
        if (!dbPath) {
            throw new Error('Database path is required');
        }
        
        console.log('Usando banco de dados em:', dbPath);
        
        this.db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error('Erro ao conectar ao banco:', err);
            } else {
                console.log('Conectado ao banco SQLite');
            }
        });

        // Criar índices para otimizar buscas
        this.db.exec(`
            CREATE INDEX IF NOT EXISTS idx_modelos_nome ON modelos(nome);
            CREATE INDEX IF NOT EXISTS idx_modelos_tag ON modelos(tag);
            CREATE INDEX IF NOT EXISTS idx_modelos_modelo ON modelos(modelo);
            CREATE INDEX IF NOT EXISTS idx_checklists_nome ON checklists(nome);
            CREATE INDEX IF NOT EXISTS idx_checklists_tag ON checklists(tag);
        `);
    }

    // Função auxiliar para construir a query de busca em modelos
    #buildModelosSearchQuery(filters) {
        const conditions = [];
        const params = [];

        // Dividir o termo de pesquisa em palavras
        const termos = filters.termo.split(/\s+/);

        // Para cada palavra, adicionar uma condição LIKE para cada campo
        termos.forEach(termo => {
            const termoConditions = [];

            if (filters.nome) {
                termoConditions.push(`nome LIKE '%' || ? || '%'`);
                params.push(termo);
            }

            if (filters.etiqueta) {
                termoConditions.push(`EXISTS (
                    SELECT 1 FROM json_each(tag) 
                    WHERE value LIKE '%' || ? || '%'
                )`);
                params.push(termo);
            }

            if (filters.conteudo) {
                termoConditions.push(`modelo LIKE '%' || ? || '%'`);
                params.push(termo);
            }

            // Combinar as condições de cada palavra com OR
            if (termoConditions.length > 0) {
                conditions.push(`(${termoConditions.join(' OR ')})`);
            }
        });

        // Combinar as condições de todas as palavras com AND
        const whereClause = conditions.length > 0
            ? 'WHERE ' + conditions.join(' AND ')
            : '';

        return {
            query: `
                SELECT 
                    id,
                    nome,
                    tag,
                    modelo
                FROM modelos
                ${whereClause}
                LIMIT 100
            `,
            params: params
        };
    }

    async buscarModelos(termo, filtros = { nome: true, etiqueta: false, conteudo: false }) {
        if (!filtros.nome && !filtros.etiqueta && !filtros.conteudo) {
            filtros.nome = true; // Garantir pelo menos um filtro ativo
        }
        
        const { query, params } = this.#buildModelosSearchQuery({
            termo,
            ...filtros
        });

        return new Promise((resolve, reject) => {
            this.db.all(query, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    async buscarChecklists(termo) {
        return new Promise((resolve, reject) => {
            this.db.all(`
                WITH RECURSIVE
                split_tags(id, nome, tag_value, checklist, modelo_id) AS (
                    SELECT 
                        id,
                        nome,
                        json_each.value,
                        checklist,
                        modelo_id
                    FROM checklists, json_each(checklists.tag)
                )
                SELECT DISTINCT
                    c.id,
                    c.nome,
                    c.tag,
                    c.checklist,
                    c.modelo_id,
                    CASE 
                        WHEN c.nome LIKE ? THEN 3
                        WHEN st.tag_value LIKE ? THEN 2
                        ELSE 1
                    END as relevance
                FROM checklists c
                LEFT JOIN split_tags st ON c.id = st.id
                WHERE 
                    c.nome LIKE ? OR
                    st.tag_value LIKE ? OR
                    EXISTS (
                        SELECT 1
                        FROM json_each(c.checklist) checklist_items
                        WHERE 
                            json_extract(checklist_items.value, '$.descrição') LIKE ? OR
                            json_extract(checklist_items.value, '$.descricao') LIKE ?
                    )
                ORDER BY relevance DESC, c.nome COLLATE NOCASE
                LIMIT 100
            `, [
                `%${termo}%`, `%${termo}%`,
                `%${termo}%`, `%${termo}%`,
                `%${termo}%`, `%${termo}%`
            ], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    // Métodos de manipulação com validação JSON
    async inserirModelo(nome, tag, modelo) {
        try {
            const tagArray = this.#validarJSON(tag);
            return new Promise((resolve, reject) => {
                this.db.run(
                    'INSERT INTO modelos (nome, tag, modelo) VALUES (?, ?, ?)',
                    [nome, JSON.stringify(tagArray), modelo],
                    function(err) {
                        if (err) reject(err);
                        else resolve(this.lastID);
                    }
                );
            });
        } catch (err) {
            throw new Error(`Erro ao validar JSON: ${err.message}`);
        }
    }

    #validarJSON(data) {
        if (typeof data === 'string') {
            try {
                return JSON.parse(data);
            } catch (e) {
                throw new Error('JSON inválido');
            }
        }
        return Array.isArray(data) ? data : [data];
    }

    buscarChecklists(termo) {
        return new Promise((resolve, reject) => {
            this.db.all(
                `SELECT * FROM checklists 
                WHERE nome LIKE ? 
                OR EXISTS (
                    SELECT 1 
                    FROM json_each(tag) 
                    WHERE value LIKE ?
                )
                ORDER BY nome COLLATE NOCASE`,
                [`%${termo}%`, `%${termo}%`],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });
    }

    atualizarModelo(id, nome, tag, modelo) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'UPDATE modelos SET nome = ?, tag = ?, modelo = ? WHERE id = ?',
                [nome, tag, modelo, id],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.changes);
                }
            );
        });
    }

    deletarModelo(id) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'DELETE FROM modelos WHERE id = ?',
                [id],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.changes);
                }
            );
        });
    }

    obterModeloPorId(id) {
        return new Promise((resolve, reject) => {
            this.db.get(
                'SELECT * FROM modelos WHERE id = ?',
                [id],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });
    }

    fecharConexao() {
        this.db.close();
    }
}

// Exportar uma função factory ao invés de uma instância
module.exports = function(dbPath) {
    return new Database(dbPath);
};
