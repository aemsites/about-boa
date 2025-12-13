/**
 * Decorates the arts-masthead block
 * A hero-style masthead with title, description, program links and image grid
 * Layout: Stacked (mobile/tablet), side-by-side with gray panel (desktop)
 * @param {Element} block The arts-masthead block element
 */
export default function decorate(block) {
  // Get the row containing content and image
  const row = block.querySelector(':scope > div');
  if (!row) return;

  const cells = [...row.children];
  if (cells.length < 2) return;

  // First cell is content, second is image
  const contentCell = cells[0];
  const imageCell = cells[1];

  // Create wrapper structure
  const wrapper = document.createElement('div');
  wrapper.className = 'arts-masthead-inner';

  // Create content container
  const contentContainer = document.createElement('div');
  contentContainer.className = 'arts-masthead-content';

  // Move all content from the cell
  while (contentCell.firstChild) {
    contentContainer.append(contentCell.firstChild);
  }

  // Create image container
  const imageContainer = document.createElement('div');
  imageContainer.className = 'arts-masthead-image';

  // Move the picture element
  const picture = imageCell.querySelector('picture');
  if (picture) {
    imageContainer.append(picture);
  }

  // Assemble the structure
  wrapper.append(contentContainer, imageContainer);

  // Clear and rebuild block
  block.textContent = '';
  block.append(wrapper);

  // Remove button styling from links - they should be plain links
  const links = contentContainer.querySelectorAll('a');
  links.forEach((link) => {
    link.classList.remove('button');
    if (link.parentElement?.classList.contains('button-container')) {
      link.parentElement.classList.remove('button-container');
    }
  });
}
