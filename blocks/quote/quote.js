export default function decorate(block) {
  const rows = [...block.children];

  // First row contains the quote text
  const quoteText = rows[0]?.textContent.trim();

  // Second row contains attribution (name and role)
  const attributionRow = rows[1];
  const name = attributionRow?.children[0]?.textContent.trim();
  const role = attributionRow?.children[1]?.textContent.trim();

  // Create blockquote structure
  const blockquote = document.createElement('blockquote');

  // Add quote text
  const quoteP = document.createElement('p');
  quoteP.className = 'quote-text';
  quoteP.textContent = quoteText;
  blockquote.append(quoteP);

  // Add attribution
  if (name || role) {
    const cite = document.createElement('cite');
    cite.className = 'quote-attribution';

    if (name) {
      const nameSpan = document.createElement('span');
      nameSpan.className = 'quote-name';
      nameSpan.textContent = `– ${name}`;
      cite.append(nameSpan);
    }

    if (role) {
      const roleSpan = document.createElement('span');
      roleSpan.className = 'quote-role';
      roleSpan.textContent = role;
      cite.append(roleSpan);
    }

    blockquote.append(cite);
  }

  block.replaceChildren(blockquote);
}
