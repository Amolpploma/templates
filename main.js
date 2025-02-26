// main.js

// Modules to control application life and create native browser window
const { app, BrowserWindow, globalShortcut, ipcMain } = require('electron')
const path = require('node:path')
const database = require('./src/database')

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

  // Registrar handlers IPC
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
  // Desregistrar todos os atalhos ao fechar
  globalShortcut.unregisterAll()
  database.fecharConexao();
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.