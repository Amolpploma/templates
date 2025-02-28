// main.js

// Modules to control application life and create native browser window
const { app, BrowserWindow, globalShortcut, ipcMain } = require('electron')
const path = require('node:path')
const fs = require('fs')

// Função para determinar o caminho correto do banco de dados
function getDatabasePath() {
    const userDataPath = app.getPath('userData');
    const dbPath = path.join(userDataPath, 'database.sqlite');

    // Verificar se o banco já existe no diretório do usuário
    if (!fs.existsSync(dbPath)) {
        try {
            // Em desenvolvimento
            const devDbPath = path.join(__dirname, 'recursos', 'database.sqlite');
            if (fs.existsSync(devDbPath)) {
                fs.copyFileSync(devDbPath, dbPath);
            } 
            // Em produção
            else {
                const prodDbPath = path.join(process.resourcesPath, 'app.asar.unpacked', 'recursos', 'database.sqlite');
                if (fs.existsSync(prodDbPath)) {
                    fs.copyFileSync(prodDbPath, dbPath);
                } else {
                    console.error('Database not found:', { devDbPath, prodDbPath });
                    throw new Error('Database file not found');
                }
            }
        } catch (err) {
            console.error('Error copying database:', err);
            throw err;
        }
    }

    return dbPath;
}

// Inicializar o banco de dados com o caminho correto
const database = require('./src/database')(getDatabasePath());

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      enableRemoteModule: false,
      devTools: true,
      preload: path.join(__dirname, 'preload.js')  // Caminho atualizado para a raiz
    }
  })

  // Ajustando o caminho para o index.html no diretório src
  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'))

  // Registrar todos os handlers IPC antes de qualquer outra operação
  registerIpcHandlers();
}

function registerIpcHandlers() {
  ipcMain.handle('buscar-checklists', async (event, termo) => {
    try {
      const resultados = await database.buscarChecklists(termo);
      return resultados;
    } catch (err) {
      console.error('Erro na busca de checklists:', err);
      return [];
    }
  });

  ipcMain.handle('buscar-documentos', async (event, termo) => {
    try {
      return await database.buscarModelos(termo);
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
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

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
  
  globalShortcut.unregisterAll();
  database.fecharConexao();
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.