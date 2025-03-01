// Funções compartilhadas entre os módulos
window.inserirModelo = async function(texto, nome, modeloId = '') {
    // Verificar se já existe uma caixa com este modelo
    if (modeloId) {
        const caixaExistente = document.querySelector(`.modelo-box[data-modelo_id="${modeloId}"]`);
        if (caixaExistente) {
            console.log('Modelo já inserido:', modeloId);
            return;
        }
    }

    const editor = document.querySelector('.textarea-editor');
    const modeloBox = createModeloBox(texto, nome, modeloId);
    editor.appendChild(modeloBox);
};
