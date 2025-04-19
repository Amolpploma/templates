document.addEventListener('DOMContentLoaded', async () => {
    // Elementos da página
    const themeLight = document.getElementById('theme-light');
    const themeDark = document.getElementById('theme-dark');
    const importBtn = document.getElementById('import-btn');
    const exportBtn = document.getElementById('export-btn');
    const statusMessage = document.getElementById('import-export-status');
    const selectDbBtn = document.getElementById('select-db-btn');
    const createDbBtn = document.getElementById('create-db-btn');
    const dbPathConfig = document.getElementById('db-path-config');
    const appVersion = document.getElementById('app-version');
    
    // Elemento do overlay de loading global
    const loadingOverlay = document.getElementById('global-loading-overlay');
    const loadingText = document.getElementById('loading-text');

    // Elementos do modal de exportação
    const exportModal = document.getElementById('export-modal');
    const exportModalClose = document.getElementById('export-modal-close');
    const modelosList = document.getElementById('modelos-list');
    const selectAllModelos = document.getElementById('select-all-modelos');
    const cancelExport = document.getElementById('cancel-export');
    const confirmExport = document.getElementById('confirm-export');
    const modelosCount = document.getElementById('modelos-count');

    let modelos = [];
    let selectedModelos = [];

    // Inicializar o tema atual
    const currentTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', currentTheme);
    
    if (currentTheme === 'dark') {
        themeDark.checked = true;
    } else {
        themeLight.checked = true;
    }

    // Adicionar event listeners para mudança de tema
    themeLight.addEventListener('change', () => {
        document.documentElement.setAttribute('data-theme', 'light');
        localStorage.setItem('theme', 'light');
    });

    themeDark.addEventListener('change', () => {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
    });

    // Carregar caminho do banco de dados
    try {
        const dbPath = await window.electronAPI.getDatabasePath();
        dbPathConfig.textContent = dbPath;
    } catch (error) {
        console.error('Erro ao carregar caminho do banco de dados:', error);
        dbPathConfig.textContent = 'Erro ao carregar caminho';
    }

    // Função para mostrar o overlay de loading global
    function showGlobalLoading(message = 'Processando...') {
        if (loadingText) {
            loadingText.textContent = message;
        }
        if (loadingOverlay) {
            loadingOverlay.classList.add('active');
        }
    }

    // Função para esconder o overlay de loading global
    function hideGlobalLoading() {
        if (loadingOverlay) {
            loadingOverlay.classList.remove('active');
        }
    }

    // Event listener para importar documentos
    importBtn.addEventListener('click', async () => {
        try {
            // Mostrar diálogo de escolha do tipo de importação
            const importChoice = await window.showDialog(
                'Importar Modelos',
                'Escolha o tipo de importação:',
                [
                    {
                        id: 'btn-text',
                        text: 'Importar modelos em formato de texto',
                        class: 'btn-secondary',
                        value: 'text'
                    },
                    {
                        id: 'btn-json',
                        text: 'Importar modelos em formato JSON',
                        class: 'btn-primary',
                        value: 'json'
                    }
                ]
            );

            if (!importChoice) return; // Usuário cancelou
            
            // Mostrar indicadores de loading
            importBtn.disabled = true;
            importBtn.innerHTML = '<span class="loading-spinner"></span> Importando...';
            importBtn.classList.add('loading');
            
            // Mostrar overlay global
            showGlobalLoading(importChoice === 'text' ? 
                'Importando modelos de texto...' : 
                'Importando modelos JSON...');
            
            let result;
            if (importChoice === 'text') {
                // Importar modelos a partir de arquivos de texto
                result = await window.electronAPI.importarModelosTexto();
            } else {
                // Importar a partir de arquivos JSON
                result = await window.electronAPI.importModelos();
            }
            
            // Verificar se há conflitos que precisam ser resolvidos
            if (result.success && result.requiresResolution) {
                // Criar e mostrar diálogo de resolução de conflitos
                await mostrarDialogoResolucaoConflitos(result.pendentes, result.ignorados || 0);
                // Atualizar mensagem após resolução de conflitos
                statusMessage.textContent = 'Importação concluída com resolução de conflitos';
                statusMessage.className = 'status-message success';
            } else if (result.success) {
                statusMessage.textContent = result.message;
                statusMessage.className = 'status-message success';
            } else {
                statusMessage.textContent = result.message;
                statusMessage.className = 'status-message error';
            }
        } catch (error) {
            statusMessage.textContent = `Erro na importação: ${error.message}`;
            statusMessage.className = 'status-message error';
        } finally {
            // Esconder indicadores de loading
            importBtn.disabled = false;
            importBtn.classList.remove('loading');
            importBtn.innerHTML = '<svg viewBox="0 0 24 24" class="config-icon"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" /></svg> Importar Modelos';
            hideGlobalLoading();
        }
    });

    // Nova função para mostrar diálogo de resolução de conflitos
    async function mostrarDialogoResolucaoConflitos(modelosPendentes, ignorados) {
        // Filtrar apenas os conflitos
        const conflitos = modelosPendentes.filter(item => item.tipo === 'conflito');
        const novos = modelosPendentes.filter(item => item.tipo === 'novo');
        
        // Container que mostrará os conflitos um por um
        const conflitosContainer = document.createElement('div');
        conflitosContainer.id = 'conflitos-container';
        conflitosContainer.className = 'conflitos-container';
        
        // Criar o modal de conflitos
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'modal-overlay active';
        
        const modal = document.createElement('div');
        modal.className = 'modal conflito-modal';
        
        // Criar cabeçalho do modal
        const modalHeader = document.createElement('div');
        modalHeader.className = 'modal-header';
        
        const modalTitle = document.createElement('h3');
        modalTitle.textContent = `Conflitos de Importação (${conflitos.length})`;
        
        modalHeader.appendChild(modalTitle);
        
        // Criar corpo do modal
        const modalBody = document.createElement('div');
        modalBody.className = 'modal-body';
        
        // Informação de progresso
        const progressInfo = document.createElement('div');
        progressInfo.className = 'conflict-progress-info';
        progressInfo.innerHTML = `<span id="conflict-current">1</span> de ${conflitos.length} conflitos`;
        
        // Container para exibir as diferenças
        const diffContainer = document.createElement('div');
        diffContainer.className = 'conflict-diff-container';
        
        // Container para as opções
        const optionsContainer = document.createElement('div');
        optionsContainer.className = 'conflict-options';
        
        // Detalhes do conflito atual
        const conflictDetails = document.createElement('div');
        conflictDetails.className = 'conflict-details';
        conflictDetails.innerHTML = `<strong>Nome do modelo:</strong> <span id="conflict-name"></span>`;
        
        modalBody.appendChild(progressInfo);
        modalBody.appendChild(conflictDetails);
        modalBody.appendChild(diffContainer);
        modalBody.appendChild(optionsContainer);
        
        // Criar rodapé do modal
        const modalFooter = document.createElement('div');
        modalFooter.className = 'modal-footer conflict-footer';
        
        // Botões para resolver o conflito atual
        const btnManter = document.createElement('button');
        btnManter.className = 'modal-btn btn-secondary btn-manter'; // Classe atualizada
        btnManter.textContent = 'Manter existente';
        
        const btnSobrescrever = document.createElement('button');
        btnSobrescrever.className = 'modal-btn btn-primary btn-sobrescrever'; // Classe atualizada
        btnSobrescrever.textContent = 'Sobrescrever';
        
        const btnNovoNome = document.createElement('button');
        btnNovoNome.className = 'modal-btn btn-secondary btn-novo-nome'; // Classe atualizada
        btnNovoNome.textContent = 'Salvar como novo';
        
        // Campo para inserir novo nome
        const novoNomeContainer = document.createElement('div');
        novoNomeContainer.className = 'novo-nome-container hidden';
        novoNomeContainer.innerHTML = `
            <input type="text" id="novo-nome-input" class="novo-nome-input" placeholder="Novo nome para o modelo">
            <button class="modal-btn btn-primary btn-confirmar-novo">Confirmar</button> // Classe atualizada
        `;
        
        modalFooter.appendChild(btnManter);
        modalFooter.appendChild(btnSobrescrever);
        modalFooter.appendChild(btnNovoNome);
        modalFooter.appendChild(novoNomeContainer);

        // Botões para resolver todos os conflitos de uma vez
        const btnManterTodos = document.createElement('button');
        btnManterTodos.className = 'modal-btn btn-secondary btn-manter-todos'; // Classe atualizada
        btnManterTodos.textContent = 'Manter todos os existentes';

        const btnSobrescreverTodos = document.createElement('button');
        btnSobrescreverTodos.className = 'modal-btn btn-primary btn-sobrescrever-todos'; // Classe atualizada
        btnSobrescreverTodos.textContent = 'Subscrever todos os existentes';

        modalFooter.appendChild(btnManterTodos);
        modalFooter.appendChild(btnSobrescreverTodos);

        // Botão Cancelar
        const btnCancelar = document.createElement('button');
        btnCancelar.className = 'modal-btn btn-secondary btn-cancelar'; // Classe para estilo
        btnCancelar.textContent = 'Cancelar Importação';
        modalFooter.appendChild(btnCancelar);
        
        // Montar o modal
        modal.appendChild(modalHeader);
        modal.appendChild(modalBody);
        modal.appendChild(modalFooter);
        modalOverlay.appendChild(modal);
        
        // Adicionar ao DOM
        document.body.appendChild(modalOverlay);
        
        // Função para mostrar as diferenças entre os modelos
        function mostrarDiferencas(existente, novo) {
            // Criar elementos para mostrar as diferenças lado a lado
            diffContainer.innerHTML = `
                <div class="diff-header">
                    <div>Modelo Existente</div>
                    <div>Modelo a Importar</div>
                </div>
                <div class="diff-content">
                    <div class="diff-existente">
                        <h4>Conteúdo:</h4>
                        <div class="diff-content-html">${existente.modelo}</div>
                        <h4>Tags:</h4>
                        <div class="diff-tags">${formatarTags(existente.tag)}</div>
                    </div>
                    <div class="diff-novo">
                        <h4>Conteúdo:</h4>
                        <div class="diff-content-html">${novo.modelo}</div>
                        <h4>Tags:</h4>
                        <div class="diff-tags">${formatarTags(novo.tag)}</div>
                    </div>
                </div>
            `;
            
            // Destacar as diferenças (aqui você pode adicionar uma lógica mais sofisticada)
            // Por exemplo, usando uma biblioteca como diff ou jsdiff
        }
        
        // Função para formatar tags
        function formatarTags(tags) {
            if (!tags) return 'Nenhuma tag';
            
            // Se for string JSON, converter para array
            let tagsArray = tags;
            if (typeof tags === 'string') {
                try {
                    tagsArray = JSON.parse(tags);
                } catch (e) {
                    tagsArray = [tags];
                }
            }
            
            if (!Array.isArray(tagsArray)) {
                return String(tagsArray);
            }
            
            return tagsArray.map(tag => `<span class="tag">${tag}</span>`).join(' ');
        }
        
        // Função para processar o conflito atual
        let indiceAtual = 0;
        let importados = 0;
        let mantidos = 0;
        let sobrescritos = 0;
        
        async function processarConflitoAtual() {
            if (indiceAtual >= conflitos.length) {
                // Todos os conflitos foram processados, finalizar
                finalizarProcessamento();
                return;
            }
            
            const conflito = conflitos[indiceAtual];
            const existente = conflito.existente;
            const novo = conflito.novo;
            
            // Atualizar contadores
            document.getElementById('conflict-current').textContent = (indiceAtual + 1);
            document.getElementById('conflict-name').textContent = existente.nome;
            
            // Mostrar diferenças
            mostrarDiferencas(existente, novo);
            
            // Resetar UI de novo nome
            novoNomeContainer.classList.add('hidden');
            const novoNomeInput = document.getElementById('novo-nome-input');
            if (novoNomeInput) {
                novoNomeInput.value = `${existente.nome} (cópia)`;
            }
        }
        
        // Iniciar com o primeiro conflito
        processarConflitoAtual();
        
        // Handlers para os botões
        btnManter.addEventListener('click', async () => {
            await window.electronAPI.resolverConflitoModelo({
                modeloExistente: conflitos[indiceAtual].existente,
                modeloNovo: conflitos[indiceAtual].novo,
                acao: 'manter'
            });
            
            mantidos++;
            indiceAtual++;
            processarConflitoAtual();
        });
        
        btnSobrescrever.addEventListener('click', async () => {
            await window.electronAPI.resolverConflitoModelo({
                modeloExistente: conflitos[indiceAtual].existente,
                modeloNovo: conflitos[indiceAtual].novo,
                acao: 'sobrescrever'
            });
            
            sobrescritos++;
            indiceAtual++;
            processarConflitoAtual();
        });
        
        btnNovoNome.addEventListener('click', () => {
            // Mostrar campo para inserir novo nome
            novoNomeContainer.classList.remove('hidden');
        });
        
        // Botão de confirmar novo nome
        const btnConfirmarNovo = novoNomeContainer.querySelector('.btn-confirmar-novo');
        btnConfirmarNovo.addEventListener('click', async () => {
            const novoNome = document.getElementById('novo-nome-input').value.trim();
            
            if (!novoNome) {
                alert('Por favor, informe um nome válido para o modelo.');
                return;
            }
            
            // Verificar se o novo nome já existe
            const verificacao = await window.electronAPI.verificarModelo(novoNome);
            if (verificacao) {
                alert(`Já existe um modelo com o nome "${novoNome}". Por favor, escolha outro nome.`);
                return;
            }
            
            await window.electronAPI.resolverConflitoModelo({
                modeloExistente: conflitos[indiceAtual].existente,
                modeloNovo: conflitos[indiceAtual].novo,
                acao: 'novo',
                novoNome: novoNome
            });
            
            importados++;
            indiceAtual++;
            processarConflitoAtual();
        });

        // Handlers para os novos botões
        btnManterTodos.addEventListener('click', async () => {
            for (const [index, conflito] of conflitos.entries()) {
                // Pular conflitos já resolvidos individualmente
                if (indiceAtual > index) continue;

                await window.electronAPI.resolverConflitoModelo({
                    modeloExistente: conflito.existente,
                    modeloNovo: conflito.novo,
                    acao: 'manter'
                });
                mantidos++;
            }
            finalizarProcessamento();
        });

        btnSobrescreverTodos.addEventListener('click', async () => {
            for (const [index, conflito] of conflitos.entries()) {
                // Pular conflitos já resolvidos individualmente
                if (indiceAtual > index) continue;

                await window.electronAPI.resolverConflitoModelo({
                    modeloExistente: conflito.existente,
                    modeloNovo: conflito.novo,
                    acao: 'sobrescrever'
                });
                sobrescritos++;
            }
            finalizarProcessamento();
        });

        // Handler para o botão Cancelar
        btnCancelar.addEventListener('click', () => {
            // Simplesmente remove o modal sem processar mais nada
            document.body.removeChild(modalOverlay);
            // Opcional: Mostrar mensagem de cancelamento
            statusMessage.textContent = 'Importação cancelada pelo usuário.';
            statusMessage.className = 'status-message warning'; 
        });
        
        // Função para finalizar o processamento
        async function finalizarProcessamento() {
            // Importar os modelos sem conflito
            for (const novo of novos) {
                try {
                    await window.electronAPI.salvarDocumento({
                        nome: novo.modelo.nome,
                        tag: novo.modelo.tag,
                        modelo: novo.modelo.modelo
                    });
                    importados++;
                } catch (err) {
                    console.error('Erro ao importar modelo sem conflito:', err);
                }
            }
            
            // Mostrar resumo
            modalBody.innerHTML = `
                <h3>Importação concluída</h3>
                <div class="import-summary">
                    <p>Modelos importados sem conflito: ${novos.length}</p>
                    <p>Modelos mantidos (versão existente): ${mantidos}</p>
                    <p>Modelos sobrescritos: ${sobrescritos}</p>
                    <p>Modelos importados com novo nome: ${importados - novos.length}</p>
                    ${ignorados > 0 ? `<p>Arquivos ignorados: ${ignorados}</p>` : ''}
                    <p class="summary-total">Total de modelos processados: ${novos.length + conflitos.length}</p>
                </div>
            `;
            
            // Simplificar os botões
            modalFooter.innerHTML = `
                <button class="modal-btn modal-btn-primary btn-finalizar">Concluir</button>
            `;
            
            const btnFinalizar = modalFooter.querySelector('.btn-finalizar');
            btnFinalizar.addEventListener('click', () => {
                document.body.removeChild(modalOverlay);
            });
        }
    }

    // Função para resetar todos os checkboxes do modal
    function resetCheckboxes() {
        // Resetar checkbox "Selecionar todos"
        selectAllModelos.checked = false;
        selectAllModelos.indeterminate = false;
        
        // Resetar checkboxes individuais
        document.querySelectorAll('.modelo-checkbox').forEach(checkbox => {
            checkbox.checked = false;
        });
        
        // Limpar arrays de seleção
        selectedModelos = [];
        
        // Atualizar contadores
        updateSelectionCounts();
    }

    // Event listener para exportar documentos
    exportBtn.addEventListener('click', async () => {
        try {
            console.log('Clique no botão de exportar detectado');
            
            // Limpar seleções anteriores e resetar checkboxes
            resetCheckboxes();
            
            // Mostrar indicador de loading no botão
            exportBtn.disabled = true;
            exportBtn.classList.add('loading');
            exportBtn.innerHTML = '<span class="loading-spinner"></span> Carregando...';
            
            // Mostrar loading global para carregamento
            showGlobalLoading('Carregando modelos para exportação...');
            
            // Primeiro, mostrar o modal
            exportModal.classList.add('active');
            console.log('Modal de exportação aberto');
            
            // Depois, carregar os modelos
            console.log('Iniciando carregamento de modelos...');
            await loadDocuments();
            console.log('Carregamento de modelos concluído');
            
            // Restaurar botão após carregamento
            exportBtn.disabled = false;
            exportBtn.classList.remove('loading');
            exportBtn.innerHTML = '<svg viewBox="0 0 24 24" class="config-icon"><path d="M19 12v7H5v-7H3v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2zm-6 .67l2.59-2.58L17 11.5l-5 5-5-5 1.41-1.41L11 12.67V3h2v9.67z" /></svg> Exportar Modelos';
            hideGlobalLoading();
        } catch (error) {
            console.error('Erro ao abrir modal de exportação:', error);
            statusMessage.textContent = `Erro ao preparar exportação: ${error.message}`;
            statusMessage.className = 'status-message error';
            
            // Restaurar botão em caso de erro
            exportBtn.disabled = false;
            exportBtn.classList.remove('loading');
            exportBtn.innerHTML = '<svg viewBox="0 0 24 24" class="config-icon"><path d="M19 12v7H5v-7H3v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2zm-6 .67l2.59-2.58L17 11.5l-5 5-5-5 1.41-1.41L11 12.67V3h2v9.67z" /></svg> Exportar Modelos';
            hideGlobalLoading();
        }
    });

    // Event listeners para ações do banco de dados
    selectDbBtn.addEventListener('click', async () => {
        const success = await window.electronAPI.selectDatabase();
        if (success) {
            location.reload();
        }
    });

    createDbBtn.addEventListener('click', async () => {
        const success = await window.electronAPI.createDatabase();
        if (success) {
            location.reload();
        }
    });

    // Obter versão do aplicativo
    try {
        // Pode não estar disponível em algumas versões
        if (window.electronAPI.getAppVersion) {
            const version = await window.electronAPI.getAppVersion();
            appVersion.textContent = version;
        }
    } catch (error) {
        console.error('Erro ao obter versão do aplicativo:', error);
    }

    // Função para carregar modelos
    async function loadDocuments() {
        try {
            // Limpar lista e mostrar mensagem de carregamento
            modelosList.innerHTML = '<div class="selection-list-empty">Carregando modelos...</div>';
            
            // Buscar todos os modelos sem filtro
            modelos = await window.electronAPI.buscarDocumentos('', { nome: true });
            console.log('Modelos carregados:', modelos.length);
            
            // Verificar se os modelos foram realmente carregados
            if (modelos && modelos.length > 0) {
                console.log('Exemplo de modelo:', modelos[0]);
            }
            
            // Renderizar lista mesmo que esteja vazia
            renderModelosList();
            
            // Resetar estado de seleção
            selectedModelos = [];
            updateSelectionCounts();
        } catch (error) {
            console.error('Erro ao carregar modelos:', error);
            modelosList.innerHTML = '<div class="selection-list-empty">Erro ao carregar modelos: ' + error.message + '</div>';
        }
    }

    // Função para renderizar lista de modelos
    function renderModelosList() {
        console.log('Renderizando lista de modelos:', modelos ? modelos.length : 0);
        
        if (!modelos || modelos.length === 0) {
            modelosList.innerHTML = '<div class="selection-list-empty">Nenhum modelo encontrado.</div>';
            return;
        }

        let html = '';
        modelos.forEach(modelo => {
            const modeloNome = modelo.nome || 'Sem nome';
            const modeloId = modelo.id || '0';
            console.log(`Adicionando modelo: ${modeloId} - ${modeloNome}`);
            
            html += `
                <div class="selection-item">
                    <label class="checkmark-container">
                        <input type="checkbox" class="modelo-checkbox" data-id="${modeloId}">
                        <span class="checkmark"></span>
                        <div class="modelo-info">
                            <span class="selection-item-label" title="${modeloNome}">${modeloNome}</span>
                        </div>
                    </label>
                </div>
            `;
        });

        modelosList.innerHTML = html;
        
        // Adicionar event listeners para checkboxes
        document.querySelectorAll('.modelo-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                const id = parseInt(this.getAttribute('data-id'));
                if (this.checked) {
                    if (!selectedModelos.includes(id)) {
                        selectedModelos.push(id);
                    }
                } else {
                    selectedModelos = selectedModelos.filter(item => item !== id);
                }
                updateSelectionCounts();
                updateSelectAllCheckbox(selectAllModelos, '.modelo-checkbox');
            });
        });
    }

    // Função para atualizar contadores de seleção
    function updateSelectionCounts() {
        modelosCount.textContent = `${selectedModelos.length} selecionados`;
        
        // Habilitar/desabilitar botões de exportação
        confirmExport.disabled = selectedModelos.length === 0;
        
        // Habilitar "Exportar como texto" apenas quando houver modelos selecionados
        exportAsTextBtn.disabled = selectedModelos.length === 0;
    }

    // Função para atualizar estado do checkbox "selecionar todos"
    function updateSelectAllCheckbox(selectAllCheckbox, itemSelector) {
        const checkboxes = document.querySelectorAll(itemSelector);
        const checkedCount = document.querySelectorAll(`${itemSelector}:checked`).length;
        
        if (checkedCount === 0) {
            selectAllCheckbox.checked = false;
            selectAllCheckbox.indeterminate = false;
        } else if (checkedCount === checkboxes.length) {
            selectAllCheckbox.checked = true;
            selectAllCheckbox.indeterminate = false;
        } else {
            selectAllCheckbox.indeterminate = true;
        }
    }

    // Event listener para o botão "selecionar todos modelos"
    selectAllModelos.addEventListener('change', function() {
        const isChecked = this.checked;
        document.querySelectorAll('.modelo-checkbox').forEach(checkbox => {
            checkbox.checked = isChecked;
            const id = parseInt(checkbox.getAttribute('data-id'));
            
            if (isChecked && !selectedModelos.includes(id)) {
                selectedModelos.push(id);
            } else if (!isChecked) {
                selectedModelos = selectedModelos.filter(item => item !== id);
            }
        });
        updateSelectionCounts();
    });

    // Event listeners para fechar o modal
    exportModalClose.addEventListener('click', () => {
        exportModal.classList.remove('active');
        resetCheckboxes(); // Adicionar reset ao fechar
    });
    
    cancelExport.addEventListener('click', () => {
        exportModal.classList.remove('active');
        resetCheckboxes(); // Adicionar reset ao fechar
    });

    // Event listener para confirmar exportação
    confirmExport.addEventListener('click', async () => {
        try {
            // Mostrar loading nos botões
            confirmExport.classList.add('loading');
            confirmExport.disabled = true;
            
            // Mostrar overlay global
            showGlobalLoading('Exportando modelos selecionados...');
            
            // Filtrar modelos selecionados
            const modelosToExport = modelos.filter(modelo => selectedModelos.includes(modelo.id));
            
            console.log('Exportando modelos selecionados:', {
                modelos: modelosToExport.length
            });
            
            // Chamar API para exportar
            const result = await window.electronAPI.exportarModelosSelecionados(modelosToExport);
            
            // Esconder modal
            exportModal.classList.remove('active');
            resetCheckboxes(); // Adicionar reset após exportação
            
            // Mostrar mensagem de resultado
            if (result.success) {
                statusMessage.textContent = result.message;
                statusMessage.className = 'status-message success';
            } else {
                statusMessage.textContent = result.message;
                statusMessage.className = 'status-message error';
            }
        } catch (error) {
            console.error('Erro na exportação:', error);
            statusMessage.textContent = `Erro na exportação: ${error.message}`;
            statusMessage.className = 'status-message error';
        } finally {
            // Remover indicadores de loading
            confirmExport.classList.remove('loading');
            confirmExport.disabled = false;
            hideGlobalLoading();
        }
    });

    // Quando clicar fora do modal, fecha
    exportModal.addEventListener('click', (e) => {
        if (e.target === exportModal) {
            exportModal.classList.remove('active');
            resetCheckboxes(); // Adicionar reset ao fechar
        }
    });

    // Elemento do botão de exportação como texto
    const exportAsTextBtn = document.getElementById('export-as-text');
    
    // Inicialmente desabilitar o botão até que haja seleção
    exportAsTextBtn.disabled = true;
    
    // Event listener para exportar modelos como texto
    exportAsTextBtn.addEventListener('click', async () => {
        try {
            // Verificação redundante (por segurança)
            if (selectedModelos.length === 0) {
                statusMessage.textContent = 'Por favor, selecione pelo menos um modelo para exportar como texto.';
                statusMessage.className = 'status-message error';
                exportModal.classList.remove('active');
                return;
            }
            
            // Mostrar indicadores de loading
            exportAsTextBtn.classList.add('loading');
            exportAsTextBtn.disabled = true;
            
            // Mostrar overlay global
            showGlobalLoading('Exportando modelos como texto...');
            
            // Filtrar apenas os modelos selecionados
            const modelosToExport = modelos.filter(modelo => selectedModelos.includes(modelo.id));
            
            console.log('Exportando modelos como texto:', {
                modelos: modelosToExport.length
            });
            
            // Chamar API para exportar como texto
            const result = await window.electronAPI.exportarModelosComoTexto(modelosToExport);
            
            // Esconder modal
            exportModal.classList.remove('active');
            resetCheckboxes(); // Adicionar reset após exportação
            
            // Mostrar mensagem de resultado
            if (result.success) {
                let messageHTML = result.message;
                
                // Se houver erros, adicionar botão para expandir detalhes
                if (result.errorCount > 0 && result.errorDetails && result.errorDetails.length > 0) {
                    messageHTML += `
                        <button class="error-details-button" id="toggle-error-details">
                            Mostrar detalhes dos erros
                        </button>
                        <div class="error-details-container" id="error-details-container">
                            <ul class="error-details-list">
                                ${result.errorDetails.map(detail => `
                                    <li class="error-details-item">
                                        <span class="error-model-name">${detail.nome}:</span> 
                                        ${detail.erro}
                                    </li>
                                `).join('')}
                            </ul>
                        </div>
                    `;
                }
                
                statusMessage.innerHTML = messageHTML;
                statusMessage.className = 'status-message success';
                
                // Adicionar event listener para o botão de toggle após criar o elemento
                const toggleButton = document.getElementById('toggle-error-details');
                if (toggleButton) {
                    const detailsContainer = document.getElementById('error-details-container');
                    
                    toggleButton.addEventListener('click', () => {
                        const isExpanded = detailsContainer.classList.toggle('expanded');
                        toggleButton.textContent = isExpanded ? 'Ocultar detalhes dos erros' : 'Mostrar detalhes dos erros';
                    });
                }
            } else {
                statusMessage.textContent = result.message;
                statusMessage.className = 'status-message error';
            }
        } catch (error) {
            console.error('Erro na exportação como texto:', error);
            statusMessage.textContent = `Erro na exportação como texto: ${error.message}`;
            statusMessage.className = 'status-message error';
        } finally {
            // Remover indicadores de loading
            exportAsTextBtn.classList.remove('loading');
            exportAsTextBtn.disabled = false;
            hideGlobalLoading();
        }
    });

    // Adicionar input de pesquisa ao modal de exportação
    const exportSearchContainer = document.createElement('div');
    exportSearchContainer.className = 'export-search-container';
    const exportSearchInput = document.createElement('input');
    exportSearchInput.className = 'export-search-input input input-search'; // Adiciona classes para estilização
    exportSearchInput.type = 'text';
    exportSearchInput.placeholder = 'Pesquisar modelos para exportação...';
    exportSearchContainer.appendChild(exportSearchInput);
    // Inserir o campo de pesquisa acima da lista
    if (modelosList && modelosList.parentNode) {
        modelosList.parentNode.insertBefore(exportSearchContainer, modelosList);
    }

    // Função para buscar modelos resumidos (nome/id) para exportação
    async function buscarModelosParaExportacao(termo) {
        try {
            // Usa a mesma API do modelo-dialog.js
            const resultados = await window.electronAPI.buscarModelosResumidos(termo);
            return resultados || [];
        } catch (e) {
            console.error('Erro ao buscar modelos para exportação:', e);
            return [];
        }
    }

    // Atualizar lista de modelos conforme pesquisa
    exportSearchInput.addEventListener('input', async function() {
        const termo = exportSearchInput.value.trim();
        modelosList.innerHTML = '<div class="selection-list-empty">Carregando modelos...</div>';
        const resultados = termo ? await buscarModelosParaExportacao(termo) : modelos;
        if (!resultados || resultados.length === 0) {
            modelosList.innerHTML = '<div class="selection-list-empty">Nenhum modelo encontrado.</div>';
            return;
        }
        // Renderizar lista filtrada
        let html = '';
        resultados.forEach(modelo => {
            const modeloNome = modelo.nome || 'Sem nome';
            const modeloId = modelo.id || '0';
            html += `
                <div class="selection-item">
                    <label class="checkmark-container">
                        <input type="checkbox" class="modelo-checkbox" data-id="${modeloId}">
                        <span class="checkmark"></span>
                        <div class="modelo-info">
                            <span class="selection-item-label" title="${modeloNome}">${modeloNome}</span>
                        </div>
                    </label>
                </div>
            `;
        });
        modelosList.innerHTML = html;
        // Adicionar event listeners para checkboxes
        document.querySelectorAll('.modelo-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                const id = parseInt(this.getAttribute('data-id'));
                if (this.checked) {
                    if (!selectedModelos.includes(id)) {
                        selectedModelos.push(id);
                    }
                } else {
                    selectedModelos = selectedModelos.filter(item => item !== id);
                }
                updateSelectionCounts();
                updateSelectAllCheckbox(selectAllModelos, '.modelo-checkbox');
            });
        });
        // Atualizar contadores
        updateSelectionCounts();
    });

    // Event listeners para botões de licença
    const viewLicenseBtn = document.getElementById('view-license-btn');
    const viewNoticeBtn = document.getElementById('view-notice-btn');
    const fileContentModal = document.getElementById('file-content-modal');
    const fileContentTitle = document.getElementById('file-content-title');
    const fileContentText = document.getElementById('file-content-text');
    const fileContentClose = document.getElementById('file-content-close');
    const fileContentCloseBtn = document.getElementById('file-content-close-btn');

    if (viewLicenseBtn) {
        viewLicenseBtn.addEventListener('click', async () => {
            try {
                const result = await window.electronAPI.getLicenseContent();
                if (result.success) {
                    fileContentTitle.textContent = 'Arquivo LICENSE';
                    fileContentText.textContent = result.content;
                    fileContentModal.classList.add('active');
                } else {
                    statusMessage.textContent = result.error;
                    statusMessage.className = 'status-message error';
                }
            } catch (err) {
                console.error('Erro ao obter conteúdo do arquivo LICENSE:', err);
                statusMessage.textContent = 'Erro ao obter conteúdo do arquivo LICENSE';
                statusMessage.className = 'status-message error';
            }
        });
    }

    if (viewNoticeBtn) {
        viewNoticeBtn.addEventListener('click', async () => {
            try {
                const result = await window.electronAPI.getNoticeContent();
                if (result.success) {
                    fileContentTitle.textContent = 'Arquivo NOTICE';
                    fileContentText.textContent = result.content;
                    fileContentModal.classList.add('active');
                } else {
                    statusMessage.textContent = result.error;
                    statusMessage.className = 'status-message error';
                }
            } catch (err) {
                console.error('Erro ao obter conteúdo do arquivo NOTICE:', err);
                statusMessage.textContent = 'Erro ao obter conteúdo do arquivo NOTICE';
                statusMessage.className = 'status-message error';
            }
        });
    }

    // Event listeners para fechar o modal
    if (fileContentClose) {
        fileContentClose.addEventListener('click', () => {
            fileContentModal.classList.remove('active');
        });
    }

    if (fileContentCloseBtn) {
        fileContentCloseBtn.addEventListener('click', () => {
            fileContentModal.classList.remove('active');
        });
    }

    // Fechar modal ao clicar fora
    if (fileContentModal) {
        fileContentModal.addEventListener('click', (e) => {
            if (e.target === fileContentModal) {
                fileContentModal.classList.remove('active');
            }
        });
    }
});
