/**
 * Decorate the modal header block
 * Creates a two-column layout with image on left and content on right
 * If only one column, image takes full width
 * @param {Element} block the modal header block
 */
export default function decorate(block) {
  const row = block.querySelector(':scope > div');
  if (!row) return;

  const columns = row.querySelectorAll(':scope > div');

  if (columns.length === 1) {
    block.classList.add('single-column');
  }

  columns.forEach((column, index) => {
    if (index === 0) {
      column.classList.add('modal-header-image');
    } else {
      column.classList.add('modal-header-content');
    }
  });
}
