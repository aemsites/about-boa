/*
 * Universal Editor support for the Cards block.
 * Handles DOM mutations when cards are edited in UE.
 */

import { moveInstrumentation } from '../../ue/scripts/ue-utils.js';

/**
 * Sets up mutation observer for cards block UE editing.
 * @param {Element} block The cards block element
 * @returns {MutationObserver} The observer instance
 */
export function setupObserver(block) {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type !== 'childList' || mutation.target.tagName !== 'DIV') return;

      const isCardsBlock = mutation.target.getAttribute('data-aue-model') === 'cards';
      const isCardImage = mutation.target.classList.contains('cards-card-image');

      if (isCardsBlock) {
        // Handle card div > li replacements
        const addedUl = [...mutation.addedNodes].find((node) => node.tagName === 'UL');
        if (addedUl) {
          const removedDivs = [...mutation.removedNodes].filter((node) => node.tagName === 'DIV');
          removedDivs.forEach((div, index) => {
            if (index < addedUl.children.length) {
              moveInstrumentation(div, addedUl.children[index]);
            }
          });
        }
      } else if (isCardImage) {
        // Handle card-image picture replacements
        const addedPicture = [...mutation.addedNodes].find((node) => node.tagName === 'PICTURE');
        const removedPicture = [...mutation.removedNodes].find((node) => node.tagName === 'PICTURE');
        if (addedPicture && removedPicture) {
          const oldImg = removedPicture.querySelector('img');
          const newImg = addedPicture.querySelector('img');
          if (oldImg && newImg) {
            moveInstrumentation(oldImg, newImg);
          }
        }
      }
    });
  });

  observer.observe(block, { childList: true, subtree: true });
  return observer;
}

/**
 * Handles UE ui-select events for cards.
 * Cards don't need special selection handling.
 */
export function onSelect() {
  // No-op for cards
}
