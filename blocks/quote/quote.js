export default function decorate(block) {
  const [quoteRow, attributionRow, roleRow] = block.children;

  // Create blockquote wrapper
  const blockquote = document.createElement('blockquote');
  blockquote.className = 'quote-text';

  // Move quote text into blockquote
  if (quoteRow) {
    const quoteText = quoteRow.textContent.trim();
    blockquote.textContent = quoteText;
  }

  // Create attribution wrapper
  const attribution = document.createElement('p');
  attribution.className = 'quote-attribution';

  // Add attribution text with em dash
  if (attributionRow) {
    const attributionText = attributionRow.textContent.trim();
    attribution.textContent = `— ${attributionText}`;
  }

  // Create role element
  const role = document.createElement('p');
  role.className = 'quote-role';

  // Add role text (should be uppercase in CSS)
  if (roleRow) {
    role.textContent = roleRow.textContent.trim();
  }

  // Replace block contents with new structure
  block.replaceChildren(blockquote, attribution, role);
}
