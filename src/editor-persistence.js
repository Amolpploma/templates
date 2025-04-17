/**
 * Sistema de persistência para o conteúdo do TinyMCE entre abas e sessões
 */
document.addEventListener('DOMContentLoaded', () => {
    // Evitar múltiplas inicializações
    if (window.editorPersistenceInitialized) return;
    window.editorPersistenceInitialized = true;

    // Se o sistema de abas está presente, não usar persistência global
    if (window.editorTabs) {
        console.log('Persistência global desabilitada: sistema de abas detectado');
        return;
    }
    
    // Determinar qual é a página atual e a chave de armazenamento apropriada
    const isSearchPage = !document.body.hasAttribute('data-page');
    const isEditorPage = document.body.getAttribute('data-page') === 'editor';
    
    const SEARCH_KEY = 'tinymce_search_content';
    const EDITOR_KEY = 'tinymce_editor_content';
    const LAST_PAGE_KEY = 'last_visited_page';
    
    // Definir qual chave usar para esta página
    const storageKey = isSearchPage ? SEARCH_KEY : (isEditorPage ? EDITOR_KEY : null);
    
    if (!storageKey) {
        console.log('Página atual não suporta persistência do editor');
        return; // Sair se não for uma página suportada
    }
    
    // Registrar a página atual como a última visitada
    const currentPage = window.location.pathname.split('/').pop();
    localStorage.setItem(LAST_PAGE_KEY, currentPage);
    
    // Detectar navegação para outra página
    const links = document.querySelectorAll('a');
    links.forEach(link => {
        const href = link.getAttribute('href');
        if (href && (href.includes('index.html') || href.includes('gerenciador-modelos.html') || href.includes('gerenciador-checklists.html'))) {
            link.addEventListener('click', () => {
                // Usar activeEditor para garantir que obtemos a instância correta
                if (window.tinymce && tinymce.activeEditor) {
                    const content = tinymce.activeEditor.getContent();
                    localStorage.setItem(storageKey, content);
                    localStorage.setItem(LAST_PAGE_KEY, href);
                }
            });
        }
    });
    
    // Modificar a inicialização do TinyMCE para incluir nosso código
    const originalInit = window.tinymce && window.tinymce.init;
    if (originalInit) {
        window.tinymce.init = function(settings) {
            // Guardar a função setup original
            const originalSetup = settings.setup;
            
            // Modificar a configuração para adicionar nosso handler
            settings.setup = function(editor) {
                // Chamar o setup original se existir
                if (typeof originalSetup === 'function') {
                    originalSetup.call(this, editor);
                }
                
                // Adicionar nosso handler ao evento init
                editor.on('init', function() {
                    // Este setTimeout garante que executamos depois que o TinyMCE realmente terminou
                    setTimeout(() => {
                        // Obter o conteúdo salvo
                        const savedContent = localStorage.getItem(storageKey);
                        
                        if (savedContent && savedContent.trim() !== '') {
                            // Definir o conteúdo
                            editor.setContent(savedContent);
                            console.log('Conteúdo restaurado do armazenamento local');
                        }
                        
                        // Configurar handlers para salvar automaticamente
                        editor.on('input change blur', function() {
                            localStorage.setItem(storageKey, editor.getContent());
                        });
                    }, 300); // Atraso de 300ms para garantir que o TinyMCE está realmente pronto
                });
            };
            
            // Retornar o resultado da função init original
            return originalInit.call(this, settings);
        };
    }
});
