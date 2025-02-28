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
    
    let isResizing = false, startY = 0, startEditorHeight = 0;
    const minHeight = 100; // altura mínima em px para cada área
    const panelHeight = panel ? panel.offsetHeight : 0; // altura total do painel

    resizer.addEventListener('mousedown', (e) => {
        e.preventDefault(); // Impede seleção de texto
        isResizing = true;
        startY = e.pageY;
        startEditorHeight = editorContainer.getBoundingClientRect().height;
        panel.style.userSelect = 'none';
        console.log('Início do resize', { startY, startEditorHeight, panelHeight });
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });

    function onMouseMove(e) {
        if (!isResizing) return;
        const dy = e.pageY - startY;
        let newEditorHeight = Math.max(minHeight, Math.min(startEditorHeight + dy, panelHeight - minHeight - resizer.offsetHeight));
        editorContainer.style.height = `${newEditorHeight}px`;
        let newTextareaHeight = panelHeight - newEditorHeight - resizer.offsetHeight;
        textareaEditor.style.height = `${newTextareaHeight}px`;
        console.log('Resizing', { dy, newEditorHeight, newTextareaHeight });
    }

    function onMouseUp() {
        isResizing = false;
        panel.style.userSelect = '';
        console.log('Fim do resize');
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
    }
});
