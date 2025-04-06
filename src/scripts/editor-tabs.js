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

    // Inicializar após o carregamento completo do DOM
    document.addEventListener('DOMContentLoaded', () => {
        // Aguardar o TinyMCE ser carregado
        const waitForTinyMCE = setInterval(() => {
            if (window.tinymce && tinymce.get('editor-container')) {
                clearInterval(waitForTinyMCE);
                initTabs();
            }
        }, 100);

        // Adicionar evento ao botão de adicionar aba
        addTabBtn.addEventListener('click', createNewTab);
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
            createNewTab();
        } else {
            // Renderizar todas as abas salvas
            renderTabs();
            
            // Ativar a aba salva como ativa
            if (activeTabId) {
                activateTab(activeTabId);
            } else if (tabs.length > 0) {
                activateTab(tabs[0].id);
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
    function createNewTab() {
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
        
        // Salvar conteúdo da aba atual antes de criar uma nova
        saveCurrentTabContent();
        
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
        
        // Ativar a nova aba
        activateTab(newTab.id);
        
        // Salvar estado
        saveTabsState();
    }

    // Ativar uma aba específica
    function activateTab(tabId) {
        // Salvar conteúdo da aba atual antes de mudar
        saveCurrentTabContent();
        
        // Atualizar estado da aba ativa
        activeTabId = tabId;
        
        // Atualizar classes CSS
        document.querySelectorAll('.editor-tab').forEach(tab => {
            if (tab.getAttribute('data-tab-id') === tabId) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });
        
        // Carregar conteúdo da aba
        loadTabContent(tabId);
        
        // Salvar estado
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
            // Primeiro salvar o estado da aba atual antes de mudar
            saveCurrentTabContent();
            
            const currentIndex = tabs.findIndex(tab => tab.id === tabId);
            const newActiveIndex = currentIndex > 0 ? currentIndex - 1 : currentIndex + 1;
            
            // Armazenar o ID da nova aba ativa
            const newActiveTabId = tabs[newActiveIndex].id;
            
            // Limpar o editor antes de carregar o conteúdo da nova aba
            const editor = tinymce.get('editor-container');
            if (editor) {
                editor.setContent('');
            }
            
            // Remover a aba do array antes de ativar a nova
            tabs = tabs.filter(tab => tab.id !== tabId);
            
            // Atualizar a exibição
            renderTabs();
            
            // Limpar dados da aba fechada
            localStorage.removeItem(`${TAB_CONTENT_PREFIX}${tabId}`);
            localStorage.removeItem(`${TAB_CONTENT_PREFIX}${tabId}_form`);
            
            // Ativar a nova aba selecionada - com ID armazenado previamente
            activateTab(newActiveTabId);
        } else {
            // Se a aba fechada não é a ativa, apenas remover e atualizar
            tabs = tabs.filter(tab => tab.id !== tabId);
            renderTabs();
            
            // Limpar dados da aba fechada
            localStorage.removeItem(`${TAB_CONTENT_PREFIX}${tabId}`);
            localStorage.removeItem(`${TAB_CONTENT_PREFIX}${tabId}_form`);
            
            // Salvar estado
            saveTabsState();
        }
    }

    // Salvar o conteúdo da aba atual
    function saveCurrentTabContent() {
        if (!activeTabId) return;
        
        const editor = tinymce.get('editor-container');
        if (editor) {
            try {
                // Salvar conteúdo do editor
                const content = editor.getContent();
                localStorage.setItem(`${TAB_CONTENT_PREFIX}${activeTabId}`, content);
                
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
                console.error('Erro ao salvar conteúdo da aba:', error);
            }
        }
    }

    // Carregar o conteúdo de uma aba
    function loadTabContent(tabId) {
        const editor = tinymce.get('editor-container');
        if (editor) {
            try {
                // Garantir que o conteúdo seja limpo antes de carregar o novo
                editor.undoManager.clear();
                
                // Carregar conteúdo do editor
                const content = localStorage.getItem(`${TAB_CONTENT_PREFIX}${tabId}`) || '';
                editor.setContent(content);
                
                // Carregar campos de formulário
                const formDataStr = localStorage.getItem(`${TAB_CONTENT_PREFIX}${tabId}_form`);
                if (formDataStr) {
                    const formData = JSON.parse(formDataStr);
                    
                    const nomeInput = document.getElementById('nome-input');
                    const tagInput = document.getElementById('tag-input');
                    
                    if (nomeInput && formData.nome !== undefined) {
                        nomeInput.value = formData.nome;
                    } else {
                        nomeInput.value = '';
                    }
                    
                    if (tagInput && formData.tag !== undefined) {
                        tagInput.value = formData.tag;
                    } else {
                        tagInput.value = '';
                    }
                } else {
                    // Limpar campos se não houver dados
                    document.getElementById('nome-input').value = '';
                    document.getElementById('tag-input').value = '';
                }
            } catch (error) {
                console.error('Erro ao carregar conteúdo da aba:', error);
                
                // Em caso de erro, limpar os campos
                editor.setContent('');
                document.getElementById('nome-input').value = '';
                document.getElementById('tag-input').value = '';
            }
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
