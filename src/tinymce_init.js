document.addEventListener('DOMContentLoaded', () => {
    const theme = document.documentElement.getAttribute('data-theme');
    const isDarkTheme = theme === 'dark';

    tinymce.init({
        selector: '#editor-container',
        skin: isDarkTheme ? 'oxide-dark' : 'oxide',
        content_css: isDarkTheme ? 'dark' : 'default',
        plugins: ['wordcount', 'lists', 'searchreplace', 'charmap',
        ],
        menubar: false,
        statusbar: true,
        elementpath: false,
        toolbar: "fontfamily fontsize | bold italic underline | alignjustify aligncenter align lineheight | outdent indent | selectall copy undo redo searchreplace | numlist bullist | forecolor backcolor | removeformat charmap",
        content_style:'body { font-family:times new roman,times; font-size:12pt }',
        license_key: 'gpl'
    });

    // Adicionar listener para mudança de tema
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.attributeName === 'data-theme') {
                const newTheme = document.documentElement.getAttribute('data-theme');
                const editor = tinymce.get('editor-container');
                if (editor) {
                    editor.destroy();
                    tinymce.init({
                        selector: '#editor-container',
                        skin: newTheme === 'dark' ? 'oxide-dark' : 'oxide',
                        content_css: newTheme === 'dark' ? 'dark' : 'default',
                        plugins: ['wordcount', 'lists', 'searchreplace', 'charmap',
                        ],
                        menubar: false,
                        statusbar: true,
                        elementpath: false,
                        toolbar: "fontfamily fontsize | bold italic underline | alignjustify aligncenter align lineheight | outdent indent | selectall copy undo redo searchreplace | numlist bullist | forecolor backcolor | removeformat charmap",
                        content_style: 'body { font-family:times new roman,times; font-size:12pt }',
                        license_key: 'gpl'
                    });
                }
            }
        });
    });

    observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-theme']
    });
});