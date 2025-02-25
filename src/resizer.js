const resizer = document.getElementById('resizer');
const leftPanel = document.querySelector('.left-panel');
const rightPanel = document.querySelector('.right-panel');

let isResizing = false;
let startX;
let leftWidth;

resizer.addEventListener('mousedown', initResize);

function initResize(e) {
    isResizing = true;
    startX = e.clientX;
    leftWidth = leftPanel.offsetWidth;
    
    resizer.classList.add('dragging');
    
    document.addEventListener('mousemove', resize);
    document.addEventListener('mouseup', stopResize);
}

function resize(e) {
    if (!isResizing) return;
    
    const diff = e.clientX - startX;
    const newLeftWidth = leftWidth + diff;
    const containerWidth = leftPanel.parentNode.offsetWidth;
    const resizerWidth = resizer.offsetWidth;
    
    if (newLeftWidth > 100 && newLeftWidth < containerWidth - 100 - resizerWidth) {
        leftPanel.style.width = `${newLeftWidth}px`;
        rightPanel.style.width = `${containerWidth - newLeftWidth - resizerWidth}px`;
    }
}

function stopResize() {
    isResizing = false;
    resizer.classList.remove('dragging');
    document.removeEventListener('mousemove', resize);
    document.removeEventListener('mouseup', stopResize);
}
