console.log('Arquivo editor-resizer.js carregado');

document.addEventListener('DOMContentLoaded', () => {
    const panel = document.querySelector('.editor-panel');
    const toolbar = document.querySelector('.ql-toolbar.ql-snow');
    const editorContainer = document.getElementById('editor-container');
    const resizer = document.getElementById('editor-resizer');
    const textareaEditor = document.querySelector('.textarea-editor');

    if (!panel || !toolbar || !editorContainer || !resizer || !textareaEditor) {
        console.error("Um ou mais elementos não foram encontrados.");
        return;
    }

    function getUsablePanelHeight() {
        const panelHeight = panel.offsetHeight;
        const toolbarHeight = toolbar.offsetHeight;
        const resizerHeight = resizer.offsetHeight;
        
        // Altura total disponível após subtrair toolbar e resizer
        const availableHeight = panelHeight - toolbarHeight - resizerHeight;
        
        console.log('Medidas reais:', {
            panel: panelHeight,
            toolbar: toolbarHeight,
            resizer: resizerHeight,
            available: availableHeight
        });
        
        return availableHeight;
    }

    function adjustHeights(editorHeight = null) {
        // Configurar panel como flex container
        panel.style.display = 'flex';
        panel.style.flexDirection = 'column';
        panel.style.height = '100%';
        panel.style.overflow = 'hidden';

        // Remover margens que possam interferir
        toolbar.style.margin = '0';
        resizer.style.margin = '0';
        editorContainer.style.margin = '0';
        textareaEditor.style.margin = '0';

        const availableHeight = getUsablePanelHeight();
        
        if (editorHeight === null) {
            // Divisão inicial igual
            editorHeight = Math.floor(availableHeight / 2);
        } else {
            // Durante o drag, garantir limites mínimo e máximo
            const minHeight = 50;
            const maxHeight = availableHeight - minHeight;
            editorHeight = Math.max(minHeight, Math.min(editorHeight, maxHeight));
        }

        // Calcular altura da textarea
        const textareaHeight = availableHeight - editorHeight;

        // Aplicar alturas sem definir minHeight
        editorContainer.style.height = `${editorHeight}px`;
        textareaEditor.style.height = `${textareaHeight}px`;
        
        // Remover propriedades que possam interferir
        editorContainer.style.removeProperty('min-height');
        textareaEditor.style.removeProperty('min-height');
        
        console.log('Alturas ajustadas:', {
            available: availableHeight,
            editor: editorHeight,
            textarea: textareaHeight
        });
    }

    let isDragging = false;
    let startY;
    let startEditorHeight;

    function onMouseMove(e) {
        if (!isDragging) return;
        
        const editorRect = editorContainer.getBoundingClientRect();
        const panelRect = panel.getBoundingClientRect();
        const availableHeight = panelRect.height - toolbar.offsetHeight - resizer.offsetHeight;
        
        // Calcular nova altura baseada na posição do mouse relativa ao painel
        const mouseY = e.clientY - panelRect.top - toolbar.offsetHeight;
        const newEditorHeight = Math.max(50, Math.min(mouseY, availableHeight - 50));
        
        // Aplicar as alturas diretamente
        editorContainer.style.height = `${newEditorHeight}px`;
        textareaEditor.style.height = `${availableHeight - newEditorHeight}px`;
        
        console.log('Resize:', {
            mouseY,
            newEditorHeight,
            availableHeight
        });
    }

    function onMouseUp() {
        isDragging = false;
        document.body.classList.remove('resizing');
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
    }

    resizer.addEventListener('mousedown', (e) => {
        e.preventDefault();
        isDragging = true;
        startY = e.clientY;
        startEditorHeight = editorContainer.offsetHeight;

        document.body.classList.add('resizing');

        // Adicionar os listeners no documento
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });

    // Garantir que o ajuste inicial aconteça após todos os elementos estarem renderizados
    window.requestAnimationFrame(() => {
        adjustHeights();
    });

    // Ajustar quando a janela for redimensionada
    window.addEventListener('resize', () => {
        window.requestAnimationFrame(() => {
            adjustHeights();
        });
    });
});
