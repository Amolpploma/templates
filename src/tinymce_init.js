tinymce.init({
    selector: '#editor-container',
    skin: 'oxide',
    content_css: 'default',
    plugins: ['wordcount', 'lists', 'searchreplace', 'charmap',
    ],
    menubar: false,
    statusbar: true,
    elementpath: false,
    toolbar: "charmap | undo redo selectall copy| searchreplace | numlist bullist | fontfamily fontsize | bold italic underline | align outdent indent| lineheight | forecolor backcolor removeformat",
    license_key: 'gpl'
});