/*
 * Universal Editor support for the Accordion block.
 * Handles DOM mutations when accordion items are edited in UE.
 */

import { moveInstrumentation } from '../../ue/scripts/ue-utils.js';

/**
 * Sets up mutation observer for accordion block UE editing.
 * @param {Element} block The accordion block element
 * @returns {MutationObserver} The observer instance
 */
export function setupObserver(block) {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type !== 'childList' || mutation.target.tagName !== 'DIV') return;
      if (mutation.target.getAttribute('data-aue-model') !== 'accordion') return;

      const addedDetails = [...mutation.addedNodes].find((node) => node.tagName === 'DETAILS');
      const removedDiv = [...mutation.removedNodes].find((node) => node.tagName === 'DIV');

      if (addedDetails && removedDiv) {
        moveInstrumentation(removedDiv, addedDetails);
        const removedInnerDiv = removedDiv.querySelector('div');
        const addedSummary = addedDetails.querySelector('summary');
        if (removedInnerDiv && addedSummary) {
          moveInstrumentation(removedInnerDiv, addedSummary);
        }
      }
    });
  });

  observer.observe(block, { childList: true, subtree: true });
  return observer;
}

/**
 * Handles UE ui-select events for accordion.
 * Opens the selected accordion item.
 * @param {Element} block The accordion block element
 * @param {Element} element The selected element
 */
export function onSelect(block, element) {
  // Close all accordion items
  block.querySelectorAll('details').forEach((details) => {
    details.open = false;
  });
  // Open the selected item
  if (element.tagName === 'DETAILS') {
    element.open = true;
  } else {
    const details = element.closest('details');
    if (details) details.open = true;
  }
}
