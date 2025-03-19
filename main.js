// main.js

// Modules to control application life and create native browser window
const { app, BrowserWindow, globalShortcut, ipcMain, dialog } = require('electron')
const path = require('node:path')
const fs = require('fs')
let store;

async function loadStore() {
    const { default: Store } = await import('electron-store');
    store = new Store();
}

let database = null;

// Função para determinar o caminho correto do banco de dados
function getDatabasePath() {
    // Em desenvolvimento, usar o banco da pasta recursos
    if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
        const devDbPath = path.join(__dirname, 'recursos', 'database.sqlite');
        if (fs.existsSync(devDbPath)) {
            return devDbPath;
        }
    }

    // Em produção, continuar com o comportamento atual
    const userDataPath = app.getPath('userData');
    const dbPath = path.join(userDataPath, 'database.sqlite');

    if (!fs.existsSync(dbPath)) {
        try {
            const prodDbPath = path.join(process.resourcesPath, 'app.asar.unpacked', 'recursos', 'database.sqlite');
            if (fs.existsSync(prodDbPath)) {
                fs.copyFileSync(prodDbPath, dbPath);
            } else {
                console.error('Database not found:', { prodDbPath });
                throw new Error('Database file not found');
            }
        } catch (err) {
            console.error('Error copying database:', err);
            throw err;
        }
    }

    return dbPath;
}

async function initializeDatabase(dbPath) {
    try {
        if (database) {
            database.fecharConexao();
        }

        // Verificar se o banco de dados é válido
        const isValid = await validateDatabase(dbPath);
        if (!isValid) {
            dialog.showMessageBox({
                type: 'error',
                title: 'Erro',
                message: 'Banco de dados inválido ou corrompido. Selecione um banco de dados válido ou crie um novo a partir da tela inicial.'
            });
            return false;
        }

        // Configurar SQLite com modo WAL para permitir múltiplos acessos
        const db = require('./src/database')(dbPath);
        await db.configurar();
        database = db;
        
        store.set('databasePath', dbPath);
        return true;
    } catch (error) {
        console.error('Erro ao inicializar banco:', error);
        return false;
    }
}

async function validateDatabase(dbPath) {
    try {
        const sqlite3 = require('sqlite3').verbose(); // Importar sqlite3 aqui
        const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
            if (err) {
                console.error('Erro ao abrir banco para validação:', err);
                return false;
            }
        });

        const checkTablesQuery = `
            SELECT name FROM sqlite_sequence WHERE name IN ('modelos', 'checklists');
        `;

        return new Promise((resolve, reject) => {
            db.all(checkTablesQuery, [], (err, rows) => {
                db.close();
                if (err) {
                    console.error('Erro ao validar tabelas:', err);
                    resolve(false);
                } else {
                    const tableNames = rows.map(row => row.name);
                    const hasModelos = tableNames.includes('modelos');
                    const hasChecklists = tableNames.includes('checklists');
                    resolve(hasModelos && hasChecklists);
                }
            });
        });
    } catch (error) {
        console.error('Erro na validação do banco:', error);
        return false;
    }
}

function createWindow(page = 'index.html') {
    const mainWindow = new BrowserWindow({
        width: 960,
        height: 600,
        minWidth: 960,  // Tamanho mínimo
        minHeight: 600, // Tamanho mínimo
        frame: false, // Remove a barra padrão
        titleBarStyle: 'hidden',   // Esconde a barra de título
        autoHideMenuBar: true,     // Esconde a barra de menu
        center: true,              // Centraliza a janela
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: false,
            enableRemoteModule: false,
            devTools: true,
            preload: path.join(__dirname, 'preload.js')  // Caminho atualizado para a raiz
        }
    });

    mainWindow.loadFile(path.join(__dirname, 'src', page));

    // Adicionar handlers para controles da janela
    ipcMain.on('minimize-window', () => mainWindow.minimize());
    ipcMain.on('maximize-window', () => {
        if (mainWindow.isMaximized()) {
            mainWindow.unmaximize();
        } else {
            mainWindow.maximize();
        }
    });
    ipcMain.on('close-window', () => mainWindow.close());

    // Registrar todos os handlers IPC antes de qualquer outra operação
    registerIpcHandlers();
}

