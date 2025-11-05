export default function decorate(block) {
  // Extract the three parts from the block structure
  const rows = [...block.children];

  if (rows.length < 2) {
    // eslint-disable-next-line no-console
    console.warn('Quote block requires at least quote text and attribution');
    return;
  }

  // Get content from rows
  const quoteText = rows[0]?.textContent.trim() || '';
  const attribution = rows[1]?.textContent.trim() || '';
  const role = rows[2]?.textContent.trim() || '';

  // Clear the block
  block.innerHTML = '';

  // Create blockquote element
  const blockquote = document.createElement('blockquote');
  blockquote.textContent = quoteText;

  // Create attribution element with cite
  const cite = document.createElement('cite');
  cite.classList.add('quote-attribution');
  // Add em dash if not already present
  const attributionText = attribution.startsWith('–') ? attribution : `– ${attribution}`;
  cite.textContent = attributionText;

  // Create role element if provided
  let roleElement = null;
  if (role) {
    roleElement = document.createElement('p');
    roleElement.classList.add('quote-role');
    roleElement.textContent = role;
  }

  // Append elements to block
  block.appendChild(blockquote);
  block.appendChild(cite);
  if (roleElement) {
    block.appendChild(roleElement);
  }
}
