import { getMetadata } from '../../scripts/aem.js';
import { decorateIcons } from '../../scripts/scripts.js';
import { loadFragment } from '../fragment/fragment.js';
import { toggleAllNavSections } from '../nav-sections/nav-sections.js';
import { toggleAllNavTools } from '../nav-tools/nav-tools.js';

// media query match that indicates mobile/tablet width
const isDesktop = window.matchMedia('(min-width: 900px)');

/**
 * Creates the mobile search overlay panel
 * @param {Element} navBrand The nav brand element containing the logo
 * @returns {Element} The search overlay element
 */
function createSearchOverlay(navBrand) {
  const overlay = document.createElement('div');
  overlay.className = 'nav-search-overlay';
  overlay.setAttribute('aria-hidden', 'true');

  // Create header with back, logo, and close
  const header = document.createElement('div');
  header.className = 'nav-search-header';

  // Back button
  const backButton = document.createElement('button');
  backButton.className = 'nav-search-back';
  backButton.setAttribute('type', 'button');
  backButton.setAttribute('aria-label', 'Back to menu');

  // Logo (clone from nav-brand)
  const logo = document.createElement('div');
  logo.className = 'nav-search-logo';
  const brandLink = navBrand?.querySelector('a');
  if (brandLink) {
    const logoClone = brandLink.cloneNode(true);
    logoClone.removeAttribute('href');
    logoClone.setAttribute('aria-hidden', 'true');
    logo.appendChild(logoClone);
  }

  // Close button
  const closeButton = document.createElement('button');
  closeButton.className = 'nav-search-close';
  closeButton.setAttribute('type', 'button');
  closeButton.setAttribute('aria-label', 'Close menu');

  header.append(backButton, logo, closeButton);

  // Create search form
  const form = document.createElement('form');
  form.className = 'nav-search-form';
  form.setAttribute('role', 'search');
  form.setAttribute('action', '/en/search');

  const inputWrapper = document.createElement('div');
  inputWrapper.className = 'nav-search-input-wrapper';

  const input = document.createElement('input');
  input.type = 'search';
  input.name = 'q';
  input.className = 'nav-search-input';
  input.placeholder = 'Enter Search Keywords';
  input.setAttribute('aria-label', 'Search');

  const submitButton = document.createElement('button');
  submitButton.type = 'submit';
  submitButton.className = 'nav-search-submit';
  submitButton.setAttribute('aria-label', 'Submit search');
  submitButton.innerHTML = '<span class="icon icon-search"></span>';

  inputWrapper.append(input, submitButton);
  form.append(inputWrapper);

  overlay.append(header, form);

  // Decorate icons (double-decoration check in decorateIcons prevents logo duplication)
  decorateIcons(overlay);

  return overlay;
}

/**
 * Opens the search overlay
 * @param {Element} overlay The search overlay element
 * @param {Element} [triggerButton] The button that triggered the overlay (for aria-expanded)
 */
function openSearchOverlay(overlay, triggerButton) {
  overlay.inert = false;
  overlay.setAttribute('aria-hidden', 'false');
  if (triggerButton) {
    triggerButton.setAttribute('aria-expanded', 'true');
    triggerButton.setAttribute('aria-label', 'Close search');
  }
  const input = overlay.querySelector('.nav-search-input');
  // Focus the input after transition
  setTimeout(() => input?.focus(), 300);
}

/**
 * Closes the search overlay and returns focus to the trigger
 * @param {Element} overlay The search overlay element
 * @param {Element} [focusTarget] Element to focus after closing
 */
function closeSearchOverlay(overlay, focusTarget) {
  // Move focus out before hiding to avoid aria-hidden focus trap warning
  if (focusTarget) {
    focusTarget.setAttribute('aria-expanded', 'false');
    focusTarget.setAttribute('aria-label', 'Open search');
    focusTarget.focus();
  }
  overlay.setAttribute('aria-hidden', 'true');
  overlay.inert = true;
  const input = overlay.querySelector('.nav-search-input');
  if (input) input.value = '';
}

/**
 * Sets up search overlay event handlers
 * @param {Element} overlay The search overlay element
 * @param {Element} nav The nav element
 * @param {Element} navSections The nav sections element
 * @param {Function} getFocusTarget Function that returns the button to focus after closing
 * @param {Function} toggleMenuFn The toggle menu function
 */
