/**
 * Decorate the icon-list block.
 * Transforms rows into a semantic list with visual + content structure.
 * @param {Element} block the block element
 */
export default function decorate(block) {
  const ul = document.createElement('ul');

  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    const [visualCol, contentCol] = row.children;

    // Visual column: may contain optional label text + icon or image
    if (visualCol) {
      visualCol.className = 'icon-list-visual';
    }

    // Content column: any authored content
    if (contentCol) {
      contentCol.className = 'icon-list-content';
    }

    while (row.firstElementChild) {
      li.append(row.firstElementChild);
    }

    ul.append(li);
  });

  block.replaceChildren(ul);
}
