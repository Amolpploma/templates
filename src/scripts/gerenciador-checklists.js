document.addEventListener('DOMContentLoaded', () => {
    const btnAdicionar = document.querySelector('.btn-adicionar-item');
    const itemsContainer = document.getElementById('checklist-items-container');
    let currentFocusedItem = null; // Mover para o escopo mais amplo

    // Remover a função createItemRow daqui pois ela foi movida para shared-functions.js

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
        const itemRow = window.createItemRow(); // Usar a função global
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

    // Adicionar handler para o botão salvar
    const btnSalvar = document.querySelector('.btn-salvar');
    const nomeInput = document.getElementById('nome-checklist-input');
    const tagInput = document.getElementById('tag-checklist-input');

    btnSalvar.addEventListener('click', async () => {
        const nome = nomeInput.value.trim();
        if (!nome) {
            await showDialog(
                'Campo obrigatório',
                'Por favor, insira um nome para o checklist',
                [{
                    id: 'btn-ok',
                    text: 'OK',
                    class: 'btn-primary',
                    value: false
                }]
            );
            return;
        }

        // Coletar itens do checklist
        const checklistItems = Array.from(document.querySelectorAll('.checklist-item-row'))
            .map(item => ({
                descricao: item.querySelector('.checklist-item-input').value,
                modelo_id: item.querySelector('.modelo-associado')?.dataset?.id || null
            }))
            .filter(item => item.descricao.trim().length > 0);

        if (checklistItems.length === 0) {
            await showDialog(
                'Campo obrigatório',
                'Por favor, adicione pelo menos um item ao checklist',
                [{
                    id: 'btn-ok',
                    text: 'OK',
                    class: 'btn-primary',
                    value: false
                }]
            );
            return;
        }

        // Obter modelo_id do header
        const headerModelo = document.querySelector('.checklist-header-modelo');
        const modeloId = headerModelo?.dataset?.id || null;

        // Processar tags
        const tags = tagInput.value
            .split(',')
            .map(tag => tag.trim())
            .filter(tag => tag.length > 0);

        try {
            const checklistExistente = await verificarChecklistExistente(nome);

            if (checklistExistente) {
                const shouldUpdate = await showDialog(
                    'Checklist Existente',
                    'Já existe um checklist com este nome. Deseja atualizá-lo?',
                    [{
                        id: 'btn-cancelar',
                        text: 'Cancelar',
                        class: 'btn-secondary',
                        value: false
                    },
                    {
                        id: 'btn-atualizar',
                        text: 'Atualizar',
                        class: 'btn-primary',
                        value: true
                    }]
                );

                if (shouldUpdate) {
                    try {
                        const lastID = await window.electronAPI.salvarChecklist({
                            nome,
                            tag: tags,
                            checklist: checklistItems,
                            modelo_id: modeloId,
                            id: checklistExistente.id // Passar o ID para a função salvarChecklist
                        });

                        // Limpar campos após salvar
                        limparCampos();

                        await showDialog(
                            'Sucesso',
                            `Checklist atualizado com sucesso! (ID: ${lastID})`,
                            [{
                                id: 'btn-ok',
                                text: 'OK',
                                class: 'btn-primary',
                                value: true
                            }]
                        );
                    } catch (err) {
                        console.error('Erro ao atualizar checklist:', err);
                        await showDialog(
                            'Erro',
                            `Erro ao atualizar o checklist: ${err.message}`,
                            [{
                                id: 'btn-ok',
                                text: 'OK',
                                class: 'btn-primary',
                                value: false
                            }]
                        );
                    }
                }
            } else {
                try {
                    const lastID = await window.electronAPI.salvarChecklist({
                        nome,
                        tag: tags,
                        checklist: checklistItems,
                        modelo_id: modeloId
                    });

                    // Limpar campos após salvar
                    limparCampos();

                    await showDialog(
                        'Sucesso',
                        `Checklist salvo com sucesso! (ID: ${lastID})`,
                        [{
                            id: 'btn-ok',
                            text: 'OK',
                            class: 'btn-primary',
                            value: true
                        }]
                    );
                } catch (err) {
                    console.error('Erro ao salvar checklist:', err);
                    await showDialog(
                        'Erro',
                        `Erro ao salvar o checklist: ${err.message}`,
                        [{
                            id: 'btn-ok',
                            text: 'OK',
                            class: 'btn-primary',
                            value: false
                        }]
                    );
                }
            }
        } catch (err) {
            console.error('Erro ao verificar checklist existente:', err);
            await showDialog(
                'Erro',
                `Erro ao verificar checklist existente: ${err.message}`,
                [{
                    id: 'btn-ok',
                    text: 'OK',
                    class: 'btn-primary',
                    value: false
                }]
            );
        }
    });

    async function verificarChecklistExistente(nome) {
        try {
            // Chamar a função no processo principal para verificar o modelo
            const checklistExistente = await window.electronAPI.verificarChecklist(nome);
            return checklistExistente;
        } catch (error) {
            console.error('Erro ao verificar checklist existente:', error);
            return null;
        }
    }

    function limparCampos() {
        nomeInput.value = '';
        tagInput.value = '';
        document.getElementById('checklist-items-container').innerHTML = '';
        const headerModelo = document.querySelector('.checklist-header-modelo');
        headerModelo.dataset.id = '';
        headerModelo.dataset.nome = '';
        headerModelo.textContent = 'Modelo: sem modelo associado';
    }
});

