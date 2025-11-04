/*
 * Copyright 2024 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

/* global WebImporter */
/* eslint-disable no-console, class-methods-use-this */

/**
 * Create a row from an element by extracting image and content using selectors
 * @param {Element} element - The element to query
 * @param {string} imageSelector - CSS selector for the image
 * @param {string} contentSelector - CSS selector for the content
 * @returns {Array} Array containing [image, content]
 */
function createRowFromSelectors(element, imageSelector, contentSelector) {
  const img = element.querySelector(imageSelector);
  const content = element.querySelector(contentSelector);
  return [img, content];
}

/**
 * Create metadata block
 * @param {Element} main - The main element
 * @param {Document} document - The document object
 */
function createMetadata(main, document) {
  const meta = {};

  // Extract title
  const title = document.querySelector('title');
  if (title) {
    meta.Title = title.textContent.replace(/[\n\t]/gm, '');
  }

  // Extract description from meta tags
  const desc = document.querySelector('[property="og:description"]')
    || document.querySelector('[name="description"]');
  if (desc) {
    meta.Description = desc.content || desc.getAttribute('content');
  }

  // Extract image from og:image
  const ogImage = document.querySelector('[property="og:image"]');
  if (ogImage) {
    const img = document.createElement('img');
    img.src = ogImage.content || ogImage.getAttribute('content');
    meta.Image = img;
  }

  // Extract template if present
  const template = document.querySelector('[name="template"]')
    || document.querySelector('[property="template"]');
  if (template) {
    let templateValue = template.content || template.getAttribute('content');
    // Strip -template suffix if present
    if (templateValue && templateValue.endsWith('-template')) {
      templateValue = templateValue.replace(/-template$/, '');
    }
    meta.Template = templateValue;
  }

  // Extract keywords if present
  const keywords = document.querySelector('[name="keywords"]');
  if (keywords) {
    meta.Keywords = keywords.content || keywords.getAttribute('content');
  }

  const breadcrumb = document.querySelector('meta[name="breadcrumb"]');
  if (breadcrumb) {
    meta.Breadcrumb = breadcrumb.content;
  }

  // Create and append metadata block
  const block = WebImporter.Blocks.getMetadataBlock(document, meta);
  main.append(block);

  return meta;
}

/**
 * Transform notched-image blocks
 * Looks for elements with class 'aem-wrap--notched-image'
 */
function transformNotchedImage(main, document) {
  const notchedImages = main.querySelectorAll('.aem-wrap--notched-image');

  notchedImages.forEach((el) => {
    // Extract variants from classes
    const variants = [];

    const childDiv = el.querySelector('.notched-image');
    if (childDiv) {
      const classes = Array.from(childDiv.classList);
      const alignmentClass = classes.find((cls) => cls.includes('notched-image--aligment-'));

      if (alignmentClass) {
        if (alignmentClass.includes('left')) {
          variants.push('align-left');
        } else if (alignmentClass.includes('right')) {
          variants.push('align-right');
        }
        // centered is default, no need to add variant
      }
    }

    if (el.querySelector('.notched-image__col-1--shadow')) {
      variants.push('shadowed');
    }

    // Create the block using the official Blocks.createBlock helper
    const block = WebImporter.Blocks.createBlock(document, {
      name: 'notched-image',
      variants,
      cells: [
        createRowFromSelectors(el, '.notched-image__image img', '.notched-image__content'),
      ],
    });

    // Replace original element with the block
    el.replaceWith(block);
  });
}

