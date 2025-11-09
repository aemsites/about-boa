import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';
import { toggleAllNavSections } from '../nav-sections/nav-sections.js';
import { toggleAllNavTools } from '../nav-tools/nav-tools.js';

// media query match that indicates mobile/tablet width
const isDesktop = window.matchMedia('(min-width: 900px)');

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
  const isNavToolDrop = focused.classList.contains('nav-tool-drop');

  if ((isNavDrop || isNavToolDrop) && (e.code === 'Enter' || e.code === 'Space')) {
    const dropExpanded = focused.getAttribute('aria-expanded') === 'true';
    if (isNavDrop && focused.closest('.nav-sections')) {
      // eslint-disable-next-line no-use-before-define
      toggleAllNavSections(focused.closest('.nav-sections'));
    } else if (focused.closest('.nav-tools')) {
      // eslint-disable-next-line no-use-before-define
      toggleAllNavTools(focused.closest('.nav-tools'));
    }
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
  const stickyClass = 'nav-wrapper--sticky';

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
    const scrollY = window.scrollY;
    const threshold = getScrollThreshold();

    if (scrollY > threshold && scrollY > lastScrollY) {
      // Scrolling down past threshold - make sticky
      navWrapper.classList.add(stickyClass);
    } else if (scrollY <= threshold) {
      // Scrolled back to top - remove sticky
      navWrapper.classList.remove(stickyClass);
    }

    lastScrollY = scrollY;
  };

  window.addEventListener('scroll', updateStickyState, { passive: true });

  // Check initial state
  updateStickyState();
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
        sectionTitle.replaceChildren(...toolTitle.cloneNode(true).children);
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
        const searchText = document.createElement('span');
        searchText.classList.add('mobile-only', 'search-text');
        // searchText.innerHTML = 'Search';
        searchText.textContent = 'Search';
        searchIcon?.parentElement?.append(searchText);

        sectionItem.classList.add('has-search');
      } else {
        sectionItem.addEventListener('click', (e) => {
          if (!isDesktop.matches) {
            e.stopPropagation();
            const expanded = sectionItem.getAttribute('aria-expanded') === 'true';
            sectionItem.setAttribute('aria-expanded', expanded ? 'false' : 'true');
          }
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
}
