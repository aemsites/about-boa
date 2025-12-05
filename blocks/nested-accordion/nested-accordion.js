/**
 * Nested Accordion Block
 * Converts heading-based content into accordion format by collecting content
 * between markers and transforming it into a table structure for accordion.js
 */

/**
 * Extracts the heading tag configuration from the block
 * @param {Element} block The nested accordion block
 * @returns {string} The heading tag (h2-h6), defaults to 'h2'
 */
function getHeadingConfig(block) {
  const firstRow = block.querySelector('div:first-child');
  const configCell = firstRow?.children[1];
  const headingValue = configCell?.textContent.trim().toLowerCase();
  return /^h[1-6]$/.test(headingValue) ? headingValue : 'h2';
}

/**
 * Collects content from sibling wrappers until end marker
 * @param {Element} wrapper The wrapper containing the nested-accordion block
 * @returns {Element[]} Array of collected elements
 */
function collectContentFromWrappers(wrapper) {
  const elements = [];
  let currentWrapper = wrapper.nextElementSibling;

  while (currentWrapper) {
    const hasEndMarker = currentWrapper.querySelector('.nested-accordion');
    if (hasEndMarker) {
      currentWrapper.remove();
      break;
    }

    const nextWrapper = currentWrapper.nextElementSibling;
    elements.push(...currentWrapper.children);
    currentWrapper.remove();
    currentWrapper = nextWrapper;
  }

  return elements;
}

/**
 * Groups content elements by heading
 * @param {Element[]} elements Elements to process
 * @param {string} headingTag The heading tag to group by
 * @returns {Array<{heading: Element, content: Element[]}>} Grouped content
 */
function groupContentByHeading(elements, headingTag) {
  const tempContainer = document.createElement('div');
  tempContainer.append(...elements);

  const headings = [...tempContainer.querySelectorAll(headingTag)];
  return headings.map((heading) => {
    const content = [];
    let nextElement = heading.nextElementSibling;

    while (nextElement && nextElement.tagName?.toLowerCase() !== headingTag) {
      const element = nextElement;
      nextElement = nextElement.nextElementSibling;
      content.push(element);
    }

    return { heading, content };
  });
}

/**
 * Creates an accordion row with label and body cells
 * @param {Element|string|Node[]} label The label content (heading element, text, or nodes)
 * @param {Element[]|Element|string} content The body content
 * @returns {Element} The accordion row element
 */
function createAccordionRow(label, content) {
  const row = document.createElement('div');
  const labelCell = document.createElement('div');
  const bodyCell = document.createElement('div');

  // Handle different label types
  if (label instanceof Element) {
    labelCell.append(...label.childNodes);
  } else if (typeof label === 'string') {
    labelCell.textContent = label;
  } else if (Array.isArray(label)) {
    labelCell.append(...label);
  } else {
    labelCell.appendChild(label);
  }

  // Handle different content types
  if (Array.isArray(content)) {
    bodyCell.append(...content);
  } else if (content instanceof Element) {
    bodyCell.appendChild(content);
  } else if (typeof content === 'string') {
    bodyCell.textContent = content;
  } else {
    bodyCell.appendChild(content);
  }

  row.append(labelCell, bodyCell);
  return row;
}

/**
 * Decorates the nested accordion block
 * @param {Element} block The nested accordion block element
 */
export default async function decorate(block) {
  const wrapper = block.parentElement;
  if (!wrapper) return;

  const headingTag = getHeadingConfig(block);
  const elements = collectContentFromWrappers(wrapper);

  if (elements.length === 0) return;

  const groups = groupContentByHeading(elements, headingTag);

  if (groups.length === 0) {
    block.textContent = '';
    block.append(...elements);
    return;
  }

  // Import accordion utilities
  const {
    createAccordionItems,
  } = await import('../accordion/accordion.js');

  // Build table structure
  block.textContent = '';
  block.classList.add('accordion');
  groups.forEach(({ heading, content }) => {
    block.appendChild(createAccordionRow(heading, content));
  });

  // Convert rows to accordion items
  createAccordionItems(block);
}
