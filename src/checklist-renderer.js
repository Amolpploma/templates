const searchChecklistInput = document.querySelector('.search-checklist-input');
const searchChecklistResults = document.getElementById('search-checklist-results');

// Somente inicializar se os elementos existirem
if (searchChecklistInput && searchChecklistResults) {
    // Criar containers para lista e conteúdo
    searchChecklistResults.innerHTML = `
        <div class="search-results-list"></div>
        <div class="search-results-content"></div>
    `;

    const checklistResultsList = searchChecklistResults.querySelector('.search-results-list');
    const checklistResultsContent = searchChecklistResults.querySelector('.search-results-content');

    let checklistTimeoutId = null;

    searchChecklistInput.addEventListener('input', (e) => {
        clearTimeout(checklistTimeoutId);
        checklistTimeoutId = setTimeout(() => realizarBuscaChecklist(e.target.value), 300);
    });

    async function realizarBuscaChecklist(termo) {
        if (termo.length < 2) {
            checklistResultsList.innerHTML = '';
            checklistResultsContent.innerHTML = '';
            return;
        }

        try {
            // Obter estado dos checkboxes de filtro
            const filtros = {
                nome: document.getElementById('checklist-nome').checked,
                etiqueta: document.getElementById('checklist-etiqueta').checked
            };

            const resultados = await window.electronAPI.buscarChecklists(termo, filtros);
            exibirResultadosChecklist(resultados);
        } catch (err) {
            console.error('Erro na busca de checklists:', err);
        }
    }

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
                             data-nome="${encodeURIComponent(checklist.nome)}"
                             data-tag='${JSON.stringify(tags)}'
                             data-modelo_id="${checklist.modelo_id || ''}"
                             data-checklist='${JSON.stringify(checklistData)}'>
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
                // Remover seleção anterior apenas dos checklists
                document.querySelector('.resultado-checklist.selected')?.classList.remove('selected');
                item.classList.add('selected');
                
                try {
                    const checklistData = item.dataset.checklist;
                    console.log('Checklist data:', checklistData); // Debug
                    const checklist = JSON.parse(checklistData);
                    
                    if (!Array.isArray(checklist)) {
                        console.error('Dados do checklist:', checklist); // Debug
                        throw new Error('Checklist não é um array válido');
                    }

                    // Adicionar o modelo_id do checklist ao container de resultado
                    const modeloIdChecklist = item.dataset.modelo_id;

                    const checklistHtml = window.renderizarChecklist(checklistData);

                    // Verificar se estamos na página de edição de checklists
                    const isEditPage = document.body.getAttribute('data-page') === 'checklist-editor';

                    checklistResultsContent.innerHTML = `
                        <div class="resultado-texto-container" data-modelo_id="${modeloIdChecklist}">
                            ${renderizarChecklist(checklistData)}
                        </div>
                        ${isEditPage ? `
                            <div class="button-container">
                                <button class="btn-editar">Editar</button>
                                <button class="btn-danger">Apagar</button>
                            </div>
                        ` : ''}
                    `;

                    // Adicionar handlers dos botões e eventos apenas se NÃO estivermos na página de edição
                    if (!isEditPage) {
                        const checklistItems = checklistResultsContent.querySelectorAll('.checklist-descricao');
                        checklistItems.forEach(item => {
                            item.addEventListener('click', async () => {
                                const currentState = item.dataset.state;
                                if (currentState === 'inactive' || currentState === 'disabled') {
                                    // Tratar ambos os estados da mesma forma para ativação
                                    item.dataset.state = 'active';
                                    item.classList.remove('inactive');
                                    item.classList.add('active');
                                    item.querySelector('.checklist-icon').innerHTML = `
                                        <svg viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                                        </svg>
                                    `;
                                    
                                    // Verificar se todas as descrições estão ativas
                                    const todasAtivas = Array.from(checklistItems)
                                        .every(item => item.dataset.state === 'active');
                                    
                                    if (todasAtivas) {
                                        // Obter o modelo_id do checklist completo do elemento selecionado
                                        const selectedChecklist = document.querySelector('.resultado-checklist.selected');
                                        const modeloIdChecklist = selectedChecklist?.dataset.modelo_id;

                                        console.log(`Todas as descrições ativas. Verificando modelo completo: ${modeloIdChecklist}`);
                                        
                                        // Verificar e inserir se necessário
                                        const modeloExistente = document.querySelector(
                                            `.modelo-box[data-modelo_id="${modeloIdChecklist}"]`
                                        );

                                        if (!modeloExistente && modeloIdChecklist) {
                                            console.log(`Iniciando inserção do modelo completo ${modeloIdChecklist}`);
                                            await inserirModeloAutomatico(modeloIdChecklist);
                                        } else {
                                            console.log(`Modelo completo ${modeloIdChecklist} ${modeloExistente ? 'já existe' : 'não tem ID'}`);
                                        }
                                    }
                                } else if (currentState === 'active') {
                                    // Estado desligado (vermelho)
                                    item.dataset.state = 'disabled';
                                    item.classList.remove('active');
                                    item.classList.add('inactive');
                                    item.querySelector('.checklist-icon').innerHTML = `
                                        <svg viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                                    `;
                                    
                                    // Usar o modelo_id do item individual
                                    const itemModeloId = item.dataset.modelo_id;
                                    if (itemModeloId) {
                                        const modeloExistente = document.querySelector(
                                            `.modelo-box[data-modelo_id="${itemModeloId}"]`
                                        );
                                        
                                        if (!modeloExistente) {
                                            await inserirModeloAutomatico(itemModeloId);
                                        }
                                    }
                                }
                            });
                        });
                    }

                    // Adicionar handlers dos botões de edição/apagar se estivermos na página de edição
                    if (isEditPage) {
                        const btnEditar = checklistResultsContent.querySelector('.btn-editar');
                        const btnApagar = checklistResultsContent.querySelector('.btn-danger');

                        if (btnEditar) {
                            btnEditar.addEventListener('click', () => carregarChecklistParaEdicao(item));
                        }

                        if (btnApagar) {
                            btnApagar.addEventListener('click', () => apagarChecklist(item));
                        }
                    }

                } catch (err) {
                    console.error('Erro ao processar checklist:', err, 'Dados:', item.dataset.checklist);
                    checklistResultsContent.innerHTML = `
                        <div class="resultado-texto-container">
                            <div class="resultado-texto">Erro ao carregar o checklist: ${err.message}</div>
                        </div>
                    `;
                }
            });
        });

        if (itensResultado.length > 0) {
            itensResultado[0].click();
        } else {
            checklistResultsContent.innerHTML = `
                <div class="resultado-texto-container">
                    <div class="resultado-texto">Nenhum resultado encontrado</div>
                </div>
            `;
        }
    }

    // Função auxiliar para verificar modelo completo - usando a mesma lógica do botão inserir
    async function verificarModeloCompleto() {
        const checklistElement = document.querySelector('.resultado-checklist.selected');
        if (checklistElement) {
            const modeloId = checklistElement.dataset.modelo_id;
            console.log(`Tentando inserir modelo completo: ${modeloId}`);
            
            // Usando a mesma lógica do botão "Inserir no modelo"
            try {
                const modelo = await window.electronAPI.buscarModeloPorId(modeloId);
                if (modelo) {
                    await window.inserirModelo(modelo.modelo, modelo.nome, modeloId);
                }
            } catch (error) {
                console.error('Erro ao inserir modelo completo:', error);
            }
        }
    }

    // Simplificar a função inserirModeloAutomatico já que agora usa a mesma lógica
    async function inserirModeloAutomatico(modeloId) {
        if (!modeloId) return;
        
        try {
            const modelo = await window.electronAPI.buscarModeloPorId(modeloId);
            if (modelo) {
                await window.inserirModelo(modelo.modelo, modelo.nome, modeloId);
            }
        } catch (error) {
            console.error('Erro ao inserir modelo automático:', error);
        }
    }

    // Função para verificar se o modelo completo já existe
    function verificarModeloCompletoExistente(modeloId) {
        if (!modeloId) return false;
        
        console.log(`Verificando existência do modelo completo ID: ${modeloId}`);
        const modeloExistente = document.querySelector(`.modelo-box[data-modelo_id="${modeloId}"]`);
        console.log(`Modelo completo ${modeloId} ${modeloExistente ? 'encontrado' : 'não encontrado'} no DOM`);
        
        return !!modeloExistente;
    }
}

