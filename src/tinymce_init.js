tinymce.init({
    selector: '#editor-container',
    skin: 'oxide',
    content_css: 'default',
    plugins: ['wordcount'
    ],
    menubar: false,
    statusbar: true,
    elementpath: false,
    toolbar: 'undo redo styles bold italic alignleft aligncenter alignright alignjustify | bullist numlist outdent indent',
    license_key: 'gpl'
});