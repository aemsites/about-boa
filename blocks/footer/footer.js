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

  sections.forEach((section) => {
    // Get section ID from data-id attribute and add footer-prefixed class
    const sectionId = section.dataset.id;
    if (sectionId) {
      section.classList.add(`footer-${sectionId}`);
    }
  });

  block.append(footer);
}
