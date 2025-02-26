const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    buscarDocumentos: (termo) => ipcRenderer.invoke('buscar-documentos', termo),
    salvarDocumento: (dados) => ipcRenderer.invoke('salvar-documento', dados),
    buscarChecklists: (termo) => ipcRenderer.invoke('buscar-checklists', termo)
});
