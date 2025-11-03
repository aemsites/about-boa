/**
 * Decorates a table block by converting div-based structure to semantic HTML table
 * @param {Element} block The table block element
 */
export default function decorate(block) {
  const table = document.createElement('table');
  const rows = [...block.children];

  rows.forEach((row) => {
    const tr = document.createElement('tr');
    const cells = [...row.children];

    cells.forEach((cell) => {
      const td = document.createElement('td');
      td.innerHTML = cell.innerHTML;
      tr.append(td);
    });

    table.append(tr);
  });

  block.textContent = '';
  block.append(table);
}
