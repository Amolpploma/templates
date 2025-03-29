(function() {
    // Aplicar tema
    const theme = localStorage.getItem('theme') || 
                  (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
    
    // Determinar página atual para aplicar estados de colapso corretos
    const currentPath = window.location.pathname;
    const isSearchPage = currentPath.includes('index.html') || currentPath.endsWith('/');
    const isEditorPage = currentPath.includes('gerenciador-modelos.html');
    
    // Prefixo específico para a página atual
    const pagePrefix = isSearchPage ? 'search_' : (isEditorPage ? 'editor_' : '');
    
    // Aplicar classes de colapso com base no localStorage
    if (localStorage.getItem(`${pagePrefix}leftPanelCollapsed`) === 'true') {
        document.documentElement.classList.add('left-panel-collapsed');
    }
    
    if (localStorage.getItem(`${pagePrefix}rightPanelCollapsed`) === 'true') {
        document.documentElement.classList.add('right-panel-collapsed');
    }
    
    // Marcar documento como pronto após carregamento completo
    window.addEventListener('load', () => {
        document.documentElement.classList.add('ready');
    });
})();
