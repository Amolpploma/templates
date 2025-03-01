const searchChecklistInput = document.querySelector('.search-checklist-input');
const searchChecklistResults = document.getElementById('search-checklist-results');

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
        const resultados = await window.electronAPI.buscarChecklists(termo);
        exibirResultadosChecklist(resultados);
    } catch (err) {
        console.error('Erro na busca de checklists:', err);
    }
}

function exibirResultadosChecklist(resultados) {
    checklistResultsList.innerHTML = resultados
        .map(checklist => {
            try {
                const tags = Array.isArray(checklist.tag) ? checklist.tag : JSON.parse(checklist.tag || '[]');
                const checklistData = typeof checklist.checklist === 'string' ? 
                    JSON.parse(checklist.checklist) : checklist.checklist;

                return `
                    <div class="resultado-checklist" 
                         data-id="${checklist.id}" 
                         data-modelo_id="${checklist.modelo_id || ''}"
                         data-checklist='${JSON.stringify(checklistData)}'>
                        <div class="nome-texto">${checklist.nome}</div>
                        <div class="tags-container">${tags.map(tag => `<span class="tag">${tag}</span>`).join('')}</div>
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

                const checklistHtml = checklist
                    .map(item => `
                        <div class="checklist-item">
                            <div class="checklist-descricao" 
                                 data-state="inactive"
                                 data-modelo_id="${item.modelo_id || ''}"
                                 data-checklist_id="${checklist.id || ''}">
                                <span class="checklist-icon"></span>
                                <span class="checklist-text">${item.descrição || item.descricao}</span>
                            </div>
                        </div>
                    `)
                    .join('');

                checklistResultsContent.innerHTML = `
                    <div class="resultado-texto-container">
                        <div class="resultado-texto">${checklistHtml}</div>
                    </div>
                `;

                // Adicionar eventos de clique aos itens do checklist
                const checklistItems = checklistResultsContent.querySelectorAll('.checklist-descricao');
                checklistItems.forEach(item => {
                    item.addEventListener('click', async () => {
                        const currentState = item.dataset.state;
                        
                        if (currentState === 'inactive') {
                            // Primeiro clique: inativo -> ativo
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
                                // Usar o modelo_id do checklist principal
                                const checklistElement = document.querySelector('.resultado-checklist.selected');
                                if (checklistElement) {
                                    const modeloId = checklistElement.dataset.modelo_id;
                                    if (modeloId) {
                                        console.log('Inserindo modelo do checklist completo:', modeloId);
                                        await inserirModeloAutomatico(modeloId);
                                    }
                                }
                            }
                        } else if (currentState === 'active') {
                            // Segundo clique: ativo -> desligado
                            item.dataset.state = 'disabled';
                            item.classList.remove('active');
                            item.classList.add('inactive');
                            item.querySelector('.checklist-icon').innerHTML = `
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                                </svg>
                            `;
                            
                            // Usar o modelo_id do item individual
                            const itemModeloId = item.dataset.modelo_id;
                            if (itemModeloId) {
                                await inserirModeloAutomatico(itemModeloId);
                            }
                        } else if (currentState === 'disabled') {
                            // Terceiro clique: desligado -> ativo
                            item.dataset.state = 'active';
                            item.classList.remove('inactive');
                            item.classList.add('active');
                            item.querySelector('.checklist-icon').innerHTML = `
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                                </svg>
                            `;
                        }
                    });
                });

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

async function inserirModeloAutomatico(modeloId) {
    if (!modeloId) return;

    try {
        const modelo = await window.electronAPI.buscarModeloPorId(modeloId);
        if (modelo) {
            await window.inserirModelo(modelo.modelo, modelo.nome, modelo.id); // Usar função global
        }
    } catch (error) {
        console.error('Erro ao inserir modelo automático:', error);
    }
}
