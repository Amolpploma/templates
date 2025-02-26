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
                // Parse das tags
                const tags = Array.isArray(checklist.tag) ? checklist.tag : JSON.parse(checklist.tag || '[]');
                // Parse do checklist antecipadamente para validar
                const checklistData = typeof checklist.checklist === 'string' ? 
                    JSON.parse(checklist.checklist) : checklist.checklist;

                const tagsHtml = tags
                    .map(tag => `<span class="tag">${tag}</span>`)
                    .join('');

                return `
                    <div class="resultado-nome" data-id="${checklist.id}" data-checklist='${JSON.stringify(checklistData)}'>
                        <div class="nome-texto">${checklist.nome}</div>
                        <div class="tags-container">${tagsHtml}</div>
                    </div>
                `;
            } catch (err) {
                console.error('Erro ao processar item do checklist:', err);
                return '';
            }
        })
        .join('');

    const itensResultado = checklistResultsList.querySelectorAll('.resultado-nome');
    itensResultado.forEach(item => {
        item.addEventListener('click', () => {
            document.querySelector('.resultado-nome.selected')?.classList.remove('selected');
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
                            <div class="checklist-descricao" data-state="inactive">
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
                    item.addEventListener('click', () => {
                        const currentState = item.dataset.state;
                        if (currentState === 'inactive') {
                            item.dataset.state = 'active';
                            item.classList.add('active');
                            item.querySelector('.checklist-icon').innerHTML = `
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                                </svg>
                            `;
                        } else if (currentState === 'active') {
                            item.dataset.state = 'disabled';
                            item.classList.remove('active');
                            item.classList.add('inactive');
                            item.querySelector('.checklist-icon').innerHTML = `
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/>
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
