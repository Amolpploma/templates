const { contextBridge, ipcRenderer } = require('electron');
const path = require('path');

// Expor APIs seguras para o renderer process
contextBridge.exposeInMainWorld('electronAPI', {
    // Atualizar para passar os filtros
    buscarDocumentos: (termo, filtros) => ipcRenderer.invoke('buscar-documentos', termo, filtros),
    salvarDocumento: (dados) => ipcRenderer.invoke('salvar-documento', dados),
    buscarChecklists: (termo, filtros) => ipcRenderer.invoke('buscar-checklists', termo, filtros),
    buscarModeloPorId: (id) => ipcRenderer.invoke('buscar-modelo-por-id', id),
    minimizeWindow: () => ipcRenderer.send('minimize-window'),
    maximizeWindow: () => ipcRenderer.send('maximize-window'),
    closeWindow: () => ipcRenderer.send('close-window'),
    apagarModelo: (id) => ipcRenderer.invoke('apagar-modelo', id),
    verificarModelo: (nome) => ipcRenderer.invoke('verificar-modelo', nome),
    atualizarModelo: (dados) => ipcRenderer.invoke('atualizar-modelo', dados),
    salvarChecklist: (dados) => ipcRenderer.invoke('salvar-checklist', dados),
    verificarChecklist: (nome) => ipcRenderer.invoke('verificar-checklist', nome),
    apagarChecklist: (id) => ipcRenderer.invoke('apagar-checklist', id)
});