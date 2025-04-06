/**
 * Script para navegação entre abas quando o espaço é limitado
 */
document.addEventListener('DOMContentLoaded', () => {
    const editorPanel = document.querySelector('.editor-panel');
    const tabList = document.querySelector('.tab-list');
    const addTabBtn = document.getElementById('add-tab-btn');
    
    if (!editorPanel || !tabList) return;
    
    // Criar botões de navegação
    function createNavButtons() {
        const prevBtn = document.createElement('button');
        prevBtn.className = 'tab-nav-button tab-nav-prev';
        prevBtn.innerHTML = '◄';
        prevBtn.setAttribute('aria-label', 'Abas anteriores');
        prevBtn.setAttribute('title', 'Abas anteriores');
        
        const nextBtn = document.createElement('button');
        nextBtn.className = 'tab-nav-button tab-nav-next';
        nextBtn.innerHTML = '►';
        nextBtn.setAttribute('aria-label', 'Próximas abas');
        nextBtn.setAttribute('title', 'Próximas abas');
        
        // Adicionar ao DOM
        const editorTabs = document.querySelector('.editor-tabs');
        editorTabs.appendChild(prevBtn);
        editorTabs.appendChild(nextBtn);
        
        // Adicionar eventos de clique
        prevBtn.addEventListener('click', () => scrollTabs(-100));
        nextBtn.addEventListener('click', () => scrollTabs(100));
        
        return { prevBtn, nextBtn };
    }
    
    // Função para rolar as abas
    function scrollTabs(amount) {
        const currentScroll = tabList.scrollLeft;
        tabList.scrollTo({
            left: currentScroll + amount,
            behavior: 'smooth'
        });
        
        // Verificar visibilidade após a rolagem
        setTimeout(checkNavButtonsVisibility, 310);
    }
    
    // Verificar se os botões de navegação devem estar visíveis
    function checkNavButtonsVisibility() {
        const { prevBtn, nextBtn } = getNavButtons();
        
        // Verificar se há overflow
        const hasOverflow = tabList.scrollWidth > tabList.clientWidth;
        
        // Verificar posição do scroll
        const atStart = tabList.scrollLeft <= 1;
        const atEnd = tabList.scrollLeft + tabList.clientWidth >= tabList.scrollWidth - 1;
        
        // Atualizar visibilidade dos botões
        prevBtn.classList.toggle('visible', hasOverflow && !atStart);
        nextBtn.classList.toggle('visible', hasOverflow && !atEnd);
    }
    
    // Obter referências aos botões de navegação
    function getNavButtons() {
        let prevBtn = document.querySelector('.tab-nav-prev');
        let nextBtn = document.querySelector('.tab-nav-next');
        
        // Criar os botões se não existirem
        if (!prevBtn || !nextBtn) {
            const buttons = createNavButtons();
            prevBtn = buttons.prevBtn;
            nextBtn = buttons.nextBtn;
        }
        
        return { prevBtn, nextBtn };
    }
    
    // Inicializar
    function initialize() {
        // Criar botões de navegação
        createNavButtons();
        
        // Verificar visibilidade inicial
        checkNavButtonsVisibility();
        
        // Configurar observador para mudanças em abas
        const observer = new MutationObserver(() => {
            checkNavButtonsVisibility();
        });
        
        // Observar mudanças na lista de abas
        observer.observe(tabList, { 
            childList: true,
            subtree: false
        });
        
        // Monitorar redimensionamento da janela
        window.addEventListener('resize', checkNavButtonsVisibility);
        
        // Também monitorar mudanças no painel do editor
        const editorObserver = new MutationObserver(checkNavButtonsVisibility);
        editorObserver.observe(editorPanel, {
            attributes: true,
            attributeFilter: ['style']
        });
        
        // Também monitorar scroll nas abas
        tabList.addEventListener('scroll', () => {
            checkNavButtonsVisibility();
        });
    }
    
    // Iniciar o sistema de navegação
    initialize();
});
