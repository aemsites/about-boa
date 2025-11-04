/**
 * Decorates the notched image block
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  // Get the image and content from the block cells
  const rows = [...block.children];
  const imageCell = rows[0]?.children[0];
  const contentCell = rows[0]?.children[1];

  if (!imageCell || !contentCell) {
    return;
  }

  // Clear the block
  block.innerHTML = '';

  // Create the image container (full-bleed background)
  const imageContainer = document.createElement('div');
  imageContainer.className = 'notched-image-image';
  const img = imageCell.querySelector('img');
  if (img) {
    imageContainer.appendChild(img);
  }

  // Create the content container (notched panel)
  const contentContainer = document.createElement('div');
  contentContainer.className = 'notched-image-content';
  contentContainer.append(...contentCell.children);

  // Add both to the block
  block.appendChild(imageContainer);
  block.appendChild(contentContainer);
}
