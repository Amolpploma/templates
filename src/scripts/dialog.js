/**
 * Módulo compartilhado para diálogos personalizados
 * Implementa a função showDialog de forma centralizada para toda a aplicação
 */

(function() {
    /**
     * Exibe um diálogo personalizado com título, mensagem e botões.
     * 
     * @param {string} title - Título do diálogo
     * @param {string} message - Mensagem do diálogo (pode conter HTML)
     * @param {Array} buttons - Array de objetos de botão, cada um com: id, text, class e value
     * @returns {Promise} - Promise que resolve com o valor do botão clicado
     */
    window.showDialog = function(title, message, buttons = []) {
        return new Promise((resolve) => {
            // Salvar o elemento que está com foco antes de abrir o diálogo
            const activeElement = document.activeElement;
            
            // Remover diálogos existentes para evitar sobreposição
            const existingDialog = document.querySelector('.custom-dialog');
            if (existingDialog) {
                document.body.classList.remove('dialog-open');
                existingDialog.remove();
            }
            
            // Garantir que existam botões padrão caso não sejam fornecidos
            if (!buttons || buttons.length === 0) {
                buttons = [{
                    id: 'btn-ok',
                    text: 'OK',
                    class: 'btn-primary',
                    value: true
                }];
            }
            
            const dialog = document.createElement('div');
            dialog.className = 'custom-dialog';
            dialog.innerHTML = `
                <div class="dialog-content">
                    <h2>${title}</h2>
                    <p>${message}</p>
                    <div class="dialog-buttons">
                        ${buttons.map(btn => `
                            <button class="${btn.class}" id="${btn.id}">${btn.text}</button>
                        `).join('')}
                    </div>
                </div>
            `;
            
            document.body.appendChild(dialog);
            document.body.classList.add('dialog-open');
            
            // Focar no primeiro botão para melhor acessibilidade
            if (buttons.length > 0) {
                setTimeout(() => {
                    const firstButton = dialog.querySelector(`#${buttons[0].id}`);
                    if (firstButton) {
                        firstButton.focus();
                    }
                }, 10);
            }
            
            // Configurar eventos dos botões com restauração de foco
            buttons.forEach(btn => {
                const btnElement = dialog.querySelector(`#${btn.id}`);
                if (btnElement) {
                    btnElement.addEventListener('click', () => {
                        document.body.classList.remove('dialog-open');
                        dialog.remove();
                        
                        // Restaurar o foco ao elemento que estava ativo antes do diálogo
                        if (activeElement && typeof activeElement.focus === 'function') {
                            setTimeout(() => {
                                try {
                                    activeElement.focus();
                                } catch (e) {
                                    console.error('Erro ao restaurar foco:', e);
                                }
                            }, 10);
                        }
                        
                        resolve(btn.value);
                    });
                }
            });
        });
    };
    
    console.log('Módulo de diálogo compartilhado carregado');
})();
