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
    let largestValue = -1;
    let hasMinWidth = false;
    const sources = img.closest('picture').querySelectorAll('source');

    const convertToPixels = (value, unit) => {
      if (unit === 'rem' || unit === 'em') {
        return value * 16;
      }
      return value;
    };

    // First pass: collect all sources and check if any have min-width
    sources.forEach((source) => {
      const { media } = source;
      if (media && media !== 'all') {
        const minWidthMatch = media.match(/min-width:\s*([\d.]+)(rem|px|em)/);
        if (minWidthMatch) {
          hasMinWidth = true;
        }
      }
    });

    sources.forEach((source) => {
      const { media } = source;
      if (!media || media === 'all') {
        // No media query means it's the default/smallest
        return;
      }

      // Extract min-width value from media query (supports rem, px, em, etc.)
      const minWidthMatch = media.match(/min-width:\s*([\d.]+)(rem|px|em)/);

      // Prefer min-width queries for desktop (they target larger screens)
      if (minWidthMatch) {
        const value = parseFloat(minWidthMatch[1]);
        const unit = minWidthMatch[2];
        const pixels = convertToPixels(value, unit);

        if (pixels > largestValue) {
          largestValue = pixels;
          desktopSource = source;
        }
      }
      // If only max-width queries exist, the img tag itself is the desktop version
    });

    // If we found a min-width source, use it
    if (desktopSource) {
      const newImg = document.createElement('img');
      newImg.src = desktopSource.srcset;
      img.closest('picture').replaceWith(newImg);
    } else if (hasMinWidth === false && sources.length > 0) {
      // If only max-width queries exist, the img tag is already the desktop version
      // Just convert picture to img (using img's existing src)
      const newImg = document.createElement('img');
      newImg.src = img.src;
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
      // Check if this is an imageless tile
      const isImageless = item.querySelector('.tile--imageless');

      if (isImageless) {
        // For imageless tiles, only include content in a single cell
        const content = item.querySelector('.tile__short-section');
        cells.push([content]);
      } else {
        // Standard tile with image
        cells.push(createRowFromSelectors(
          item,
          '.tile__top-section img',
          '.tile__short-section',
        ));
      }
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

  // Handle manual tiles (same block, different source structure)
  main.querySelectorAll('.aem-wrap--manual-tile').forEach((el) => {
    const items = el.querySelectorAll('.manual-tile__item');

    const cells = [];
    items.forEach((item) => {
      const img = item.querySelector('.manual-tile__image');
      const link = item.querySelector('.manual-tile__link');

      // Create content cell with link wrapped around heading
      const contentCell = document.createElement('div');

      if (link) {
        const heading = link.querySelector('.header__heading');

        // Clone all children from the link
        [...link.childNodes].forEach((child) => {
          contentCell.append(child.cloneNode(true));
        });

        // Wrap the heading with the link
        if (heading) {
          const headingInContent = contentCell.querySelector('.header__heading');
          if (headingInContent) {
            const wrappedLink = document.createElement('a');
            wrappedLink.href = link.href;
            // Move heading content into the link
            while (headingInContent.firstChild) {
              wrappedLink.append(headingInContent.firstChild);
            }
            // Replace heading with the wrapped link
            headingInContent.replaceWith(wrappedLink);
          }
        }
      }

      cells.push([img, contentCell]);
    });

    const block = WebImporter.Blocks.createBlock(document, {
      name: 'tile',
      cells,
    });

    el.replaceWith(block);
  });
}

