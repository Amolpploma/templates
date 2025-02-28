document.addEventListener('DOMContentLoaded', async () => {
    try {
        if (!window.QuillEditor) {
            throw new Error('QuillEditor não está disponível');
        }
        
        const quill = await window.QuillEditor.createEditor('#editor-container', {
            theme: 'snow',
            modules: {
                toolbar: [
                    ['bold', 'italic', 'underline'],
                    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                    [{ 'color': [] }, { 'background': [] }]
                ]
            }
        });
        
        window.quill = quill;
        console.log('Quill inicializado com sucesso!');
    } catch (error) {
        console.error('Erro ao inicializar Quill:', error);
    }
});

// Integração com o processo principal do Electron
//const { ipcRenderer } = require('electron');

// Exemplo: Enviar conteúdo para salvar
function saveContent() {
    const content = quill.root.innerHTML;
    ipcRenderer.send('save-content', content);
}