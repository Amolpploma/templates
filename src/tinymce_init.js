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
            toolbar: isSearchPage ? `editnewmodel|${defaultToolbar}` : defaultToolbar,
            content_style: 'body { font-family:times new roman,times; font-size:12pt }',
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