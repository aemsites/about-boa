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

  // decorate sections by their data-id attributes (already processed by section decoration)
  const sections = [...fragment.children];

  sections.forEach((section) => {
    // Get section ID from data-id attribute and add footer-prefixed class
    const sectionId = section.dataset.id;
    if (sectionId) {
      section.classList.add(`footer-${sectionId}`);
    }
  });

  // create two wrapper divs for different background sections
  const mainSection = document.createElement('div');
  mainSection.className = 'footer-main';
  const utilitySection = document.createElement('div');
  utilitySection.className = 'footer-utility';

  // move sections into appropriate wrapper
  sections.forEach((section) => {
    const sectionId = section.dataset.id;
    if (sectionId === 'quick-links' || sectionId === 'navigation') {
      mainSection.append(section);
    } else {
      utilitySection.append(section);
    }
  });

  const privacyLink = utilitySection.querySelector('a[href*="#lot"]');
  if (privacyLink) {
    privacyLink.className = '';
    privacyLink.addEventListener('click', (e) => {
      e.preventDefault();
      // open privacy modal
    });
  }

  block.replaceChildren(mainSection, utilitySection);
}
