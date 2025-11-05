import {
  // loadHeader, // TODO: Re-enable when header is fixed
  loadFooter,
  decorateIcons,
  decorateSections,
  decorateBlocks,
  decorateTemplateAndTheme,
  waitForFirstImage,
  loadSection,
  loadSections,
  loadCSS,
  getMetadata,
  buildBlock,
} from './aem.js';
import { rewriteLinkUrl, linkTextIncludesHref } from './utils.js';
import { replacePlaceholders } from './placeholders.js';

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

function loadFragments(main) {
  const fragments = main.querySelectorAll('a[href*="/fragments/"]');
  if (fragments.length > 0) {
    // eslint-disable-next-line import/no-cycle
    import('../blocks/fragment/fragment.js').then(({ loadFragment }) => {
      fragments.forEach(async (fragment) => {
        if (linkTextIncludesHref(fragment)) {
          try {
            const { pathname } = new URL(fragment.href);
            const frag = await loadFragment(pathname);
            fragment.parentElement.replaceWith(frag.firstElementChild);
          } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Fragment loading failed', error);
          }
        }
      });
    });
  }
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
function buildAutoBlocks(main) {
  try {
    loadFragments(main);

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

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
async function loadEager(doc) {
  doc.documentElement.lang = getMetadata('language') || 'en';
  decorateTemplateAndTheme();
  const main = doc.querySelector('main');
  if (main) {
    decorateMain(main);
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
  const main = doc.querySelector('main');
  await loadSections(main);

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();

  // TODO: Re-enable when header is fixed
  // loadHeader(doc.querySelector('header'));
  loadFooter(doc.querySelector('footer'));

  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  loadFonts();
}

/**
 * Loads everything that happens a lot later,
 * without impacting the user experience.
 */
function loadDelayed() {
  // eslint-disable-next-line import/no-cycle
  window.setTimeout(() => import('./delayed.js'), 3000);
  // load anything that can be postponed to the latest here
}

async function loadPage() {
  await loadEager(document);
  await loadLazy(document);
  loadDelayed();
}

loadPage();

const { searchParams, origin } = new URL(window.location.href);
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
