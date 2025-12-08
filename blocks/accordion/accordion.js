/**
 * Converts accordion rows into interactive details/summary elements
 * @param {Element} block The block containing accordion rows
 */
export function createAccordionItems(block) {
  [...block.children].forEach((row) => {
    // Create summary from first cell (label)
    const label = row.children[0];
    const summary = document.createElement('summary');
    summary.className = 'accordion-item-label';
    summary.append(...label.childNodes);

    // Create body from second cell (content)
    const body = row.children[1];
    body.className = 'accordion-item-body';

    // Create details element
    const details = document.createElement('details');
    details.className = 'accordion-item';
    details.append(summary, body);

    // Replace row with details
    row.replaceWith(details);
  });
}

/**
 * Decorates an accordion block by transforming rows into details/summary elements
 * @param {Element} block The accordion block element
 */
export default function decorate(block) {
  createAccordionItems(block);
}
