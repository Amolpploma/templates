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
                this.initDatabase();
            }
        });
    }

    initDatabase() {
        this.db.run(`
            CREATE TABLE IF NOT EXISTS documentos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                titulo TEXT,
                conteudo TEXT,
                data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
    }

    inserirDocumento(titulo, conteudo) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'INSERT INTO documentos (titulo, conteudo) VALUES (?, ?)',
                [titulo, conteudo],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });
    }

    buscarDocumentos(termo) {
        return new Promise((resolve, reject) => {
            this.db.all(
                'SELECT * FROM documentos WHERE titulo LIKE ? OR conteudo LIKE ?',
                [`%${termo}%`, `%${termo}%`],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });
    }

    fecharConexao() {
        this.db.close();
    }
}

module.exports = new Database();
