/**
 * Decorates the utility navigation
 * @param {Element} block The utility navigation element
 */
export default function decorate(block) {
  // Clean up button classes
  block.querySelectorAll('.button-container').forEach((bc) => {
    bc.className = '';
  });
  block.querySelectorAll('.button').forEach((btn) => {
    btn.classList.remove('button');
  });
}
