/**
 * Decorates the locator block
 * A flexible content block that displays location finder with image and content
 * Supports variants: img-right-align (image on right on desktop)
 * Default: image on left on desktop, always on top on mobile
 * @param {Element} block The locator block element
 */
export default function decorate(block) {
  // Get all child divs (rows from the table)
  const rows = [...block.children];

  // Find image and content
  const imageCell = block.querySelector('picture');
  const contentCells = [];

  rows.forEach((row) => {
    const cells = [...row.children];
    cells.forEach((cell) => {
      if (!cell.querySelector('picture')) {
        contentCells.push(cell);
      }
    });
  });

  // Create wrapper structure
  const wrapper = document.createElement('div');
  wrapper.className = 'locator-inner-wrapper';

  // Create image container
  if (imageCell) {
    const imageContainer = document.createElement('div');
    imageContainer.className = 'locator-image';
    imageContainer.append(imageCell.closest('div'));
    wrapper.append(imageContainer);
  }

  // Create content container
  const contentContainer = document.createElement('div');
  contentContainer.className = 'locator-content';

  // Move all content cells into content container
  contentCells.forEach((cell) => {
    const cellContents = [...cell.children];
    cellContents.forEach((child) => {
      contentContainer.append(child);
    });
  });

  wrapper.append(contentContainer);

  // Clear block and add wrapper
  block.textContent = '';
  block.append(wrapper);
}
