/**
 * Decorates the notched image block
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  // Get the image and content from the block cells
  let imageContainer;
  let contentContainer;
  let additionalCells = false;
  let hasNoImage = false;

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

  if (block.classList.contains('masthead') && !imageContainer) {
    hasNoImage = true;
    block.classList.add('no-image');
  }

  if ((!hasNoImage && !imageContainer) || !contentContainer || additionalCells) {
    block.classList.add('authoring-error');
    block.dataset.authorError = 'Notched Image block requires both an image and content.';
    return;
  }

  if (!hasNoImage) {
    let focusValue = 'center';
    const img = imageContainer.querySelector('img');
    const { title } = img.dataset;
    if (!title?.includes('data-focal')) return;
    delete img.dataset.title;
    const [x, y] = title.split(':')[1].split(',');
    focusValue = `${x}% ${y}%`;
    imageContainer.style.setProperty('--focus-position', focusValue);

    imageContainer.className = 'notched-image-image';
  }

  contentContainer.className = 'notched-image-content';
  const contentInner = document.createElement('div');
  contentInner.className = 'notched-image-content-inner';
  contentInner.append(...contentContainer.children);
  contentContainer.replaceChildren(contentInner);

  block.replaceChildren(hasNoImage ? contentContainer : imageContainer, contentContainer);
}
