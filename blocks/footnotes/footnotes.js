/**
 * Adds back-links from footnotes to their references in the document
 * @param {Element} block The footnotes block element
 */
function addBackLinks(block) {
  const footnotes = block.querySelectorAll('li[id]');

  footnotes.forEach((footnote) => {
    const footnoteId = footnote.id;

    // Find all references to this footnote in the document
    const references = document.querySelectorAll(`a[href$="#${footnoteId}"].footnote-ref`);

    if (references.length > 0) {
      // Create back-links container
      const backlinksContainer = document.createElement('span');
      backlinksContainer.className = 'footnote-backlinks';
      backlinksContainer.setAttribute('aria-label', 'Back to content');

      references.forEach((ref, index) => {
        const backlink = document.createElement('a');
        backlink.href = `#${ref.id}`;
        backlink.className = 'footnote-backlink';
        backlink.textContent = '↩';
        backlink.title = `Return to reference ${index + 1}`;
        backlink.setAttribute('aria-label', `Return to reference ${index + 1}`);

        // Add space between multiple back-links
        if (index > 0) {
          backlinksContainer.append(' ');
        }
        backlinksContainer.append(backlink);
      });

      // Append back-links to the footnote
      footnote.append(' ');
      footnote.append(backlinksContainer);
    }
  });
}

/**
 * Decorates the footnotes block
 * Converts table rows to an ordered list with proper IDs
 * Adds back-links to references in the document
 * @param {Element} block The footnotes block element
 */
export default function decorate(block) {
  // Create ordered list for footnotes
  const ol = document.createElement('ol');
  ol.className = 'footnotes-list';

  // Get all rows (each row is a footnote)
  const rows = [...block.children];

  rows.forEach((row, index) => {
    const li = document.createElement('li');
    const footnoteNumber = index + 1;

    // Set ID for linking (check if row has custom ID first)
    const customId = row.getAttribute('id') || row.querySelector('[id]')?.id;
    li.id = customId || `footnote-${footnoteNumber}`;

    // Move content from row to list item
    while (row.firstElementChild) {
      li.append(row.firstElementChild);
    }

    // Wrap content in a span for easier styling with back-links
    const content = document.createElement('span');
    content.className = 'footnote-content';
    while (li.firstChild) {
      content.append(li.firstChild);
    }
    li.append(content);

    ol.append(li);
  });

  // Replace block content with ordered list
  block.replaceChildren(ol);

  // Add back-links after a short delay to ensure references are in DOM
  // This runs after the page is fully loaded and all references are inserted
  setTimeout(() => {
    addBackLinks(block);
  }, 100);
}
