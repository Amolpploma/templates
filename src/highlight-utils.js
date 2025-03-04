function highlightText(text, searchTerm) {
    if (!searchTerm) return text;
    
    const terms = searchTerm.trim().split(/\s+/);
    let highlightedText = text;
    
    terms.forEach(term => {
        const regex = new RegExp(`(${term})`, 'gi');
        highlightedText = highlightedText.replace(regex, '<mark>$1</mark>');
    });
    
    return highlightedText;
}

module.exports = { highlightText };
