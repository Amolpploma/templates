document.addEventListener('DOMContentLoaded', () => {
    const resizerLeft = document.getElementById('resizer-left');
    const resizerRight = document.getElementById('resizer-right');
    const leftPanel = document.querySelector('.left-panel');
    const editorPanel = document.querySelector('.editor-panel');
    const rightPanel = document.querySelector('.right-panel');

    let isResizing = false;
    let currentResizer = null;
    let startX;
    let startWidths = {};

    function initResize(e) {
        isResizing = true;
        currentResizer = e.target;
        startX = e.clientX;

        // Adicionar classes para prevenir seleção
        document.body.classList.add('resizing');
        currentResizer.classList.add('dragging');

        // Inicializar larguras apenas para os painéis que existem
        startWidths = {};
        
        if (leftPanel) startWidths.left = leftPanel.offsetWidth;
        if (editorPanel) startWidths.editor = editorPanel.offsetWidth;
        if (rightPanel) startWidths.right = rightPanel.offsetWidth;

        document.addEventListener('mousemove', resize);
        document.addEventListener('mouseup', stopResize);
        
        // Prevenir comportamento padrão
        e.preventDefault();
    }

    function resize(e) {
        if (!isResizing) return;

        const diff = e.clientX - startX;

        if (currentResizer.id === 'resizer-left' && leftPanel && editorPanel) {
            const newLeftWidth = startWidths.left + diff;
            const newEditorWidth = startWidths.editor - diff;
            if (newLeftWidth > 200 && newEditorWidth > 200) {
                leftPanel.style.width = `${newLeftWidth}px`;
                editorPanel.style.width = `${newEditorWidth}px`;
            }
        } else if (currentResizer.id === 'resizer-right' && editorPanel && rightPanel) {
            const newEditorWidth = startWidths.editor + diff;
            const newRightWidth = startWidths.right - diff;
            if (newEditorWidth > 200 && newRightWidth > 200) {
                editorPanel.style.width = `${newEditorWidth}px`;
                rightPanel.style.width = `${newRightWidth}px`;
            }
        }
    }

    function stopResize() {
        isResizing = false;
        if (currentResizer) {
            currentResizer.classList.remove('dragging');
        }
        
        // Remover classes de prevenção de seleção
        document.body.classList.remove('resizing');
        
        document.removeEventListener('mousemove', resize);
        document.removeEventListener('mouseup', stopResize);
    }

    // Adicionar listeners apenas se os elementos existirem
    if (resizerLeft && leftPanel) {
        resizerLeft.addEventListener('mousedown', initResize);
    }

    if (resizerRight && rightPanel) {
        resizerRight.addEventListener('mousedown', initResize);
    }
});

function initializeResizers() {
    // Setup do resizer esquerdo (se existir)
    const resizerLeft = document.getElementById('resizer-left');
    if (resizerLeft) {
        const leftPanel = resizerLeft.previousElementSibling;
        setupResizer(resizerLeft, leftPanel, 'width', 200);
    }

    // Setup do resizer direito (sempre presente)
    const resizerRight = document.getElementById('resizer-right');
    if (resizerRight) {
        const rightPanel = resizerRight.nextElementSibling;
        setupResizer(resizerRight, rightPanel, 'width', 200);
    }
}

function setupResizer(resizer, panel, dimension, minSize) {
    if (!resizer || !panel) return; // Proteção extra

    let x = 0;
    let panelSize = 0;

    function mouseDownHandler(e) {
        x = e.clientX;
        panelSize = parseInt(getComputedStyle(panel)[dimension], 10);

        document.addEventListener('mousemove', mouseMoveHandler);
        document.addEventListener('mouseup', mouseUpHandler);

        resizer.classList.add('resizing');
    }

    /* ...existing code... */
}

// Inicializar os resizers quando o documento estiver pronto
document.addEventListener('DOMContentLoaded', initializeResizers);

/* ...existing code... */
