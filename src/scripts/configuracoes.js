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

    // Elementos do modal de exportação
    const exportModal = document.getElementById('export-modal');
    const exportModalClose = document.getElementById('export-modal-close');
    const modelosList = document.getElementById('modelos-list');
    const checklistsList = document.getElementById('checklists-list');
    const selectAllModelos = document.getElementById('select-all-modelos');
    const selectAllChecklists = document.getElementById('select-all-checklists');
    const cancelExport = document.getElementById('cancel-export');
    const confirmExport = document.getElementById('confirm-export');
    const modelosCount = document.getElementById('modelos-count');
    const checklistsCount = document.getElementById('checklists-count');

    let modelos = [];
    let checklists = [];
    let selectedModelos = [];
    let selectedChecklists = [];
    // Mapa para rastrear modelos associados a checklists selecionados
    let modelosAssociados = new Map(); // modeloId -> [checklistId1, checklistId2, ...]

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

    // Event listener para importar documentos
    importBtn.addEventListener('click', async () => {
        try {
            importBtn.disabled = true;
            importBtn.textContent = 'Importando...';
            
            const result = await window.electronAPI.importDocumentos();
            
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
            importBtn.disabled = false;
            importBtn.innerHTML = '<svg viewBox="0 0 24 24" class="config-icon"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" /></svg> Importar Documentos';
        }
    });

    // Função para resetar todos os checkboxes do modal
    function resetCheckboxes() {
        // Resetar checkbox "Selecionar todos"
        selectAllModelos.checked = false;
        selectAllModelos.indeterminate = false;
        selectAllChecklists.checked = false;
        selectAllChecklists.indeterminate = false;
        
        // Resetar checkboxes individuais
        document.querySelectorAll('.modelo-checkbox, .checklist-checkbox').forEach(checkbox => {
            checkbox.checked = false;
            checkbox.disabled = false; // Garantir que todos os checkboxes estejam habilitados
        });
        
        // Ocultar todos os ícones de associação (mas manter espaço)
        document.querySelectorAll('.modelo-associado-icon').forEach(icon => {
            icon.classList.remove('visible');
            icon.title = '';
        });
        
        // Remover destaques
        document.querySelectorAll('.selection-item').forEach(item => {
            item.style.backgroundColor = '';
        });
        
        // Limpar arrays de seleção
        selectedModelos = [];
        selectedChecklists = [];
        
        // Limpar mapa de modelos associados
        modelosAssociados.clear();
        
        // Atualizar contadores
        updateSelectionCounts();
    }

    // Event listener para exportar documentos (agora com diagnóstico adicional)
    exportBtn.addEventListener('click', async () => {
        try {
            console.log('Clique no botão de exportar detectado');
            
            // Limpar seleções anteriores e resetar checkboxes
            resetCheckboxes();
            
            // Primeiro, mostrar o modal
            exportModal.classList.add('active');
            console.log('Modal de exportação aberto');
            
            // Depois, carregar os documentos
            console.log('Iniciando carregamento de documentos...');
            await loadDocuments();
            console.log('Carregamento de documentos concluído');
        } catch (error) {
            console.error('Erro ao abrir modal de exportação:', error);
            statusMessage.textContent = `Erro ao preparar exportação: ${error.message}`;
            statusMessage.className = 'status-message error';
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

    // Função para carregar modelos e checklists
    async function loadDocuments() {
        try {
            // Limpar listas e mostrar mensagem de carregamento
            modelosList.innerHTML = '<div class="selection-list-empty">Carregando modelos...</div>';
            checklistsList.innerHTML = '<div class="selection-list-empty">Carregando checklists...</div>';
            
            // Buscar todos os modelos sem filtro
            modelos = await window.electronAPI.buscarDocumentos('', { nome: true });
            console.log('Modelos carregados:', modelos.length);
            
            // Buscar todos os checklists sem filtro
            checklists = await window.electronAPI.buscarChecklists('', { nome: true });
            console.log('Checklists carregados:', checklists.length);
            
            // Verificar se os modelos e checklists foram realmente carregados
            if (modelos && modelos.length > 0) {
                console.log('Exemplo de modelo:', modelos[0]);
            }
            
            if (checklists && checklists.length > 0) {
                console.log('Exemplo de checklist:', checklists[0]);
            }
            
            // Processo adicional para analisar associações de checklists e modelos
            mapearModelosAssociados();
            
            // Renderizar listas mesmo que estejam vazias
            renderModelosList();
            renderChecklistsList();
            
            // Resetar estado de seleção
            selectedModelos = [];
            selectedChecklists = [];
            updateSelectionCounts();
        } catch (error) {
            console.error('Erro ao carregar documentos:', error);
            modelosList.innerHTML = '<div class="selection-list-empty">Erro ao carregar modelos: ' + error.message + '</div>';
            checklistsList.innerHTML = '<div class="selection-list-empty">Erro ao carregar checklists: ' + error.message + '</div>';
        }
    }

    // Função para mapear todos os modelos associados a checklists
    function mapearModelosAssociados() {
        // Limpar mapa existente
        modelosAssociados.clear();
        
        // Construir mapa de todos os modelos associados a checklists
        if (checklists && Array.isArray(checklists)) {
            checklists.forEach(checklist => {
                if (checklist.modelo_id) {
                    if (!modelosAssociados.has(checklist.modelo_id)) {
                        modelosAssociados.set(checklist.modelo_id, []);
                    }
                    modelosAssociados.get(checklist.modelo_id).push(checklist.id);
                }
                
                // Verificar também associações dentro dos itens do checklist
                try {
                    const itens = typeof checklist.checklist === 'string' 
                        ? JSON.parse(checklist.checklist) 
                        : checklist.checklist;
                    
                    if (Array.isArray(itens)) {
                        itens.forEach(item => {
                            if (item.modelo_id && !isNaN(parseInt(item.modelo_id))) {
                                const modeloId = parseInt(item.modelo_id);
                                if (!modelosAssociados.has(modeloId)) {
                                    modelosAssociados.set(modeloId, []);
                                }
                                if (!modelosAssociados.get(modeloId).includes(checklist.id)) {
                                    modelosAssociados.get(modeloId).push(checklist.id);
                                }
                            }
                        });
                    }
                } catch (e) {
                    console.error('Erro ao processar itens do checklist:', e);
                }
            });
        }
        console.log('Mapa de modelos associados:', Object.fromEntries(modelosAssociados));
    }

    // Função para renderizar lista de modelos com verificação adicional
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
                            <span class="modelo-associado-icon" title=""><svg viewBox="0 0 24 24"><text x="50%" y="50%" text-anchor="middle" dominant-baseline="central" font-size="18" font-weight="bold">A</text></svg></span>
                        </div>
                    </label>
                </div>
            `;
        });

        modelosList.innerHTML = html;
        
        // Adicionar event listeners para checkboxes
        document.querySelectorAll('.modelo-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                // Evitar processamento se estiver desabilitado
                if (this.disabled) return;
                
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

    // Função para renderizar lista de checklists com verificação adicional
    function renderChecklistsList() {
        console.log('Renderizando lista de checklists:', checklists ? checklists.length : 0);
        
        if (!checklists || checklists.length === 0) {
            checklistsList.innerHTML = '<div class="selection-list-empty">Nenhum checklist encontrado.</div>';
            return;
        }

        let html = '';
        checklists.forEach(checklist => {
            const checklistNome = checklist.nome || 'Sem nome';
            const checklistId = checklist.id || '0';
            console.log(`Adicionando checklist: ${checklistId} - ${checklistNome}`);
            
            html += `
                <div class="selection-item">
                    <label class="checkmark-container">
                        <input type="checkbox" class="checklist-checkbox" data-id="${checklistId}">
                        <span class="checkmark"></span>
                        <span class="selection-item-label" title="${checklistNome}">${checklistNome}</span>
                    </label>
                </div>
            `;
        });

        checklistsList.innerHTML = html;
        
        // Adicionar event listeners para checkboxes
        document.querySelectorAll('.checklist-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                const id = parseInt(this.getAttribute('data-id'));
                if (this.checked) {
                    if (!selectedChecklists.includes(id)) {
                        selectedChecklists.push(id);
                    }
                } else {
                    selectedChecklists = selectedChecklists.filter(item => item !== id);
                }
                // Atualizar modelos associados após alteração na seleção de checklists
                atualizarModelosAssociados();
                updateSelectionCounts();
                updateSelectAllCheckbox(selectAllChecklists, '.checklist-checkbox');
            });
        });
    }

    // Função para atualizar contadores de seleção
    function updateSelectionCounts() {
        modelosCount.textContent = `${selectedModelos.length} selecionados`;
        checklistsCount.textContent = `${selectedChecklists.length} selecionados`;
        
        // Habilitar/desabilitar botões de exportação
        confirmExport.disabled = selectedModelos.length === 0 && selectedChecklists.length === 0;
        
        // Habilitar "Exportar modelos como texto" apenas quando houver modelos selecionados
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

    // Função para atualizar estado dos checkboxes de modelos associados
    function atualizarModelosAssociados() {
        console.log('Atualizando modelos associados...'); // Log para debug
        
        // Redefinir todos os ícones para invisível (mas mantendo espaço)
        document.querySelectorAll('.modelo-associado-icon').forEach(icon => {
            icon.classList.remove('visible');
            icon.title = '';
        });

        // Habilitar todos os checkboxes de modelos
        document.querySelectorAll('.modelo-checkbox').forEach(checkbox => {
            checkbox.disabled = false;
            // Remover estilo de destaque do item pai
            const selectionItem = checkbox.closest('.selection-item');
            selectionItem.style.backgroundColor = '';
        });
        
        // Mapa para armazenar relações de modelos -> checklists (usado para tooltips)
        const modeloToChecklists = new Map();
        
        // Identificar todos os modelos associados a checklists selecionados
        selectedChecklists.forEach(checklistId => {
            // Buscar nome do checklist para o tooltip
            const checklist = checklists.find(c => c.id === checklistId);
            const checklistNome = checklist ? checklist.nome : 'Checklist desconhecido';
            
            modelosAssociados.forEach((checklistsAssociados, modeloId) => {
                if (checklistsAssociados.includes(checklistId)) {
                    // Armazenar a relação para o tooltip
                    if (!modeloToChecklists.has(modeloId)) {
                        modeloToChecklists.set(modeloId, []);
                    }
                    modeloToChecklists.get(modeloId).push(checklistNome);
                }
            });
        });
        
        console.log('Modelos que serão associados:', Object.fromEntries(modeloToChecklists));
        
        // Agora atualizar a UI com base nas relações
        modeloToChecklists.forEach((checklistNomes, modeloId) => {
            // Buscar o checkbox do modelo
            const checkbox = document.querySelector(`.modelo-checkbox[data-id="${modeloId}"]`);
            if (checkbox) {
                console.log(`Aplicando associação ao modelo ID ${modeloId}`);
                
                // Selecionar e desabilitar o checkbox
                checkbox.checked = true;
                checkbox.disabled = true;
                
                // Mostrar o ícone de associação
                const selectionItem = checkbox.closest('.selection-item');
                // Aplicar estilo de destaque diretamente ao item, sem usar a classe modelo-associado
                selectionItem.style.backgroundColor = 'rgba(var(--primary-color-rgb), 0.08)';
                
                const icon = selectionItem.querySelector('.modelo-associado-icon');
                if (icon) {
                    // Usar classe para mostrar o ícone em vez de mudar display
                    icon.classList.add('visible');
                    icon.title = `Associado a: ${checklistNomes.join(', ')}`;
                    console.log('Ícone exibido com título:', icon.title);
                } else {
                    console.warn('Ícone não encontrado para o modelo ID', modeloId);
                }
                
                // Garantir que está na lista de selecionados
                if (!selectedModelos.includes(modeloId)) {
                    selectedModelos.push(modeloId);
                }
            } else {
                console.warn('Checkbox não encontrado para o modelo ID', modeloId);
            }
        });
        
        // Atualizar contador e estado do "selecionar todos"
        updateSelectionCounts();
        updateSelectAllCheckbox(selectAllModelos, '.modelo-checkbox');
    }

    // Event listener para o botão "selecionar todos modelos"
    selectAllModelos.addEventListener('change', function() {
        const isChecked = this.checked;
        document.querySelectorAll('.modelo-checkbox').forEach(checkbox => {
            // Não alterar checkboxes desabilitados
            if (checkbox.disabled) return;
            
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

    // Event listener para o botão "selecionar todos checklists"
    selectAllChecklists.addEventListener('change', function() {
        const isChecked = this.checked;
        document.querySelectorAll('.checklist-checkbox').forEach(checkbox => {
            checkbox.checked = isChecked;
            const id = parseInt(checkbox.getAttribute('data-id'));
            
            if (isChecked && !selectedChecklists.includes(id)) {
                selectedChecklists.push(id);
            } else if (!isChecked) {
                selectedChecklists = selectedChecklists.filter(item => item !== id);
            }
        });
        // Atualizar modelos associados após alteração na seleção de checklists
        atualizarModelosAssociados();
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
            // Mostrar loading
            confirmExport.classList.add('loading');
            confirmExport.disabled = true;
            
            // Filtrar modelos e checklists selecionados
            const modelosToExport = modelos.filter(modelo => selectedModelos.includes(modelo.id));
            const checklistsToExport = checklists.filter(checklist => selectedChecklists.includes(checklist.id));
            
            console.log('Exportando documentos selecionados:', {
                modelos: modelosToExport.length,
                checklists: checklistsToExport.length
            });
            
            // Chamar API para exportar
            const result = await window.electronAPI.exportarDocumentosSelecionados({
                modelos: modelosToExport,
                checklists: checklistsToExport
            });
            
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
            // Remover loading
            confirmExport.classList.remove('loading');
            confirmExport.disabled = false;
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
            
            // Mostrar loading
            exportAsTextBtn.classList.add('loading');
            exportAsTextBtn.disabled = true;
            
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
            // Remover loading
            exportAsTextBtn.classList.remove('loading');
            exportAsTextBtn.disabled = false;
        }
    });

});
