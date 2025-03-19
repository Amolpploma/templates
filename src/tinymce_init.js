document.addEventListener('DOMContentLoaded', () => {
    const theme = document.documentElement.getAttribute('data-theme');
    const isDarkTheme = theme === 'dark';

    function initTinyMCE() {
        const isSearchPage = !document.body.hasAttribute('data-page');
        const defaultPlugins = ['wordcount', 'lists', 'searchreplace', 'charmap'];
        const defaultToolbar = 'fontfamily fontsize | bold italic underline | alignjustify aligncenter align lineheight | outdent indent | selectall copy undo redo searchreplace | numlist bullist | forecolor backcolor | removeformat charmap';
        
        const config = {
            selector: '#editor-container',
            skin: isDarkTheme ? 'oxide-dark' : 'oxide',
            content_css: isDarkTheme ? 'dark' : 'default',
            plugins: defaultPlugins,
            menubar: false,
            statusbar: true,
            elementpath: false,
            toolbar: isSearchPage ? `${defaultToolbar} | editnewmodel` : defaultToolbar,
            content_style: 'body { font-family:times new roman,times; font-size:12pt }',
            readonly: false, // Remover readonly global
            license_key: 'gpl',
            setup: function(editor) {
                if (isSearchPage) {
                    editor.ui.registry.addButton('editnewmodel', {
                        text: 'Editar novo modelo',
                        tooltip: 'Transferir conteúdo para página de edição',
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

    initTinyMCE();

    // Adicionar listener para mudança de tema
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.attributeName === 'data-theme') {
                const newTheme = document.documentElement.getAttribute('data-theme');
                const editor = tinymce.get('editor-container');
                if (editor) {
                    editor.destroy();
                    initTinyMCE();
                }
            }
        });
    });

    observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-theme']
    });
});