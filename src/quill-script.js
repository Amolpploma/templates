document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Configuração do Quill com fontes explícitas
        const quill = new Quill('#editor-container', {
            theme: 'snow',
            modules: {
                toolbar: [
                    ['bold', 'italic', 'underline'],
                    [{ 'indent': '-1'}, { 'indent': '+1' }],
                    [{ 'size': ['small', false, 'large', 'huge'] }],
                    [{ 'font': [] }],
                    [{ 'align': [] }],
                    ['clean']
                ]
            },
            formats: ['bold', 'italic', 'underline', 'indent', 'size', 'font', 'align'],
            defaultStyle: {
                'font-family': 'inherit'
            }
        });

        // Sobrescrever o comportamento padrão dos formatos
        const formats = ['bold', 'italic', 'underline'];
        formats.forEach(format => {
            quill.format(format, true, 'user');
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