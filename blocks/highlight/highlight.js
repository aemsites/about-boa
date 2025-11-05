/**
 * Decorates the highlight block
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  // Get the image and content from the block cells
  let imageContainer;
  let contentContainer;
  let additionalCells = false;

  [...block.children].forEach((row) => {
    [...row.children].forEach((cell) => {
      if (cell.querySelector('picture')) {
        if (imageContainer) {
          additionalCells = true;
        }
        imageContainer = cell;
      } else {
        if (contentContainer) {
          additionalCells = true;
        }
        contentContainer = cell;
      }
    });
  });

  if (!imageContainer || !contentContainer || additionalCells) {
    block.classList.add('authoring-error');
    return;
  }

  // Create the structure
  imageContainer.className = 'highlight-image';
  contentContainer.className = 'highlight-box';

  // Wrap the content in an inner container for styling
  const contentInner = document.createElement('div');
  contentInner.className = 'highlight-box-inner';
  contentInner.append(...contentContainer.children);
  contentContainer.replaceChildren(contentInner);

  // Create a container wrapper for positioning
  const container = document.createElement('div');
  container.className = 'highlight-container';

  const boxContainer = document.createElement('div');
  boxContainer.className = 'highlight-box-container';
  boxContainer.append(contentContainer);

  container.append(imageContainer, boxContainer);
  block.replaceChildren(container);
}
