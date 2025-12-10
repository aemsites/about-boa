import {
  loadHeader,
  loadFooter,
  decorateIcon,
  decorateSections,
  decorateBlock,
  decorateBlocks,
  decorateTemplateAndTheme,
  waitForFirstImage,
  loadSection,
  loadSections,
  loadCSS,
  getMetadata,
  buildBlock,
  toClassName,
} from './aem.js';
import { rewriteLinkUrl, enableSmoothAnchorScroll } from './utils.js';
import { replacePlaceholders } from './placeholders.js';

const { searchParams, origin } = new URL(window.location.href);

export function decorateIcons(element) {
  const icons = element.querySelectorAll('span.icon');
  icons.forEach((span) => {
    const isIcomoon = [...span.classList].some((c) => c.startsWith('icon-icomoon-'));
    if (!isIcomoon) {
      decorateIcon(span);
    }
  });
}

/**
 * load fonts.css and set a session storage flag
 */
async function loadFonts() {
  await loadCSS(`${window.hlx.codeBasePath}/styles/fonts.css`);
  try {
    if (!window.location.hostname.includes('localhost')) sessionStorage.setItem('fonts-loaded', 'true');
  } catch (e) {
    // do nothing
  }
}

function autolinkModals(doc) {
  doc.addEventListener('click', async (e) => {
    const link = e.target.closest('a');
    if (link && link.href && link.href.includes('/modals/')) {
      e.preventDefault();
      const { openModal } = await import(`${window.hlx.codeBasePath}/blocks/modal/modal.js`);
      openModal(link.href);
    }
  });
}

/**
 * Builds a fragment block from a link element
 * @param {Element} link The link element
 */
