const searchInput = document.querySelector('.search-input');
const searchResults = document.getElementById('search-results');

if (searchInput && searchResults) {
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
            // Obter estado dos checkboxes de filtro
            const filtros = {
                nome: document.getElementById('modelo-nome').checked,
                etiqueta: document.getElementById('modelo-etiqueta').checked,
                conteudo: document.getElementById('modelo-conteudo').checked
            };

            const resultados = await window.electronAPI.buscarDocumentos(termo, filtros);
            exibirResultados(resultados);
        } catch (err) {
            console.error('Erro na busca:', err);
        }
    }

    function exibirResultados(resultados) {
        const filtros = {
            nome: document.getElementById('modelo-nome').checked,
            etiqueta: document.getElementById('modelo-etiqueta').checked,
            conteudo: document.getElementById('modelo-conteudo').checked
        };

        resultsList.innerHTML = resultados
            .map(modelo => {
                try {
                    const tags = Array.isArray(modelo.tag) ? modelo.tag : JSON.parse(modelo.tag || '[]');
                    const tagsHtml = tags
                        .map(tag => `<span class="tag" data-tag="${encodeURIComponent(tag)}">${highlightText(tag, searchInput.value, filtros.etiqueta)}</span>`)
                        .join('');

                    return `
                        <div class="resultado-modelo" 
                             data-id="${modelo.id}" 
                             data-nome="${encodeURIComponent(modelo.nome)}"
                             data-modelo="${encodeURIComponent(modelo.modelo)}">
                            <div class="nome-modelo">
                                ${highlightText(modelo.nome, searchInput.value, filtros.nome)}
                            </div>
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
                
                const modeloSelecionado = decodeURIComponent(item.dataset.modelo);
                const nomeModelo = decodeURIComponent(item.dataset.nome);
                
                // Verificar se estamos na página de edição
                const isEditorPage = document.body.getAttribute('data-page') === 'editor';
                const isChecklistEditorPage = document.body.getAttribute('data-page') === 'checklist-editor';
                
                resultsContent.innerHTML = `
                    <div class="resultado-modelo-container">
                        <div class="resultado-modelo-texto" data-nome="${encodeURIComponent(nomeModelo)}">
                            ${highlightText(modeloSelecionado, searchInput.value, filtros.conteudo)}
                        </div>
                    </div>
                    <div class="button-container">
                        ${!isChecklistEditorPage ? `<button class="btn-inserir">Inserir modelo</button>` : ''}
                        ${isEditorPage ? `
                            <button class="btn-editar">Editar</button>
                            <button class="btn-danger">Apagar</button>
                        ` : ''}
                    </div>
                `;

                if (isEditorPage) {
                    const btnApagar = resultsContent.querySelector('.btn-danger');
                    btnApagar.addEventListener('click', async () => {
                        const shouldDelete = await showDialog(
                            'Confirmar exclusão',
                            'Tem certeza que deseja apagar este modelo?',
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
                                await window.electronAPI.apagarModelo(item.dataset.id);
                                realizarBusca(searchInput.value);
                                await showDialog(
                                    'Sucesso',
                                    `Modelo <i><u>${decodeURIComponent(item.dataset.nome)}</u></i> apagado com sucesso!`,
                                    [{
                                        id: 'btn-ok',
                                        text: 'OK',
                                        class: 'btn-primary',
                                        value: false
                                    }]
                                );
                            } catch (err) {
                                console.error('Erro ao apagar modelo:', err);
                                await showDialog(
                                    'Erro',
                                    'Erro ao apagar o modelo',
                                    [{
                                        id: 'btn-ok',
                                        text: 'OK',
                                        class: 'btn-primary',
                                        value: false
                                    }]
                                );
                            }
                        }
                    });
                }

                // Atualizar para usar a função global
                window.atualizarBotaoInserir(resultsContent);
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
        
        // Adicionar classe para cor de fundo baseada no tema atual
        const colorClass = `modelo-box-color-${Math.floor(Math.random() * 4) + 1}`;
        div.classList.add(colorClass);
        
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
            
            // Usar TinyMCE em vez de Quill
            if (window.tinymce && window.tinymce.activeEditor) {
                try {
                    const editor = window.tinymce.activeEditor;
                    const currentContent = editor.getContent();
                    
                    // Adicionar quebras de linha se já houver conteúdo
                    const newContent = currentContent 
                        ? currentContent + '<p>&nbsp;</p>' + content 
                        : content;
                    
                    // Inserir o conteúdo
                    editor.setContent(newContent);
                    
                    // Mover o cursor para o final
                    editor.selection.select(editor.getBody(), true);
                    editor.selection.collapse(false);
                    
                    // Rolar para o final
                    const body = editor.getBody();
                    body.scrollTop = body.scrollHeight;
                    
                    // Remover a caixa do modelo
                    div.remove();
                } catch (error) {
                    console.error('Erro ao inserir conteúdo no editor:', error);
                }
            } else {
                console.error('Editor TinyMCE não encontrado');
            }
        });

        copyBtn.addEventListener('mousedown', (e) => {
            e.preventDefault();
            navigator.clipboard.writeText(modeloContent.textContent);
            copyBtn.classList.add('copy-success');
            setTimeout(() => copyBtn.classList.remove('copy-success'), 500);
        });

        closeBtn.addEventListener('mousedown', (e) => {
            e.preventDefault();
            // Remove a caixa
            div.remove();
            
            // Atualizar visibilidade da textarea-editor
            window.updateTextareaEditorVisibility();
        });

        return div;
    }

    // Remover a função inserirModelo daqui pois ela agora está em shared-functions.js

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

    // Controle dos checkboxes de refinamento
    function setupSearchRefinements(parentSelector, defaultCheckboxId) {
        const checkboxes = document.querySelectorAll(`${parentSelector} .search-refinements input[type="checkbox"]`);
        
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                if (!e.target.checked) {
                    // Verificar se há outros checkboxes marcados no mesmo grupo
                    const anyChecked = Array.from(checkboxes)
                        .some(cb => cb !== e.target && cb.checked);
                    
                    if (!anyChecked) {
                        e.preventDefault();
                        e.target.checked = true;
                        return false;
                    }
                }
            });
        });

        // Garantir que o checkbox padrão esteja marcado na inicialização
        const defaultCheckbox = document.getElementById(defaultCheckboxId);
        if (defaultCheckbox) {
            defaultCheckbox.checked = true;
        }
    }

    // Inicializar os refinamentos de pesquisa com os seletores corretos
    document.addEventListener('DOMContentLoaded', () => {
        setupSearchRefinements('.left-panel', 'checklist-nome');
        setupSearchRefinements('.right-panel', 'modelo-nome');
    });
}

function showDialog(title, message, buttons) {
    return new Promise((resolve) => {
        const existingDialog = document.querySelector('.custom-dialog');
        if (existingDialog) {
            document.body.classList.remove('dialog-open');
            existingDialog.remove();
        }
        
        const dialog = document.createElement('div');
        dialog.className = 'custom-dialog';
        dialog.innerHTML = `
            <div class="dialog-content">
                <h2>${title}</h2>
                <p>${message}</p>
                <div class="dialog-buttons">${buttons.map(btn => `
                    <button class="${btn.class}" id="${btn.id}">${btn.text}</button>
                `).join('')}</div>
            </div>
        `;
    
        document.body.appendChild(dialog);
        document.body.classList.add('dialog-open');

        // Configurar eventos dos botões
        buttons.forEach(btn => {
            dialog.querySelector(`#${btn.id}`).onclick = () => {
                document.body.classList.remove('dialog-open');
                dialog.remove();
                resolve(btn.value);
            };
        });
    });
}
