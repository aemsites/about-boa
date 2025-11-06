/**
 * Decorates the brand logo
 * @param {Element} block The brand element
 */
export default function decorate(block) {
  const brandLink = block.querySelector('a');
  if (brandLink) {
    brandLink.className = 'nav-brand-link';
    const container = brandLink.closest('.button-container');
    if (container) container.className = '';
  }
}
