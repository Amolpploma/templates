// Disponibilizar a função globalmente ao invés de usar module.exports
window.highlightText = function(text, searchTerm, shouldHighlight = true) {
    if (!searchTerm || !shouldHighlight) return text;

    // Função para decodificar entidades HTML
    function decodeHTMLEntities(str) {
        var txt = document.createElement("textarea");
        txt.innerHTML = str;
        return txt.value;
    }

    const terms = searchTerm
        .trim()
        .split(/\s+/)
        .filter(term => term.length >= 3); // Filtrar termos com 3 ou mais caracteres

    let highlightedText = decodeHTMLEntities(text); // Decodificar antes de processar

    terms.forEach(term => {
        // Escapar caracteres especiais para evitar erros na regex
        const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        // Dividir o texto em partes, separando tags HTML de texto
        const parts = highlightedText.split(/(<[^>]*>)/);
        
        // Mapear as partes, aplicando o highlight apenas nas partes de texto
        const highlightedParts = parts.map(part => {
            if (part.startsWith('<') && part.endsWith('>')) {
                // É uma tag HTML, não modificar
                return part;
            } else {
                // É texto, aplicar o highlight
                const regex = new RegExp(`(${escapedTerm})`, 'gi');
                return part.replace(regex, '<mark>$1</mark>');
            }
        });

        // Juntar as partes novamente
        highlightedText = highlightedParts.join('');
    });

    return highlightedText;
};
