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

        // Remover margens e paddings que possam interferir
        toolbar.style.margin = '0';
        resizer.style.margin = '0';
        editorContainer.style.margin = '0';
        textareaEditor.style.margin = '0';

        const availableHeight = getUsablePanelHeight();
        
        if (editorHeight === null) {
            // Divisão inicial exata
            editorHeight = Math.floor(availableHeight / 2);
        }

        // Limites de altura
        const minHeight = 50;
        editorHeight = Math.max(minHeight, Math.min(editorHeight, availableHeight - minHeight));
        
        // Calcular altura da textarea garantindo que soma seja exata
        const textareaHeight = availableHeight - editorHeight;

        // Aplicar alturas e garantir que elementos ocupem espaço corretamente
        editorContainer.style.height = `${editorHeight}px`;
        editorContainer.style.minHeight = `${editorHeight}px`;
        editorContainer.style.flexShrink = '0';
        
        textareaEditor.style.height = `${textareaHeight}px`;
        textareaEditor.style.minHeight = `${textareaHeight}px`;
        textareaEditor.style.flexShrink = '0';
        
        console.log('Alturas definidas:', {
            available: availableHeight,
            editor: editorHeight,
            textarea: textareaHeight,
            total: editorHeight + textareaHeight
        });
    }

    let isDragging = false;
    let startY;
    let startEditorHeight;

    resizer.addEventListener('mousedown', (e) => {
        isDragging = true;
        startY = e.clientY;
        startEditorHeight = editorContainer.getBoundingClientRect().height;
        document.body.classList.add('resizing');
        
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });

    function onMouseMove(e) {
        if (!isDragging) return;
        const dy = e.clientY - startY;
        const newEditorHeight = startEditorHeight + dy;
        adjustHeights(newEditorHeight);
    }

    function onMouseUp() {
        isDragging = false;
        document.body.classList.remove('resizing');
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
    }

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
