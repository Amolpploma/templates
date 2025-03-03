document.addEventListener('DOMContentLoaded', () => {
    const minimizeButton = document.querySelector('.minimize-button');
    const maximizeButton = document.querySelector('.maximize-button');
    const closeButton = document.querySelector('.close-button');

    minimizeButton?.addEventListener('click', () => {
        window.electronAPI.minimizeWindow();
    });

    maximizeButton?.addEventListener('click', () => {
        window.electronAPI.maximizeWindow();
    });

    closeButton?.addEventListener('click', () => {
        window.electronAPI.closeWindow();
    });
});
