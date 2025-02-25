const searchInput = document.querySelector('.search-input');
const searchResults = document.getElementById('search-results');

// Criar containers para lista e conteúdo
searchResults.innerHTML = `
    <div class="search-results-list"></div>
    <div class="search-results-content"></div>
`;

const resultsList = searchResults.querySelector('.search-results-list');
const resultsContent = searchResults.querySelector('.search-results-content');

let timeoutId = null;

searchInput.addEventListener('input', (e) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => realizarBusca(e.target.value), 300);
});

async function realizarBusca(termo) {
    if (termo.length < 2) {
        resultsList.innerHTML = '';
        resultsContent.innerHTML = '';
        return;
    }

    try {
        const resultados = await window.electronAPI.buscarDocumentos(termo);
        exibirResultados(resultados);
    } catch (err) {
        console.error('Erro na busca:', err);
    }
}

function exibirResultados(resultados) {
    resultsList.innerHTML = resultados
        .map(modelo => `
            <div class="resultado-nome" data-id="${modelo.id}" data-texto="${encodeURIComponent(modelo.texto)}">
                ${modelo.nome} <span class="tag">${modelo.tag}</span>
            </div>
        `)
        .join('');

    // Adicionar listeners para os itens clicáveis
    const itensResultado = resultsList.querySelectorAll('.resultado-nome');
    itensResultado.forEach(item => {
        item.addEventListener('click', () => {
            // Remover seleção anterior
            document.querySelector('.resultado-nome.selected')?.classList.remove('selected');
            
            // Adicionar seleção ao item clicado
            item.classList.add('selected');
            
            // Exibir o texto do modelo e o botão
            const texto = decodeURIComponent(item.dataset.texto);
            resultsContent.innerHTML = `
                <div class="resultado-texto">${texto}</div>
                <button class="btn-inserir">Inserir no modelo</button>
            `;

            // Adicionar evento de clique ao botão
            const btnInserir = resultsContent.querySelector('.btn-inserir');
            btnInserir.addEventListener('click', () => {
                const textArea = document.querySelector('.textarea-editor');
                textArea.value = texto;
            });
        });
    });

    // Se houver resultados, mostrar o primeiro
    if (itensResultado.length > 0) {
        itensResultado[0].click();
    } else {
        resultsContent.innerHTML = '<div class="resultado-texto">Nenhum resultado encontrado</div>';
    }
}

async function salvarDocumento() {
    const texto = textArea.value;
    const nome = document.getElementById('nome-input').value || 'Sem nome';
    const tag = document.getElementById('tag-input').value || 'sem-tag';
    
    try {
        await window.electronAPI.salvarDocumento({ nome, tag, texto });
    } catch (err) {
        console.error('Erro ao salvar:', err);
    }
}
