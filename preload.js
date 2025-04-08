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
    apagarChecklist: (id) => ipcRenderer.invoke('apagar-checklist', id),
    selectDatabase: () => ipcRenderer.invoke('select-database'),
    createDatabase: () => ipcRenderer.invoke('create-database'),
    checkDatabaseConnection: () => ipcRenderer.invoke('check-database-connection'),
    getDatabasePath: () => ipcRenderer.invoke('get-database-path'),
    navigateAndTransferContent: (page, content) => {
        ipcRenderer.send('navigate-transfer-content', { page, content });
    },
    getStore: (key) => ipcRenderer.invoke('get-store', key),
    setStore: (key, value) => ipcRenderer.invoke('set-store', key, value),
    getNativeTheme: () => ipcRenderer.invoke('get-native-theme'),
    onNativeThemeUpdate: (callback) => ipcRenderer.on('native-theme-update', callback),
    
    // Novos métodos para importar/exportar modelos
    importModelos: () => ipcRenderer.invoke('import-modelos'),
    importarModelosTexto: () => ipcRenderer.invoke('importar-modelos-texto'), // Nova função adicionada
    exportModelos: () => ipcRenderer.invoke('export-modelos'),
    
    // Método para exportar modelos selecionados
    exportarModelosSelecionados: (modelos) => ipcRenderer.invoke('exportarModelosSelecionados', modelos),
    
    // Método para exportar modelos como texto
    exportarModelosComoTexto: (modelos) => ipcRenderer.invoke('export-modelos-como-texto', modelos),
    
    // Adicionar nova função para buscar apenas IDs e nomes de modelos
    buscarModelosResumidos: (termo) => ipcRenderer.invoke('buscar-modelos-resumidos', termo),
    
    // Adicionar APIs para obter conteúdo dos arquivos em vez de abri-los externamente
    getLicenseContent: () => ipcRenderer.invoke('get-license-content'),
    getNoticeContent: () => ipcRenderer.invoke('get-notice-content'),
});