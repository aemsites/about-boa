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

/**
 * Loads block-specific UE scripts for blocks that have them.
 * Each block can have a {blockName}.ue.js file that exports:
 * - setupObserver(block): Sets up mutation observers for the block
 * - onSelect(block, element): Handles UE ui-select events
 */
async function loadBlockUEScripts() {
  const blocks = [...document.querySelectorAll('.block')];
  const loadedModules = new Map();

  const loadPromises = blocks.map(async (block) => {
    const { blockName } = block.dataset;
    if (!blockName || loadedModules.has(blockName)) return;

    try {
      const module = await import(
        `${window.hlx.codeBasePath}/blocks/${blockName}/${blockName}.ue.js`
      );
      loadedModules.set(blockName, module);

      // Set up observer if the block provides one
      if (module.setupObserver) {
        module.setupObserver(block);
      }
    } catch (e) {
      // Block doesn't have a UE script, which is fine
    }
  });

  await Promise.all(loadPromises);
  return loadedModules;
}

/**
 * Sets up global UE event handlers.
 * @param {Map} blockModules Map of block names to their UE modules
 */
function setupUEEventHandlers(blockModules) {
  // For each img source change, update the srcsets of the parent picture sources
  document.addEventListener('aue:content-patch', (event) => {
    if (event.detail.patch.name.match(/img.*\[src\]/)) {
      const newImgSrc = event.detail.patch.value;
      const picture = event.srcElement.querySelector('picture');

      if (picture) {
        picture.querySelectorAll('source').forEach((source) => {
          source.setAttribute('srcset', newImgSrc);
        });
      }
    }
  });

  document.addEventListener('aue:ui-select', (event) => {
    const { detail } = event;
    const resource = detail?.resource;

    if (!resource) return;

    const element = document.querySelector(`[data-aue-resource="${resource}"]`);
    if (!element) return;

    const blockEl = element.parentElement?.closest('.block[data-aue-resource]')
      || element?.closest('.block[data-aue-resource]');

    if (blockEl) {
      const { blockName } = blockEl.dataset;
      const module = blockModules.get(blockName);

      if (module?.onSelect) {
        module.onSelect(blockEl, element);
      }
    }
  });
}

export default async () => {
  const blockModules = await loadBlockUEScripts();
  setupUEEventHandlers(blockModules);
};
