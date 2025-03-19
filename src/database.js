const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
    constructor(dbPath) {
        if (!dbPath) throw new Error('Database path is required');
        this.dbPath = dbPath;
    }

    async executarQuery(query, params = []) {
        return new Promise((resolve, reject) => {
            const db = new sqlite3.Database(this.dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
                if (err) {
                    reject(err);
                    return;
                }

                db.exec(`PRAGMA journal_mode = WAL; PRAGMA synchronous = NORMAL; PRAGMA busy_timeout = 5000;`, (err) => {
                    if (err) {
                        reject(err);
                        db.close();
                        return;
                    }

                    db.all(query, params, (err, rows) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(rows);
                        }
                        db.close();
                    });
                });
            });
        });
    }

    async executarRun(sql, params = []) {
        return new Promise((resolve, reject) => {
            const db = new sqlite3.Database(this.dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
                if (err) {
                    reject(err);
                    return;
                }

                db.exec(`PRAGMA journal_mode = WAL; PRAGMA synchronous = NORMAL; PRAGMA busy_timeout = 5000;`, (err) => {
                    if (err) {
                        reject(err);
                        db.close();
                        return;
                    }

                    db.run(sql, params, function(err) {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(this.lastID || this.changes);
                        }
                        db.close();
                    });
                });
            });
        });
    }

    async configurar() {
        const sql = `
            PRAGMA journal_mode = WAL;
            PRAGMA synchronous = NORMAL;
            PRAGMA busy_timeout = 5000;
        `;
        return this.executarQuery(sql);
    }

    #buildModelosSearchQuery(filters) {
        const conditions = [];
        const params = [];

        const termos = filters.termo.split(/\s+/);

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

            if (termoConditions.length > 0) {
                conditions.push(`(${termoConditions.join(' OR ')})`);
            }
        });

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
            filtros.nome = true;
        }
        
        const { query, params } = this.#buildModelosSearchQuery({
            termo,
            ...filtros
        });

        return this.executarQuery(query, params);
    }

    async buscarChecklists(termo, filtros = { nome: true, etiqueta: false }) {
        if (!filtros.nome && !filtros.etiqueta) {
            filtros.nome = true;
        }

        const conditions = [];
        const params = [];

        if (filtros.nome) {
            conditions.push('c.nome LIKE ?');
            params.push(`%${termo}%`);
        }

        if (filtros.etiqueta) {
            conditions.push(`EXISTS (
                SELECT 1 FROM json_each(c.tag) 
                WHERE value LIKE ?
            )`);
            params.push(`%${termo}%`);
        }

        const whereClause = conditions.length > 0
            ? 'WHERE ' + conditions.join(' OR ')
            : '';

        const query = `
            SELECT DISTINCT
                c.id,
                c.nome,
                c.tag,
                c.checklist,
                c.modelo_id
            FROM checklists c
            ${whereClause}
            ORDER BY c.nome COLLATE NOCASE
            LIMIT 100
        `;
        return this.executarQuery(query, params);
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

    async inserirModelo(nome, tag, modelo) {
        try {
            const tagArray = this.#validarJSON(tag);
            const sql = 'INSERT INTO modelos (nome, tag, modelo) VALUES (?, ?, ?)';
            return this.executarRun(sql, [nome, JSON.stringify(tagArray), modelo]);
        } catch (err) {
            throw new Error(`Erro ao validar JSON: ${err.message}`);
        }
    }

    async inserirChecklist(nome, tag, checklist, modelo_id) {
        try {
            const tagArray = this.#validarJSON(tag);
            const checklistArray = this.#validarJSON(checklist);

            // Primeiro verificar se já existe um checklist com este nome
            let row = await this.verificarChecklistExistente(nome);

            const sql = row 
                ? 'UPDATE checklists SET tag = ?, checklist = ?, modelo_id = ? WHERE nome = ?'
                : 'INSERT INTO checklists (nome, tag, checklist, modelo_id) VALUES (?, ?, ?, ?)';

            const params = row
                ? [JSON.stringify(tagArray), JSON.stringify(checklistArray), modelo_id || null, nome]
                : [nome, JSON.stringify(tagArray), JSON.stringify(checklistArray), modelo_id || null];

            return this.executarRun(sql, params);
        } catch (err) {
            console.error('Erro ao processar dados do checklist:', err);
            throw new Error(`Erro ao validar JSON: ${err.message}`);
        }
    }

    async verificarModeloExistente(nome) {
        const query = 'SELECT * FROM modelos WHERE nome = ?';
        const rows = await this.executarQuery(query, [nome]);
        return rows.length > 0 ? rows[0] : null;
    }

    async verificarChecklistExistente(nome) {
        const query = 'SELECT * FROM checklists WHERE nome = ?';
        const rows = await this.executarQuery(query, [nome]);
        return rows.length > 0 ? rows[0] : null;
    }

    async atualizarModelo(id, nome, tag, modelo) {
        try {
            const tagArray = this.#validarJSON(tag);
            const sql = 'UPDATE modelos SET nome = ?, tag = ?, modelo = ? WHERE id = ?';
            return this.executarRun(sql, [nome, JSON.stringify(tagArray), modelo, id]);
        } catch (err) {
            throw new Error(`Erro ao validar JSON: ${err.message}`);
        }
    }

    deletarModelo(id) {
        const sql = 'DELETE FROM modelos WHERE id = ?';
        return this.executarRun(sql, [id]);
    }

    deletarChecklist(id) {
        const sql = 'DELETE FROM checklists WHERE id = ?';
        return this.executarRun(sql, [id]);
    }

    async obterModeloPorId(id) {
        const query = 'SELECT * FROM modelos WHERE id = ?';
        const rows = await this.executarQuery(query, [id]);
        return rows.length > 0 ? rows[0] : null;
    }

    fecharConexao() {
        // Não precisa fechar a conexão aqui, pois cada operação abre e fecha sua própria conexão
    }
}

// Exportar uma função factory ao invés de uma instância
module.exports = function(dbPath) {
    return new Database(dbPath);
};
