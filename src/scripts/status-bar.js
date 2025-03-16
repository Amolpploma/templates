document.addEventListener('DOMContentLoaded', () => {
    const dbPathSpan = document.getElementById('db-path');

    async function updateDbPath() {
        const dbPath = await window.electronAPI.getDatabasePath();
        dbPathSpan.textContent = dbPath;
    }

    dbPathSpan.addEventListener('click', () => {
        window.electronAPI.selectDatabase();
    });

    updateDbPath();
});
