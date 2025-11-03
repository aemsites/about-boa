import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  // load footer as fragment
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/footer';
  const fragment = await loadFragment(footerPath);

  // decorate footer DOM
  block.textContent = '';
  const footer = document.createElement('div');
  while (fragment.firstElementChild) footer.append(fragment.firstElementChild);

  // decorate sections by their data-id attributes (already processed by section decoration)
  const sections = footer.querySelectorAll(':scope > div.section');
  const sectionIds = [];

  sections.forEach((section) => {
    // Get section ID from data-id attribute
    const sectionId = section.dataset.id;

    if (sectionId) {
      // Handle duplicate IDs by tracking occurrences
      const occurrenceCount = sectionIds.filter((id) => id === sectionId).length;
      sectionIds.push(sectionId);

      // Add appropriate class based on section ID and occurrence
      if (sectionId === 'company') {
        section.classList.add('footer-quick-links');
      } else if (sectionId === 'utility' && occurrenceCount === 0) {
        section.classList.add('footer-navigation');
      } else if (sectionId === 'disclaimer') {
        section.classList.add('footer-disclaimer');
      } else if (sectionId === 'utility' && occurrenceCount === 1) {
        section.classList.add('footer-legal');
      } else if (sectionId === 'social') {
        section.classList.add('footer-social');
      }
    }
  });

  block.append(footer);
}
