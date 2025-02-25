const searchInput = document.querySelector('.search-input');
const searchResults = document.getElementById('search-results');
const textArea = document.querySelector('.textarea-editor');

let timeoutId = null;

searchInput.addEventListener('input', (e) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => realizarBusca(e.target.value), 300);
});

async function realizarBusca(termo) {
    if (termo.length < 3) {
        searchResults.innerHTML = '';
        return;
    }

    try {
        const resultados = await ipcRenderer.invoke('buscar-documentos', termo);
        exibirResultados(resultados);
    } catch (err) {
        console.error('Erro na busca:', err);
    }
}

function exibirResultados(resultados) {
    searchResults.innerHTML = resultados
        .map(doc => `
            <div class="resultado-item" onclick="carregarDocumento('${doc.id}')">
                <h3>${doc.titulo}</h3>
                <p>${doc.conteudo.substring(0, 100)}...</p>
            </div>
        `)
        .join('');
}

async function salvarDocumento() {
    const conteudo = textArea.value;
    const titulo = conteudo.split('\n')[0] || 'Sem título';
    
    try {
        await ipcRenderer.invoke('salvar-documento', { titulo, conteudo });
    } catch (err) {
        console.error('Erro ao salvar:', err);
    }
}
