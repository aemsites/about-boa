export default async function decorate(block) {
  const errorBlocks = document.querySelectorAll('.block.authoring-error');
  if (errorBlocks.length === 0) {
    return;
  }

  // Create or get the fixed container
  let container = document.querySelector('.author-feedback-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'author-feedback-container';
    document.body.appendChild(container);
  }

  // Move block into container
  if (block.parentElement !== container) {
    container.appendChild(block);
  }

  block.classList.add('has-errors');

  const errorCount = errorBlocks.length;
  const countText = errorCount === 1 ? 'error' : 'errors';

  // Create button element
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'author-feedback-button';
  button.textContent = `${errorCount} ${countText}`;
  button.setAttribute('aria-label', `Show ${countText}`);

  block.replaceChildren(button);

  let currentErrorIndex = -1;

  function scrollToError(index) {
    const blockElement = errorBlocks[index];
    if (blockElement) {
      const blockRect = blockElement.getBoundingClientRect();
      const scrollOffset = blockRect.top + window.scrollY - 100; // 100px offset from top

      window.scrollTo({
        top: scrollOffset,
        behavior: 'smooth',
      });

      // Highlight the error block briefly
      blockElement.classList.add('author-error-active');
      setTimeout(() => {
        blockElement.classList.remove('author-error-active');
      }, 2000);
    }
  }

  // Click handler - scroll to next error
  button.addEventListener('click', () => {
    scrollToError(currentErrorIndex);
    // Move to next error (cycle back to first)
    currentErrorIndex = (currentErrorIndex + 1) % errorBlocks.length;
  });

  // Initialize - scroll to first error on first click
}
