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

/* eslint-disable no-console, class-methods-use-this */

/**
 * HTML Pattern Analysis Script
 *
 * This script analyzes HTML markup to identify patterns that can help determine
 * what blocks need to be built for an AEM Edge Delivery Services project.
 *
 * Usage:
 * 1. Run `aem import` from your project root
 * 2. In the Import UI, set the transformation file URL to:
 *    http://localhost:3001/tools/importer/import-report.js
 * 3. Add URLs of pages to analyze
 * 4. Run the import and download the report
 *
 * The report will include:
 * - Common class names and their frequency
 * - Repeated element patterns
 * - Potential block candidates
 * - Semantic structure analysis
 */

/**
 * Main transform function - analyzes patterns without creating documents
 * This generates ONLY a report for analysis purposes
 */
export default {
  /**
   * Transform function that analyzes HTML and generates a report
   * No documents are created - only data collection
   */
  transform: ({ document, params }) => {
    const url = new URL(params.originalURL);
    const path = url.pathname.replace(/\/$/, '').replace(/\.html$/, '') || '/';

    // Count main sections
    const main = document.querySelector('main');
    let sectionCount = 0;

    const report = {
      'Page Title': document.title,
    };

    if (main) {
      sectionCount = main.querySelectorAll('section').length
                    || main.querySelectorAll(':scope > div').length;
      report.Sections = sectionCount;

      // Extract AEM block candidates from aem-wrap--* classes
      const aemWrapBlocks = new Map();
      const aemWrapElements = main.querySelectorAll('[class*="aem-wrap--"]');

      aemWrapElements.forEach((el) => {
        const classes = el.className.split(/\s+/);
        classes.forEach((cls) => {
          if (cls.startsWith('aem-wrap--')) {
            const blockName = cls.replace('aem-wrap--', '');
            aemWrapBlocks.set(blockName, (aemWrapBlocks.get(blockName) || 0) + 1);
          }
        });
      });

      // Sort by frequency and format
      const blockList = [...aemWrapBlocks.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([name, count]) => `${name}(${count})`)
        .join(', ');

      report['AEM Blocks'] = blockList || 'None found';
    } else {
      report['Has Main Element'] = 'No - skipped analysis';
    }

    // Return without element - this creates a report-only import
    return [{
      path,
      report,
    }];
  },

  /**
   * Optional: Generate a document path
   * This is here for reference but not used when element is omitted
   */
  generateDocumentPath: ({ url }) => {
    const u = new URL(url);
    return u.pathname.replace(/\/$/, '').replace(/\.html$/, '') || '/';
  },
};
