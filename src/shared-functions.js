// Gerenciador de modelos
const modelosManager = {
    _modelos: new Set(),
    _observers: new Map(),
    _debug: true,

    log(message) {
        if (this._debug) {
            console.log(`[ModelosManager] ${message}`);
        }
    },

    adicionar(modeloId, elemento, editor) {
        if (!modeloId) {
            this.log('Tentativa de adicionar modelo sem ID');
            return;
        }

        if (!document.contains(elemento)) {
            this.log(`Tentativa de adicionar modelo ${modeloId} falhou - elemento não está no DOM`);
            return;
        }

        this._modelos.add(modeloId);
        this.log(`Modelo ${modeloId} adicionado`);
        
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.type === 'childList' && !document.contains(elemento)) {
                    this.log(`Detectada remoção do modelo ${modeloId} do DOM`);
                    this._modelos.delete(modeloId);
                    this._observers.delete(modeloId);
                    observer.disconnect();
                    break;
                }
            }
        });

        observer.observe(editor, { childList: true, subtree: true });
        this._observers.set(modeloId, observer);
    },

    remover(modeloId) {
        if (!modeloId) return;
        
        const observer = this._observers.get(modeloId);
        if (observer) {
            observer.disconnect();
            this._observers.delete(modeloId);
        }
        
        if (this._modelos.has(modeloId)) {
            this._modelos.delete(modeloId);
            this.log(`Modelo ${modeloId} removido do registro`);
        }
    },

    verificar(modeloId) {
        if (!modeloId) return false;

        this.log(`Verificando modelo ${modeloId}`);
        const existeNoConjunto = this._modelos.has(modeloId);
        const elementoNoDom = document.querySelector(`.modelo-box[data-modelo_id="${modeloId}"]`);

        if (existeNoConjunto && !elementoNoDom) {
            this.log(`Modelo ${modeloId} existe no registro mas não no DOM - limpando registro`);
            this.remover(modeloId);
            return false;
        }

        this.log(`Modelo ${modeloId} ${existeNoConjunto ? 'existe' : 'não existe'} no registro`);
        return existeNoConjunto;
    }
};

// Função global para inserir modelo
window.inserirModelo = async function(texto, nome, modeloId = '') {
    if (!modeloId) return;

    modelosManager.log(`Iniciando processo de inserção do modelo ${modeloId}`);
    const modeloExists = modelosManager.verificar(modeloId);
    
    if (modeloExists) {
        modelosManager.log(`Modelo ${modeloId} já existe - ignorando inserção`);
        return;
    }

    modelosManager.log(`Criando novo modelo ${modeloId}`);
    const editor = document.querySelector('.textarea-editor');
    const modeloBox = createModeloBox(texto, nome, modeloId);
    editor.appendChild(modeloBox);
    modelosManager.adicionar(modeloId, modeloBox, editor);
};

// Função global para verificar modelo
window.verificarModeloInserido = function(modeloId) {
    return modeloId ? modelosManager.verificar(modeloId) : false;
};