function setupSearchOverlayHandlers(overlay, nav, navSections, getFocusTarget, toggleMenuFn) {
  const backButton = overlay.querySelector('.nav-search-back');
  const closeButton = overlay.querySelector('.nav-search-close');
  const form = overlay.querySelector('.nav-search-form');

  // Back button returns to main menu (mobile) or closes overlay (desktop)
  backButton?.addEventListener('click', () => {
    closeSearchOverlay(overlay, getFocusTarget());
  });

  // Close button closes entire menu
  closeButton?.addEventListener('click', () => {
    const hamburger = nav.querySelector('.nav-hamburger button');
    closeSearchOverlay(overlay, hamburger);
    toggleMenuFn(nav, navSections, false);
  });

  // Form submission navigates to search page
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = form.querySelector('.nav-search-input');
    const query = input?.value?.trim();
    if (query) {
      window.location.href = `/en/search?q=${encodeURIComponent(query)}`;
    }
  });

  // Close on escape - return to menu/close overlay
  overlay.addEventListener('keydown', (e) => {
    if (e.code === 'Escape') {
      e.stopPropagation();
      closeSearchOverlay(overlay, getFocusTarget());
    }
  });
}

function closeOnEscape(e) {
  if (e.code === 'Escape') {
    const nav = document.getElementById('nav');
    const navSections = nav.querySelector('.nav-sections');
    const navTools = nav.querySelector('.nav-tools');
    const navSectionExpanded = navSections?.querySelector('[aria-expanded="true"]');
    const navToolsExpanded = navTools?.querySelector('[aria-expanded="true"]');

    if ((navSectionExpanded || navToolsExpanded) && isDesktop.matches) {
      if (navSections) {
        toggleAllNavSections(navSections);
      }
      if (navTools) {
        toggleAllNavTools(navTools);
      }
      (navSectionExpanded || navToolsExpanded)?.focus();
    } else if (!isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleMenu(nav, navSections);
      nav.querySelector('button')?.focus();
    }
  }
}

function openOnKeydown(e) {
  const focused = document.activeElement;
  const isNavDrop = focused.classList.contains('nav-drop');

  if (isNavDrop && (e.code === 'Enter' || e.code === 'Space')) {
    const dropExpanded = focused.getAttribute('aria-expanded') === 'true';
    // eslint-disable-next-line no-use-before-define
    toggleAllNavSections(focused.closest('.nav-sections'));
    focused.setAttribute('aria-expanded', dropExpanded ? 'false' : 'true');
  }
}

function focusNavSection() {
  document.activeElement.addEventListener('keydown', openOnKeydown);
}

/**
 * Toggles the entire nav
 * @param {Element} nav The container element
 * @param {Element} navSections The nav sections within the container element
 * @param {*} forceExpanded Optional param to force nav expand behavior when not null
 */
function toggleMenu(nav, navSections, forceExpanded = null) {
  const expanded = forceExpanded !== null ? !forceExpanded : nav.getAttribute('aria-expanded') === 'true';
  const button = nav.querySelector('.nav-hamburger button');
  document.body.style.overflowY = (expanded || isDesktop.matches) ? '' : 'hidden';
  nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  button?.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');

  // Prevent focus on nav-sections content when menu is closed on mobile
  if (navSections) {
    const isMenuOpen = nav.getAttribute('aria-expanded') === 'true';
    navSections.inert = !isDesktop.matches && !isMenuOpen;

    // Move focus to first menu item when opening on mobile
    if (isMenuOpen && !isDesktop.matches) {
      const firstFocusable = navSections.querySelector('a, button');
      firstFocusable?.focus();
    }
  }

  // enable nav dropdown keyboard accessibility
  const navDrops = navSections?.querySelectorAll('.nav-drop') || [];
  if (isDesktop.matches) {
    navDrops.forEach((drop) => {
      if (!drop.hasAttribute('tabindex')) {
        drop.setAttribute('tabindex', 0);
        drop.addEventListener('focus', focusNavSection);
      }
    });
  } else {
    navDrops.forEach((drop) => {
      drop.removeAttribute('tabindex');
      drop.removeEventListener('focus', focusNavSection);
    });
  }

  // enable menu collapse on escape keypress
  if (!expanded || isDesktop.matches) {
    // collapse menu on escape press
    window.addEventListener('keydown', closeOnEscape);
  } else {
    window.removeEventListener('keydown', closeOnEscape);
  }
}

