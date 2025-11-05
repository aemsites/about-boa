/**
 * Keep the button block visible in the parent window's viewport
 * when the page is in an iframe that's taller than the viewport
 * @param {HTMLElement} block The block element
 */
function keepButtonInView(block) {
  function updatePosition() {
    const iframe = window.frameElement;
    if (!iframe) return;

    // Get iframe's position in parent window
    const iframeRect = iframe.getBoundingClientRect();

    // Calculate where button should be positioned
    // Default: 1rem from top of iframe
    const defaultOffset = 16; // 1rem in pixels
    let topOffset = defaultOffset;

    // If iframe top is above viewport, adjust button to stay visible
    if (iframeRect.top < 0) {
      // Iframe is scrolled up, show button at top of visible area
      topOffset = Math.max(defaultOffset, -iframeRect.top + defaultOffset);
    }

    // Clamp to ensure button stays within iframe bounds
    const maxTop = iframeRect.height - 100; // Leave room for button
    topOffset = Math.min(topOffset, maxTop);

    block.style.top = `${topOffset}px`;
  }

  // Update on parent window scroll
  const parentWindow = window.parent;
  if (parentWindow) {
    parentWindow.addEventListener('scroll', updatePosition, { passive: true });
    parentWindow.addEventListener('resize', updatePosition, { passive: true });
  }

  // Update on iframe resize
  const resizeObserver = new ResizeObserver(updatePosition);
  resizeObserver.observe(document.body);

  // Initial update
  updatePosition();

  // Update periodically to catch any layout changes
  const interval = setInterval(updatePosition, 100);

  // Clean up on page unload
  window.addEventListener('beforeunload', () => {
    if (parentWindow) {
      parentWindow.removeEventListener('scroll', updatePosition);
      parentWindow.removeEventListener('resize', updatePosition);
    }
    resizeObserver.disconnect();
    clearInterval(interval);
  });
}

export default async function decorate(block) {
  const errorBlocks = document.querySelectorAll('.block.authoring-error');
  if (errorBlocks.length === 0) {
    return;
  }

  block.classList.add('has-errors');

  // Keep button visible in parent viewport if in iframe
  if (window.self !== window.top) {
    keepButtonInView(block);
  }

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