function exibirResultadosChecklist(resultados) {
    const filtros = {
        nome: document.getElementById('checklist-nome').checked,
        etiqueta: document.getElementById('checklist-etiqueta').checked
    };

    checklistResultsList.innerHTML = resultados
        .map(checklist => {
            try {
                const tags = Array.isArray(checklist.tag) ? checklist.tag : JSON.parse(checklist.tag || '[]');
                const tagsHtml = tags
                    .map(tag => `<span class="tag" data-tag="${encodeURIComponent(tag)}">${highlightText(tag, searchChecklistInput.value, filtros.etiqueta)}</span>`)
                    .join('');

                const checklistData = typeof checklist.checklist === 'string' ? 
                    JSON.parse(checklist.checklist) : checklist.checklist;
                
                return `
                    <div class="resultado-checklist" 
                         data-id="${checklist.id}" 
                         data-modelo_id="${checklist.modelo_id || ''}"
                         data-checklist='${JSON.stringify(checklistData)}'
                         data-nome="${encodeURIComponent(checklist.nome)}"
                         data-tag='${JSON.stringify(tags)}'>
                        <div class="nome-texto">
                            ${highlightText(checklist.nome, searchChecklistInput.value, filtros.nome)}
                        </div>
                        <div class="tags-container">${tagsHtml}</div>
                    </div>
                `;
            } catch (err) {
                console.error('Erro ao processar item do checklist:', err);
                return '';
            }
        })
        .join('');

    const itensResultado = checklistResultsList.querySelectorAll('.resultado-checklist');
    itensResultado.forEach(item => {
        item.addEventListener('click', () => {
            document.querySelector('.resultado-checklist.selected')?.classList.remove('selected');
            item.classList.add('selected');

            const checklistData = JSON.parse(item.dataset.checklist);
            const modeloId = item.dataset.modelo_id;

            const buttons = `
                <div class="button-container">
                    <button class="btn-editar">Editar</button>
                    <button class="btn-danger">Apagar</button>
                </div>
            `;

            checklistResultsContent.innerHTML = `
                <div class="resultado-texto-container">
                    ${renderizarChecklist(checklistData)}
                </div>
                ${buttons}
            `;

            // Adicionar handlers dos botões
            const btnEditar = checklistResultsContent.querySelector('.btn-editar');
            const btnApagar = checklistResultsContent.querySelector('.btn-danger');

            if (btnEditar) {
                btnEditar.addEventListener('click', () => carregarChecklistParaEdicao(item));
            }

            if (btnApagar) {
                btnApagar.addEventListener('click', () => apagarChecklist(item));
            }
        });
    });

    // ...existing code...
}

