document.addEventListener('DOMContentLoaded', () => {
    const btnSalvar = document.querySelector('.btn-salvar');
    const nomeInput = document.getElementById('nome-input');
    const tagInput = document.getElementById('tag-input');
    const searchInput = document.querySelector('.search-input');

    // Verificar se o editor está pronto
    const waitForEditor = setInterval(async () => {
        if (window.tinymce?.activeEditor) {
            clearInterval(waitForEditor);
            setupSaveHandler();
            
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

    // Tornar a função showDialog acessível globalmente com estilos aprimorados
    window.showDialog = function(title, message, buttons) {
        return new Promise((resolve, reject) => {
            const dialog = document.createElement('div');
            dialog.className = 'dialog-overlay';
            // Adicionar estilos inline para garantir posicionamento correto
            dialog.style.position = 'fixed';
            dialog.style.top = '0';
            dialog.style.left = '0';
            dialog.style.right = '0';
            dialog.style.bottom = '0';
            dialog.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
            dialog.style.display = 'flex';
            dialog.style.alignItems = 'center';
            dialog.style.justifyContent = 'center';
            dialog.style.zIndex = '10000';
            
            dialog.innerHTML = `
                <div class="dialog" style="background-color: var(--bg-secondary, #ffffff); border-radius: 8px; padding: 20px; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3); max-width: 400px; width: 100%;">
                    <div class="dialog-header">
                        <h3>${title}</h3>
                    </div>
                    <div class="dialog-body">
                        ${message}
                    </div>
                    <div class="dialog-footer">
                        ${buttons.map(btn => `
                            <button id="${btn.id}" class="dialog-btn ${btn.class || ''}">${btn.text}</button>
                        `).join('')}
                    </div>
                </div>
            `;
            
            document.body.appendChild(dialog);
            
            // Focar no primeiro botão (melhoria de acessibilidade)
            if (buttons.length > 0) {
                setTimeout(() => {
                    const firstButton = dialog.querySelector(`#${buttons[0].id}`);
                    if (firstButton) {
                        firstButton.focus();
                    }
                }, 10);
            }
            
            buttons.forEach(btn => {
                dialog.querySelector(`#${btn.id}`).addEventListener('click', () => {
                    dialog.remove();
                    resolve(btn.value);
                });
            });
        });
    };

    async function setupSaveHandler() {
        btnSalvar.addEventListener('click', async () => {
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
        });
    }
});
