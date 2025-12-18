/*
 * Universal Editor support for the Carousel block.
 * Handles DOM mutations when carousel slides are edited in UE.
 */

import { moveInstrumentation } from '../../ue/scripts/ue-utils.js';
import { showSlide } from './carousel.js';

/**
 * Sets up mutation observer for carousel block UE editing.
 * @param {Element} block The carousel block element
 * @returns {MutationObserver} The observer instance
 */
export function setupObserver(block) {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type !== 'childList' || mutation.target.tagName !== 'DIV') return;
      if (mutation.target.getAttribute('data-aue-model') !== 'carousel') return;

      const removedItem = [...mutation.removedNodes].find(
        (node) => node.attributes?.['data-aue-model']?.value === 'carousel-item',
      );

      if (removedItem) {
        const resourceAttr = removedItem.getAttribute('data-aue-resource');
        if (resourceAttr) {
          const itemMatch = resourceAttr.match(/item-(\d+)/);
          if (itemMatch?.[1]) {
            const slideIndex = parseInt(itemMatch[1], 10);
            const slides = mutation.target.querySelectorAll('li.carousel-slide');
            const targetSlide = Array.from(slides).find(
              (slide) => parseInt(slide.getAttribute('data-slide-index'), 10) === slideIndex,
            );
            if (targetSlide) {
              moveInstrumentation(removedItem, targetSlide);
            }
          }
        }
      }
    });
  });

  observer.observe(block, { childList: true, subtree: true });
  return observer;
}

/**
 * Handles UE ui-select events for carousel.
 * Navigates to the selected slide.
 * @param {Element} block The carousel block element
 * @param {Element} element The selected element
 */
export function onSelect(block, element) {
  const index = element.getAttribute('data-slide-index');
  if (index) {
    // Find the carousel container (has the showSlide logic)
    const container = block.querySelector('.carousel-slides-container') || block;
    showSlide(container, parseInt(index, 10));
  }
}