function transformCarousels(main, document) {
  main.querySelectorAll('.aem-wrap--horizontal-content, .aem-wrap--horizontal-tile').forEach((el) => {
    const cells = [];

    const container = el.querySelector('.horizontal-tile__item-container');
    [...container.children].forEach((child) => {
      cells.push(createRowFromSelectors(
        child,
        '.horizontal-tile__image-container img',
        '.horizontal-tile__text-container',
      ));
    });

    const block = WebImporter.Blocks.createBlock(document, {
      name: 'carousel',
      cells,
    });

    // Replace original element with the block
    el.replaceWith(block);
  });

  main.querySelectorAll('.aem-wrap--carousel').forEach((el) => {
    const cells = [];
    const variants = [];
    const items = el.querySelectorAll('.uc-carousel__item');
    items.forEach((item) => {
      if (item.querySelector('uc-masthead')) {
        variants.push('masthead');
        cells.push(createRowFromSelectors(
          item,
          '.uc-masthead__image img',
          '.uc-masthead__body',
        ));
      } else {
        console.warn('Unknown carousel item', item);
      }
    });

    const uniqueVariants = [...new Set(variants)];
    if (uniqueVariants.length > 1) {
      console.warn('Multiple variants found in carousel', el);
    }

    const block = WebImporter.Blocks.createBlock(document, {
      name: 'carousel',
      variants: uniqueVariants,
      cells,
    });

    el.replaceWith(block);
  });
}

function ensureDesktopImages(main, document) {
  const images = main.querySelectorAll('picture > img');
  images.forEach((img) => {
    // find source element with widest media query
    let desktopSource = null;
    const sources = img.closest('picture').querySelectorAll('source');
    sources.forEach((source) => {
      if (source.media === '(min-width: 48.0625rem)') {
        desktopSource = source;
      }
    });

    if (desktopSource) {
      const newImg = document.createElement('img');
      newImg.src = desktopSource.srcset;
      img.closest('picture').replaceWith(newImg);
    } else {
      console.warn('No desktop source found for image', img.closest('picture'));
    }
  });
}

function normalizeURLs(main) {
  const resetAttributeBase = (tag, attr) => {
    main.querySelectorAll(`${tag}[${attr}]`).forEach((elem) => {
      elem[attr] = new URL(elem.getAttribute(attr), new URL('https://about.bankofamerica.com')).href;
    });
  };

  resetAttributeBase('img', 'src');
  resetAttributeBase('source', 'srcset');
}

function transformHighlightBlock(main, document) {
  main.querySelectorAll('.aem-wrap--highlight-block').forEach((el) => {
    const highlightBlock = el.querySelector('.highlight-block');
    const content = el.querySelector('.highlight-block__box');

    const variants = [];

    // Get position from .highlight-block
    if (highlightBlock) {
      const blockClasses = [...highlightBlock.classList];
      const position = blockClasses.find((cls) => cls.includes('highlight-block--position-'));
      if (position) {
        variants.push(position.replace('highlight-block--', ''));
      }
    }

    // Get color and rounded from .highlight-block__box
    if (content) {
      const boxClasses = [...content.classList];

      const color = boxClasses.find((cls) => cls.includes('highlight-block--bg-'));
      if (color) {
        variants.push(color.replace('highlight-block--', ''));
      }

      if (boxClasses.includes('highlight-block--rounded')) {
        variants.push('rounded');
      }
    }

    const block = WebImporter.Blocks.createBlock(document, {
      name: 'highlight',
      variants,
      cells: [
        createRowFromSelectors(el, '.highlight-block__image img', '.highlight-block__box'),
      ],
    });

    el.replaceWith(block);
  });
}

function transformStoryBlock(main, document) {
  main.querySelectorAll('.aem-wrap--story-block').forEach((el) => {
    const color = [...el.querySelector('.story-block').classList].find((cls) => cls.includes('story-block--bg-'));
    const align = [...el.querySelector('.story-block').classList].find((cls) => cls.includes('story-block--align-'));
    const variants = [color.replace('story-block--', ''), align.replace('story-block--', '')];

    const block = WebImporter.Blocks.createBlock(document, {
      name: 'story',
      variants,
      cells: [
        createRowFromSelectors(el, '.story-block__image img', '.story-block__content'),
      ],
    });

    el.replaceWith(block);
  });
}

