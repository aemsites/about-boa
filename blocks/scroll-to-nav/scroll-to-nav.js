/**
 * Scroll-to-nav block
 * Navigation block with anchor links that scroll to page sections
 * Mobile: Custom collapsible dropdown | Tablet/Desktop: Horizontal inline links
 * Note: Smooth scrolling is handled globally by enableSmoothAnchorScroll in utils.js
 * @param {Element} block The scroll-to-nav block element
 */
export default function decorate(block) {
  const ul = block.querySelector('ul');
  if (!ul) return;

  const links = [...ul.querySelectorAll('a')];
  if (links.length === 0) return;

  // Create wrapper for the navigation
  const wrapper = document.createElement('nav');
  wrapper.className = 'scroll-to-nav-wrapper';
  wrapper.setAttribute('aria-label', 'Page navigation');

  // Create mobile dropdown (custom collapsible)
  const mobileNav = document.createElement('div');
  mobileNav.className = 'scroll-to-nav-mobile';

  // Toggle button with chevron and selected text
  const toggleBtn = document.createElement('button');
  toggleBtn.className = 'scroll-to-nav-toggle';
  toggleBtn.setAttribute('aria-expanded', 'false');
  toggleBtn.setAttribute('aria-label', 'Toggle navigation menu');

  const selectedText = document.createElement('span');
  selectedText.className = 'scroll-to-nav-selected';
  selectedText.textContent = links[0].textContent;

  const chevron = document.createElement('span');
  chevron.className = 'scroll-to-nav-chevron';

  toggleBtn.append(selectedText, chevron);

  // Mobile links list - clone links for mobile navigation
  const mobileList = document.createElement('ul');
  mobileList.className = 'scroll-to-nav-list';

  links.forEach((link) => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = link.getAttribute('href');
    a.textContent = link.textContent;

    // Handle UI updates only - let global handler do the scrolling
    a.addEventListener('click', () => {
      // Update selected text
      selectedText.textContent = a.textContent;
      // Collapse menu after selection
      mobileNav.classList.remove('is-open');
      toggleBtn.setAttribute('aria-expanded', 'false');
    });

    li.append(a);
    mobileList.append(li);
  });

  // Toggle dropdown
  toggleBtn.addEventListener('click', () => {
    const isOpen = mobileNav.classList.toggle('is-open');
    toggleBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });

  mobileNav.append(toggleBtn, mobileList);

  // Create desktop/tablet navigation - reuse the existing ul
  const desktopNav = document.createElement('div');
  desktopNav.className = 'scroll-to-nav-desktop';
  desktopNav.append(ul);

  // Assemble structure
  wrapper.append(mobileNav, desktopNav);

  // Clear and rebuild block
  block.textContent = '';
  block.append(wrapper);
}
