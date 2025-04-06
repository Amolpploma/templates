document.addEventListener('DOMContentLoaded', () => {
    const theme = document.documentElement.getAttribute('data-theme');
    const isDarkTheme = theme === 'dark';

    function initTinyMCE() {
        const theme = document.documentElement.getAttribute('data-theme');
        const isDarkTheme = theme === 'dark';
        const isSearchPage = !document.body.hasAttribute('data-page');
        const defaultPlugins = ['wordcount', 'lists', 'searchreplace', 'charmap']; 
        const defaultToolbar = 'fontfamily fontsize bold italic underline | alignjustify aligncenter align lineheight | outdent indent | selectall copy undo redo searchreplace | numlist bullist | forecolor backcolor | removeformat charmap'; 
        
        const config = {
            selector: '#editor-container',
            skin: isDarkTheme ? 'oxide-dark' : 'oxide',
            content_css: isDarkTheme ? 'dark' : 'default',
            plugins: defaultPlugins,
            menubar: false,
            statusbar: true,
            elementpath: false,
            height: '100%',
            min_height: 200,
            resize: true,
            autoresize_bottom_margin: 20,
            autoresize_overflow_padding: 10,
            
            // Configurações para o corretor ortográfico
            browser_spellcheck: true,
            contextmenu: "", // Forçar menu vazio para usar o nativo
            contextmenu_never_use_native: false, // Permitir menu nativo
            
            // Remover 'insertmodelo' da toolbar
            toolbar: isSearchPage 
                ? `editnewmodel|${defaultToolbar}` 
                : defaultToolbar,
            
            content_style: `
                body { 
                    font-family:times new roman,times; 
                    font-size:12pt;
                    background-color: ${isDarkTheme ? '#1e1e1e !important' : '#ffffff'};
                    color: ${isDarkTheme ? '#bfbfbf !important' : '#000000'};
                    spellcheck: true !important;
                }
                
                /* Estilização da barra de rolagem - consistente com os painéis */
                ::-webkit-scrollbar {
                    width: 8px !important;
                    height: 10px !important;
                }
                
                ::-webkit-scrollbar-track {
                    background: transparent !important;
                    border-radius: 4px !important;
                }
                
                ::-webkit-scrollbar-thumb {
                    background-color: ${isDarkTheme ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'} !important;
                }
                
                ::-webkit-scrollbar-thumb:hover {
                    background-color: ${isDarkTheme ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)'} !important;
                }
                
                /* Destaque para palavras incorretas */
                .mce-spellchecker-word {
                    background-image: none !important;
                    border-bottom: 2px wavy red !important;
                    margin-bottom: -2px !important;
                }

                * { 
                    transition: none !important;
                }
            `,
            
            readonly: false,
            license_key: 'gpl',
            
            // Evento init customizado para forçar as configurações
            init_instance_callback: function(editor) {
                // Forçar spellcheck no documento após inicialização
                editor.getDoc().documentElement.setAttribute('spellcheck', 'true');
                editor.getDoc().body.setAttribute('spellcheck', 'true');
                
                // Injetar CSS para evitar que o TinyMCE capture e suprima o menu de contexto
                const style = editor.dom.create('style', { type: 'text/css' });
                style.innerHTML = `
                    body {
                        spellcheck: true !important;
                    }
                    
                    /* Desativar menu de contexto do TinyMCE completamente */
                    .tox-tinymce-aux, .tox-tbtn__select-chevron, .tox-collection--list, .tox-menu {
                        display: none !important;
                        visibility: hidden !important;
                        opacity: 0 !important;
                    }
                `;
                editor.dom.add(editor.getDoc().head, style);
                
                // Garantir que o TinyMCE não bloqueie eventos do menu de contexto
                editor.getDoc().addEventListener('contextmenu', function(e) {
                    // Forçar o comportamento padrão do navegador
                    e.stopPropagation();
                }, true);
            },
            
            setup: function(editor) {
                if (isSearchPage) {
                    editor.ui.registry.addButton('editnewmodel', {
                        icon: 'save',
                        tooltip: 'Transferir para página de edição',
                        onAction: function() {
                            const content = editor.getContent();
                            window.electronAPI.navigateAndTransferContent('gerenciador-modelos.html', content);
                        }
                    });

                    // Tornar somente leitura após carregamento apenas na página de busca
                    editor.on('init', function() {
                        const editorIframe = editor.iframeElement;
                        if (editorIframe) {
                            editorIframe.setAttribute('contenteditable', 'false');
                        }
                    });
                }

                // Remover a definição do botão insertmodelo
                // Manter apenas os atalhos de teclado

                // Atalho Ctrl+Espaço
                editor.addShortcut('ctrl+space', 'Inserir modelo (Ctrl+Espaço)', function() {
                    console.log('Atalho Ctrl+Espaço acionado');
                    if (typeof window.showModeloDialog === 'function') {
                        window.showModeloDialog(editor);
                        return true; // Indica que o evento foi processado
                    }
                });
                
                // Atalho alternativo Alt+M
                editor.addShortcut('alt+m', 'Inserir modelo (Alt+M)', function() {
                    console.log('Atalho Alt+M acionado');
                    if (typeof window.showModeloDialog === 'function') {
                        window.showModeloDialog(editor);
                        return true; // Indica que o evento foi processado
                    }
                });

                // Manipulador direto para Ctrl+Espaço
                editor.on('keydown', function(e) {
                    // Verificar se é Ctrl+Espaço 
                    if (e.ctrlKey && e.keyCode === 32) { // 32 é o keyCode para a barra de espaço
                        console.log('Evento keydown capturado: Ctrl+Espaço');
                        e.preventDefault(); // Prevenir comportamento padrão
                        e.stopPropagation(); // Parar propagação
                        
                        if (typeof window.showModeloDialog === 'function') {
                            window.showModeloDialog(editor);
                            return false; // Isso impede a propagação adicional
                        }
                    }
                });

                // Garantir que não capturamos os eventos de contextmenu
                editor.on('contextmenu', function(e) {
                    return true; // Permitir comportamento padrão
                });
            }
        };

        tinymce.init(config);
        
        // Adicionar hack global para garantir o menu de contexto
        setTimeout(() => {
            // Remover manipuladores do evento contextmenu do TinyMCE
            const iframe = document.querySelector('.tox-edit-area__iframe');
            if (iframe && iframe.contentDocument) {
                const doc = iframe.contentDocument;
                
                // Redefinir contextmenu no iframe
                const replaceContextMenu = function() {
                    doc.addEventListener('contextmenu', function(e) {
                        e.stopPropagation();
                    }, true);
                };
                
                try {
                    replaceContextMenu();
                } catch (e) {
                    console.error('Erro ao reconfigurar menu de contexto:', e);
                }
            }
        }, 1000);
    }

    // Iniciar o editor
    initTinyMCE();

    // Observar mudanças no tema
    const observer = new MutationObserver(() => {
        const editor = tinymce.get('editor-container');
        if (editor) {
            const content = editor.getContent();
            editor.destroy();
            initTinyMCE();
            // Restaurar conteúdo após reinicialização
            setTimeout(() => {
                const newEditor = tinymce.get('editor-container');
                if (newEditor) {
                    newEditor.setContent(content);
                }
            }, 100);
        }
    });

    observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-theme']
    });
});