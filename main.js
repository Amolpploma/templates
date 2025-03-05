// main.js

// Modules to control application life and create native browser window
const { app, BrowserWindow, globalShortcut, ipcMain, dialog } = require('electron')
const path = require('node:path')
const fs = require('fs')

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

// Inicializar o banco de dados com o caminho correto
const database = require('./src/database')(getDatabasePath());

const createWindow = () => {
  // Create the browser window.
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
  })

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
  ipcMain.removeHandler('buscar-modelo-por-id'); // Adicionar esta linha
  
  globalShortcut.unregisterAll();
  database.fecharConexao();
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