/**
 * Handle scroll behavior for sticky navigation
 * @param {Element} navWrapper The nav wrapper element
 * @param {Element} navNotification The notification banner element
 * @param {Element} navUtility The utility nav element
 */
function handleStickyNav(navWrapper, navNotification, navUtility) {
  let lastScrollY = window.scrollY;
  const stickyClass = 'nav-wrapper-sticky';

  // Calculate the height of elements that should scroll away
  const getScrollThreshold = () => {
    let threshold = 0;
    if (navNotification) {
      threshold += navNotification.offsetHeight;
    }
    if (navUtility) {
      threshold += navUtility.offsetHeight;
    }
    return threshold;
  };

  const updateStickyState = () => {
    const { scrollY } = window;
    const threshold = getScrollThreshold();

    if (scrollY > threshold && scrollY > lastScrollY) {
      // Scrolling down past threshold - make sticky
      navWrapper.classList.add(stickyClass);
      navWrapper.style.setProperty('--nav-menu-top', `${navWrapper.offsetHeight}px`);
    } else if (scrollY <= threshold) {
      // Scrolled back to top - remove sticky
      navWrapper.classList.remove(stickyClass);
      navWrapper.style.setProperty('--nav-menu-top', `${navWrapper.offsetHeight - scrollY}px`);
    }

    lastScrollY = scrollY;
  };

  window.addEventListener('scroll', updateStickyState, { passive: true });

  // Check initial state
  setTimeout(() => {
    updateStickyState();
  }, 100);
}