function transformIconList(main, document) {
  // Handle .aem-wrap--icon-list
  main.querySelectorAll('.aem-wrap--icon-list').forEach((el) => {
    const items = el.querySelectorAll('.component-icon__item');

    const cells = [];
    items.forEach((item) => {
      // Get the icon column (header-top + image/icon)
      const iconColumn = document.createElement('div');
      const headerTop = item.querySelector('.component-icon__header-top');

      // Check for image first
      let icon = item.querySelector('.component-icon__img img');

      // If no image, check for icon reference
      if (!icon) {
        const iconContainer = item.querySelector('.component-icon__ico');
        if (iconContainer) {
          const unityIcon = iconContainer.querySelector('.unity-icon');
          if (unityIcon) {
            // Extract icon name from class like 'unity-icon-finance-spending'
            const iconClass = Array.from(unityIcon.classList)
              .find((cls) => cls.startsWith('unity-icon-') && cls !== 'unity-icon');

            if (iconClass) {
              const iconName = iconClass.replace('unity-icon-', '');
              // Create span with icon reference syntax (same as convertIcons rule)
              icon = document.createElement('span');
              icon.innerHTML = `:${iconName}:`;
            }
          }
        }
      }

      if (headerTop) {
        iconColumn.append(headerTop.cloneNode(true));
      }
      if (icon) {
        iconColumn.append(icon);
      }

      // Get the content column (header + optional CTA)
      const contentColumn = document.createElement('div');
      const header = item.querySelector('.component-icon__header');
      const cta = item.querySelector('.component-icon__cta');

      if (header) {
        contentColumn.append(header.cloneNode(true));
      }
      if (cta) {
        contentColumn.append(cta.cloneNode(true));
      }

      cells.push([iconColumn, contentColumn]);
    });

    const block = WebImporter.Blocks.createBlock(document, {
      name: 'icon-list',
      cells,
    });

    el.replaceWith(block);
  });

  // Handle uc-icon-grid
  main.querySelectorAll('uc-icon-grid').forEach((el) => {
    const items = el.querySelectorAll('.uc-icon-grid-item');

    const cells = [];
    items.forEach((item) => {
      // Get the graphic (image or icon)
      const graphic = item.querySelector('.uc-icon-grid-item__graphic');
      let icon = graphic ? graphic.querySelector('img') : null;

      // If no image, check for icon reference
      if (!icon && graphic) {
        const ucIcon = graphic.querySelector('.uc-icon');
        if (ucIcon) {
          const iconSpan = ucIcon.querySelector('span[class^="uc-icon-"]');
          if (iconSpan) {
            // Extract icon name from class like 'uc-icon-people-team'
            const iconClass = Array.from(iconSpan.classList)
              .find((cls) => cls.startsWith('uc-icon-'));

            if (iconClass) {
              const iconName = iconClass.replace('uc-icon-', '');
              // Create span with icon reference syntax (same as convertIcons rule)
              icon = document.createElement('span');
              icon.innerHTML = `:${iconName}:`;
            }
          }
        }
      }

      // Get the content (heading + action)
      const contentColumn = document.createElement('div');
      const heading = item.querySelector('.uc-icon-grid-item__heading');
      const action = item.querySelector('.uc-icon-grid-item__action');

      if (heading) {
        contentColumn.append(heading.cloneNode(true));
      }
      if (action) {
        contentColumn.append(action.cloneNode(true));
      }

      cells.push([icon, contentColumn]);
    });

    const block = WebImporter.Blocks.createBlock(document, {
      name: 'icon-list',
      cells,
    });

    el.replaceWith(block);
  });
}

function transformLinkList(main, document) {
  main.querySelectorAll('.aem-wrap--linklist').forEach((el) => {
    const items = el.querySelectorAll('.linklist__item');

    const cells = [];
    items.forEach((item) => {
      // Get main CTA for first column
      const mainCta = item.querySelector('.linklist__item-main-cta');

      // Get text and secondary CTA for second column
      const secondColumn = document.createElement('div');
      const text = item.querySelector('.linklist__item-text');
      const secondaryCta = item.querySelector('.linklist__item-secondary-cta');

      if (text) {
        secondColumn.append(text.cloneNode(true));
      }
      if (secondaryCta) {
        secondColumn.append(secondaryCta.cloneNode(true));
      }

      cells.push([mainCta, secondColumn]);
    });

    const block = WebImporter.Blocks.createBlock(document, {
      name: 'linklist',
      cells,
    });

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
      transformIconList,
      transformLinkList,
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
