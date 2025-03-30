(function() {
    // Aplicar tema
    const theme = localStorage.getItem('theme') || 
                  (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
    
    // Ocultar completamente a página inicialmente
    document.documentElement.style.visibility = 'hidden';
    
    // Determinar página atual para aplicar estados de colapso
    const currentPath = window.location.pathname;
    const isSearchPage = currentPath.includes('index.html') || currentPath.endsWith('/');
    const isEditorPage = currentPath.includes('gerenciador-modelos.html');
    
    // Prefixo específico para a página atual
    const pagePrefix = isSearchPage ? 'search_' : (isEditorPage ? 'editor_' : '');
    
    // IMPORTANTE: Aplicar estilos inline diretamente para garantir que sejam aplicados imediatamente
    if (localStorage.getItem(`${pagePrefix}leftPanelCollapsed`) === 'true') {
        // Adicionar classe para CSS
        document.documentElement.classList.add('left-panel-collapsed');
        
        // Também criar um estilo inline que será aplicado imediatamente
        const style = document.createElement('style');
        style.id = 'critical-panel-styles-left';
        style.textContent = `.left-panel { 
            width: 30px !important; 
            min-width: 30px !important; 
            position: relative; 
            overflow: hidden !important;
        }
        .left-panel > *:not(.panel-expand-btn) { 
            visibility: hidden !important;
        }
        /* Garantir que o botão de expansão fique visível */
        .left-panel .panel-expand-btn {
            visibility: visible !important;
            display: flex !important;
            z-index: 1000;
        }`;
        document.head.appendChild(style);
    }
    
    if (localStorage.getItem(`${pagePrefix}rightPanelCollapsed`) === 'true') {
        // Adicionar classe para CSS
        document.documentElement.classList.add('right-panel-collapsed');
        
        // Também criar um estilo inline
        const style = document.createElement('style');
        style.id = 'critical-panel-styles-right';
        style.textContent = `.right-panel { 
            width: 30px !important; 
            min-width: 30px !important; 
            position: relative; 
            overflow: hidden !important;
        }
        .right-panel > *:not(.panel-expand-btn) { 
            visibility: hidden !important;
        }
        /* Garantir que o botão de expansão fique visível */
        .right-panel .panel-expand-btn {
            visibility: visible !important;
            display: flex !important;
            z-index: 1000;
        }`;
        document.head.appendChild(style);
    }
    
    // Mostrar página apenas quando o DOM estiver completamente carregado e processado
    window.addEventListener('DOMContentLoaded', () => {
        // Pequeno atraso para garantir que todos os estilos foram aplicados
        setTimeout(() => {
            document.documentElement.style.visibility = 'visible';
            
            // Sinalizar que a página está pronta para outros scripts
            document.documentElement.classList.add('ready');
        }, 50);
    });
})();
