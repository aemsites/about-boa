/**
 * Decorate the modal header block
 * Creates a two-column layout with image on left and content on right
 * Responsive: stacks vertically on mobile with image on top
 * @param {Element} block the modal header block
 */
export default function decorate(block) {
  // Get the first row which contains our two columns
  const row = block.querySelector(':scope > div');
  if (!row) return;

  const columns = row.querySelectorAll(':scope > div');
  if (columns.length !== 2) return;

  // Add semantic classes to columns
  const imageColumn = columns[0];
  const contentColumn = columns[1];

  imageColumn.classList.add('modal-header-image');
  contentColumn.classList.add('modal-header-content');

  // Style links in content column as CTA buttons
  const links = contentColumn.querySelectorAll('a');
  links.forEach((link) => {
    // Only style links that are in paragraphs (not inline in text)
    const parent = link.parentElement;
    if (parent.tagName === 'P' && parent.textContent.trim() === link.textContent.trim()) {
      link.classList.add('button', 'primary');
    }
  });
}
