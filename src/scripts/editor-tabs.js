/**
 * Sistema de gerenciamento de múltiplas abas para o editor
 */
(function() {
    // Estado das abas
    let tabs = [];
    let activeTabId = null;
    const MAX_TABS = 10;
    
    // Chave para armazenamento no localStorage
    const TABS_STATE_KEY = 'editor_tabs_state';
    const TAB_CONTENT_PREFIX = 'tinymce_tab_content_';

    // Elementos DOM
    const tabsList = document.getElementById('editor-tabs');
    const addTabBtn = document.getElementById('add-tab-btn');
    
    // Verificar se os elementos necessários existem
    if (!tabsList || !addTabBtn) {
        console.error('Elementos necessários para as abas não foram encontrados');
        return;
    }

    // Salvar o conteúdo da aba ativa ao sair/recarregar a aplicação (manter como fallback)
    window.addEventListener('beforeunload', () => {
        console.log('beforeunload: Tentando salvar aba ativa:', activeTabId);
        saveCurrentTabContent();
    });

    // Salvar periodicamente e em blur
    let saveInterval = null;
    const SAVE_INTERVAL_MS = 5000; // Salvar a cada 5 segundos

    function startSaveInterval() {
        if (saveInterval) clearInterval(saveInterval);
        saveInterval = setInterval(() => {
            // Só salva se houver um editor ativo e a janela tiver foco
            if (document.hasFocus() && tinymce.get('editor-container')) {
                 saveCurrentTabContent();
            }
        }, SAVE_INTERVAL_MS);
    }

    function stopSaveInterval() {
        if (saveInterval) clearInterval(saveInterval);
        saveInterval = null;
    }

    // Inicializar após o carregamento completo do DOM
    document.addEventListener('DOMContentLoaded', () => {
        // Aguardar o TinyMCE ser carregado
        const waitForTinyMCE = setInterval(() => {
            if (window.tinymce && tinymce.get('editor-container')) {
                clearInterval(waitForTinyMCE);
                initTabs();

                // Iniciar o salvamento periódico APÓS initTabs
                startSaveInterval();

                // Pausar/Retomar salvamento com base no foco da janela
                window.addEventListener('focus', startSaveInterval);
                window.addEventListener('blur', stopSaveInterval);

                // Adicionar listener para salvar antes de navegar para outras abas principais
                document.querySelectorAll('.titlebar-tabs a').forEach(link => {
                    link.addEventListener('click', (e) => {
                        // Verifica se o link é para uma página diferente da atual e se estamos na página de edição
                        const targetHref = link.getAttribute('href');
                        const currentPath = window.location.pathname.split('/').pop();
                        // Verifica se targetHref existe e não é igual à página atual E se estamos na página do editor
                        if (targetHref && targetHref !== currentPath && document.body.getAttribute('data-page') === 'editor') {
                            console.log('Navegação principal: Salvando aba ativa antes de sair:', activeTabId);
                            saveCurrentTabContent();
                        }
                    });
                });
            }
        }, 100);

        // Adicionar evento ao botão de adicionar aba
        addTabBtn.addEventListener('click', createNewTab);
    });

    // Salvar o conteúdo da aba ativa ao sair/recarregar a aplicação
    window.addEventListener('beforeunload', () => {
        saveCurrentTabContent();
    });

    // Inicializar abas
    function initTabs() {
        // Tentar carregar estado das abas do localStorage
        try {
            const savedState = localStorage.getItem(TABS_STATE_KEY);
            if (savedState) {
                const parsedState = JSON.parse(savedState);
                tabs = parsedState.tabs || [];
                activeTabId = parsedState.activeTabId;
            }
        } catch (error) {
            console.error('Erro ao carregar estado das abas:', error);
            tabs = [];
            activeTabId = null;
        }

        // Se não houver abas ou a aba ativa não existir, criar uma nova
        if (tabs.length === 0 || !tabs.find(tab => tab.id === activeTabId)) {
            // Ao criar a primeira aba, também marcar como inicialização
            createNewTab(true); // Passa true para isInitialization
        } else {
            // Renderizar todas as abas salvas
            renderTabs();
            
            // Ativar a aba salva como ativa, indicando que é inicialização
            if (activeTabId) {
                activateTab(activeTabId, true); // Passa true para isInitialization
            } else if (tabs.length > 0) {
                // Se activeTabId era inválido, ativa a primeira como inicialização
                activateTab(tabs[0].id, true); // Passa true para isInitialization
            }
        }
    }

    // Renderizar todas as abas
    function renderTabs() {
        tabsList.innerHTML = '';
        
        tabs.forEach(tab => {
            const tabElement = createTabElement(tab);
            tabsList.appendChild(tabElement);
        });
    }

    // Criar elemento DOM para uma aba
    function createTabElement(tab) {
        const tabElement = document.createElement('div');
        tabElement.className = `editor-tab ${tab.id === activeTabId ? 'active' : ''}`;
        tabElement.setAttribute('data-tab-id', tab.id);
        tabElement.innerHTML = `
            <span class="editor-tab-title">${tab.title}</span>
            <button class="editor-tab-close" title="Fechar aba">
                <svg viewBox="0 0 24 24">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
            </button>
        `;
        
        // Adicionar evento de clique para ativar a aba
        tabElement.addEventListener('click', (e) => {
            if (!e.target.closest('.editor-tab-close')) {
                activateTab(tab.id);
            }
        });
        
        // Adicionar evento ao botão de fechar
        const closeBtn = tabElement.querySelector('.editor-tab-close');
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            closeTab(tab.id);
        });
        
        return tabElement;
    }

    // Criar nova aba
    function createNewTab(isInitialization = false) { // Adiciona parâmetro isInitialization
        // Limitar número máximo de abas
        if (tabs.length >= MAX_TABS) {
            // Substituir alert por showDialog personalizado
            if (window.showDialog) {
                window.showDialog(
                    'Limite de abas',
                    `Você atingiu o limite máximo de ${MAX_TABS} abas.`,
                    [{
                        id: 'btn-ok',
                        text: 'OK',
                        class: 'btn-primary',
                        value: true
                    }]
                );
            } else {
                // Fallback para alert apenas se necessário
                alert(`Você atingiu o limite máximo de ${MAX_TABS} abas.`);
            }
            return;
        }
        
        // Salvar conteúdo da aba atual antes de criar uma nova, APENAS se não for inicialização
        if (!isInitialization) {
            saveCurrentTabContent();
        }
        
        // Gerar um nome único para a nova aba
        let tabNumber = 1;
        let tabTitle = `Modelo ${tabNumber}`;
        
        // Verificar se já existe uma aba com este nome e incrementar o número até encontrar um nome único
        while (tabs.some(tab => tab.title === tabTitle)) {
            tabNumber++;
            tabTitle = `Modelo ${tabNumber}`;
        }
        
        // Criar nova aba com ID único
        const newTab = {
            id: 'tab_' + Date.now(),
            title: tabTitle
        };
        
        // Adicionar a nova aba ao array
        tabs.push(newTab);
        
        // Adicionar o elemento DOM
        const tabElement = createTabElement(newTab);
        tabsList.appendChild(tabElement);
        
        // Ativar a nova aba, passando o flag de inicialização
        activateTab(newTab.id, isInitialization);
        
        // Salvar estado (não precisa salvar se for a primeira aba na inicialização, pois activateTab fará isso)
        // saveTabsState(); // Removido daqui, activateTab já salva
    }

    // Ativar uma aba específica
    function activateTab(tabId, isInitialization = false) { // Adiciona parâmetro isInitialization
        // Salvar conteúdo da aba *anterior* antes de mudar, APENAS se não for inicialização
        // e se a aba ativa for diferente da que está sendo ativada
        if (!isInitialization && activeTabId && activeTabId !== tabId) {
            console.log(`activateTab: Salvando aba anterior ${activeTabId} antes de ativar ${tabId}`);
            saveCurrentTabContent();
        } else if (isInitialization) {
            console.log(`activateTab: Inicialização, pulando salvamento da aba anterior ao ativar ${tabId}`);
        }

        // Atualizar estado da aba ativa
        activeTabId = tabId;
        console.log(`activateTab: Aba ativa definida para ${activeTabId}`);

        // Atualizar classes CSS
        document.querySelectorAll('.editor-tab').forEach(tab => {
            const currentTabId = tab.getAttribute('data-tab-id');
            if (currentTabId === tabId) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });

        // Carregar conteúdo da nova aba
        console.log(`activateTab: Chamando loadTabContent para ${tabId}`);
        loadTabContent(tabId); // Chamada síncrona agora

        // Salvar estado geral das abas (qual aba está ativa)
        console.log(`activateTab: Chamando saveTabsState após ativar ${tabId}`);
        saveTabsState();
    }

    // Fechar uma aba
    async function closeTab(tabId) {
        // Não permitir fechar a última aba
        if (tabs.length <= 1) {
            if (window.showDialog) {
                await window.showDialog(
                    'Aviso',
                    'Não é possível fechar a última aba.',
                    [{
                        id: 'btn-ok',
                        text: 'OK',
                        class: 'btn-primary',
                        value: true
                    }]
                );
                
                // O foco será restaurado automaticamente pela nova implementação de showDialog
            } else {
                // Fallback para alert() se showDialog não estiver disponível
                alert('Não é possível fechar a última aba.');
            }
            return;
        }
        
        // Se a aba a ser fechada é a ativa, mudar para outra
        if (activeTabId === tabId) {
            // Salvar o conteúdo da aba que será fechada ANTES de qualquer outra coisa
            console.log('Fechando aba ativa: Salvando conteúdo antes:', tabId);
            saveCurrentTabContent(); // Garante que o conteúdo seja salvo

            const currentIndex = tabs.findIndex(tab => tab.id === tabId);
            // Correção: Garantir que newActiveIndex não seja inválido se a aba fechada for a última
            let newActiveIndex;
            if (currentIndex === tabs.length - 1) { // Se for a última aba da lista
                newActiveIndex = currentIndex - 1; // Ativa a anterior
            } else { // Caso contrário, ativa a próxima (ou a anterior se for a primeira)
                newActiveIndex = currentIndex > 0 ? currentIndex - 1 : currentIndex + 1;
            }
            // Garantir que o índice seja válido
            newActiveIndex = Math.max(0, Math.min(newActiveIndex, tabs.length - 2)); // -2 porque uma aba será removida

            const newActiveTabId = tabs[newActiveIndex].id; // Obter ID antes de remover

            // Limpar o editor ANTES de remover a aba do array
            const editor = tinymce.get('editor-container');
            if (editor && !editor.destroyed) {
                editor.setContent(''); // Limpa visualmente
                if (editor.undoManager) editor.undoManager.clear();
            }

            // Remover aba do array e do localStorage
            tabs = tabs.filter(tab => tab.id !== tabId);
            localStorage.removeItem(`${TAB_CONTENT_PREFIX}${tabId}`);
            localStorage.removeItem(`${TAB_CONTENT_PREFIX}${tabId}_form`);

            // Atualizar a exibição
            renderTabs();

            // Ativar a nova aba (isso carregará o conteúdo dela e salvará o estado)
            activateTab(newActiveTabId); // activateTab já chama saveTabsState

        } else {
            // Se a aba fechada não é a ativa, apenas remover e atualizar
            tabs = tabs.filter(tab => tab.id !== tabId);
            renderTabs();

            // Limpar dados da aba fechada
            localStorage.removeItem(`${TAB_CONTENT_PREFIX}${tabId}`);
            localStorage.removeItem(`${TAB_CONTENT_PREFIX}${tabId}_form`);

            // Salvar estado (apenas a lista de abas e a aba ativa, que não mudou)
            saveTabsState();
        }
    }

    // Salvar o conteúdo da aba atual
    function saveCurrentTabContent() {
        if (!activeTabId) {
            return;
        }

        const editor = tinymce.get('editor-container');
        // Verifica se o editor existe, não está destruído e tem o método getContent
        if (editor && !editor.destroyed && typeof editor.getContent === 'function') {
            try {
                const content = editor.getContent();
                // Verifica se o conteúdo é uma string antes de salvar
                if (typeof content === 'string') {
                    localStorage.setItem(`${TAB_CONTENT_PREFIX}${activeTabId}`, content);
                } else {
                    console.warn(`Conteúdo do editor para ${activeTabId} não é string ao salvar:`, content);
                }

                // Salvar campos de formulário também
                const nomeInput = document.getElementById('nome-input');
                const tagInput = document.getElementById('tag-input');
                if (nomeInput && tagInput) {
                    const formData = {
                        nome: nomeInput.value,
                        tag: tagInput.value
                    };
                    localStorage.setItem(`${TAB_CONTENT_PREFIX}${activeTabId}_form`, JSON.stringify(formData));
                }
            } catch (error) {
                // Adiciona verificação para erros comuns do TinyMCE durante o desligamento ou inicialização
                if (error.message.includes("Cannot read properties of null") ||
                    error.message.includes("editor is undefined") ||
                    error.message.includes("document is undefined") || // Pode ocorrer durante o unload
                    error.message.includes("Cannot read properties of undefined (reading 'setContent')")) { // Pode ocorrer se chamado muito cedo/tarde
                    console.warn(`Editor TinyMCE provavelmente em estado instável (inicializando/desligando) ao tentar salvar ${activeTabId}, não foi possível salvar:`, error.message);
                } else {
                    console.error(`Erro inesperado ao salvar conteúdo da aba ${activeTabId}:`, error);
                }
            }
        } else {
            // Log mais informativo se o editor não estiver pronto
            const editorStatus = editor ? (editor.destroyed ? 'destruído' : 'sem getContent') : 'não encontrado';
            console.warn(`Editor TinyMCE ${editorStatus} ao tentar salvar a aba ${activeTabId}.`);
        }
    }

    // Carregar o conteúdo de uma aba (simplificado para usar apenas localStorage)
    function loadTabContent(tabId) { // Tornar síncrona novamente
        console.log(`loadTabContent: Iniciando carregamento para ${tabId}`);
        const editor = tinymce.get('editor-container');

        // Verifica se o editor existe e tem o método setContent
        if (editor && typeof editor.setContent === 'function') {
            // Verifica se o editor já foi destruído
            if (editor.destroyed) {
                console.warn(`loadTabContent: Editor para ${tabId} já está destruído.`);
                return;
            }

            try {
                let content = '';
                let formData = null;

                // Carregar APENAS do localStorage por enquanto
                console.log(`loadTabContent: Tentando carregar dados da aba ${tabId} via localStorage.`);
                const localContent = localStorage.getItem(`${TAB_CONTENT_PREFIX}${tabId}`);
                const localFormDataStr = localStorage.getItem(`${TAB_CONTENT_PREFIX}${tabId}_form`);

                if (typeof localContent === 'string') {
                    content = localContent;
                    console.log(`loadTabContent: Conteúdo da aba ${tabId} carregado via localStorage (tamanho: ${content.length}).`);
                } else {
                    console.log(`loadTabContent: Nenhum conteúdo encontrado para ${tabId} via localStorage.`);
                }

                if (localFormDataStr) {
                    try {
                        formData = JSON.parse(localFormDataStr);
                        console.log(`loadTabContent: FormData da aba ${tabId} carregado via localStorage.`);
                    } catch (e) {
                        console.error(`loadTabContent: Erro ao analisar formData do localStorage para ${tabId}:`, e);
                        formData = null; // Garante que formData seja nulo em caso de erro
                    }
                }

                // Garantir que content seja uma string válida
                content = (typeof content === 'string' && content !== 'undefined' && content !== null) ? content : '';

                // Pequeno delay antes de setContent para garantir que o editor esteja pronto
                console.log(`loadTabContent: Agendando setContent para ${tabId} em 50ms.`);
                setTimeout(() => {
                    // Re-verificar o estado do editor DENTRO do setTimeout
                    const currentEditor = tinymce.get('editor-container');
                    if (currentEditor && !currentEditor.destroyed && currentEditor.initialized) { // Verifica editor.initialized
                         try {
                             console.log(`loadTabContent: Executando setContent para ${tabId} (tamanho: ${content.length}).`);
                             currentEditor.setContent(content);
                             console.log(`loadTabContent: setContent executado para ${tabId}.`);
                             // Resetar histórico DEPOIS de definir o conteúdo
                             if (currentEditor.undoManager) {
                                 currentEditor.undoManager.clear();
                                 console.log(`loadTabContent: Histórico de undo limpo para ${tabId}.`);
                             }
                         } catch (setContentError) {
                              console.error(`loadTabContent: Erro durante setContent para ${tabId} dentro do setTimeout:`, setContentError);
                         }
                    } else {
                         const status = currentEditor ? (currentEditor.destroyed ? 'destruído' : (!currentEditor.initialized ? 'não inicializado' : 'outro')) : 'não encontrado';
                         console.warn(`loadTabContent: Editor ${status} no momento do setTimeout para ${tabId}. setContent não executado.`);
                    }
                }, 50); // Delay de 50ms (ajuste se necessário)


                // Carregar campos de formulário (fora do setTimeout, pois não dependem do editor)
                console.log(`loadTabContent: Carregando campos de formulário para ${tabId}.`);
                const nomeInput = document.getElementById('nome-input');
                const tagInput = document.getElementById('tag-input');
                if (formData) {
                    if (nomeInput) nomeInput.value = formData.nome !== undefined ? formData.nome : '';
                    if (tagInput) tagInput.value = formData.tag !== undefined ? formData.tag : '';
                    console.log(`loadTabContent: Campos de formulário preenchidos para ${tabId}.`);
                } else {
                    if (nomeInput) nomeInput.value = '';
                    if (tagInput) tagInput.value = '';
                    console.log(`loadTabContent: Campos de formulário limpos para ${tabId} (sem formData).`);
                }

            } catch (error) {
                console.error(`loadTabContent: Erro geral ao carregar conteúdo da aba ${tabId}:`, error);
            }
        } else {
            const editorStatus = editor ? (editor.destroyed ? 'destruído' : 'sem setContent') : 'não encontrado';
            console.warn(`loadTabContent: Editor TinyMCE ${editorStatus} ao tentar iniciar carregamento para a aba ${tabId}.`);
        }
    }

    // Salvar o estado das abas no localStorage
    function saveTabsState() {
        const state = {
            tabs: tabs,
            activeTabId: activeTabId
        };
        
        localStorage.setItem(TABS_STATE_KEY, JSON.stringify(state));
    }

    // Renomear uma aba
    function renameTab(tabId, newTitle) {
        const tab = tabs.find(t => t.id === tabId);
        if (tab) {
            tab.title = newTitle || tab.title;
            renderTabs();
            saveTabsState();
        }
    }

    // Expor API para uso externo
    window.editorTabs = {
        createNewTab,
        activateTab,
        closeTab,
        saveCurrentTabContent,
        renameTab,
        getCurrentTabId: () => activeTabId
    };
})();
