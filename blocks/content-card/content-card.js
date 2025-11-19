import { createOptimizedPicture, loadCSS } from '../../scripts/aem.js';
import { openModal } from '../modal/modal.js';

/**
 * Get modal width class based on block variant
 * @param {Element} block - The content-card block element
 * @returns {string} Modal width class
 */
function getModalWidthClass(block) {
  const blockClasses = Array.from(block.classList);
  if (blockClasses.includes('small')) return 'modal-small';
  if (blockClasses.includes('large')) return 'modal-large';
  if (blockClasses.includes('full')) return 'modal-full';
  return 'modal-default';
}

/**
 * Build a single content card element
 * @param {Element} row - The row element containing card data
 * @returns {Element} The card list item element
 */
export function buildContentCard(row, modalWidth = 'default') {
  // Load content-card base CSS for use in other contexts (e.g., carousel)
  loadCSS(`${window.hlx.codeBasePath}/blocks/content-card/content-card-base.css`);

  const li = document.createElement('li');
  li.classList.add('content-card-item');

  // Extract cells from row
  const cells = Array.from(row.children);
  let imageCell = null;
  let contentCell = null;

  // Determine which cell contains what based on structure
  if (cells.length === 2) {
    // Two columns: image (optional) and content
    [imageCell, contentCell] = cells;
  } else if (cells.length === 1) {
    // Single column: just content (no image)
    [contentCell] = cells;
  }

  // Process image if present
  if (imageCell && imageCell.querySelector('picture')) {
    const imageDiv = document.createElement('div');
    imageDiv.className = 'content-card-image';
    const picture = imageCell.querySelector('picture');

    if (picture) {
      const img = picture.querySelector('img');
      if (img) {
        const optimizedPicture = createOptimizedPicture(
          img.src,
          img.alt,
          false,
        );
        imageDiv.append(optimizedPicture);
      }
    }
    li.append(imageDiv);
  }

  // Process content cell
  if (contentCell) {
    const contentDiv = document.createElement('div');
    contentDiv.className = 'content-card-body';

    contentDiv.append(...contentCell.childNodes);
    li.append(contentDiv);

    const links = contentDiv.querySelectorAll('a');
    const modalLink = [...links].find((link) => link.href.includes('/modals/'));

    // Make the entire card clickable
    if (modalLink) {
      const modalPath = modalLink.getAttribute('href');
      modalLink.remove();

      li.classList.add('has-modal');
      li.setAttribute('role', 'button');
      li.setAttribute('tabindex', '0');
      li.style.cursor = 'pointer';

      li.addEventListener('click', (e) => {
        e.preventDefault();
        openModal(modalPath, modalWidth);
      });

      li.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openModal(modalPath, modalWidth);
        }
      });
    }
  }

  return li;
}

/**
 * Decorate the content-card block
 * @param {Element} block - The content-card block element
 */
export default function decorate(block) {
  const modalWidthClass = getModalWidthClass(block);

  // Convert rows to list items
  const ul = document.createElement('ul');
  ul.classList.add('content-card-list');

  [...block.children].forEach((row) => {
    const li = buildContentCard(row, modalWidthClass);
    ul.append(li);
  });

  block.replaceChildren(ul);
}
