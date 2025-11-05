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
    block.dataset.authorError = 'Highlight block requires both an image and content.';
    return;
  }

  // Handle image focus positioning
  [...block.classList].forEach((cls) => {
    if (cls.startsWith('img-focus-')) {
      const focusPosition = cls.replace('img-focus-', '');
      let focusValue;
      if (focusPosition.match(/^[0-9]+$/)) {
        focusValue = `${focusPosition}%`;
      } else if (focusPosition === 'left') {
        focusValue = '25%';
      } else if (focusPosition === 'right') {
        focusValue = '75%';
      } else {
        focusValue = 'center';
      }
      imageContainer.style.setProperty('--focus-position', focusValue);
    }
  });

  // Create the structure
  imageContainer.className = 'highlight-image';
  contentContainer.className = 'highlight-box-container';

  const boxContainer = document.createElement('div');
  boxContainer.className = 'highlight-box';
  boxContainer.append(contentContainer);

  block.replaceChildren(imageContainer, boxContainer);
}
