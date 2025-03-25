/**
 * Diálogo de pesquisa e seleção de modelos para inserir no editor
 */

// Garantir que o script seja executado imediatamente
(function() {
    // Variável para rastrear instância ativa do diálogo
    let activeModeloDialog = null;

    // Função principal para exibir o diálogo de seleção de modelo
    function showModeloDialog(editor) {
        console.log('Função showModeloDialog chamada', editor);
        
        // Verificar se o editor existe e é válido
        if (!editor) {
            console.error('Editor não definido ou inválido');
            return;
        }
        
        // Fechar diálogo anterior se existir
        closeModeloDialog();
        
        // Criar overlay
        const overlay = document.createElement('div');
        overlay.className = 'modelo-dialog-overlay';
        
        // Criar diálogo
        const dialog = document.createElement('div');
        dialog.className = 'modelo-dialog';
        
        // Cabeçalho do diálogo
        const header = document.createElement('div');
        header.className = 'modelo-dialog-header';
        
        const title = document.createElement('h3');
        title.textContent = 'Inserir Modelo';
        
        const closeButton = document.createElement('button');
        closeButton.className = 'modelo-close-btn';
        closeButton.innerHTML = '×';
        closeButton.onclick = closeModeloDialog;
        
        header.appendChild(title);
        header.appendChild(closeButton);
        
        // Área de pesquisa
        const searchContainer = document.createElement('div');
        searchContainer.className = 'modelo-search-container';
        
        const searchInput = document.createElement('input');
        searchInput.className = 'modelo-search-input';
        searchInput.placeholder = 'Pesquisar modelos...';
        searchInput.autofocus = true;
        
        const clearButton = document.createElement('button');
        clearButton.className = 'modelo-clear-search';
        clearButton.innerHTML = '<svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>';
        clearButton.onclick = () => {
            searchInput.value = '';
            searchInput.focus();
            loadModelos('', resultsContainer);
        };
        
        searchContainer.appendChild(searchInput);
        searchContainer.appendChild(clearButton);
        
        // Área de resultados
        const resultsContainer = document.createElement('div');
        resultsContainer.className = 'modelo-results-container';
        
        // Rodapé com botões
        const footer = document.createElement('div');
        footer.className = 'modelo-dialog-footer';
        
        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'modelo-btn';
        cancelBtn.textContent = 'Cancelar';
        cancelBtn.onclick = closeModeloDialog;
        
        const insertBtn = document.createElement('button');
        insertBtn.className = 'modelo-btn modelo-btn-primary';
        insertBtn.textContent = 'Inserir';
        insertBtn.disabled = true; // Inicialmente desabilitado
        
        footer.appendChild(cancelBtn);
        footer.appendChild(insertBtn);
        
        // Montar o diálogo
        dialog.appendChild(header);
        dialog.appendChild(searchContainer);
        dialog.appendChild(resultsContainer);
        dialog.appendChild(footer);
        
        overlay.appendChild(dialog);
        
        // Adicionar ao DOM
        document.body.appendChild(overlay);
        
        // Armazenar referência ao diálogo ativo
        activeModeloDialog = {
            overlay,
            dialog,
            searchInput,
            resultsContainer,
            insertBtn,
            selectedModelo: null,
            editor
        };
        
        // Configurar eventos
        setupDialogEvents();
        
        // Carregar modelos iniciais
        loadModelos('', resultsContainer);
        
        // Focar no input de pesquisa
        setTimeout(() => searchInput.focus(), 100);
    }

    // Função para fechar o diálogo - adicionar limpeza de eventos
    function closeModeloDialog() {
        if (activeModeloDialog) {
            // Remover manipuladores de eventos para evitar vazamentos de memória
            document.removeEventListener('keydown', handleKeyDown);
            
            // Remover do DOM
            document.body.removeChild(activeModeloDialog.overlay);
            activeModeloDialog = null;
        }
    }

    // Configurar eventos do diálogo
    function setupDialogEvents() {
        if (!activeModeloDialog) return;
        
        const { searchInput, insertBtn, editor, overlay, dialog } = activeModeloDialog;
        
        // Pesquisa ao digitar
        searchInput.addEventListener('input', () => {
            loadModelos(searchInput.value, activeModeloDialog.resultsContainer);
        });
        
        // Remover qualquer handler de tecla anterior para evitar duplicação
        document.removeEventListener('keydown', handleKeyDown);
        
        // Adicionar handler de tecla diretamente ao diálogo e ao campo de pesquisa
        dialog.addEventListener('keydown', handleKeyDown);
        searchInput.addEventListener('keydown', handleKeyDown);
        
        // Inserir modelo selecionado - atualizada para usar ID
        insertBtn.addEventListener('click', () => {
            if (activeModeloDialog.selectedModeloId) {
                insertModeloPorId(
                    activeModeloDialog.selectedModeloId,
                    activeModeloDialog.selectedModeloNome,
                    editor
                );
                closeModeloDialog();
            }
        });
    }

    // Função para lidar com teclas pressionadas - modificada para melhor captura
    function handleKeyDown(event) {
        console.log('Tecla pressionada:', event.key, event); // Log para depuração
        
        if (!activeModeloDialog) return;
        
        // Escape fecha o diálogo
        if (event.key === 'Escape') {
            closeModeloDialog();
            event.preventDefault();
            return;
        }
        
        // Enter seleciona o modelo atual
        if (event.key === 'Enter' && activeModeloDialog.selectedModeloId) {
            insertModeloPorId(
                activeModeloDialog.selectedModeloId,
                activeModeloDialog.selectedModeloNome,
                activeModeloDialog.editor
            );
            closeModeloDialog();
            event.preventDefault();
            return;
        }
        
        // Navegação com setas - modificada para capturar melhor
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            console.log('Navegando com seta:', event.key);
            navigateResults(event.key === 'ArrowDown');
            event.preventDefault();
            event.stopPropagation(); // Impedir propagação para o TinyMCE
        }
    }

    // Função para navegar pelos resultados com as setas (melhorada)
    function navigateResults(down) {
        if (!activeModeloDialog) return;
        
        const items = activeModeloDialog.resultsContainer.querySelectorAll('.modelo-result-item');
        if (items.length === 0) return;
        
        // Encontrar o índice do item selecionado
        let selectedIndex = -1;
        items.forEach((item, index) => {
            if (item.classList.contains('selected')) {
                selectedIndex = index;
            }
        });
        
        // Se nenhum item estiver selecionado, selecionar o primeiro ou o último
        if (selectedIndex === -1) {
            selectedIndex = down ? 0 : items.length - 1;
        } else {
            // Calcular o próximo índice
            if (down) {
                selectedIndex = selectedIndex + 1 >= items.length ? 0 : selectedIndex + 1;
            } else {
                selectedIndex = selectedIndex - 1 < 0 ? items.length - 1 : selectedIndex - 1;
            }
        }
        
        // Remover seleção anterior
        items.forEach(item => item.classList.remove('selected'));
        
        // Aplicar nova seleção
        const selectedItem = items[selectedIndex];
        selectedItem.classList.add('selected');
        
        // Efeito de flash para destacar a mudança de seleção
        selectedItem.animate(
            [
                { opacity: '0.7' },
                { opacity: '1' }
            ],
            { duration: 150 }
        );
        
        // SOLUÇÃO MELHORADA: Garantir visibilidade com cálculo manual da rolagem
        ensureVisibility(selectedItem, activeModeloDialog.resultsContainer);
        
        // Atualizar ID do modelo selecionado
        activeModeloDialog.selectedModeloId = parseInt(selectedItem.dataset.modeloId);
        activeModeloDialog.selectedModeloNome = selectedItem.textContent;
        activeModeloDialog.insertBtn.disabled = false;
    }

    // Nova função para garantir que o item está visível na área de rolagem
    function ensureVisibility(element, container) {
        // Obter dimensões e posições
        const containerRect = container.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();
        
        // Verificar se o elemento está fora da área visível
        const isAbove = elementRect.top < containerRect.top;
        const isBelow = elementRect.bottom > containerRect.bottom;
        
        if (isAbove) {
            // Se o elemento estiver acima, rolar para torná-lo visível com margens
            const scrollTop = container.scrollTop - (containerRect.top - elementRect.top) - 10;
            container.scrollTo({
                top: scrollTop,
                behavior: 'auto' // Comportamento imediato para resposta rápida
            });
        } else if (isBelow) {
            // Se o elemento estiver abaixo, rolar para torná-lo visível com margens
            const scrollBottom = container.scrollTop + (elementRect.bottom - containerRect.bottom) + 10;
            container.scrollTo({
                top: scrollBottom,
                behavior: 'auto' // Comportamento imediato para resposta rápida
            });
        }
    }

    // Função para carregar modelos - otimizada para carregar apenas nome e ID
    async function loadModelos(termo, resultsContainer) {
        if (!activeModeloDialog) return;
        
        resultsContainer.innerHTML = '<div class="modelo-loading">Carregando modelos...</div>';
        
        try {
            // Buscar apenas ID e nome dos modelos, não o conteúdo completo
            const modelos = await window.electronAPI.buscarModelosResumidos(termo);
            
            if (!modelos || modelos.length === 0) {
                resultsContainer.innerHTML = '<div class="modelo-no-results">Nenhum modelo encontrado</div>';
                activeModeloDialog.selectedModelo = null;
                activeModeloDialog.insertBtn.disabled = true;
                return;
            }
            
            // Limpar e adicionar resultados
            resultsContainer.innerHTML = '';
            
            modelos.forEach((modelo, index) => {
                const modeloItem = document.createElement('div');
                modeloItem.className = 'modelo-result-item';
                modeloItem.textContent = modelo.nome;
                // Armazenar apenas o ID do modelo
                modeloItem.dataset.modeloId = modelo.id;
                
                // Eventos do item
                modeloItem.addEventListener('click', () => {
                    // Remover seleção anterior
                    resultsContainer.querySelectorAll('.modelo-result-item').forEach(item => {
                        item.classList.remove('selected');
                    });
                    
                    // Marcar como selecionado
                    modeloItem.classList.add('selected');
                    activeModeloDialog.selectedModeloId = modelo.id;
                    activeModeloDialog.selectedModeloNome = modelo.nome;
                    activeModeloDialog.insertBtn.disabled = false;
                    
                    // Inserir com duplo clique
                    if (modeloItem.dataset.lastClick && Date.now() - modeloItem.dataset.lastClick < 300) {
                        insertModeloPorId(modelo.id, modelo.nome, activeModeloDialog.editor);
                        closeModeloDialog();
                    }
                    modeloItem.dataset.lastClick = Date.now();
                });
                
                resultsContainer.appendChild(modeloItem);
                
                // Selecionar automaticamente o primeiro item da lista quando carregar
                if (index === 0) {
                    modeloItem.classList.add('selected');
                    activeModeloDialog.selectedModeloId = modelo.id;
                    activeModeloDialog.selectedModeloNome = modelo.nome;
                    activeModeloDialog.insertBtn.disabled = false;
                    
                    // Destacar o item selecionado inicialmente
                    modeloItem.animate(
                        [
                            { opacity: '0.7' },
                            { opacity: '1' }
                        ],
                        { duration: 300 }
                    );
                    
                    // Garantir que o item selecionado esteja visível com rolagem forçada
                    resultsContainer.scrollTop = 0; // Forçar rolagem para o topo
                }
            });
        } catch (error) {
            console.error('Erro ao buscar modelos:', error);
            resultsContainer.innerHTML = '<div class="modelo-no-results">Erro ao buscar modelos</div>';
        }
    }

    // Nova função para inserir o modelo buscando seu conteúdo por ID
    async function insertModeloPorId(modeloId, modeloNome, editor) {
        if (!editor) return;
        
        try {
            // Mostrar indicador de carregamento no editor
            editor.setProgressState(true, 100);
            
            // Buscar o modelo completo usando o ID
            const modelo = await window.electronAPI.buscarModeloPorId(modeloId);
            
            if (!modelo) {
                console.error(`Modelo com ID ${modeloId} não encontrado`);
                alert(`Erro ao carregar o modelo "${modeloNome}"`);
                return;
            }
            
            // Inserir o conteúdo do modelo
            editor.execCommand('mceInsertContent', false, modelo.modelo);
            
            // Focar no editor novamente
            editor.focus();
        } catch (error) {
            console.error('Erro ao inserir modelo:', error);
            alert(`Erro ao carregar modelo: ${error.message}`);
        } finally {
            // Remover indicador de carregamento
            editor.setProgressState(false);
        }
    }

    // Função para inserir o modelo no editor
    function insertModelo(modelo, editor) {
        if (!editor) return;
        
        // Inserir parágrafo vazio primeiro se estiver no final do documento
        const currentNode = editor.selection.getNode();
        const isAtEnd = !currentNode.nextSibling && 
                        currentNode.textContent.trim() === '' && 
                        currentNode.tagName.toLowerCase() === 'p';
        
        // Inserir o conteúdo do modelo
        editor.execCommand('mceInsertContent', false, modelo.modelo);
        
        // Focar no editor novamente
        editor.focus();
    }

    // Garantir que a função seja exposta globalmente
    window.showModeloDialog = showModeloDialog;
    
    // Registrar no console que o script foi carregado
    console.log('Script de diálogo de modelos carregado com sucesso');

})();