function registerIpcHandlers() {
  ipcMain.handle('buscar-checklists', async (event, termo, filtros) => {
    try {
      const resultados = await database.buscarChecklists(termo, filtros);
      return resultados;
    } catch (err) {
      console.error('Erro na busca de checklists:', err);
      return [];
    }
  });

  ipcMain.handle('buscar-documentos', async (event, termo, filtros) => {
    try {
      return await database.buscarModelos(termo, filtros);
    } catch (err) {
      console.error('Erro na busca:', err);
      return [];
    }
  });

  ipcMain.handle('salvar-documento', async (event, { nome, tag, modelo }) => {
    try {
      return await database.inserirModelo(nome, tag, modelo);
    } catch (err) {
      console.error('Erro ao salvar:', err);
      return null;
    }
  });

  ipcMain.handle('buscar-modelo-por-id', async (event, id) => {
    try {
      const modelo = await database.obterModeloPorId(id);
      console.log('Modelo encontrado:', modelo); // Debug log
      return modelo;
    } catch (err) {
      console.error('Erro ao buscar modelo por ID:', err);
      return null;
    }
  });
  
  ipcMain.handle('apagar-modelo', async (event, id) => {
    try {
      return await database.deletarModelo(id);
    } catch (err) {
      console.error('Erro ao apagar modelo:', err);
      return null;
    }
  });

  ipcMain.handle('verificar-modelo', async (event, nome) => {
    try {
      return await database.verificarModeloExistente(nome);
    } catch (err) {
      console.error('Erro ao verificar modelo:', err);
      return null;
    }
  });

  ipcMain.handle('atualizar-modelo', async (event, { id, nome, tag, modelo }) => {
    try {
      return await database.atualizarModelo(id, nome, tag, modelo);
    } catch (err) {
      console.error('Erro ao atualizar modelo:', err);
      return null;
    }
  });

  ipcMain.handle('salvar-checklist', async (event, dados) => {
    try {
      const lastID = await database.inserirChecklist(
        dados.nome,
        dados.tag,
        dados.checklist,
        dados.modelo_id
      );
      return lastID; // Retornar o ID do novo checklist
    } catch (err) {
      console.error('Erro ao salvar checklist:', err);
      throw err; // Propagar o erro para ser tratado no renderer
    }
  });

  ipcMain.handle('verificar-checklist', async (event, nome) => {
    try {
      return await database.verificarChecklistExistente(nome);
    } catch (err) {
      console.error('Erro ao verificar checklist:', err);
      return null;
    }
  });

  ipcMain.handle('apagar-checklist', async (event, id) => {
    try {
      return await database.deletarChecklist(id);
    } catch (err) {
      console.error('Erro ao apagar checklist:', err);
      return null;
    }
  });

  ipcMain.handle('select-database', async () => {
    const mainWindow = BrowserWindow.getFocusedWindow();
    const result = await dialog.showOpenDialog(mainWindow, {
        modal: true,
        properties: ['openFile'],
        filters: [{ name: 'SQLite Database', extensions: ['sqlite', 'db'] }]
    });

    if (!result.canceled && result.filePaths.length > 0) {
        const success = await initializeDatabase(result.filePaths[0]);
        if (success) {
            BrowserWindow.getAllWindows()[0].loadFile(path.join(__dirname, 'src', 'index.html'));
        }
        return success;
    }
    return false;
  });

  ipcMain.handle('create-database', async () => {
    const mainWindow = BrowserWindow.getFocusedWindow();
    const result = await dialog.showSaveDialog(mainWindow, {
        modal: true,
        filters: [{ name: 'SQLite Database', extensions: ['sqlite'] }]
    });

    if (!result.canceled && result.filePath) {
        try {
            const sqlite3 = require('sqlite3').verbose();
            const db = new sqlite3.Database(result.filePath);

            const schema = `
                CREATE TABLE "checklists" (
                    "id"	INTEGER NOT NULL UNIQUE,
                    "nome"	TEXT NOT NULL,
                    "tag"	TEXT,
                    "checklist"	TEXT NOT NULL,
                    "modelo_id"	INTEGER,
                    PRIMARY KEY("id" AUTOINCREMENT)
                );

                CREATE TABLE "modelos" (
                    "id"	INTEGER NOT NULL UNIQUE,
                    "nome"	TEXT NOT NULL,
                    "tag"	TEXT,
                    "modelo"	TEXT NOT NULL,
                    PRIMARY KEY("id" AUTOINCREMENT)
                );

                CREATE INDEX IF NOT EXISTS idx_modelos_nome ON modelos(nome);
                CREATE INDEX IF NOT EXISTS idx_modelos_tag ON modelos(tag);
                CREATE INDEX IF NOT EXISTS idx_modelos_modelo ON modelos(modelo);
                CREATE INDEX IF NOT EXISTS idx_checklists_nome ON checklists(nome);
                CREATE INDEX IF NOT EXISTS idx_checklists_tag ON checklists(tag);
            `;

            await new Promise((resolve, reject) => {
                db.exec(schema, (err) => {
                    db.close();
                    if (err) reject(err);
                    else resolve();
                });
            });

            const success = await initializeDatabase(result.filePath);
            if (success) {
                BrowserWindow.getAllWindows()[0].loadFile(path.join(__dirname, 'src', 'index.html'));
            }
            return success;
        } catch (err) {
            console.error('Erro ao criar banco de dados:', err);
            dialog.showMessageBoxSync(mainWindow, {
                type: 'error',
                title: 'Erro',
                message: 'Erro ao criar banco de dados: ' + err.message
            });
            return false;
        }
    }
    return false;
  });

  ipcMain.handle('get-database-path', async () => {
    return store.get('databasePath') || 'Nenhum banco de dados selecionado';
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
    await loadStore();
    // Verificar se já existe um caminho de banco salvo
    const savedPath = store.get('databasePath');
    
    if (savedPath && fs.existsSync(savedPath)) {
        const success = await initializeDatabase(savedPath);
        createWindow(success ? 'index.html' : 'select-database.html');
    } else {
        createWindow('select-database.html');
    }
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('will-quit', () => {
  // Remover todos os handlers ao fechar
  ipcMain.removeHandler('buscar-checklists');
  ipcMain.removeHandler('buscar-documentos');
  ipcMain.removeHandler('salvar-documento');
  ipcMain.removeHandler('buscar-modelo-por-id'); // Adicionar esta linha
  
  globalShortcut.unregisterAll();
  //database.fecharConexao(); //Remover essa linha
})

ipcMain.on('save-content', (event, content) => {
  dialog.showSaveDialog({
    filters: [{ name: 'Documentos de texto', extensions: ['txt', 'html'] }]
  }).then(result => {
    if (!result.canceled && result.filePath) {
      fs.writeFileSync(result.filePath, content);
    }
  });
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.