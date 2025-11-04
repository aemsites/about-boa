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

    // Find the image
    const img = el.querySelector('.notched-image__image img');

    // Find the content using the specific class
    const content = el.querySelector('.notched-image__content');

    // Create the block using the official Blocks.createBlock helper
    const block = WebImporter.Blocks.createBlock(document, {
      name: 'notched-image',
      variants,
      cells: [
        [img, content],
      ],
    });

    // Replace original element with the block
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
      transformNotchedImage,
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
