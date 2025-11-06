/**
 * Decorates the notification banner
 * @param {Element} block The notification element
 */
export default function decorate(block) {
  // Remove button-container class from links
  block.querySelectorAll('.button-container').forEach((bc) => {
    bc.className = '';
  });
  block.querySelectorAll('.button').forEach((btn) => {
    btn.classList.remove('button');
  });
}
