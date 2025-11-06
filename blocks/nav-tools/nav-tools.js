/**
 * Toggles all nav tools
 * @param {Element} tools The container element
 * @param {Boolean} expanded Whether the element should be expanded or collapsed
 */
export function toggleAllNavTools(tools, expanded = false) {
  if (!tools) return;
  tools.querySelectorAll('.nav-tool-drop').forEach((tool) => {
    tool.setAttribute('aria-expanded', expanded);
  });
}

/**
 * Decorates the tools section (Help and Search)
 * @param {Element} block The tools element
 */
export default function decorate(block) {
  const toolItems = Array.from(block.children);

  toolItems.forEach((tool) => {
    tool.classList.add('nav-tool-item');
    const divs = Array.from(tool.children);

    if (divs.length === 0) return;

    // First div is the main link/icon
    const mainDiv = divs[0];
    mainDiv.classList.add('nav-tool-title');
    const mainLink = mainDiv.querySelector('a');
    if (mainLink) {
      mainLink.classList.remove('button');
      const container = mainLink.closest('.button-container');
      if (container) container.className = '';
    }

    // Second div contains dropdown content (for Help)
    if (divs.length > 1 && divs[1].textContent.trim()) {
      divs[1].classList.add('nav-tool-dropdown');
      tool.classList.add('nav-tool-drop');

      // Clean up button classes
      tool.querySelectorAll('.button-container').forEach((bc) => {
        bc.className = '';
      });
      tool.querySelectorAll('.button').forEach((btn) => {
        btn.classList.remove('button');
      });

      // Store click-outside handler reference for proper cleanup
      // This prevents memory leaks if the tool is removed from DOM
      let clickOutsideHandler = null;

      const attachClickOutside = () => {
        // Remove any existing handler first to prevent duplicates
        if (clickOutsideHandler) {
          document.removeEventListener('click', clickOutsideHandler);
        }

        clickOutsideHandler = (e) => {
          if (!tool.contains(e.target)) {
            tool.setAttribute('aria-expanded', 'false');
            document.removeEventListener('click', clickOutsideHandler);
            clickOutsideHandler = null;
          }
        };

        // Use setTimeout to avoid immediate triggering on the same click
        setTimeout(() => {
          document.addEventListener('click', clickOutsideHandler);
        }, 0);
      };

      // Add click handler for both desktop and mobile
      tool.addEventListener('click', (e) => {
        if (!e.target.closest('a')) {
          e.stopPropagation();
          const expanded = tool.getAttribute('aria-expanded') === 'true';
          toggleAllNavTools(block);
          const newState = expanded ? 'false' : 'true';
          tool.setAttribute('aria-expanded', newState);

          // Add click-outside listener when opened
          if (newState === 'true') {
            attachClickOutside();
          } else if (clickOutsideHandler) {
            document.removeEventListener('click', clickOutsideHandler);
            clickOutsideHandler = null;
          }
        }
      });

      tool.setAttribute('aria-expanded', 'false');
    }
  });
}
