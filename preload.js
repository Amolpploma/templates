const { contextBridge, ipcRenderer } = require('electron');
const path = require('path');

// Expor APIs seguras para o renderer process
contextBridge.exposeInMainWorld('electronAPI', {
    // Atualizar para passar os filtros
    buscarDocumentos: (termo, filtros) => ipcRenderer.invoke('buscar-documentos', termo, filtros),
    salvarDocumento: (dados) => ipcRenderer.invoke('salvar-documento', dados),
    buscarChecklists: (termo) => ipcRenderer.invoke('buscar-checklists', termo),
    buscarModeloPorId: (id) => ipcRenderer.invoke('buscar-modelo-por-id', id),
    minimizeWindow: () => ipcRenderer.send('minimize-window'),
    maximizeWindow: () => ipcRenderer.send('maximize-window'),
    closeWindow: () => ipcRenderer.send('close-window'),
    apagarModelo: (id) => ipcRenderer.invoke('apagar-modelo', id)
});

// Expor Quill para o renderer process
contextBridge.exposeInMainWorld('QuillEditor', {
    createEditor: (selector, options) => {
        return import('quill').then(module => new module.default(selector, options));
    }
});

// Adicionar API para obter caminhos
contextBridge.exposeInMainWorld('paths', {
    getQuillPaths: () => {
        const isDev = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
        
        if (isDev) {
            return {
                js: '../node_modules/quill/dist/quill.js',
                css: '../node_modules/quill/dist/quill.snow.css'
            };
        } else {
            return {
                js: '../resources/quill.js',
                css: '../resources/quill.snow.css'
            };
        }
    }
});
