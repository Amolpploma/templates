(function() {
    const theme = localStorage.getItem('theme') || 
                  (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
    
    // Marcar documento como pronto após carregamento completo
    window.addEventListener('load', () => {
        document.documentElement.classList.add('ready');
    });
})();
