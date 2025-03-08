document.addEventListener('DOMContentLoaded', () => {
    const theme = document.documentElement.getAttribute('data-theme');
    const isDarkTheme = theme === 'dark';

    // Configurações de cores personalizadas para tema escuro
    const darkThemeOverrides = `
        body.mce-content-body {
            background-color: #1e1e1e !important;
            color: #cccccc !important;
        }
        .mce-content-body[data-mce-selected="inline-boundary"] {
            background-color: #2d2d2d !important;
        }
    `;

    tinymce.init({
        selector: '#editor-container',
        skin: isDarkTheme ? 'oxide-dark' : 'oxide',
        content_css: isDarkTheme ? 'dark' : 'default',
        plugins: ['wordcount', 'lists', 'searchreplace', 'charmap',
        ],
        menubar: false,
        statusbar: true,
        elementpath: false,
        toolbar: "charmap | undo redo selectall copy| searchreplace | numlist bullist | fontfamily fontsize | bold italic underline | align outdent indent| lineheight | forecolor backcolor removeformat",
        content_style: isDarkTheme 
            ? `body { font-family:times new roman,times; font-size:14px } ${darkThemeOverrides}`
            : 'body { font-family:times new roman,times; font-size:14px }',
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
                        toolbar: "charmap | undo redo selectall copy| searchreplace | numlist bullist | fontfamily fontsize | bold italic underline | align outdent indent| lineheight | forecolor backcolor removeformat",
                        content_style: newTheme === 'dark'
                            ? `body { font-family:times new roman,times; font-size:14px } ${darkThemeOverrides}`
                            : 'body { font-family:times new roman,times; font-size:14px }',
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