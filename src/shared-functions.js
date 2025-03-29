// Adicionar antes do modelosManager
window.createItemRow = function() {
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
                        <path d="M19 2h-4.18C14.4.84 13.3 0 12 0c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1-1-1-.45-1-1 .45-1 1-1zm7 18H5V4h2v3h10V4h2v16z"/>
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
            itemRow.parentElement.insertBefore(itemRow, prev);
        }
    };

    moveDownBtn.onclick = () => {
        const next = itemRow.nextElementSibling;
        if (next) {
            itemRow.parentElement.insertBefore(next, itemRow);
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
};

// Gerenciador de modelos
const modelosManager = {
    _modelos: new Set(),
    _observers: new Map(),
    _debug: true,

    log(message) {
        if (this._debug) {
            console.log(`[ModelosManager] ${message}`);
        }
    },

    adicionar(modeloId, elemento, editor) {
        if (!modeloId) {
            this.log('Tentativa de adicionar modelo sem ID');
            return;
        }

        if (!document.contains(elemento)) {
            this.log(`Tentativa de adicionar modelo ${modeloId} falhou - elemento não está no DOM`);
            return;
        }

        this._modelos.add(modeloId);
        this.log(`Modelo ${modeloId} adicionado`);
        
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.type === 'childList' && !document.contains(elemento)) {
                    this.log(`Detectada remoção do modelo ${modeloId} do DOM`);
                    this._modelos.delete(modeloId);
                    this._observers.delete(modeloId);
                    observer.disconnect();
                    break;
                }
            }
        });

        observer.observe(editor, { childList: true, subtree: true });
        this._observers.set(modeloId, observer);
    },

    remover(modeloId) {
        if (!modeloId) return;
        
        const observer = this._observers.get(modeloId);
        if (observer) {
            observer.disconnect();
            this._observers.delete(modeloId);
        }
        
        if (this._modelos.has(modeloId)) {
            this._modelos.delete(modeloId);
            this.log(`Modelo ${modeloId} removido do registro`);
        }
    },

    verificar(modeloId) {
        if (!modeloId) return false;

        this.log(`Verificando modelo ${modeloId}`);
        const existeNoConjunto = this._modelos.has(modeloId);
        const elementoNoDom = document.querySelector(`.modelo-box[data-modelo_id="${modeloId}"]`);

        if (existeNoConjunto && !elementoNoDom) {
            this.log(`Modelo ${modeloId} existe no registro mas não no DOM - limpando registro`);
            this.remover(modeloId);
            return false;
        }

        this.log(`Modelo ${modeloId} ${existeNoConjunto ? 'existe' : 'não existe'} no registro`);
        return existeNoConjunto;
    }
};

// Função global para gerenciar altura da textarea-editor - corrigida
window.updateTextareaEditorVisibility = function() {
    const textareaEditor = document.querySelector('.textarea-editor');
    if (!textareaEditor) return;
    
    // Verificar se há modelos na textarea
    const hasModelos = textareaEditor.querySelectorAll('.modelo-box').length > 0;
    
    if (hasModelos) {
        // Primeiro adicionar classe para tornar visível
        textareaEditor.classList.add('has-content');
        
        // Calcular e definir altura de forma direta - sem transições
        const totalHeight = Array.from(textareaEditor.children)
            .reduce((sum, child) => sum + child.offsetHeight, 0) + 40; // +40 para padding
            
        // Limitar a 50% da altura da viewport
        const maxHeight = Math.floor(window.innerHeight * 0.5);
        textareaEditor.style.maxHeight = `${Math.min(totalHeight, maxHeight)}px`;
    } else {
        // Se não houver modelos, esconder completamente
        textareaEditor.classList.remove('has-content');
        textareaEditor.style.maxHeight = '0px';
    }
};

// Função global para inserir modelo
window.inserirModelo = function(texto, nome, modeloId) {
    if (!modeloId) return;

    modelosManager.log(`Iniciando processo de inserção do modelo ${modeloId}`);
    const modeloExists = modelosManager.verificar(modeloId);
    
    if (modeloExists) {
        modelosManager.log(`Modelo ${modeloId} já existe - ignorando inserção`);
        return;
    }

    modelosManager.log(`Criando novo modelo ${modeloId}`);
    const editor = document.querySelector('.textarea-editor');
    const modeloBox = createModeloBox(texto, nome, modeloId);
    editor.appendChild(modeloBox);
    modelosManager.adicionar(modeloId, modeloBox, editor);
    
    // Atualizar visibilidade e altura
    window.updateTextareaEditorVisibility();
};

// Função global para verificar modelo
window.verificarModeloInserido = function(modeloId) {
    return modeloId ? modelosManager.verificar(modeloId) : false;
};

// Adicionar após o bloco do modelosManager
window.atualizarBotaoInserir = function(resultsContent) {
    const btnInserir = resultsContent.querySelector('.btn-inserir');
    const btnEditar = resultsContent.querySelector('.btn-editar');
    const modeloSelecionado = document.querySelector('.resultado-modelo.selected');

    if (btnInserir) {
        btnInserir.addEventListener('click', () => {
            if (modeloSelecionado) {
                const modelo = decodeURIComponent(modeloSelecionado.dataset.modelo);
                const nome = decodeURIComponent(modeloSelecionado.dataset.nome);
                const modeloId = modeloSelecionado.dataset.id;
                window.inserirModelo(modelo, nome, modeloId);
            }
        });
    }

    if (btnEditar) {
        btnEditar.addEventListener('click', () => {
            if (modeloSelecionado) {
                const nomeInput = document.getElementById('nome-input');
                const tagInput = document.getElementById('tag-input');
                
                // Obter nome e tags
                const nome = decodeURIComponent(modeloSelecionado.dataset.nome);
                const tags = Array.from(modeloSelecionado.querySelectorAll('.tag'))
                    .map(tag => decodeURIComponent(tag.dataset.tag));
                
                // Obter conteúdo do modelo
                const modelo = decodeURIComponent(modeloSelecionado.dataset.modelo);
                
                // Preencher os campos
                nomeInput.value = nome;
                tagInput.value = tags.join(', ');
                tinymce.activeEditor.setContent(modelo);
            }
        });
    }
};

// Função global para renderizar checklist
window.renderizarChecklist = function(checklistData) {
    // Garantir que checklistData seja um array
    const items = Array.isArray(checklistData) ? 
        checklistData : 
        (typeof checklistData === 'string' ? JSON.parse(checklistData) : []);

    // Verificar se estamos na página de edição
    const isEditPage = document.body.getAttribute('data-page') === 'checklist-editor';
    
    return items
        .map(item => `
            <div class="checklist-item">
                <div class="checklist-descricao${isEditPage ? ' no-interaction' : ''}" 
                     data-state="inactive"
                     data-modelo_id="${item.modelo_id || ''}"
                     data-checklist_id="${item.id || ''}">
                    <span class="checklist-icon"></span>
                    <span class="checklist-text">${item.descrição || item.descricao}</span>
                </div>
            </div>
        `)
        .join('');
};
