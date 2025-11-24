/**
 * Decorates the locator block
 * A flexible content block that displays location finder with image and content
 * Image position is preserved as authored on desktop, always on top on mobile
 * @param {Element} block The locator block element
 */
export default function decorate(block) {
  // Get all child divs (rows from the table)
  const rows = [...block.children];

  // Create wrapper structure
  const wrapper = document.createElement('div');
  wrapper.className = 'locator-inner-wrapper';

  // Process rows and cells in order to preserve authored position
  rows.forEach((row) => {
    const cells = [...row.children];
    cells.forEach((cell) => {
      const picture = cell.querySelector('picture');

      if (picture) {
        // Create image container
        const imageContainer = document.createElement('div');
        imageContainer.className = 'locator-image';
        imageContainer.append(cell);
        wrapper.append(imageContainer);
      } else if (cell.textContent.trim()) {
        // Create content container for non-empty content cells
        const contentContainer = document.createElement('div');
        contentContainer.className = 'locator-content';

        // Move cell contents into content container
        const cellContents = [...cell.children];
        cellContents.forEach((child) => {
          contentContainer.append(child);
        });

        wrapper.append(contentContainer);
      }
    });
  });

  // Clear block and add wrapper
  block.replaceChildren(wrapper);
}
