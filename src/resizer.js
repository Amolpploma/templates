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
        startWidths = {
            left: leftPanel.offsetWidth,
            editor: editorPanel.offsetWidth,
            right: rightPanel.offsetWidth
        };
        currentResizer.classList.add('dragging');
        document.addEventListener('mousemove', resize);
        document.addEventListener('mouseup', stopResize);
    }

    function resize(e) {
        if (!isResizing) return;
        const diff = e.clientX - startX;
        if (currentResizer.id === 'resizer-left') {
            const newLeftWidth = startWidths.left + diff;
            const newEditorWidth = startWidths.editor - diff;
            if (newLeftWidth > 200 && newEditorWidth > 200) {
                leftPanel.style.width = `${newLeftWidth}px`;
                editorPanel.style.width = `${newEditorWidth}px`;
            }
        } else {
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
        currentResizer?.classList.remove('dragging');
        document.removeEventListener('mousemove', resize);
        document.removeEventListener('mouseup', stopResize);
    }

    if (resizerLeft) {
        resizerLeft.addEventListener('mousedown', initResize);
    } else {
        console.error('Elemento "resizer-left" não encontrado.');
    }

    if (resizerRight) {
        resizerRight.addEventListener('mousedown', initResize);
    } else {
        console.error('Elemento "resizer-right" não encontrado.');
    }
});
