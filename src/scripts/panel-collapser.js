/**
 * Script para gerenciar a funcionalidade de colapsar/expandir painéis laterais
 */
document.addEventListener('DOMContentLoaded', () => {
    const leftPanel = document.querySelector('.left-panel');
    const rightPanel = document.querySelector('.right-panel');
    const editorPanel = document.querySelector('.editor-panel');
    const resizerLeft = document.getElementById('resizer-left');
    const resizerRight = document.getElementById('resizer-right');
    
    // Identificar a página atual
    const isSearchPage = !document.body.hasAttribute('data-page');
    const isEditorPage = document.body.getAttribute('data-page') === 'editor';
    const pagePrefix = isSearchPage ? 'search_' : (isEditorPage ? 'editor_' : '');
    
    // Chaves localStorage específicas por página
    const LEFT_PANEL_KEY = `${pagePrefix}leftPanelCollapsed`;
    const RIGHT_PANEL_KEY = `${pagePrefix}rightPanelCollapsed`;
    
    // Adicionar botões de expansão aos painéis colapsáveis - modificado para garantir visibilidade
    if (leftPanel) {
        // Remover qualquer botão de expansão existente para evitar duplicação
        const existingBtn = leftPanel.querySelector('.panel-expand-btn');
        if (existingBtn) {
            existingBtn.remove();
        }
        
        const expandBtn = document.createElement('button');
        expandBtn.className = 'panel-expand-btn';
        expandBtn.id = 'left-expand-btn'; // ID específico para facilitar depuração
        expandBtn.title = 'Expandir painel';
        expandBtn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"></path></svg>';
        expandBtn.setAttribute('data-target', 'left');
        leftPanel.appendChild(expandBtn);
        
        console.log('Botão de expansão esquerdo adicionado:', expandBtn);
    }
    
    if (rightPanel) {
        // Remover qualquer botão de expansão existente para evitar duplicação
        const existingBtn = rightPanel.querySelector('.panel-expand-btn');
        if (existingBtn) {
            existingBtn.remove();
        }
        
        const expandBtn = document.createElement('button');
        expandBtn.className = 'panel-expand-btn';
        expandBtn.id = 'right-expand-btn'; // ID específico para facilitar depuração
        expandBtn.title = 'Expandir painel';
        expandBtn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z"></path></svg>';
        expandBtn.setAttribute('data-target', 'right');
        rightPanel.appendChild(expandBtn);
        
        console.log('Botão de expansão direito adicionado:', expandBtn);
    }
    
    // Função para colapsar/expandir painel esquerdo
    function toggleLeftPanel() {
        if (!leftPanel) return;
        
        const isCollapsed = leftPanel.classList.toggle('collapsed');
        localStorage.setItem(LEFT_PANEL_KEY, isCollapsed ? 'true' : 'false');
        
        // Desabilitar resizer quando colapsado
        if (resizerLeft) {
            resizerLeft.classList.toggle('disabled', isCollapsed);
        }
        
        // Ajustar largura do editor
        recalculateLayout();
    }
    
    // Função para colapsar/expandir painel direito
    function toggleRightPanel() {
        if (!rightPanel) return;
        
        const isCollapsed = rightPanel.classList.toggle('collapsed');
        localStorage.setItem(RIGHT_PANEL_KEY, isCollapsed ? 'true' : 'false');
        
        // Desabilitar resizer quando colapsado
        if (resizerRight) {
            resizerRight.classList.toggle('disabled', isCollapsed);
        }
        
        // Ajustar largura do editor
        recalculateLayout();
    }
    
    // Função para recalcular layout do editor
    function recalculateLayout() {
        if (!editorPanel) return;
        
        const containerWidth = document.querySelector('.container').offsetWidth;
        const leftWidth = leftPanel ? (leftPanel.classList.contains('collapsed') ? 30 : leftPanel.offsetWidth) : 0;
        const rightWidth = rightPanel ? (rightPanel.classList.contains('collapsed') ? 30 : rightPanel.offsetWidth) : 0;
        
        editorPanel.style.width = `${containerWidth - leftWidth - rightWidth}px`;
        
        // Se o TinyMCE estiver inicializado, forçar redimensionamento
        if (window.tinymce && tinymce.activeEditor) {
            tinymce.activeEditor.execCommand('mceAutoResize');
        }
    }
    
    // Event listeners para botões de colapso
    document.querySelectorAll('.collapse-panel-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.getAttribute('data-target');
            if (target === 'left') toggleLeftPanel();
            else if (target === 'right') toggleRightPanel();
        });
    });
    
    // Event listeners para botões de expansão
    document.querySelectorAll('.panel-expand-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.getAttribute('data-target');
            if (target === 'left') toggleLeftPanel();
            else if (target === 'right') toggleRightPanel();
        });
    });
    
    // Restaurar estado dos painéis do localStorage e garantir visibilidade dos botões
    function restorePanelStates() {
        // Painel esquerdo
        if (leftPanel && localStorage.getItem(LEFT_PANEL_KEY) === 'true') {
            leftPanel.classList.add('collapsed');
            if (resizerLeft) resizerLeft.classList.add('disabled');
        }
        
        // Painel direito
        if (rightPanel && localStorage.getItem(RIGHT_PANEL_KEY) === 'true') {
            rightPanel.classList.add('collapsed');
            if (resizerRight) resizerRight.classList.add('disabled');
        }
        
        // Recalcular layout inicial
        recalculateLayout();
        
        // Verificar se os botões de expansão estão corretamente visíveis
        setTimeout(() => {
            if (leftPanel && leftPanel.classList.contains('collapsed')) {
                const leftBtn = document.getElementById('left-expand-btn');
                if (leftBtn) {
                    console.log('Botão de expansão esquerdo após colapso:', 
                                getComputedStyle(leftBtn).display);
                }
            }
            
            if (rightPanel && rightPanel.classList.contains('collapsed')) {
                const rightBtn = document.getElementById('right-expand-btn');
                if (rightBtn) {
                    console.log('Botão de expansão direito após colapso:', 
                                getComputedStyle(rightBtn).display);
                }
            }
        }, 100);
    }
    
    // Restaurar estados no carregamento
    restorePanelStates();
    
    // Recalcular layout quando a janela for redimensionada
    window.addEventListener('resize', recalculateLayout);
});
