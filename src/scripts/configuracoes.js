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
            
            if (result.success) {
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