// Mover para fora do DOMContentLoaded para ficar no escopo global
function setupModelAssociation(itemRow) {
    const pasteBtn = itemRow.querySelector('.paste');
    const rightPanel = document.querySelector('.right-panel');
    const searchInput = rightPanel.querySelector('.search-input');

    pasteBtn.onclick = (e) => {
        e.stopPropagation();
        
        if (currentFocusedItem && currentFocusedItem !== itemRow) {
            rightPanel.classList.remove('focus-mode');
            removeAssociateButtons();
        }

        rightPanel.classList.add('focus-mode');
        currentFocusedItem = itemRow;
        searchInput.focus();
        addAssociateButtons();
    };

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

// Também mover as funções auxiliares para o escopo global
function addAssociateButtons() {
    document.querySelectorAll('.resultado-modelo').forEach(resultado => {
        if (!resultado.querySelector('.associate-model-btn')) {
            const btn = createAssociateButton();
            resultado.firstElementChild.insertBefore(btn, resultado.firstElementChild.firstChild);
        }
    });
}

function removeAssociateButtons() {
    document.querySelectorAll('.associate-model-btn').forEach(btn => btn.remove());
}

// Variável global para controle do item focado
let currentFocusedItem = null;

document.addEventListener('DOMContentLoaded', () => {
    // ...existing code...
});
