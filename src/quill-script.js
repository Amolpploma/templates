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
                    [{ 'indent': '-1'}, { 'indent': '+1' }],
                    [{ 'size': ['small', false, 'large', 'huge'] }],
                    [{ 'font': [] }],
                    [{ 'align': [] }],
                    ['clean']
                ],
                history: {
                    delay: 2000,
                    maxStack: 500,
                    userOnly: true
                  }
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