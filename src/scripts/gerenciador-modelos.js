document.addEventListener('DOMContentLoaded', () => {
    const btnSalvar = document.querySelector('.btn-salvar');
    const nomeInput = document.getElementById('nome-input');
    const tagInput = document.getElementById('tag-input');
    const searchInput = document.querySelector('.search-input');

    // Remover o check pelo Quill e usar TinyMCE
    const waitForEditor = setInterval(async () => {
        if (window.tinymce?.activeEditor) {
            clearInterval(waitForEditor);
            setupSaveHandler();
            
            // Verificar se há conteúdo transferido
            const transferContent = await window.electronAPI.getStore('transferContent');
            if (transferContent) {
                tinymce.get('editor-container').setContent(transferContent);
                await window.electronAPI.setStore('transferContent', null); // Limpar após uso
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
    }

    function showDialog(title, message, buttons) {
        return new Promise((resolve) => {
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
                    <div class="dialog-buttons">${buttons.map(btn => `
                        <button class="${btn.class}" id="${btn.id}">${btn.text}</button>
                    `).join('')}</div>
                </div>
            `;
        
            document.body.appendChild(dialog);
            document.body.classList.add('dialog-open');

            // Configurar eventos dos botões
            buttons.forEach(btn => {
                dialog.querySelector(`#${btn.id}`).onclick = () => {
                    document.body.classList.remove('dialog-open');
                    dialog.remove();
                    resolve(btn.value);
                };
            });
        });
    }

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
                    await window.electronAPI.salvarDocumento({
                        nome,
                        tag: tags,
                        modelo: modeloContent
                    });
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
        });
    }
});
