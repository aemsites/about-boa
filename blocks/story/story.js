/**
 * Decorates the story block
 * A flexible content block that displays a story with image and content
 * Supports variants: bg-blue, bg-red, bg-white, align-left, align-right
 * @param {Element} block The story block element
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
  wrapper.className = 'story-inner-wrapper';

  // Create image container
  if (imageCell) {
    const imageContainer = document.createElement('div');
    imageContainer.className = 'story-image';
    imageContainer.append(imageCell.closest('div'));
    wrapper.append(imageContainer);
  }

  // Create content container
  const contentContainer = document.createElement('div');
  contentContainer.className = 'story-content';

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

  // Remove button styling from links
  const links = contentContainer.querySelectorAll('a');
  links.forEach((link) => {
    // Remove button class from link
    link.classList.remove('button');

    // Remove button-container class from parent paragraph
    if (link.parentElement.tagName === 'P') {
      link.parentElement.classList.remove('button-wrapper');
    }
  });
}