async function carregarChecklistParaEdicao(item) {
    try {
        // Preencher os campos com os dados do checklist já disponíveis
        const nome = decodeURIComponent(item.dataset.nome);
        const tags = JSON.parse(item.dataset.tag || '[]');
        const checklistData = JSON.parse(item.dataset.checklist);
        const modeloId = item.dataset.modelo_id;

        console.log('Dados para edição:', { nome, tags, checklistData, modeloId });

        // Preencher nome e tags
        document.getElementById('nome-checklist-input').value = nome;
        document.getElementById('tag-checklist-input').value = tags.join(', ');

        // Limpar itens existentes
        const container = document.getElementById('checklist-items-container');
        container.innerHTML = '';

        // Adicionar itens
        for (const item of checklistData) {
            const itemRow = window.createItemRow();
            container.appendChild(itemRow);
            
            // Preencher descrição
            const input = itemRow.querySelector('.checklist-item-input');
            input.value = item.descricao || item.descrição || '';

            // Configurar modelo associado se existir
            if (item.modelo_id) {
                const modeloAssociado = itemRow.querySelector('.modelo-associado');
                try {
                    const modelo = await window.electronAPI.buscarModeloPorId(item.modelo_id);
                    if (modelo) {
                        modeloAssociado.dataset.id = item.modelo_id;
                        modeloAssociado.dataset.nome = modelo.nome;
                        modeloAssociado.textContent = `Modelo: ${modelo.nome}`;
                    }
                } catch (err) {
                    console.error('Erro ao buscar modelo:', err);
                    modeloAssociado.textContent = `Modelo: ID ${item.modelo_id} (erro ao carregar nome)`;
                }
            }

            setupModelAssociation(itemRow);
        }

        // Configurar modelo do cabeçalho se existir
        if (modeloId) {
            const headerModelo = document.querySelector('.checklist-header-modelo');
            try {
                const modelo = await window.electronAPI.buscarModeloPorId(modeloId);
                if (modelo && headerModelo) {
                    headerModelo.dataset.id = modeloId;
                    headerModelo.dataset.nome = modelo.nome;
                    headerModelo.textContent = `Modelo: ${modelo.nome}`;
                }
            } catch (err) {
                console.error('Erro ao buscar modelo do cabeçalho:', err);
                if (headerModelo) {
                    headerModelo.textContent = `Modelo: ID ${modeloId} (erro ao carregar nome)`;
                }
            }
        }

        // Rolar para o topo da página
        window.scrollTo(0, 0);
    } catch (err) {
        console.error('Erro ao carregar checklist para edição:', err);
        await showDialog(
            'Erro',
            'Erro ao carregar checklist para edição',
            [{
                id: 'btn-ok',
                text: 'OK',
                class: 'btn-primary',
                value: false
            }]
        );
    }
}

async function apagarChecklist(item) {
    const shouldDelete = await showDialog(
        'Confirmar exclusão',
        'Tem certeza que deseja apagar este checklist?',
        [{
            id: 'btn-cancelar',
            text: 'Cancelar',
            class: 'btn-secondary',
            value: false
        },
        {
            id: 'btn-apagar',
            text: 'Apagar',
            class: 'btn-danger',
            value: true
        }]
    );

    if (shouldDelete) {
        try {
            await window.electronAPI.apagarChecklist(item.dataset.id);
            // Atualizar a lista de resultados
            const searchInput = document.querySelector('.search-checklist-input');
            searchInput.dispatchEvent(new Event('input'));
        } catch (err) {
            console.error('Erro ao apagar checklist:', err);
            await showDialog(
                'Erro',
                'Erro ao apagar o checklist',
                [{
                    id: 'btn-ok',
                    text: 'OK',
                    class: 'btn-primary',
                    value: false
                }]
            );
        }
    }
}

function renderizarChecklist(checklistData) {
    return checklistData
        .map(item => `
            <div class="checklist-item">
                <div class="checklist-descricao" 
                     data-state="inactive"
                     data-modelo_id="${item.modelo_id || ''}"
                     data-checklist_id="${item.id || ''}">
                    <span class="checklist-icon"></span>
                    <span class="checklist-text">${item.descrição || item.descricao}</span>
                </div>
            </div>
        `)
        .join('');
}
