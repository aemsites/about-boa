// media query match that indicates mobile/tablet width
const isDesktop = window.matchMedia('(min-width: 900px)');

/**
 * Toggles all nav sections
 * @param {Element} sections The container element
 * @param {Boolean} expanded Whether the element should be expanded or collapsed
 */
export function toggleAllNavSections(sections, expanded = false) {
  if (!sections) return;
  sections.querySelectorAll('.nav-section-item').forEach((section) => {
    section.setAttribute('aria-expanded', expanded);
  });
}

/**
 * Decorates the main navigation sections with mega menu
 * @param {Element} block The sections element
 */
export default function decorate(block) {
  const sections = Array.from(block.children);

  sections.forEach((section) => {
    section.classList.add('nav-section-item');
    const divs = Array.from(section.children);

    // Create content wrapper only for dropdowns
    const sectionContent = document.createElement('div');
    sectionContent.classList.add('nav-section-content');
    section.append(sectionContent);

    // First div is the main link
    const mainLinkDiv = divs[0];
    mainLinkDiv.classList.add('nav-section-title');
    const mainLink = mainLinkDiv.querySelector('a');
    if (mainLink) {
      mainLink.classList.remove('button');
      const container = mainLink.closest('.button-container');
      if (container) container.className = '';
    }

    // Second div contains sub-links
    if (divs.length > 1 && divs[1].textContent.trim()) {
      divs[1].classList.add('nav-section-links');
      section.classList.add('nav-drop');
      sectionContent.append(divs[1]);

      // Third div contains optional image and description
      if (divs.length > 2 && divs[2].textContent.trim()) {
        divs[2].classList.add('nav-section-feature');
        sectionContent.append(divs[2]);
      }

      // Clean up button classes in links
      section.querySelectorAll('.button-container').forEach((bc) => {
        bc.className = '';
      });
      section.querySelectorAll('.button').forEach((btn) => {
        btn.classList.remove('button');
      });

      // Store timeout reference for this specific section (closure scope)
      // Each section gets its own timeout variable, preventing race conditions
      let closeTimeout;

      // Add hover handlers for desktop
      section.addEventListener('mouseenter', () => {
        if (isDesktop.matches) {
          // Clear any pending close timeout
          if (closeTimeout) {
            clearTimeout(closeTimeout);
          }
          toggleAllNavSections(block);
          section.setAttribute('aria-expanded', 'true');
        }
      });

      section.addEventListener('mouseleave', () => {
        if (isDesktop.matches) {
          // Delay closing to allow mouse to move to dropdown
          closeTimeout = setTimeout(() => {
            section.setAttribute('aria-expanded', 'false');
          }, 150);
        }
      });

      // Add click handler for mobile
      section.addEventListener('click', (e) => {
        if (!isDesktop.matches) {
          if (e.target.closest('a')) {
            return;
          }
          e.stopPropagation();
          const expanded = section.getAttribute('aria-expanded') === 'true';
          section.setAttribute('aria-expanded', expanded ? 'false' : 'true');
        }
      });
    }
  });
}
