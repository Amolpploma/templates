/**
 * Script para navegação entre abas quando o espaço é limitado
 */
document.addEventListener('DOMContentLoaded', () => {
    const editorPanel = document.querySelector('.editor-panel');
    const tabList = document.querySelector('.tab-list');
    const addTabBtn = document.getElementById('add-tab-btn');
    
    if (!editorPanel || !tabList) return;
    
    // Variáveis para controlar a rolagem contínua
    let scrollInterval = null;
    const scrollSpeed = 15; // Pixels por iteração
    const scrollIntervalDelay = 50; // ms entre cada iteração
    
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
        
        // Configurar eventos de clique único
        prevBtn.addEventListener('click', () => scrollTabs(-100));
        nextBtn.addEventListener('click', () => scrollTabs(100));
        
        // Configurar eventos para rolagem contínua quando pressionar e segurar
        prevBtn.addEventListener('mousedown', () => startContinuousScroll(-scrollSpeed));
        nextBtn.addEventListener('mousedown', () => startContinuousScroll(scrollSpeed));
        
        // Parar a rolagem quando soltar o botão ou sair da área
        [prevBtn, nextBtn].forEach(btn => {
            btn.addEventListener('mouseup', stopContinuousScroll);
            btn.addEventListener('mouseleave', stopContinuousScroll);
        });
        
        return { prevBtn, nextBtn };
    }
    
    // Iniciar rolagem contínua
    function startContinuousScroll(amount) {
        // Limpar qualquer intervalo anterior
        stopContinuousScroll();
        
        // Iniciar novo intervalo para rolagem contínua
        scrollInterval = setInterval(() => {
            const currentScroll = tabList.scrollLeft;
            
            // Verificar se chegamos ao limite de rolagem
            if ((amount < 0 && currentScroll <= 0) || 
                (amount > 0 && currentScroll + tabList.clientWidth >= tabList.scrollWidth)) {
                stopContinuousScroll();
                return;
            }
            
            tabList.scrollLeft = currentScroll + amount;
            checkNavButtonsVisibility();
        }, scrollIntervalDelay);
    }
    
    // Parar rolagem contínua
    function stopContinuousScroll() {
        if (scrollInterval) {
            clearInterval(scrollInterval);
            scrollInterval = null;
        }
    }
    
    // Função para rolar as abas (clique único)
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
        
        // Adicionar evento de wheel (roda do mouse) para rolagem
        const editorTabs = document.querySelector('.editor-tabs');
        editorTabs.addEventListener('wheel', (event) => {
            if (tabList.scrollWidth > tabList.clientWidth) { // Só rolar se houver overflow
                event.preventDefault(); // Evitar scroll na página
                
                // Determinar direção e aplicar rolagem
                const direction = event.deltaY > 0 ? 1 : -1;
                tabList.scrollLeft += direction * 50; // 50 pixels por movimento da roda
                
                // Verificar visibilidade dos botões
                checkNavButtonsVisibility();
            }
        });
    }
    
    // Iniciar o sistema de navegação
    initialize();
});
