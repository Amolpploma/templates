console.log('Arquivo editor-resizer.js carregado');

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded disparado'); // Log para verificar se o evento está sendo disparado

    const editorContainer = document.getElementById('editor-container');
    const resizer = document.getElementById('editor-resizer');
    const textareaEditor = document.querySelector('.textarea-editor');
    const panel = document.querySelector('.editor-panel');

    // Log para confirmar se os elementos foram encontrados
    console.log("Elementos carregados:", { editorContainer, resizer, textareaEditor, panel });

    if (!editorContainer || !resizer || !textareaEditor || !panel) {
        console.error("Um ou mais elementos não foram encontrados.");
        return;
    }
    
    let isResizing = false;
    let startY;
    let startHeights;

    resizer.addEventListener('mousedown', (e) => {
        e.preventDefault();
        isResizing = true;
        startY = e.clientY;
        
        // Capturar alturas iniciais
        startHeights = {
            editor: editorContainer.offsetHeight,
            textarea: textareaEditor.offsetHeight
        };

        // Adicionar classe global para controlar o cursor
        document.body.classList.add('resizing');
        
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });

    function onMouseMove(e) {
        if (!isResizing) return;

        const dy = e.clientY - startY;
        
        // Calcular novas alturas mantendo as proporções
        const newEditorHeight = Math.max(100, startHeights.editor + dy);
        const newTextareaHeight = Math.max(100, startHeights.textarea - dy);

        // Aplicar novas alturas
        editorContainer.style.height = `${newEditorHeight}px`;
        textareaEditor.style.height = `${newTextareaHeight}px`;
    }

    function onMouseUp() {
        isResizing = false;
        document.body.classList.remove('resizing');
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
    }
});
