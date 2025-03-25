document.addEventListener('DOMContentLoaded', () => {
    const theme = document.documentElement.getAttribute('data-theme');
    const isDarkTheme = theme === 'dark';

    function initTinyMCE() {
        const theme = document.documentElement.getAttribute('data-theme');
        const isDarkTheme = theme === 'dark';
        const isSearchPage = !document.body.hasAttribute('data-page');
        const defaultPlugins = ['wordcount', 'lists', 'searchreplace', 'charmap']; // Remover 'hr'
        const defaultToolbar = 'fontfamily fontsize bold italic underline | alignjustify aligncenter align lineheight | outdent indent | selectall copy undo redo searchreplace | numlist bullist | forecolor backcolor | removeformat charmap'; // Remover 'hr'
        
        const config = {
            selector: '#editor-container',
            skin: isDarkTheme ? 'oxide-dark' : 'oxide',
            content_css: isDarkTheme ? 'dark' : 'default',
            plugins: defaultPlugins,
            menubar: false,
            statusbar: true,
            elementpath: false,
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
                }

                /* Estilização da barra de rolagem */
                ::-webkit-scrollbar {
                    width: 8px !important;
                    height: 8px !important;
                    background: transparent !important;
                }
                
                ::-webkit-scrollbar-thumb {
                    background-color: ${isDarkTheme ? '#404040' : '#c1c1c1'} !important;
                }
                
                ::-webkit-scrollbar-thumb:hover {
                    background-color: ${isDarkTheme ? '#666666' : '#a8a8a8'} !important;
                }
                
                * { 
                    transition: none !important;
                }
            `,
            readonly: false, // Remover readonly global
            license_key: 'gpl',
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
            }
        };

        tinymce.init(config);
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