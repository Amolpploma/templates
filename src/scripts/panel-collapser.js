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
    
    // Função para recalcular layout do editor - modificada para evitar erros de inicialização
    function recalculateLayout() {
        if (!editorPanel) return;
        
        const containerWidth = document.querySelector('.container').offsetWidth;
        const leftWidth = leftPanel ? (leftPanel.classList.contains('collapsed') ? 30 : leftPanel.offsetWidth) : 0;
        const rightWidth = rightPanel ? (rightPanel.classList.contains('collapsed') ? 30 : rightPanel.offsetWidth) : 0;
        
        editorPanel.style.width = `${containerWidth - leftWidth - rightWidth}px`;
        
        // Verificar se o TinyMCE está inicializado e pronto para receber comandos
        if (window.tinymce && tinymce.activeEditor && tinymce.activeEditor.initialized) {
            try {
                // Usar um método mais seguro para redimensionar - dispara o evento mas não tenta manipular a seleção
                tinymce.activeEditor.fire('ResizeEditor');
                
                // Apenas se o editor tiver um estado de seleção válido, executar mceAutoResize
                if (tinymce.activeEditor.selection && tinymce.activeEditor.selection.getContent() !== null) {
                    setTimeout(() => {
                        try {
                            tinymce.activeEditor.execCommand('mceAutoResize');
                        } catch(e) {
                            console.log('Aviso: Não foi possível redimensionar o editor, mas isso não é um erro crítico.');
                        }
                    }, 100);
                }
            } catch(e) {
                console.log('Aviso: TinyMCE não está completamente inicializado para redimensionamento.');
            }
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
        const leftCollapsed = localStorage.getItem(LEFT_PANEL_KEY) === 'true';
        const rightCollapsed = localStorage.getItem(RIGHT_PANEL_KEY) === 'true';
        
        // Ajustar estados dos painéis conforme localStorage (sem transições)
        if (leftPanel) {
            // Apenas adicionar classe se ainda não foi adicionada pelo preload
            if (leftCollapsed && !leftPanel.classList.contains('collapsed')) {
                leftPanel.classList.add('collapsed');
            }
            
            if (resizerLeft) {
                resizerLeft.classList.toggle('disabled', leftCollapsed);
            }
            
            // Remover classe do HTML - o painel específico já tem a classe agora
            document.documentElement.classList.remove('left-panel-collapsed');
        }
        
        if (rightPanel) {
            // Apenas adicionar classe se ainda não foi adicionada pelo preload
            if (rightCollapsed && !rightPanel.classList.contains('collapsed')) {
                rightPanel.classList.add('collapsed');
            }
            
            if (resizerRight) {
                resizerRight.classList.toggle('disabled', rightCollapsed);
            }
            
            // Remover classe do HTML - o painel específico já tem a classe agora
            document.documentElement.classList.remove('right-panel-collapsed');
        }
        
        // Mostrar o conteúdo do painel novamente (que estava oculto no preload)
        if (leftPanel) {
            Array.from(leftPanel.children).forEach(child => {
                child.style.opacity = '';
            });
        }
        
        if (rightPanel) {
            Array.from(rightPanel.children).forEach(child => {
                child.style.opacity = '';
            });
        }
        
        // Recalcular layout com delay para garantir que as dimensões foram aplicadas
        setTimeout(recalculateLayout, 0);
    }
    
    // Restaurar estados no carregamento
    restorePanelStates();
    
    // Recalcular layout quando a janela for redimensionada
    window.addEventListener('resize', recalculateLayout);
});
