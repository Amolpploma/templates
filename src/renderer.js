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
        .map(modelo => {
            // Parse das tags (assumindo que vem como string JSON)
            const tags = Array.isArray(modelo.tag) ? modelo.tag : JSON.parse(modelo.tag || '[]');
            
            // Criar elementos HTML para cada tag
            const tagsHtml = tags
                .map(tag => `<span class="tag">${tag}</span>`)
                .join('');

            return `
                <div class="resultado-nome" data-id="${modelo.id}" data-modelo="${encodeURIComponent(modelo.modelo)}">
                    <div class="nome-modelo">${modelo.nome}</div>
                    <div class="tags-container">${tagsHtml}</div>
                </div>
            `;
        })
        .join('');

    // Adicionar listeners para os itens clicáveis
    const itensResultado = resultsList.querySelectorAll('.resultado-nome');
    itensResultado.forEach(item => {
        item.addEventListener('click', () => {
            // Remover seleção anterior
            document.querySelector('.resultado-nome.selected')?.classList.remove('selected');
            
            // Adicionar seleção ao item clicado
            item.classList.add('selected');
            
            // Exibir o modelo do modelo e o botão
            const modelo = decodeURIComponent(item.dataset.modelo);
            resultsContent.innerHTML = `
                <div class="resultado-modelo-container">
                    <div class="resultado-modelo">${modelo}</div>
                </div>
                <button class="btn-inserir">Inserir no modelo</button>
            `;

            atualizarBotaoInserir();
        });
    });

    // Se houver resultados, mostrar o primeiro
    if (itensResultado.length > 0) {
        itensResultado[0].click();
    } else {
        resultsContent.innerHTML = `
            <div class="resultado-modelo-container">
                <div class="resultado-modelo">Nenhum resultado encontrado</div>
            </div>
        `;
    }
}

function getRandomPastelColor() {
    const hue = Math.floor(Math.random() * 360);
    return `hsl(${hue}, 70%, 95%)`;
}

function createModeloBox(texto) {
    const div = document.createElement('div');
    div.className = 'modelo-box';
    div.style.backgroundColor = getRandomPastelColor();
    
    div.innerHTML = `
        <div class="modelo-actions">
            <button class="modelo-action-btn" title="Copiar" type="button">
                <svg viewBox="0 0 24 24">
                    <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                </svg>
            </button>
            <button class="modelo-action-btn" title="Fechar" type="button">
                <svg viewBox="0 0 24 24">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
            </button>
        </div>
        <div class="modelo-content" contenteditable="true">${texto}</div>
    `;

    const modeloContent = div.querySelector('.modelo-content');
    const copyBtn = div.querySelector('.modelo-action-btn[title="Copiar"]');
    const closeBtn = div.querySelector('.modelo-action-btn[title="Fechar"]');

    // Prevenir inserção de modelos dentro de modelos
    modeloContent.addEventListener('paste', (e) => {
        e.preventDefault();
        const text = e.clipboardData.getData('text/plain');
        document.execCommand('insertText', false, text);
    });

    copyBtn.addEventListener('mousedown', (e) => {
        e.preventDefault();
        navigator.clipboard.writeText(modeloContent.textContent);
        copyBtn.style.color = '#4CAF50';
        setTimeout(() => copyBtn.style.color = '', 500);
    });

    closeBtn.addEventListener('mousedown', (e) => {
        e.preventDefault();
        // Simplesmente remove a caixa sem afetar nenhuma linha
        div.remove();
    });

    return div;
}

function inserirModelo(texto) {
    const editor = document.querySelector('.textarea-editor');
    const modeloBox = createModeloBox(texto);
    
    // Simplesmente adiciona a caixa ao final do editor
    editor.appendChild(modeloBox);
    
    // Rolar para a posição do novo modelo
    modeloBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Atualizar o evento do botão inserir
function atualizarBotaoInserir() {
    const btnInserir = resultsContent.querySelector('.btn-inserir');
    if (btnInserir) {
        btnInserir.addEventListener('click', () => {
            const modelo = decodeURIComponent(
                document.querySelector('.resultado-nome.selected').dataset.modelo
            );
            inserirModelo(modelo);
        });
    }
}

async function salvarDocumento() {
    const modelo = textArea.value;
    const nome = document.getElementById('nome-input').value || 'Sem nome';
    const tag = document.getElementById('tag-input').value || 'sem-tag';
    
    try {
        await window.electronAPI.salvarDocumento({ nome, tag, modelo });
    } catch (err) {
        console.error('Erro ao salvar:', err);
    }
}
