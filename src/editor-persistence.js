/**
 * Sistema de persistência para o conteúdo do TinyMCE entre abas e sessões
 */
document.addEventListener('DOMContentLoaded', () => {
    // Determinar qual é a página atual e a chave de armazenamento apropriada
    const isSearchPage = !document.body.hasAttribute('data-page');
    const isEditorPage = document.body.getAttribute('data-page') === 'editor';
    
    const SEARCH_KEY = 'tinymce_search_content';
    const EDITOR_KEY = 'tinymce_editor_content';
    
    // Definir qual chave usar para esta página
    const storageKey = isSearchPage ? SEARCH_KEY : (isEditorPage ? EDITOR_KEY : null);
    
    if (!storageKey) {
        console.log('Página não suporta persistência do editor');
        return; // Sair se não for uma página suportada
    }
    
    console.log(`Inicializando persistência para: ${isSearchPage ? 'Busca' : 'Edição'}`);
    
    // Detectar navegação para outra página
    const links = document.querySelectorAll('a');
    links.forEach(link => {
        if (link.href.includes('index.html') || link.href.includes('gerenciador-modelos.html')) {
            link.addEventListener('click', (e) => {
                // Salvar o conteúdo do editor no momento do clique no link
                if (tinymce && tinymce.activeEditor) {
                    const content = tinymce.activeEditor.getContent();
                    console.log(`Salvando conteúdo para navegação: ${link.href}`);
                    localStorage.setItem(storageKey, content);
                }
            });
        }
    });
    
    // Função para monitorar a inicialização do TinyMCE
    function setupEditorPersistence() {
        // Verificar se o TinyMCE já está inicializado
        if (typeof tinymce !== 'undefined') {
            // Adicionar um handler para o evento setup do TinyMCE
            const originalInit = tinymce.init;
            tinymce.init = function(settings) {
                // Mesclar as configurações originais com nosso handler de setup
                const originalSetup = settings.setup;
                
                settings.setup = function(editor) {
                    // Chamar o setup original se existir
                    if (typeof originalSetup === 'function') {
                        originalSetup.call(this, editor);
                    }
                    
                    // Configurar nosso handler para o evento de inicialização
                    editor.on('init', function() {
                        console.log('Editor inicializado, restaurando conteúdo...');
                        const savedContent = localStorage.getItem(storageKey);
                        
                        if (savedContent) {
                            console.log('Conteúdo encontrado, restaurando...');
                            // Pequeno atraso para garantir que o editor esteja pronto
                            setTimeout(() => {
                                editor.setContent(savedContent);
                                console.log('Conteúdo restaurado com sucesso');
                            }, 100);
                        } else {
                            console.log('Nenhum conteúdo salvo encontrado');
                        }
                    });
                    
                    // Configurar salvar automaticamente ao digitar
                    editor.on('input change blur', function() {
                        const content = editor.getContent();
                        console.log('Salvando conteúdo após alteração...');
                        localStorage.setItem(storageKey, content);
                    });
                };
                
                // Chamar o método init original com as configurações modificadas
                return originalInit.call(this, settings);
            };
            
            console.log('Persistência configurada: interceptação do tinymce.init realizada');
        } else {
            console.error('TinyMCE não encontrado, não é possível configurar persistência');
        }
    }
    
    // Configurar a persistência assim que o documento estiver carregado
    setupEditorPersistence();
    
    // Comportamento ao fechar a página
    window.addEventListener('beforeunload', () => {
        // Nas páginas de busca, limpar o conteúdo ao fechar a aplicação
        if (isSearchPage) {
            // Não limpar se estiver navegando para a página de edição
            const activeElement = document.activeElement;
            if (!activeElement || !activeElement.tagName === 'A' || 
                !activeElement.href.includes('gerenciador-modelos.html')) {
                console.log('Fechando aplicação, limpando conteúdo da página de busca');
                localStorage.removeItem(SEARCH_KEY);
            }
        }
    });
});
