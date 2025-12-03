import { createOptimizedPicture, loadCSS } from '../../scripts/aem.js';
import { openModal } from '../modal/modal.js';
// eslint-disable-next-line import/no-cycle
import { buildCarousel, updateCarousel } from '../carousel/carousel.js';

const BG_CLASSES = [
  'dark',
  'light',
];

/**
 * Get modal width class based on block variant
 * @param {Element} block - The content-card block element
 * @returns {string} Modal width class
 */
function getModalWidthClass(block) {
  const blockClasses = Array.from(block.classList);
  if (blockClasses.includes('grid')
    || blockClasses.includes('carousel')
    || blockClasses.includes('filter')) {
    return 'wide';
  }

  return 'narrow';
}

/**
 * Build a single content card element
 * @param {Element} row - The row element containing card data
 * @returns {Element} The card list item element
 */
export function buildContentCard(row, modalWidth = 'default', bg = 'dark') {
  // Load content-card base CSS for use in other contexts (e.g., carousel)
  loadCSS(`${window.hlx.codeBasePath}/blocks/content-card/content-card-base.css`);

  const li = document.createElement('li');
  li.classList.add('content-card-item');

  if (BG_CLASSES.includes(bg)) {
    li.classList.add(bg);
  }

  // Extract cells from row
  const cells = Array.from(row.children);
  let imageCell = null;
  let contentCell = null;
  let categoryCell = null;

  // Determine which cell contains what based on structure
  if (cells.length === 3) {
    // Three columns: image, content, and category
    [imageCell, contentCell, categoryCell] = cells;
  } else if (cells.length === 2) {
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

  // Store category data attribute if present (for filtering)
  // Third column is treated as metadata and not displayed
  if (categoryCell) {
    const categoryText = categoryCell.textContent.trim();
    if (categoryText) {
      li.dataset.category = categoryText;
    }
  }

  return li;
}

/**
 * Decorate the content-card block
 * @param {Element} block - The content-card block element
 */
export default async function decorate(block) {
  // Check if any row has 3 columns (filterable variant)
  const hasFilterColumn = [...block.children].some((row) => row.children.length === 3);
  // Add filter class if block has filterable content
  if (hasFilterColumn) {
    block.classList.add('filter');
  }

  const bg = block.classList.contains('light') ? 'light' : 'dark';
  const modalWidthClass = getModalWidthClass(block);
  // Convert rows to list items
  const ul = document.createElement('ul');
  ul.classList.add('content-card-list');

  [...block.children].forEach((row) => {
    const li = buildContentCard(row, modalWidthClass, bg);
    ul.append(li);
  });

  block.replaceChildren(ul);

  const isCarousel = block.classList.contains('carousel');
  if (isCarousel) {
    const container = await buildCarousel(ul);

    const isDesktop = window.matchMedia('(min-width: 900px)');
    const isTablet = window.matchMedia('(min-width: 600px)');

    if (isDesktop.matches) {
      updateCarousel(container, { slidesPerView: 3 });
    } else if (isTablet.matches) {
      updateCarousel(container, { slidesPerView: 2 });
    } else {
      updateCarousel(container, { slidesPerView: 1 });
    }

    // Update on resize
    window.addEventListener('resize', () => {
      if (isDesktop.matches) {
        updateCarousel(container, { slidesPerView: 3 });
      } else if (isTablet.matches) {
        updateCarousel(container, { slidesPerView: 2 });
      } else {
        updateCarousel(container, { slidesPerView: 1 });
      }
    });
  }
}