function transformSections(main, document) {
  const sectionBreak = document.createElement('div');
  sectionBreak.innerHTML = '<p>---</p>';

  [...main.children].forEach((sectionEl) => {
    if (sectionEl.textContent.trim() === '') {
      return;
    }

    const sectionDiv = document.createElement('div');
    main.insertBefore(sectionDiv, sectionEl);
    sectionDiv.append(sectionEl);

    const sectionStyle = [...sectionEl.firstElementChild.classList]
      .filter((cls) => cls.includes('container-layout_theme_') && cls !== 'container-layout_theme_transparent')
      .map((cls) => cls.replace('container-layout_theme_', 'bg-'));

    if (sectionStyle.length > 0) {
      const sectionMeta = WebImporter.Blocks.createBlock(document, {
        name: 'section-metadata',
        cells: [
          ['style', sectionStyle],
        ],
      });

      sectionDiv.append(sectionMeta);
    }

    sectionDiv.append(sectionBreak.cloneNode(true));
  });
}

function transformTile(main, document) {
  main.querySelectorAll('.aem-wrap--tile').forEach((el) => {
    const heading = el.querySelector('.tile__label');
    const items = el.querySelectorAll('.tile__item');

    const cells = [];
    items.forEach((item) => {
      cells.push(createRowFromSelectors(
        item,
        '.tile__top-section img',
        '.tile__short-section',
      ));
    });

    const block = WebImporter.Blocks.createBlock(document, {
      name: 'tile',
      cells,
    });

    if (heading) {
      el.parentNode.insertBefore(heading, el);
    }

    el.replaceWith(block);
  });
}

function transformBreadcrumb(main, document) {
  const bc = main.querySelector('.aem-wrap--breadcrumb');
  if (bc && bc.textContent.trim() !== '') {
    const bcContent = bc.querySelector('.breadcrumb li:last-child');
    const bcValue = bcContent ? bcContent.textContent.trim() : 'true';

    const bcMeta = document.createElement('meta');
    bcMeta.name = 'breadcrumb';
    bcMeta.content = bcValue;
    document.head.append(bcMeta);

    bc.remove();
  }
}

/**
 * Main transformation function
 */
export default {
  /**
   * Apply DOM operations to the provided document and return
   * the root element to be then transformed to Markdown.
   * @param {HTMLDocument} document The document
   * @param {string} url The url of the page imported
   * @param {string} html The raw html (the document is cleaned up during preprocessing)
   * @param {object} params Object containing some parameters given by the import process.
   * @returns {HTMLElement} The root element to be transformed
   */
  transformDOM: ({
    document,
    // eslint-disable-next-line no-unused-vars
    _url,
    // eslint-disable-next-line no-unused-vars
    html,
    // eslint-disable-next-line no-unused-vars
    params,
  }) => {
    // Find the main content area
    const main = document.querySelector('main');

    if (!main) {
      console.warn('No main element found');
      return document.body;
    }

    const transforms = [
      WebImporter.rules.transformBackgroundImages,
      normalizeURLs,
      ensureDesktopImages,
      transformBreadcrumb,
      transformSections,
      transformNotchedImage,
      transformCarousels,
      transformHighlightBlock,
      transformStoryBlock,
      transformTile,
      // more block transformations here
      createMetadata,
    ];

    transforms.forEach((transform) => transform(main, document));

    return main;
  },

  /**
   * Return a path that describes the document being transformed (file name, nesting...).
   * The path is then used to create the corresponding Word document.
   * @param {HTMLDocument} document The document
   * @param {string} url The url of the page imported
   * @param {string} html The raw html (the document is cleaned up during preprocessing)
   * @param {object} params Object containing some parameters given by the import process.
   * @return {string} The path
   */
  generateDocumentPath: ({
    // eslint-disable-next-line no-unused-vars
    document,
    // eslint-disable-next-line no-unused-vars
    url,
    // eslint-disable-next-line no-unused-vars
    html,
    params,
  }) => {
    // Use the original URL from params
    const u = new URL(params.originalURL);
    let path = u.pathname;

    // Remove trailing slash
    if (path.endsWith('/')) {
      path = path.slice(0, -1);
    }

    // Remove .html extension if present
    path = path.replace(/\.html$/, '');

    // Default to index if empty
    if (!path || path === '/') {
      path = '/index';
    }

    // Sanitize the path to follow AEM URL conventions
    // (lowercase, latin characters only, hyphens only)
    return WebImporter.FileUtils.sanitizePath(path);
  },
};