/**
 * loads and decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  // load nav as fragment
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  const fragment = await loadFragment(navPath);

  // decorate nav DOM
  block.textContent = '';
  const nav = document.createElement('nav');
  nav.id = 'nav';

  // Move all fragment children to nav
  while (fragment.firstElementChild) {
    nav.append(fragment.firstElementChild);
  }

  // Create main nav container for brand, sections, and tools
  const mainNav = document.createElement('div');
  mainNav.className = 'nav-main';

  // Identify each section
  const navBrand = nav.querySelector('.nav-brand');
  const navSections = nav.querySelector('.nav-sections');
  const navTools = nav.querySelector('.nav-tools');
  const navUtility = nav.querySelector('.nav-utility');

  // Decorate brand block
  if (navBrand) {
    mainNav.append(navBrand);
  }

  // Decorate sections block
  if (navSections) {
    mainNav.append(navSections);
  }

  // Decorate tools block
  if (navTools) {
    mainNav.append(navTools);

    const navToolsClone = navTools.cloneNode(true);
    navToolsClone.querySelectorAll('.nav-tool-item').forEach((utilityItem) => {
      const sectionItem = document.createElement('div');
      sectionItem.classList.add('nav-section-item', 'nav-drop', 'mobile-only');
      const sectionTitle = document.createElement('div');
      sectionTitle.classList.add('nav-section-title');
      const toolTitle = utilityItem.querySelector('.nav-tool-title');
      if (toolTitle) {
        const titleClone = toolTitle.cloneNode(true);
        // Remove desktop toggle button if present (we'll use mobile expand button instead)
        const toggleButton = titleClone.querySelector('.nav-tool-toggle');
        if (toggleButton) {
          // Extract text from toggle button and create a simple text node
          const titleText = document.createElement('span');
          titleText.textContent = toggleButton.textContent;
          titleClone.replaceChild(titleText, toggleButton);
        }
        sectionTitle.replaceChildren(...titleClone.children);
      }
      sectionItem.append(sectionTitle);

      const sectionContent = document.createElement('div');
      sectionContent.classList.add('nav-section-content');
      const toolDropdown = utilityItem.querySelector('.nav-tool-dropdown');
      if (toolDropdown) {
        sectionContent.replaceChildren(...toolDropdown.cloneNode(true).children);
      }
      sectionItem.append(sectionContent);

      const searchIcon = sectionItem.querySelector('.icon-search');
      if (searchIcon) {
        // Create a button for the search trigger
        const searchButton = document.createElement('button');
        searchButton.type = 'button';
        searchButton.className = 'nav-section-search';
        searchButton.setAttribute('aria-label', 'Open search');

        // Move icon into button and add text
        searchButton.append(searchIcon.cloneNode(true));
        const searchText = document.createElement('span');
        searchText.classList.add('search-text');
        searchText.textContent = 'Search';
        searchButton.append(searchText);

        // Replace the paragraph content with the button
        sectionTitle.innerHTML = '';
        sectionTitle.append(searchButton);

        sectionItem.classList.add('has-search');

        // Mark this as the search trigger - overlay will be set up after nav is complete
        sectionItem.dataset.searchTrigger = 'true';
      } else {
        // Add expand/collapse button for mobile accordion
        const expandButton = document.createElement('button');
        expandButton.type = 'button';
        expandButton.className = 'nav-section-expand';
        expandButton.setAttribute('aria-expanded', 'false');
        expandButton.setAttribute('aria-label', 'Expand section');
        sectionItem.querySelector('.nav-section-title').append(expandButton);

        expandButton.addEventListener('click', (e) => {
          e.stopPropagation();
          const expanded = sectionItem.getAttribute('aria-expanded') === 'true';
          sectionItem.setAttribute('aria-expanded', expanded ? 'false' : 'true');
          expandButton.setAttribute('aria-expanded', expanded ? 'false' : 'true');
          expandButton.setAttribute('aria-label', expanded ? 'Expand section' : 'Collapse section');
        });
      }

      navSections?.append(sectionItem);
    });
  }

  if (navUtility) {
    const navUtilityClone = navUtility.cloneNode(true);
    navUtilityClone.classList.add('mobile-only');
    navSections?.append(navUtilityClone);
  }

  // Add main nav to nav element
  nav.append(mainNav);

  // hamburger for mobile
  const hamburger = document.createElement('div');
  hamburger.classList.add('nav-hamburger');
  hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-label="Open navigation">
      <span class="nav-hamburger-icon"></span>
    </button>`;
  hamburger.addEventListener('click', () => toggleMenu(nav, navSections));
  mainNav.append(hamburger);
  nav.setAttribute('aria-expanded', 'false');

  // prevent mobile nav behavior on window resize
  toggleMenu(nav, navSections, isDesktop.matches);
  isDesktop.addEventListener('change', () => toggleMenu(nav, navSections, isDesktop.matches));

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.append(navWrapper);

  // Initialize sticky navigation behavior
  const navNotification = nav.querySelector('.nav-notification');
  const navUtilityElement = nav.querySelector('.nav-utility:not(.mobile-only)');
  handleStickyNav(navWrapper, navNotification, navUtilityElement);

  // Set up search overlay (shared by mobile and desktop)
  const searchTriggerItem = navSections?.querySelector('[data-search-trigger="true"]');
  const desktopSearchButton = navTools?.querySelector('.nav-tool-search');

  if (searchTriggerItem || desktopSearchButton) {
    const mobileSearchButton = searchTriggerItem?.querySelector('.nav-section-search');
    const searchOverlay = createSearchOverlay(navBrand);
    searchOverlay.inert = true; // Start hidden/inert

    // Append overlay to nav (parent of both navSections and navTools)
    nav.append(searchOverlay);

    // Determine which button to focus when closing based on viewport
    const getFocusTarget = () => (isDesktop.matches ? desktopSearchButton : mobileSearchButton);

    setupSearchOverlayHandlers(searchOverlay, nav, navSections, getFocusTarget, toggleMenu);

    // Mobile search trigger
    if (searchTriggerItem) {
      searchTriggerItem.addEventListener('click', (e) => {
        if (!isDesktop.matches) {
          e.stopPropagation();
          openSearchOverlay(searchOverlay);
        }
      });
    }

    // Desktop search trigger (toggles open/close)
    if (desktopSearchButton) {
      desktopSearchButton.setAttribute('aria-expanded', 'false');
      desktopSearchButton.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = searchOverlay.getAttribute('aria-hidden') === 'false';
        if (isOpen) {
          closeSearchOverlay(searchOverlay, desktopSearchButton);
        } else {
          openSearchOverlay(searchOverlay, desktopSearchButton);
        }
      });
    }
  }
}
