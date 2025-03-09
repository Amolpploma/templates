document.addEventListener('DOMContentLoaded', () => {
    const btnAdicionar = document.querySelector('.btn-adicionar-item');
    const itemsContainer = document.getElementById('checklist-items-container');
    let currentFocusedItem = null; // Mover para o escopo mais amplo

    function createItemRow() {
        const itemRow = document.createElement('div');
        itemRow.className = 'checklist-item-row';
        
        itemRow.innerHTML = `
            <div class="checklist-content">
                <div class="checklist-item-controls">
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
                    <button class="checklist-item-btn paste" title="Associar modelo">
                        <svg viewBox="0 0 24 24">
                            <path d="M19 2h-4.18C14.4.84 13.3 0 12 0c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm7 18H5V4h2v3h10V4h2v16z"/>
                        </svg>
                    </button>
                    <button class="checklist-item-btn remove" title="Remover item">
                        <svg viewBox="0 0 24 24">
                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                        </svg>
                    </button>
                </div>
            </div>
            <div class="modelo-associado" data-id="" data-nome="">Modelo: sem modelo associado</div>
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

        return itemRow;
    }

    // Adicionar handler global para cliques fora
    document.addEventListener('click', (e) => {
        const rightPanel = document.querySelector('.right-panel');
        if (rightPanel?.classList.contains('focus-mode') && 
            !rightPanel.contains(e.target) && 
            !e.target.closest('.checklist-item-row')) {
            rightPanel.classList.remove('focus-mode');
            currentFocusedItem = null;
            removeAssociateButtons();
        }
    });

    function setupModelAssociation(itemRow) {
        const pasteBtn = itemRow.querySelector('.paste');
        const rightPanel = document.querySelector('.right-panel');
        const searchInput = rightPanel.querySelector('.search-input');

        pasteBtn.onclick = (e) => {
            e.stopPropagation(); // Prevenir que o click se propague para o document
            
            // Desativar modo foco anterior se existir
            if (currentFocusedItem && currentFocusedItem !== itemRow) {
                rightPanel.classList.remove('focus-mode');
                removeAssociateButtons();
            }

            // Ativar modo foco para o item atual
            rightPanel.classList.add('focus-mode');
            currentFocusedItem = itemRow;
            searchInput.focus();

            // Adicionar botões de associação aos resultados existentes
            addAssociateButtons();
        };

        // Remover listener individual de clique fora e usar o global
        // Manter apenas o observer para mudanças na lista
        const observer = new MutationObserver(() => {
            if (rightPanel.classList.contains('focus-mode') && currentFocusedItem === itemRow) {
                addAssociateButtons();
            }
        });

        observer.observe(rightPanel.querySelector('.search-results-list'), {
            childList: true,
            subtree: true
        });
    }

    function addAssociateButtons() {
        document.querySelectorAll('.resultado-modelo').forEach(resultado => {
            if (!resultado.querySelector('.associate-model-btn')) {
                const btn = createAssociateButton();
                //resultado.appendChild(btn);
                //resultado.firstElementChild.appendChild(btn);
                resultado.firstElementChild.insertBefore(btn, resultado.firstElementChild.firstChild);
                console.log(resultado.firstElementChild);
            }
        });
    }

    function removeAssociateButtons() {
        document.querySelectorAll('.associate-model-btn').forEach(btn => btn.remove());
    }

    function createAssociateButton() {
        const btn = document.createElement('button');
        btn.className = 'associate-model-btn';
        btn.title = 'Associar este modelo';
        btn.innerHTML = `
            <svg viewBox="0 0 24 24">
                <path d="M19 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>
            </svg>
        `;

        btn.onclick = (e) => {
            e.stopPropagation();
            const resultado = e.currentTarget.closest('.resultado-modelo');
            const modeloId = resultado.dataset.id;
            const modeloNome = decodeURIComponent(resultado.dataset.nome);
            
            associateModel(modeloId, modeloNome);
        };

        return btn;
    }

    function associateModel(modeloId, modeloNome) {
        const rightPanel = document.querySelector('.right-panel');
        const itemRow = currentFocusedItem;

        if (itemRow) {
            const modeloAssociado = itemRow.querySelector('.modelo-associado');
            if (modeloAssociado) {
                modeloAssociado.textContent = `Modelo: ${modeloNome}`;
                modeloAssociado.dataset.id = modeloId;
                modeloAssociado.dataset.nome = modeloNome;
            }

            // Sair do modo foco
            rightPanel.classList.remove('focus-mode');
            currentFocusedItem = null;
            removeAssociateButtons();
        }
    }

    // Modificar a listener do botão adicionar
    btnAdicionar.addEventListener('click', () => {
        const itemRow = createItemRow();
        itemsContainer.appendChild(itemRow);
        setupModelAssociation(itemRow);
    });

    // Adicionar associação de modelo ao cabeçalho do checklist
    const headerAssociateBtn = document.querySelector('.checklist-associate-btn');
    if (headerAssociateBtn) {
        setupModelAssociation({
            querySelector: selector => {
                if (selector === '.paste') return headerAssociateBtn;
                if (selector === '.modelo-associado') return document.querySelector('.checklist-header-modelo');
                return null;
            }
        });
    }
});
