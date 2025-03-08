document.addEventListener('DOMContentLoaded', () => {
    const btnSalvar = document.querySelector('.btn-salvar');
    const nomeInput = document.getElementById('nome-input');
    const tagInput = document.getElementById('tag-input');

    const waitForQuill = setInterval(() => {
        if (window.quill) {
            clearInterval(waitForQuill);
            setupSaveHandler();
        }
    }, 100);

    function limparCampos() {
        nomeInput.value = '';
        tagInput.value = '';
        window.quill.setText('');
    }

    function showDialog(message) {
        // Prevenir múltiplos diálogos
        document.querySelector('.custom-dialog')?.remove();
        
        // Adicionar classe ao body para prevenir scroll
        document.body.classList.add('dialog-open');
    
        const dialog = document.createElement('div');
        dialog.className = 'custom-dialog';
        dialog.innerHTML = `
            <div class="dialog-content">
                <h2>Modelo Existente</h2>
                <p>${message}</p>
                <div class="dialog-buttons">
                    <button class="btn-secondary" id="btn-cancelar">Cancelar</button>
                    <button class="btn-primary" id="btn-atualizar">Atualizar</button>
                </div>
            </div>
        `;
    
        document.body.appendChild(dialog);
        return dialog;
    }

    function setupSaveHandler() {
        btnSalvar.addEventListener('click', async () => {
            const nome = nomeInput.value.trim();
            const tags = tagInput.value
                .split(',')
                .map(tag => tag.trim())
                .filter(tag => tag.length > 0);
            const modeloContent = window.quill.root.innerHTML;

            if (!nome) {
                alert('Por favor, insira um nome para o modelo');
                return;
            }

            try {
                const modeloExistente = await window.electronAPI.verificarModelo(nome);

                if (modeloExistente) {
                    const dialog = showDialog('Já existe um modelo com este nome. Deseja atualizá-lo?');

                    return new Promise((resolve) => {
                        dialog.querySelector('#btn-cancelar').onclick = () => {
                            document.body.classList.remove('dialog-open');
                            dialog.remove();
                            resolve(false);
                        };

                        dialog.querySelector('#btn-atualizar').onclick = async () => {
                            try {
                                await window.electronAPI.atualizarModelo({
                                    id: modeloExistente.id,
                                    nome,
                                    tag: tags,
                                    modelo: modeloContent
                                });
                                limparCampos();
                                document.body.classList.remove('dialog-open');
                                dialog.remove();
                                resolve(true);
                            } catch (err) {
                                console.error('Erro ao atualizar modelo:', err);
                                alert('Erro ao atualizar o modelo');
                            }
                        };
                    });
                } else {
                    await window.electronAPI.salvarDocumento({
                        nome,
                        tag: tags,
                        modelo: modeloContent
                    });
                    limparCampos();
                }
            } catch (err) {
                console.error('Erro ao salvar modelo:', err);
                alert('Erro ao salvar o modelo');
            }
        });
    }
});
