/**
 * Toggles all nav tools
 * @param {Element} tools The container element
 * @param {Boolean} expanded Whether the element should be expanded or collapsed
 */
export function toggleAllNavTools(tools, expanded = false) {
  if (!tools) return;
  tools.querySelectorAll('.nav-tool-drop').forEach((tool) => {
    tool.setAttribute('aria-expanded', expanded);
    const button = tool.querySelector('.nav-tool-toggle');
    if (button) {
      button.setAttribute('aria-expanded', expanded);
    }
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

    // Check if this is a search icon (single div with icon, no dropdown)
    const searchIcon = mainDiv.querySelector('.icon-search');
    if (searchIcon && (divs.length === 1 || !divs[1]?.textContent.trim())) {
      // Create a button for the search trigger
      const searchButton = document.createElement('button');
      searchButton.type = 'button';
      searchButton.className = 'nav-tool-search';
      searchButton.setAttribute('aria-label', 'Open search');

      // Move icon into button
      searchButton.append(searchIcon.cloneNode(true));
      mainDiv.innerHTML = '';
      mainDiv.append(searchButton);

      tool.classList.add('nav-tool-search-item');
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

      // Create toggle button for keyboard accessibility
      const toggleButton = document.createElement('button');
      toggleButton.type = 'button';
      toggleButton.className = 'nav-tool-toggle';
      toggleButton.setAttribute('aria-expanded', 'false');
      toggleButton.setAttribute('aria-haspopup', 'true');
      toggleButton.setAttribute('aria-label', `${mainDiv.textContent.trim()} menu`);
      toggleButton.textContent = mainDiv.textContent.trim();

      // Replace title content with button
      mainDiv.textContent = '';
      mainDiv.append(toggleButton);

      // Store click-outside handler reference for proper cleanup
      let clickOutsideHandler = null;

      const attachClickOutside = () => {
        if (clickOutsideHandler) {
          document.removeEventListener('click', clickOutsideHandler);
        }

        clickOutsideHandler = (e) => {
          if (!tool.contains(e.target)) {
            tool.setAttribute('aria-expanded', 'false');
            toggleButton.setAttribute('aria-expanded', 'false');
            document.removeEventListener('click', clickOutsideHandler);
            clickOutsideHandler = null;
          }
        };

        setTimeout(() => {
          document.addEventListener('click', clickOutsideHandler);
        }, 0);
      };

      // Toggle handler
      const toggle = () => {
        const expanded = tool.getAttribute('aria-expanded') === 'true';
        toggleAllNavTools(block);
        const newState = expanded ? 'false' : 'true';
        tool.setAttribute('aria-expanded', newState);
        toggleButton.setAttribute('aria-expanded', newState);

        if (newState === 'true') {
          attachClickOutside();
        } else if (clickOutsideHandler) {
          document.removeEventListener('click', clickOutsideHandler);
          clickOutsideHandler = null;
        }
      };

      toggleButton.addEventListener('click', (e) => {
        e.stopPropagation();
        toggle();
      });

      tool.setAttribute('aria-expanded', 'false');
    }
  });
}
