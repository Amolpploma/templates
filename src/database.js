const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');

class Database {
    constructor() {
        this.db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error('Erro ao conectar ao banco:', err);
            } else {
                console.log('Conectado ao banco SQLite');
            }
        });
    }

    inserirModelo(titulo, conteudo) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'INSERT INTO modelos (titulo, conteudo) VALUES (?, ?)',
                [titulo, conteudo],
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
                'SELECT * FROM modelos WHERE titulo LIKE ? OR conteudo LIKE ?',
                [`%${termo}%`, `%${termo}%`],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });
    }

    atualizarModelo(id, titulo, conteudo) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'UPDATE modelos SET titulo = ?, conteudo = ? WHERE id = ?',
                [titulo, conteudo, id],
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

module.exports = new Database();
