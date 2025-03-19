document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('selectDb').addEventListener('click', () => {
        window.electronAPI.selectDatabase();
    });

    document.getElementById('createDb').addEventListener('click', () => {
        window.electronAPI.createDatabase();
    });

    // Adicionar event listener para o botão fechar
    document.getElementById('closeButton').addEventListener('click', () => {
        window.electronAPI.closeWindow();
    });
});
