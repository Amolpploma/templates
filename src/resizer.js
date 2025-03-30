document.addEventListener('DOMContentLoaded', () => {
    const resizerLeft = document.getElementById('resizer-left');
    const resizerRight = document.getElementById('resizer-right');
    const leftPanel = document.querySelector('.left-panel');
    const editorPanel = document.querySelector('.editor-panel');
    const rightPanel = document.querySelector('.right-panel');
    const container = document.querySelector('.container');

    let isResizing = false;
    let currentResizer = null;
    let startX;
    let startWidths = {};
    let containerWidth = 0;

    // Configuração dos tamanhos mínimos e máximos (em pixels)
    const minSizes = {
        left: 225,
        editor: 428,
        right: 315
    };

    const maxSizes = {
        left: 400,
        right: 500
    };

    function initResize(e) {
        isResizing = true;
        currentResizer = e.target;
        startX = e.clientX;
        containerWidth = container.offsetWidth;

        // Capturar larguras iniciais de todos os painéis
        startWidths = {
            left: leftPanel ? leftPanel.offsetWidth : 0,
            editor: editorPanel ? editorPanel.offsetWidth : 0,
            right: rightPanel ? rightPanel.offsetWidth : 0
        };

        // Adicionar classes para prevenir seleção
        document.body.classList.add('resizing');
        currentResizer.classList.add('dragging');

        document.addEventListener('mousemove', resize);
        document.addEventListener('mouseup', stopResize);
        
        // Prevenir comportamento padrão
        e.preventDefault();
    }

    function resize(e) {
        if (!isResizing) return;

        const diff = e.clientX - startX;
        
        if (currentResizer.id === 'resizer-left' && leftPanel && editorPanel) {
            // Calcular novas larguras propostas
            let newLeftWidth = startWidths.left + diff;
            
            // Aplicar limites mínimos e máximos ao painel esquerdo
            newLeftWidth = Math.max(minSizes.left, Math.min(maxSizes.left, newLeftWidth));
            
            // Calcular quanto realmente mudou
            const actualDiff = newLeftWidth - startWidths.left;
            
            // Ajustar apenas o painel do editor, mantendo o direito inalterado
            const newEditorWidth = startWidths.editor - actualDiff;
            
            // Verificar se o editor não ficaria abaixo do tamanho mínimo
            if (newEditorWidth >= minSizes.editor) {
                leftPanel.style.width = `${newLeftWidth}px`;
                editorPanel.style.width = `${newEditorWidth}px`;
            }
        } 
        else if (currentResizer.id === 'resizer-right' && editorPanel && rightPanel) {
            // Este é o resize entre editor e painel direito
            let newRightWidth = startWidths.right - diff;
            
            // Aplicar limites mínimos e máximos ao painel direito
            newRightWidth = Math.max(minSizes.right, Math.min(maxSizes.right, newRightWidth));
            
            // Calcular quanto realmente mudou
            const actualDiff = startWidths.right - newRightWidth;
            
            // Ajustar apenas o painel do editor, mantendo o esquerdo inalterado
            const newEditorWidth = startWidths.editor + actualDiff;
            
            // Verificar se o editor não ficaria abaixo do tamanho mínimo
            if (newEditorWidth >= minSizes.editor) {
                rightPanel.style.width = `${newRightWidth}px`;
                editorPanel.style.width = `${newEditorWidth}px`;
            }
        }
    }

    function stopResize() {
        isResizing = false;
        if (currentResizer) {
            currentResizer.classList.remove('dragging');
        }
        
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
