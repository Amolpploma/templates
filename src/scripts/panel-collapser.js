/**
 * Script para gerenciar a funcionalidade de colapsar/expandir painéis laterais
 */
document.addEventListener('DOMContentLoaded', () => {
    // Remover estilos críticos - isso deve ser feito depois de criar os botões
    // para evitar problemas de visibilidade
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
    
    // IMPORTANTE: Criar os botões imediatamente, antes de qualquer outra operação
    createExpandButtons();
    
    // Agora podemos remover os estilos críticos
    const criticalLeftStyle = document.getElementById('critical-panel-styles-left');
    const criticalRightStyle = document.getElementById('critical-panel-styles-right');
    
    if (criticalLeftStyle) criticalLeftStyle.remove();
    if (criticalRightStyle) criticalRightStyle.remove();
    
    // Função para criar botões de expansão com estilos inline para garantir visibilidade
    function createExpandButtons() {
        console.log('Criando botões de expansão');
        
        // Criar botão para o painel esquerdo
        if (leftPanel) {
            // Remover qualquer botão existente para evitar duplicação
            const existingBtn = leftPanel.querySelector('.panel-expand-btn');
            if (existingBtn) existingBtn.remove();
            
            const expandBtn = document.createElement('button');
            expandBtn.className = 'panel-expand-btn';
            expandBtn.id = 'left-expand-btn';
            expandBtn.title = 'Expandir painel';
            expandBtn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"></path></svg>';
            expandBtn.setAttribute('data-target', 'left');
            
            // Aplicar estilos inline para garantir visibilidade mesmo antes do CSS ser carregado
            expandBtn.style.position = 'absolute';
            expandBtn.style.top = '50%';
            expandBtn.style.left = '50%';
            expandBtn.style.transform = 'translate(-50%, -50%)';
            expandBtn.style.width = '24px';
            expandBtn.style.height = '24px';
            expandBtn.style.zIndex = '2000';
            expandBtn.style.background = 'var(--bg-element, #ffffff)';
            expandBtn.style.border = '1px solid var(--border-color, #cccccc)';
            expandBtn.style.borderRadius = '4px';
            expandBtn.style.cursor = 'pointer';
            expandBtn.style.display = 'none';  // Inicialmente oculto, será mostrado se necessário
            
            // Adicionar ao DOM
            leftPanel.appendChild(expandBtn);
            console.log('Botão de expansão esquerdo criado:', expandBtn);
            
            // Verificar imediatamente se o painel está colapsado
            if (localStorage.getItem(LEFT_PANEL_KEY) === 'true') {
                expandBtn.style.display = 'flex';
                console.log('Botão de expansão esquerdo definido como visível');
            }
        }
        
        // Criar botão para o painel direito
        if (rightPanel) {
            // Remover qualquer botão existente para evitar duplicação
            const existingBtn = rightPanel.querySelector('.panel-expand-btn');
            if (existingBtn) existingBtn.remove();
            
            const expandBtn = document.createElement('button');
            expandBtn.className = 'panel-expand-btn';
            expandBtn.id = 'right-expand-btn';
            expandBtn.title = 'Expandir painel';
            expandBtn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z"></path></svg>';
            expandBtn.setAttribute('data-target', 'right');
            
            // Aplicar estilos inline para garantir visibilidade mesmo antes do CSS ser carregado
            expandBtn.style.position = 'absolute';
            expandBtn.style.top = '50%';
            expandBtn.style.left = '50%';
            expandBtn.style.transform = 'translate(-50%, -50%)';
            expandBtn.style.width = '24px';
            expandBtn.style.height = '24px';
            expandBtn.style.zIndex = '2000';
            expandBtn.style.background = 'var(--bg-element, #ffffff)';
            expandBtn.style.border = '1px solid var(--border-color, #cccccc)';
            expandBtn.style.borderRadius = '4px';
            expandBtn.style.cursor = 'pointer';
            expandBtn.style.display = 'none';  // Inicialmente oculto, será mostrado se necessário
            
            // Adicionar ao DOM
            rightPanel.appendChild(expandBtn);
            console.log('Botão de expansão direito criado:', expandBtn);
            
            // Verificar imediatamente se o painel está colapsado
            if (localStorage.getItem(RIGHT_PANEL_KEY) === 'true') {
                expandBtn.style.display = 'flex';
                console.log('Botão de expansão direito definido como visível');
            }
        }
    }
    
    // Função para aplicar estados colapsados aos painéis
    function restorePanelStates() {
        console.log('Restaurando estados dos painéis');
        
        // Aplicar estado do painel esquerdo
        if (leftPanel) {
            const isCollapsed = localStorage.getItem(LEFT_PANEL_KEY) === 'true';
            
            if (isCollapsed) {
                leftPanel.classList.add('collapsed');
                leftPanel.style.width = '30px';
                leftPanel.style.minWidth = '30px';
                
                if (resizerLeft) resizerLeft.classList.add('disabled');
                
                // Garantir que o botão de expansão esteja visível
                const expandBtn = document.getElementById('left-expand-btn');
                if (expandBtn) {
                    expandBtn.style.display = 'flex';
                    expandBtn.style.alignItems = 'center';
                    expandBtn.style.justifyContent = 'center';
                    console.log('Botão de expansão esquerdo configurado como visível');
                }
            } else {
                // Se não estiver colapsado, garantir as larguras mínimas corretas
                leftPanel.style.minWidth = '225px';
                leftPanel.style.width = ''; // Deixar o CSS determinar a largura padrão
            }
            
            // Remover classe do HTML
            document.documentElement.classList.remove('left-panel-collapsed');
        }
        
        // Aplicar estado do painel direito
        if (rightPanel) {
            const isCollapsed = localStorage.getItem(RIGHT_PANEL_KEY) === 'true';
            
            if (isCollapsed) {
                rightPanel.classList.add('collapsed');
                rightPanel.style.width = '30px';
                rightPanel.style.minWidth = '30px';
                
                if (resizerRight) resizerRight.classList.add('disabled');
                
                // Garantir que o botão de expansão esteja visível
                const expandBtn = document.getElementById('right-expand-btn');
                if (expandBtn) {
                    expandBtn.style.display = 'flex';
                    expandBtn.style.alignItems = 'center';
                    expandBtn.style.justifyContent = 'center';
                    console.log('Botão de expansão direito configurado como visível');
                }
            } else {
                // Se não estiver colapsado, garantir as larguras mínimas corretas
                rightPanel.style.minWidth = '315px';
                rightPanel.style.width = ''; // Deixar o CSS determinar a largura padrão
            }
            
            // Remover classe do HTML
            document.documentElement.classList.remove('right-panel-collapsed');
        }
        
        // Recalcular layout após aplicar estados
        setTimeout(recalculateLayout, 10);
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
        
        // Gerenciar visibilidade do botão de expansão
        const expandBtn = document.getElementById('left-expand-btn');
        if (expandBtn) {
            expandBtn.style.display = isCollapsed ? 'flex' : 'none';
            
            if (isCollapsed) {
                expandBtn.style.alignItems = 'center';
                expandBtn.style.justifyContent = 'center';
            }
        }
        
        // Aplicar estilos diferentes dependendo do estado
        if (isCollapsed) {
            leftPanel.style.width = '30px';
            leftPanel.style.minWidth = '30px';
        } else {
            // Ao expandir, remover todos os estilos inline de largura e deixar o CSS tomar conta
            leftPanel.style.width = '';
            leftPanel.style.minWidth = '225px'; // Forçar esta largura mínima
        }
        
        // Ajustar layout
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
        
        // Gerenciar visibilidade do botão de expansão
        const expandBtn = document.getElementById('right-expand-btn');
        if (expandBtn) {
            expandBtn.style.display = isCollapsed ? 'flex' : 'none';
            
            if (isCollapsed) {
                expandBtn.style.alignItems = 'center';
                expandBtn.style.justifyContent = 'center';
            }
        }
        
        // Aplicar estilos diferentes dependendo do estado
        if (isCollapsed) {
            rightPanel.style.width = '30px';
            rightPanel.style.minWidth = '30px';
        } else {
            // Ao expandir, remover todos os estilos inline de largura e deixar o CSS tomar conta
            rightPanel.style.width = '';
            rightPanel.style.minWidth = '315px'; // Forçar esta largura mínima
        }
        
        // Ajustar layout
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
    
    // Adicionar event listeners para botões de colapso
    document.querySelectorAll('.collapse-panel-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.getAttribute('data-target');
            if (target === 'left') toggleLeftPanel();
            else if (target === 'right') toggleRightPanel();
        });
    });
    
    // Adicionar event listeners aos botões de expansão
    document.querySelectorAll('.panel-expand-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.getAttribute('data-target');
            console.log(`Botão de expansão ${target} clicado`);
            if (target === 'left') toggleLeftPanel();
            else if (target === 'right') toggleRightPanel();
        });
    });
    
    // Restaurar estados dos painéis - depois de configurar event listeners
    restorePanelStates();
    
    // Recalcular layout quando a janela for redimensionada
    window.addEventListener('resize', recalculateLayout);
    
    // Verificação final da visibilidade dos botões após o carregamento completo
    window.addEventListener('load', () => {
        setTimeout(() => {
            console.log('Verificação final da visibilidade dos botões');
            
            // Verificar painel esquerdo
            if (leftPanel && leftPanel.classList.contains('collapsed')) {
                const expandBtn = document.getElementById('left-expand-btn');
                if (expandBtn && getComputedStyle(expandBtn).display !== 'flex') {
                    console.log('Corrigindo visibilidade do botão esquerdo');
                    expandBtn.style.display = 'flex';
                    expandBtn.style.alignItems = 'center';
                    expandBtn.style.justifyContent = 'center';
                }
            }
            
            // Verificar painel direito
            if (rightPanel && rightPanel.classList.contains('collapsed')) {
                const expandBtn = document.getElementById('right-expand-btn');
                if (expandBtn && getComputedStyle(expandBtn).display !== 'flex') {
                    console.log('Corrigindo visibilidade do botão direito');
                    expandBtn.style.display = 'flex';
                    expandBtn.style.alignItems = 'center';
                    expandBtn.style.justifyContent = 'center';
                }
            }
        }, 500);
    });
});
