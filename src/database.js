const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../recursos','database.sqlite');

class Database {
    constructor(dbPath) {
        this.db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error('Erro ao conectar ao banco:', err);
            } else {
                console.log('Conectado ao banco SQLite em:', dbPath);
            }
        });
    }

    inserirModelo(nome, tag, modelo) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'INSERT INTO modelos (nome, tag, modelo) VALUES (?, ?, ?)',
                [nome, tag, modelo],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });
    }

    buscarModelos(termo) {
        return new Promise((resolve, reject) => {
            this.db.all(
                'SELECT * FROM modelos WHERE nome LIKE ? OR tag LIKE ? OR modelo LIKE ?',
                [`%${termo}%`, `%${termo}%`, `%${termo}%`],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });
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
