document.getElementById('selectDb').addEventListener('click', () => {
    window.electronAPI.selectDatabase();
});

document.getElementById('createDb').addEventListener('click', () => {
    window.electronAPI.createDatabase();
});
