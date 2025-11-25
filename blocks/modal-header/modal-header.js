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
  if (columns.length === 0) return;

  const imageColumn = columns[0];
  imageColumn.classList.add('modal-header-image');

  const contentColumn = columns[1];
  if (contentColumn) {
    contentColumn.classList.add('modal-header-content');
  } else {
    block.classList.add('single-column');
  }
}
