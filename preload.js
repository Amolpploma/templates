const { contextBridge, ipcRenderer } = require('electron');

// Expor APIs seguras para o renderer process
contextBridge.exposeInMainWorld('electronAPI', {
    buscarDocumentos: (termo) => ipcRenderer.invoke('buscar-documentos', termo),
    salvarDocumento: (dados) => ipcRenderer.invoke('salvar-documento', dados),
    buscarChecklists: (termo) => ipcRenderer.invoke('buscar-checklists', termo),
    buscarModeloPorId: (id) => ipcRenderer.invoke('buscar-modelo-por-id', id)
});

// Expor Quill para o renderer process
contextBridge.exposeInMainWorld('QuillEditor', {
    createEditor: (selector, options) => {
        return import('quill').then(module => new module.default(selector, options));
    }
});
