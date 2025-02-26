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
                            <div class="checklist-descricao">${item.descrição || item.descricao}</div>
                        </div>
                    `)
                    .join('');

                checklistResultsContent.innerHTML = `
                    <div class="resultado-texto-container">
                        <div class="resultado-texto">${checklistHtml}</div>
                    </div>
                `;
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
