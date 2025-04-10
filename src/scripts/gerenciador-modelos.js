document.addEventListener('DOMContentLoaded', () => {
    const btnSalvar = document.querySelector('.btn-salvar');
    const nomeInput = document.getElementById('nome-input');
    const tagInput = document.getElementById('tag-input');
    const searchInput = document.querySelector('.search-input');

    // Flag para controlar se o handler já foi configurado
    let saveHandlerConfigured = false;

    // Verificar se o editor está pronto
    const waitForEditor = setInterval(async () => {
        if (window.tinymce?.activeEditor) {
            clearInterval(waitForEditor);
            
            // Verificar se o handler já foi configurado
            if (!saveHandlerConfigured) {
                setupSaveHandler();
                saveHandlerConfigured = true;
            }
            
            // Verificar se há conteúdo transferido
            const transferContent = await window.electronAPI.getStore('transferContent');
            if (transferContent) {
                tinymce.get('editor-container').setContent(transferContent);
                await window.electronAPI.setStore('transferContent', null); // Limpar após uso
                
                // Salvar na aba ativa se o sistema de abas estiver disponível
                if (window.editorTabs) {
                    window.editorTabs.saveCurrentTabContent();
                }
            }
        }
    }, 100);

    function limparCampos() {
        nomeInput.value = '';
        tagInput.value = '';
        tinymce.activeEditor.setContent('');
        
        // Limpar campo de pesquisa e disparar o evento input para atualizar a lista
        searchInput.value = '';
        searchInput.dispatchEvent(new Event('input'));
        
        // Se o sistema de abas estiver disponível, atualizar seu armazenamento
        if (window.editorTabs) {
            window.editorTabs.saveCurrentTabContent();
        }
    }

    // Tornar a função showDialog acessível globalmente usando os estilos de _dialog.css
    window.showDialog = function(title, message, buttons) {
        return new Promise((resolve) => {
            // Salvar o elemento que está com foco antes de abrir o diálogo
            const activeElement = document.activeElement;
            
            // Remover diálogos existentes para evitar sobreposição
            const existingDialog = document.querySelector('.custom-dialog');
            if (existingDialog) {
                document.body.classList.remove('dialog-open');
                existingDialog.remove();
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
                dialog.querySelector(`#${btn.id}`).addEventListener('click', () => {
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
            });
        });
    };

    async function setupSaveHandler() {
        // Remover qualquer handler existente para evitar duplicação
        btnSalvar.removeEventListener('click', handleSaveClick);
        
        // Adicionar o novo handler
        btnSalvar.addEventListener('click', handleSaveClick);
    }
    
    // Extrair a função de tratamento do clique para poder removê-la se necessário
    async function handleSaveClick() {
        // Verificar se o botão já está em processo de salvamento
        if (btnSalvar.hasAttribute('data-saving')) {
            return; // Evitar múltiplas chamadas simultâneas
        }
        
        // Desabilitar botão durante o salvamento
        btnSalvar.setAttribute('data-saving', 'true');
        btnSalvar.disabled = true;
        const originalText = btnSalvar.textContent;
        btnSalvar.textContent = 'Salvando...';
        
        try {
            const nome = nomeInput.value.trim();
            if (!nome) {
                await window.showDialog(
                    'Campo obrigatório',
                    'Por favor, insira um nome para o modelo',
                    [{
                        id: 'btn-ok',
                        text: 'OK',
                        class: 'btn-primary',
                        value: false
                    }]
                );
                return;
            }

            const tags = tagInput.value
                .split(',')
                .map(tag => tag.trim())
                .filter(tag => tag.length > 0);
            const modeloContent = tinymce.activeEditor.getContent();

            try {
                const modeloExistente = await window.electronAPI.verificarModelo(nome);

                if (modeloExistente) {
                    const shouldUpdate = await window.showDialog(
                        'Modelo Existente',
                        'Já existe um modelo com este nome. Deseja editá-lo?',
                        [{
                            id: 'btn-cancelar',
                            text: 'Cancelar',
                            class: 'btn-secondary',
                            value: false
                        },
                        {
                            id: 'btn-atualizar',
                            text: 'Atualizar',
                            class: 'btn-primary',
                            value: true
                        }]
                    );

                    if (shouldUpdate) {
                        try {
                            await window.electronAPI.atualizarModelo({
                                id: modeloExistente.id,
                                nome,
                                tag: tags,
                                modelo: modeloContent
                            });
                            limparCampos();
                            await window.showDialog(
                                'Sucesso',
                                `Modelo <i><u>${nome}</u></i> editado com sucesso!`,
                                [{
                                    id: 'btn-ok',
                                    text: 'OK',
                                    class: 'btn-primary',
                                    value: true
                                }]
                            );
                            
                            // Se o sistema de abas estiver disponível e se for o primeiro modelo salvo desta aba
                            // renomear a aba para o nome do modelo
                            if (window.editorTabs && window.editorTabs.getCurrentTabId()) {
                                window.editorTabs.renameTab(window.editorTabs.getCurrentTabId(), nome);
                                // Criar uma nova aba para continuar editando
                                window.editorTabs.createNewTab();
                            }
                        } catch (err) {
                            console.error('Erro ao atualizar modelo:', err);
                            await window.showDialog(
                                'Erro',
                                'Erro ao atualizar o modelo',
                                [{
                                    id: 'btn-ok',
                                    text: 'OK',
                                    class: 'btn-primary',
                                    value: false
                                }]
                            );
                        }
                    }
                } else {
                    try {
                        const result = await window.electronAPI.salvarDocumento({
                            nome,
                            tag: tags,
                            modelo: modeloContent
                        });

                        if (result) {
                            limparCampos();
                            await window.showDialog(
                                'Sucesso',
                                `Modelo <i><u>${nome}</u></i> salvo com sucesso!`,
                                [{
                                    id: 'btn-ok',
                                    text: 'OK',
                                    class: 'btn-primary',
                                    value: true
                                }]
                            );
                            
                            // Se o sistema de abas estiver disponível
                            if (window.editorTabs && window.editorTabs.getCurrentTabId()) {
                                window.editorTabs.renameTab(window.editorTabs.getCurrentTabId(), nome);
                                // Criar uma nova aba para continuar editando
                                window.editorTabs.createNewTab();
                            }
                        }
                    } catch (err) {
                        console.error('Erro ao salvar modelo:', err);
                        await window.showDialog(
                            'Erro',
                            'Erro ao salvar o modelo',
                            [{
                                id: 'btn-ok',
                                text: 'OK',
                                class: 'btn-primary',
                                value: false
                            }]
                        );
                    }
                }
            } catch (err) {
                console.error('Erro ao verificar modelo existente:', err);
                await window.showDialog(
                    'Erro',
                    'Erro ao verificar modelo existente',
                    [{
                        id: 'btn-ok',
                        text: 'OK',
                        class: 'btn-primary',
                        value: false
                    }]
                );
            }
        } finally {
            // Restaurar o estado do botão
            btnSalvar.disabled = false;
            btnSalvar.textContent = originalText;
            btnSalvar.removeAttribute('data-saving');
        }
    }
});
