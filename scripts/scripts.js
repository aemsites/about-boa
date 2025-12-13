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
  loadBlock,
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
    // Skip if already decorated (has img or svg child)
    if (span.querySelector('img, svg')) return;

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
 * Builds nested sections by replacing {{#section-id}} placeholders
 * with the content of sections that have matching IDs in their section-metadata.
 * After nesting, the original sections are removed from the page.
 * @param {Element} main The container element
 */
function buildNestedSections(main) {
  // Build a map of section IDs to their content
  const sectionMap = new Map();
  const sectionsToRemove = [];

  // Find all sections with section-metadata containing an id
  main.querySelectorAll('.section-metadata').forEach((metadata) => {
    const idRow = [...metadata.querySelectorAll(':scope > div')].find((row) => {
      const key = row.children[0]?.textContent?.trim().toLowerCase();
      return key === 'id';
    });

    if (idRow) {
      const sectionId = idRow.children[1]?.textContent?.trim();
      if (sectionId) {
        const section = metadata.parentElement;
        // Clone section content excluding the section-metadata itself
        const contentWrapper = document.createElement('div');
        [...section.children].forEach((child) => {
          if (!child.classList.contains('section-metadata')) {
            contentWrapper.appendChild(child.cloneNode(true));
          }
        });
        sectionMap.set(sectionId, contentWrapper);
        sectionsToRemove.push(section);
      }
    }
  });

  // Find and replace all {{#section-id}} placeholders
  const placeholderPattern = /\{\{#([^}]+)\}\}/g;

  // Walk through all text nodes and elements that might contain placeholders
  const walker = document.createTreeWalker(
    main,
    NodeFilter.SHOW_TEXT,
    null,
    false,
  );

  const nodesToProcess = [];
  let node = walker.nextNode();
  while (node) {
    if (placeholderPattern.test(node.textContent)) {
      nodesToProcess.push(node);
    }
    placeholderPattern.lastIndex = 0; // Reset regex
    node = walker.nextNode();
  }

  nodesToProcess.forEach((textNode) => {
    const text = textNode.textContent;
    const matches = [...text.matchAll(/\{\{#([^}]+)\}\}/g)];

    if (matches.length > 0) {
      const parent = textNode.parentElement;

      matches.forEach((match) => {
        const [fullMatch, sectionId] = match;
        const sectionContent = sectionMap.get(sectionId);

        if (sectionContent) {
          const clonedContent = sectionContent.cloneNode(true);
          const insertedElements = [...clonedContent.children];

          // If the placeholder is the only content in its container, replace the container
          if (parent && parent.textContent.trim() === fullMatch) {
            // Insert the section content before the parent element
            insertedElements.forEach((child) => {
              parent.before(child);
            });
            parent.remove();
          } else {
            // Replace just the text placeholder inline
            const parts = text.split(fullMatch);
            const fragment = document.createDocumentFragment();

            if (parts[0]) {
              fragment.appendChild(document.createTextNode(parts[0]));
            }
            insertedElements.forEach((child) => {
              fragment.appendChild(child);
            });
            if (parts[1]) {
              fragment.appendChild(document.createTextNode(parts[1]));
            }

            textNode.replaceWith(fragment);
          }

          // Decorate and mark nested blocks for deferred loading
          // These won't be found by standard decorateBlocks since they're nested deeper
          insertedElements.forEach((el) => {
            if (el.classList && el.classList.length > 0) {
              decorateBlock(el);
              el.classList.add('nested-block');
            }
            // Also check for nested blocks within
            el.querySelectorAll?.('div[class]').forEach((nestedBlock) => {
              if (nestedBlock.classList.length > 0 && !nestedBlock.dataset.blockStatus) {
                decorateBlock(nestedBlock);
                nestedBlock.classList.add('nested-block');
              }
            });
          });
        }
      });
    }
  });

  // Remove the original sections that were used for nesting
  sectionsToRemove.forEach((section) => {
    section.remove();
  });
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
function buildAutoBlocks(main) {
  try {
    // Process nested sections first
    buildNestedSections(main);

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

  // Load any nested blocks that were inserted by buildNestedSections
  const nestedBlocks = main.querySelectorAll('.nested-block');
  await Promise.all([...nestedBlocks].map((block) => loadBlock(block)));

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
