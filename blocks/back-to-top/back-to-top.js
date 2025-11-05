import fetchLangPlaceholders from '../../scripts/placeholders.js';

/**
 * Decorate the back-to-top block
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  // Fetch placeholders
  const placeholders = await fetchLangPlaceholders();

  // Create button element
  const button = document.createElement('button');
  button.className = 'back-to-top-button';
  button.setAttribute('type', 'button');
  button.setAttribute('aria-label', placeholders.backToTop || 'Back to top');

  // Create text span
  const text = document.createElement('span');
  text.className = 'back-to-top-text';
  text.textContent = placeholders.top || 'TOP';

  button.appendChild(text);

  // Scroll to top handler
  button.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  });

  const footer = document.querySelector('footer');
  if (footer) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          block.classList.add('visible');
        } else {
          block.classList.remove('visible');
        }
      });
    }, {
      rootMargin: '300px',
    });
    observer.observe(footer);
  }

  block.replaceChildren(button);
}
