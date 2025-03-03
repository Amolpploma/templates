document.addEventListener('DOMContentLoaded', () => {
    // Recuperar tema salvo ou usar padrão
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateIcons(savedTheme);

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
