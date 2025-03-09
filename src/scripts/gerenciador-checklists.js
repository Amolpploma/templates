document.addEventListener('DOMContentLoaded', () => {
    const btnAdicionar = document.querySelector('.btn-adicionar-item');
    const itemsContainer = document.getElementById('checklist-items-container');

    btnAdicionar.addEventListener('click', () => {
        const itemRow = document.createElement('div');
        itemRow.className = 'checklist-item-row';
        
        itemRow.innerHTML = `
            <input type="text" class="checklist-item-input" placeholder="Descrição do item...">
            <button class="checklist-item-btn move-up" title="Mover para cima">
                <svg viewBox="0 0 24 24">
                    <path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"/>
                </svg>
            </button>
            <button class="checklist-item-btn move-down" title="Mover para baixo">
                <svg viewBox="0 0 24 24">
                    <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z"/>
                </svg>
            </button>
            <button class="checklist-item-btn paste" title="Colar texto">
                <svg viewBox="0 0 24 24">
                    <path d="M19 2h-4.18C14.4.84 13.3 0 12 0c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm7 18H5V4h2v3h10V4h2v16z"/>
                </svg>
            </button>
            <button class="checklist-item-btn remove" title="Remover item">
                <svg viewBox="0 0 24 24">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
            </button>
        `;

        // Adicionar handlers dos botões
        const moveUpBtn = itemRow.querySelector('.move-up');
        const moveDownBtn = itemRow.querySelector('.move-down');
        const pasteBtn = itemRow.querySelector('.paste');
        const removeBtn = itemRow.querySelector('.remove');

        moveUpBtn.onclick = () => {
            const prev = itemRow.previousElementSibling;
            if (prev) {
                itemsContainer.insertBefore(itemRow, prev);
            }
        };

        moveDownBtn.onclick = () => {
            const next = itemRow.nextElementSibling;
            if (next) {
                itemsContainer.insertBefore(next, itemRow);
            }
        };

        pasteBtn.onclick = async () => {
            try {
                const text = await navigator.clipboard.readText();
                const input = itemRow.querySelector('.checklist-item-input');
                input.value = text;
            } catch (err) {
                console.error('Erro ao colar texto:', err);
            }
        };

        removeBtn.onclick = () => {
            itemRow.remove();
        };

        itemsContainer.appendChild(itemRow);
    });
});
