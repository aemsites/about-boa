/**
 * Decorates the icon-lists block
 * @param {Element} block the icon-lists block
 */
export default function decorate(block) {
  // Convert block structure to a list
  const ul = document.createElement('ul');

  [...block.children].forEach((row) => {
    const li = document.createElement('li');

    // Move all cells from the row into the li
    while (row.firstElementChild) {
      li.append(row.firstElementChild);
    }

    // Classify the cells: first is icon, second is content
    const cells = [...li.children];
    if (cells[0]) cells[0].className = 'icon-lists-icon';
    if (cells[1]) cells[1].className = 'icon-lists-content';

    ul.append(li);
  });

  block.replaceChildren(ul);

  // Remove button classes from links (added by decorateButtons)
  block.querySelectorAll('a.button').forEach((link) => {
    link.classList.remove('button');
  });
}
