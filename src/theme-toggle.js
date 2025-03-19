document.addEventListener('DOMContentLoaded', async () => {
    const root = document.documentElement;
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = await window.electronAPI.getNativeTheme();
    
    // Usar tema salvo ou seguir o sistema
    if (savedTheme) {
        root.setAttribute('data-theme', savedTheme);
    } else {
        root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    }

    // Listener para mudanças do tema do sistema
    window.electronAPI.onNativeThemeUpdate((event, isDark) => {
        if (!localStorage.getItem('theme')) { // Só mudar se não tiver preferência salva
            root.setAttribute('data-theme', isDark ? 'dark' : 'light');
        }
    });

    // Adicionar listener ao botão de tema
    const themeToggle = document.querySelector('.theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            updateIcons(newTheme);
        });
    }

    function updateIcons(theme) {
        const iconLight = document.querySelector('.theme-icon-light');
        const iconDark = document.querySelector('.theme-icon-dark');
        if (theme === 'dark') {
            iconLight.style.display = 'none';
            iconDark.style.display = 'block';
        } else {
            iconLight.style.display = 'block';
            iconDark.style.display = 'none';
        }
    }
});