export function buildFragment(link) {
  const block = buildBlock('fragment', link.cloneNode(true));
  const parent = link.parentElement;
  if (parent && parent.tagName === 'P') {
    parent.replaceWith(block);
  } else {
    link.replaceWith(block);
  }
  decorateBlock(block);
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
function buildAutoBlocks(main) {
  try {
    const fragments = main.querySelectorAll('a[href*="/fragments/"]');
    if (fragments.length > 0) {
      fragments.forEach((fragment) => {
        const inBlock = fragment.closest('div[class]') ? fragment.closest('div[class]').classList.item(0) : '';
        // add block names here that allow auto-blocking fragments inside them
        const autoBlockInside = [];
        if (!inBlock || autoBlockInside.includes(inBlock)) {
          buildFragment(fragment);
        }
      });
    }

    const isFragment = !window.document.contains(main);

    if (!isFragment) {
      const backToTopSection = document.createElement('div');
      const backToTopBlock = buildBlock('back-to-top', '');
      backToTopSection.classList.add('back-to-top-section');
      backToTopSection.appendChild(backToTopBlock);
      main.appendChild(backToTopSection);
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
}

/**
 * Decorates buttons in the main content area
 * @param {Element} main The main element
 */
function decorateButtons(main) {
  main.querySelectorAll('p a[href]').forEach((a) => {
    a.title = a.title || a.textContent;
    const p = a.closest('p');
    // identify standalone links - only if parent of p is a div
    if (a.href !== a.textContent
      && p.textContent === a.textContent
      && p.parentElement?.tagName === 'DIV') {
      a.className = 'button';
      const strong = a.closest('strong');
      const em = a.closest('em');
      const double = !!strong && !!em;
      if (double) a.classList.add('accent');
      else if (strong) a.classList.add('emphasis');
      else if (em) a.classList.add('outline');
      p.innerHTML = a.outerHTML;
      p.className = 'button-wrapper';
    }
  });
}

function mergeButtonContainers(main) {
  let consecContainer = main.querySelector('.button-wrapper + .button-wrapper');
  while (consecContainer) {
    const prevContainer = consecContainer.previousElementSibling;
    prevContainer.append(...consecContainer.children);
    consecContainer.remove();
    consecContainer = main.querySelector('.button-wrapper + .button-wrapper');
  }
}

function decorateLinks(main) {
  main.querySelectorAll('a').forEach(rewriteLinkUrl);
  enableSmoothAnchorScroll(main);
}

function normalizeLists(main) {
  main.querySelectorAll('li').forEach((li) => {
    const p = li.querySelector('p:first-child');
    if (p) {
      const children = p.childNodes;
      children.forEach((child) => {
        p.before(child);
      });
      p.remove();
    }
  });
}

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
export function decorateMain(main) {
  buildAutoBlocks(main);
  decorateSections(main);
  decorateBlocks(main);
  normalizeLists(main);
  decorateLinks(main);
  decorateButtons(main);
  decorateIcons(main);
  mergeButtonContainers(main);
  replacePlaceholders(main);
}

let templateModule = {
  loadEager: () => Promise.resolve(),
  loadLazy: () => Promise.resolve(),
  loadDelayed: () => Promise.resolve(),
};
async function loadTemplateModule(template) {
  if (!template || ![].includes(template)) {
    // not a known template
    return;
  }

  try {
    templateModule = await import(`../templates/${template}/${template}.js`);
    loadCSS(`${window.hlx.codeBasePath}/templates/${template}.css`);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`failed to load template module for ${template}`, error);
    templateModule = {
      loadEager: () => Promise.resolve(),
      loadLazy: () => Promise.resolve(),
      loadDelayed: () => Promise.resolve(),
    };
  }
}

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
async function loadEager(doc) {
  doc.documentElement.lang = getMetadata('language') || 'en';
  decorateTemplateAndTheme();
  if (getMetadata('template')) {
    await loadTemplateModule(toClassName(getMetadata('template')));
  }

  const main = doc.querySelector('main');
  if (main) {
    decorateMain(main);
    await templateModule.loadEager(main);
    document.body.classList.add('appear');
    await loadSection(main.querySelector('.section'), waitForFirstImage);
  }

  try {
    /* if desktop (proxy for fast connection) or fonts already loaded, load fonts.css */
    if (window.innerWidth >= 900 || sessionStorage.getItem('fonts-loaded')) {
      loadFonts();
    }
  } catch (e) {
    // do nothing
  }
}

/**
 * Loads everything that doesn't need to be delayed.
 * @param {Element} doc The container element
 */
async function loadLazy(doc) {
  loadHeader(doc.querySelector('header'));
  autolinkModals(doc);

  const main = doc.querySelector('main');

  // load icomoon icon font/css if needed
  if (main.querySelector('span.icon[class*="icon-icomoon-"]')) {
    loadCSS(`${window.hlx.codeBasePath}/styles/icomoon-icons.css`);
  }

  await loadSections(main);
  await templateModule.loadLazy(main);

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();

  loadFooter(doc.querySelector('footer'));

  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  loadFonts();

  if (searchParams.get('dapreview')) {
    document.body.classList.add('da-preview');
  }
}

/**
 * Loads everything that happens a lot later,
 * without impacting the user experience.
 */
function loadDelayed() {
  // eslint-disable-next-line import/no-cycle
  window.setTimeout(() => {
    import('./delayed.js');
    templateModule.loadDelayed();
  }, 3000);
  // load anything that can be postponed to the latest here
}

async function loadPage() {
  await loadEager(document);
  await loadLazy(document);
  loadDelayed();
}

loadPage();

const branch = searchParams.get('nx') || 'main';

export const NX_ORIGIN = branch === 'local' || origin.includes('localhost') ? 'http://localhost:6456/nx' : 'https://da.live/nx';

(async function loadDa() {
  /* eslint-disable import/no-unresolved */
  if (searchParams.get('dapreview')) {
    import('https://da.live/scripts/dapreview.js')
      .then(({ default: daPreview }) => daPreview(loadPage));
  }
  if (searchParams.get('daexperiment')) {
    import(`${NX_ORIGIN}/public/plugins/exp/exp.js`);
  }
}());
