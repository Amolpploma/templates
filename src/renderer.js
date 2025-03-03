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

// Adicionar funcionalidade aos botões de limpar
document.querySelectorAll('.clear-input').forEach(button => {
    button.addEventListener('click', (e) => {
        const input = e.target.closest('.search-container').querySelector('input');
        input.value = '';
        input.dispatchEvent(new Event('input')); // Disparar evento de input para atualizar a busca
        input.focus();
    });
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
            try {
                const tags = Array.isArray(modelo.tag) ? modelo.tag : JSON.parse(modelo.tag || '[]');
                const tagsHtml = tags
                    .map(tag => `<span class="tag">${tag}</span>`)
                    .join('');

                return `
                    <div class="resultado-modelo" 
                         data-id="${modelo.id}" 
                         data-nome="${encodeURIComponent(modelo.nome)}"
                         data-modelo="${encodeURIComponent(modelo.modelo)}">
                        <div class="nome-modelo">${modelo.nome}</div>
                        <div class="tags-container">${tagsHtml}</div>
                    </div>
                `;
            } catch (err) {
                console.error('Erro ao processar modelo:', err);
                return '';
            }
        })
        .join('');

    const itensResultado = resultsList.querySelectorAll('.resultado-modelo');
    itensResultado.forEach(item => {
        item.addEventListener('click', () => {
            // Remover seleção anterior apenas dos modelos
            document.querySelector('.resultado-modelo.selected')?.classList.remove('selected');
            
            item.classList.add('selected');
            
            const modelo = decodeURIComponent(item.dataset.modelo);
            const nomeModelo = decodeURIComponent(item.dataset.nome);
            resultsContent.innerHTML = `
                <div class="resultado-modelo-container">
                    <div class="resultado-modelo-texto" data-nome="${encodeURIComponent(nomeModelo)}">${modelo}</div>
                </div>
                <button class="btn-inserir">Inserir modelo</button>
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
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const hue = Math.floor(Math.random() * 360);
    
    if (isDark) {
        // Cores mais escuras para o tema escuro, com baixa saturação e luminosidade
        return `hsla(${hue}, 30%, 25%, 0.3)`;
    } else {
        // Cores pasteis claras para o tema claro
        return `hsla(${hue}, 70%, 95%, 0.3)`;
    }
}

function createModeloBox(texto, nome, modeloId = '') {
    const div = document.createElement('div');
    div.className = 'modelo-box';
    div.setAttribute('data-modelo_id', modeloId);
    
    // Aplicar cor de fundo baseada no tema atual
    const backgroundColor = getRandomPastelColor();
    div.style.backgroundColor = backgroundColor;
    
    div.innerHTML = `
        <div class="modelo-header">
            <div class="modelo-title">${nome}</div>
            <div class="modelo-actions">
                <button class="modelo-action-btn" title="Enviar para o editor" type="button">
                    <svg viewBox="0 0 24 24">
                        <path d="M4 12l1.41 1.41L11 7.83V20h2V7.83l5.58 5.59L20 12l-8-8-8 8z"/>
                    </svg>
                </button>
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
        </div>
        <div class="modelo-content" contenteditable="true">${texto}</div>
    `;

    // Aplicar a mesma cor de fundo à header
    const header = div.querySelector('.modelo-header');
    if (header) {
        header.style.backgroundColor = backgroundColor;
    }

    const modeloContent = div.querySelector('.modelo-content');
    const sendToEditorBtn = div.querySelector('.modelo-action-btn[title="Enviar para o editor"]');
    const copyBtn = div.querySelector('.modelo-action-btn[title="Copiar"]');
    const closeBtn = div.querySelector('.modelo-action-btn[title="Fechar"]');

    // Prevenir inserção de modelos dentro de modelos
    modeloContent.addEventListener('paste', (e) => {
        e.preventDefault();
        const text = e.clipboardData.getData('text/plain');
        document.execCommand('insertText', false, text);
    });

    sendToEditorBtn.addEventListener('mousedown', (e) => {
        e.preventDefault();
        const content = modeloContent.innerHTML;
        
        if (window.quill) {
            try {
                const editor = window.quill;
                let textLength = 0;
                
                // Tentar obter o texto usando diferentes métodos
                if (typeof editor.getText === 'function') {
                    textLength = editor.getText().length;
                } else if (editor.root && typeof editor.root.innerText === 'string') {
                    textLength = editor.root.innerText.length;
                } else {
                    console.warn('Não foi possível obter o comprimento do texto do editor.');
                }
                
                // Adicionar quebras de linha se necessário
                if (textLength > 1) {
                    if (typeof editor.insertText === 'function') {
                        editor.insertText(textLength - 1, '\n\n');
                    } else {
                        editor.root.innerHTML += '<br><br>';
                    }
                }
                
                // Inserir o conteúdo HTML
                if (typeof editor.clipboard !== 'undefined' && typeof editor.clipboard.dangerouslyPasteHTML === 'function') {
                    editor.clipboard.dangerouslyPasteHTML(textLength, content);
                } else {
                    editor.root.innerHTML += content;
                }
                
                // Rolar para o final do editor
                const editorElement = document.querySelector('.ql-editor');
                if (editorElement) {
                    setTimeout(() => {
                        editorElement.scrollTop = editorElement.scrollHeight;
                    }, 100);
                }
                
                div.remove();
            } catch (error) {
                console.error('Erro ao inserir conteúdo no editor:', error);
            }
        } else {
            console.error('Editor Quill não encontrado');
        }
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

// Remover a função inserirModelo daqui pois ela agora está em shared-functions.js

function atualizarBotaoInserir() {
    const btnInserir = resultsContent.querySelector('.btn-inserir');
    if (btnInserir) {
        btnInserir.addEventListener('click', () => {
            const modeloSelecionado = document.querySelector('.resultado-modelo.selected');
            if (modeloSelecionado) {
                const modelo = decodeURIComponent(modeloSelecionado.dataset.modelo);
                const nome = decodeURIComponent(modeloSelecionado.dataset.nome);
                const modeloId = modeloSelecionado.dataset.id;
                window.inserirModelo(modelo, nome, modeloId); // Usar função global
            }
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
