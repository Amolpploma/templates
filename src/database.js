const sqlite3 = require('sqlite3').verbose();
const path = require('path');

function initializeDatabase(dbPath) {
    const db = new sqlite3.Database(dbPath);

    // Habilitar suporte a JSON
    db.run('PRAGMA foreign_keys = ON');
    
    // Criar tabelas virtuais FTS5
    const setupQueries = [
        `CREATE VIRTUAL TABLE IF NOT EXISTS modelos_fts USING fts5(
            id UNINDEXED,  /* Não indexar ID */
            nome,          /* Indexar nome */
            tag_text,      /* Indexar tags como texto */
            modelo,        /* Indexar conteúdo */
            content='modelos',
            content_rowid='id'
        );`,
        
        `CREATE VIRTUAL TABLE IF NOT EXISTS checklists_fts USING fts5(
            id UNINDEXED,  /* Não indexar ID */
            nome,          /* Indexar nome */
            tag_text,      /* Indexar tags como texto */
            checklist_text, /* Indexar descrições do checklist como texto */
            content='checklists',
            content_rowid='id'
        );`,

        // Triggers para manter FTS5 atualizado
        `CREATE TRIGGER IF NOT EXISTS modelos_ai AFTER INSERT ON modelos BEGIN
            INSERT INTO modelos_fts(id, nome, tag_text, modelo)
            VALUES (
                new.id,
                new.nome,
                (SELECT json_group_array(value) FROM json_each(new.tag)),
                new.modelo
            );
        END;`,

        `CREATE TRIGGER IF NOT EXISTS checklists_ai AFTER INSERT ON checklists BEGIN
            INSERT INTO checklists_fts(id, nome, tag_text, checklist_text)
            VALUES (
                new.id,
                new.nome,
                (SELECT json_group_array(value) FROM json_each(new.tag)),
                (SELECT json_group_array(json_extract(value, '$.descrição')) 
                 FROM json_each(new.checklist))
            );
        END;`
    ];

    // Executar queries de setup
    db.serialize(() => {
        setupQueries.forEach(query => db.run(query));
    });

    // Função auxiliar para preparar termos de busca
    function prepareSearchTerms(termo, filters) {
        const searchTerms = [];
        
        if (filters.includes('nome')) {
            searchTerms.push(`nome:${termo}*`);
        }
        if (filters.includes('etiqueta')) {
            searchTerms.push(`tag_text:${termo}*`);
        }
        if (filters.includes('conteudo')) {
            searchTerms.push(`modelo:${termo}*`);
        }

        return searchTerms.join(' OR ');
    }

    // Funções de busca melhoradas
    async function buscarModelos(termo, filters = ['nome']) {
        const searchQuery = prepareSearchTerms(termo, filters);
        
        return new Promise((resolve, reject) => {
            const query = `
                SELECT m.*
                FROM modelos m
                JOIN modelos_fts fts ON m.id = fts.id
                WHERE modelos_fts MATCH ?
                ORDER BY rank;
            `;

            db.all(query, [searchQuery], (err, rows) => {
                if (err) reject(err);
                else {
                    // Processar JSON adequadamente
                    const results = rows.map(row => ({
                        ...row,
                        tag: JSON.parse(row.tag || '[]')
                    }));
                    resolve(results);
                }
            });
        });
    }

    async function buscarChecklists(termo, filters = ['nome']) {
        const searchQuery = prepareSearchTerms(termo, filters);
        
        return new Promise((resolve, reject) => {
            const query = `
                SELECT c.*
                FROM checklists c
                JOIN checklists_fts fts ON c.id = fts.id
                WHERE checklists_fts MATCH ?
                ORDER BY rank;
            `;

            db.all(query, [searchQuery], (err, rows) => {
                if (err) reject(err);
                else {
                    // Processar JSON adequadamente
                    const results = rows.map(row => ({
                        ...row,
                        tag: JSON.parse(row.tag || '[]'),
                        checklist: JSON.parse(row.checklist || '[]')
                    }));
                    resolve(results);
                }
            });
        });
    }

    // Exportar funções públicas
    return {
        buscarModelos,
        buscarChecklists,
        // ...existing code...
    };
}

module.exports = initializeDatabase;
