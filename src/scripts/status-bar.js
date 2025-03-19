document.addEventListener('DOMContentLoaded', () => {
    const dbPathSpan = document.getElementById('db-path');
    const closeDbButton = document.getElementById('close-db');

    async function updateDbPath() {
        const dbPath = await window.electronAPI.getDatabasePath();
        dbPathSpan.textContent = `: ${dbPath}` ;
    }

    dbPathSpan.addEventListener('click', () => {
        window.electronAPI.selectDatabase();
    });

    closeDbButton.addEventListener('click', () => {
        window.location.href = 'select-database.html';
    });

    updateDbPath();
});
