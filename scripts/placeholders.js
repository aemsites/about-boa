/*
 * Copyright 2025 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import { toCamelCase, getMetadata } from './aem.js';

async function fetchPlaceholders(prefix = 'default') {
  window.placeholders = window.placeholders || {};
  if (!window.placeholders[prefix]) {
    window.placeholders[prefix] = new Promise((resolve) => {
      fetch(`${prefix === 'default' ? '' : prefix}/placeholders.json`)
        .then((resp) => {
          if (resp.ok) {
            return resp.json();
          }
          return {};
        }).then((json) => {
          const placeholders = {};
          json.data
            .filter((placeholder) => placeholder.Key)
            .forEach((placeholder) => {
              placeholders[toCamelCase(placeholder.Key)] = placeholder.Text;
            });
          window.placeholders[prefix] = placeholders;
          resolve(window.placeholders[prefix]);
        }).catch(() => {
          // error loading placeholders
          window.placeholders[prefix] = {};
          resolve(window.placeholders[prefix]);
        });
    });
  }
  return window.placeholders[`${prefix}`];
}

export default async function fetchLangPlaceholders() {
  const lang = getMetadata('language') || 'en';
  const [langPlaceholders, defaultPlaceholders] = await Promise.all([fetchPlaceholders(`/${lang}`), fetchPlaceholders('default')]);
  return { ...defaultPlaceholders, ...langPlaceholders };
}

export async function replacePlaceholders(el) {
  const treeWalker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
  const nodesToProcess = [];

  while (treeWalker.nextNode()) {
    const textNode = treeWalker.currentNode;
    if (textNode.textContent.match(/{{.*?}}/g)) {
      nodesToProcess.push(textNode);
    }
  }

  if (nodesToProcess.length > 0) {
    const placeholders = await fetchLangPlaceholders();
    nodesToProcess.forEach((textNode) => {
      const text = textNode.textContent;
      const replacedText = text.replace(/{{(.*?)}}/g, (match, p1) => placeholders[p1] || match);
      textNode.textContent = replacedText;
    });
  }
}
