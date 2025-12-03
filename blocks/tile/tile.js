import { createOptimizedPicture } from '../../scripts/aem.js';
import { buildCarousel, updateCarousel } from '../carousel/carousel.js';

/**
 * Decorate the tile block
 * @param {Element} block the block
 */
export default async function decorate(block) {
  // Transform block structure to ul/li
  const ul = document.createElement('ul');
  ul.classList.add('tile-slides');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    li.classList.add('tile-item');

    while (row.firstElementChild) li.append(row.firstElementChild);

    // Add semantic classes to child divs
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) {
        div.className = 'tile-item-image';
      } else {
        div.className = 'tile-item-body';
      }
    });

    ul.append(li);
  });

  // Optimize images
  ul.querySelectorAll('picture > img').forEach((img) => {
    img.closest('picture').replaceWith(
      createOptimizedPicture(img.src, img.alt, false, [{ width: '600' }]),
    );
  });

  // Replace block content with transformed structure
  block.replaceChildren(ul);

  // Build carousel on mobile (will be hidden on desktop via CSS)
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
