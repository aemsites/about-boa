import { enableSmoothAnchorScroll } from '../../scripts/utils.js';

const NUMBER_WORDS = [
  '', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen',
  'eighteen', 'nineteen', 'twenty',
];

/**
 * Converts a number to its word equivalent (1 → "one", 2 → "two", etc.)
 * Falls back to numeric string for numbers > 20
 * @param {number} num The number to convert
 * @returns {string} The word representation
 */
const toWordNumber = (num) => NUMBER_WORDS[num] || String(num);

/**
 * Adds back-links from footnotes to their references in the document
 * @param {Element} block The footnotes block element
 */
function addBackLinks(block) {
  block.querySelectorAll('li[id]').forEach((footnote, index) => {
    const { id } = footnote;
    const numberEl = footnote.querySelector('.footnote-number');
    if (!numberEl) return;

    const num = index + 1;
    // Find references - check both word format (footnote-one) and numeric format (footnote-1)
    const wordId = `footnote-${toWordNumber(num)}`;
    const numericId = `footnote-${num}`;
    const selectors = [id, wordId, numericId]
      .filter((s, i, arr) => arr.indexOf(s) === i)
      .map((s) => `a[href$="#${s}"]`)
      .join(', ');

    const references = [...document.querySelectorAll(selectors)]
      .filter((ref) => !block.contains(ref));

    if (references.length === 0) return;

    // Auto-generate IDs for references that don't have one
    references.forEach((ref) => {
      if (!ref.id) ref.id = `${id}_back`;
    });

    // Make the number a back-link to the first reference
    const backlink = document.createElement('a');
    backlink.href = `#${references[0].id}`;
    backlink.className = 'footnote-backlink';
    backlink.title = 'Return to reference';
    backlink.setAttribute('aria-label', 'Return to reference');

    const backlinkText = document.createElement('sup');
    backlinkText.textContent = numberEl.textContent;
    backlink.append(backlinkText);

    numberEl.textContent = '';
    numberEl.append(backlink);
  });
}

/**
 * Creates a footnote list item with number and content structure
 * @param {Element} source Source element (li or row div)
 * @param {number} index Footnote index (0-based)
 * @returns {Element} Structured list item
 */
function createFootnoteItem(source, index) {
  const li = source.tagName === 'LI' ? source : document.createElement('li');
  const num = index + 1;

  // Set ID if not present (format: footnote-one, footnote-two, etc.)
  if (!li.id) {
    li.id = source.id || source.querySelector('[id]')?.id || `footnote-${toWordNumber(num)}`;
  }

  // Create number element
  const numberEl = document.createElement('span');
  numberEl.className = 'footnote-number';
  numberEl.textContent = `${num}`;

  // Wrap content
  const content = document.createElement('span');
  content.className = 'footnote-content';

  // Move children to content wrapper (use firstChild to include text nodes)
  if (source.tagName === 'LI') {
    while (li.firstChild) content.append(li.firstChild);
  } else {
    while (source.firstChild) content.append(source.firstChild);
  }

  li.append(numberEl, content);
  return li;
}

/**
 * Decorates the footnotes block
 * Supports two authoring patterns:
 * 1. Multiple rows - each row is a footnote
 * 2. Single row with ul/ol - list items are footnotes
 * @param {Element} block The footnotes block element
 */
export default function decorate(block) {
  const existingList = block.querySelector('ul, ol');
  const items = existingList
    ? [...existingList.querySelectorAll(':scope > li')]
    : [...block.children];

  const ol = document.createElement('ol');
  ol.className = 'footnotes-list';
  items.forEach((item, i) => ol.append(createFootnoteItem(item, i)));

  block.replaceChildren(ol);

  addBackLinks(block);
  enableSmoothAnchorScroll(block);
}
