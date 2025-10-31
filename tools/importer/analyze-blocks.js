#!/usr/bin/env node

/* eslint-disable no-console, import/no-unresolved, no-underscore-dangle */
/* eslint-disable no-await-in-loop, no-restricted-syntax */

/*
 * Block Analysis Script
 *
 * Analyzes Excel/CSV reports from import-report.js to identify
 * which blocks to build based on frequency and usage across pages.
 *
 * Usage:
 *   node analyze-blocks.js <path-to-report.xlsx|csv> [options]
 *
 * Options:
 *   --screenshots    Take screenshots of each block using Playwright
 *   --base-url       Base URL for screenshots (default: https://about.bankofamerica.com)
 *
 * Examples:
 *   node analyze-blocks.js import-report.xlsx
 *   node analyze-blocks.js import-report.xlsx --screenshots
 *   node analyze-blocks.js import-report.csv --screenshots --base-url https://example.com
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Take screenshots of blocks using Playwright
 */
async function takeBlockScreenshots(sortedBlocks, baseUrl, reportFile) {
  let playwright;
  try {
    // Dynamic import to avoid requiring playwright if not using screenshots
    // eslint-disable-next-line import/no-extraneous-dependencies
    playwright = await import('playwright');
  } catch (error) {
    console.error('\n❌ Playwright not installed. Install it with:');
    console.error('   npm install -D playwright');
    console.error('   npx playwright install chromium');
    return;
  }

  const screenshotDir = path.join(
    __dirname,
    'screenshots',
    path.basename(reportFile, path.extname(reportFile)),
  );

  // Create screenshots directory
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  const browser = await playwright.chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  let screenshotCount = 0;

  for (const [blockName, stats] of sortedBlocks) {
    // Get the page with the most occurrences of this block
    const examplePage = stats.pages.sort((a, b) => b.count - a.count)[0];
    const pageUrl = `${baseUrl}${examplePage.path}`;

    console.log(`  📸 ${blockName} (${examplePage.count}x) - ${pageUrl}`);

    try {
      await page.goto(pageUrl, { waitUntil: 'networkidle', timeout: 30000 });

      // Find the first element with aem-wrap--{blockName}
      const blockSelector = `.aem-wrap--${blockName}`;
      const element = await page.locator(blockSelector).first();

      if (await element.count() > 0) {
        // Scroll element into view centered
        await element.scrollIntoViewIfNeeded();

        // Wait a moment for any animations
        await page.waitForTimeout(500);

        // Take screenshot of just the element
        const screenshotPath = path.join(screenshotDir, `${blockName}.png`);
        await element.screenshot({ path: screenshotPath });

        // Highlight the element for context screenshot
        await element.evaluate((el) => {
          el.style.outline = '4px solid #ff0000';
          el.style.outlineOffset = '2px';
          el.style.boxShadow = '0 0 0 4px rgba(255, 0, 0, 0.2)';
          el.scrollIntoView({ block: 'center', behavior: 'instant' });
        });

        // Wait for highlight to render
        await page.waitForTimeout(300);

        // Take a full-page screenshot for context (shows whole page with highlight)
        const contextPath = path.join(screenshotDir, `${blockName}-context.png`);
        await page.screenshot({ path: contextPath, fullPage: true });

        screenshotCount += 2;
      } else {
        console.log('     ⚠️  Block element not found on page');
      }
    } catch (error) {
      console.log(`     ❌ Error: ${error.message}`);
    }
  }

  await browser.close();

  console.log(`   📸 Screenshots: ${screenshotDir} (${screenshotCount} files)`);
}

/**
 * Parse Excel or CSV file
 */
async function parseReportFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === '.xlsx' || ext === '.xls') {
    // Parse Excel file
    let XLSX;
    try {
      // eslint-disable-next-line import/no-extraneous-dependencies
      const xlsxModule = await import('xlsx');
      XLSX = xlsxModule.default || xlsxModule;
    } catch (error) {
      console.error('\n❌ xlsx library not installed. Install it with:');
      console.error('   npm install -D xlsx');
      process.exit(1);
    }

    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const records = XLSX.utils.sheet_to_json(worksheet);
    return records;
  }

  if (ext === '.csv') {
    // Parse CSV file
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').filter((line) => line.trim());
    const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
    const records = [];

    for (let i = 1; i < lines.length; i += 1) {
      const values = lines[i].split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
      const record = {};
      headers.forEach((header, index) => {
        record[header] = values[index] || '';
      });
      records.push(record);
    }

    return records;
  }

  console.error('Error: File must be .xlsx, .xls, or .csv');
  process.exit(1);
  return [];
}

// Parse command line arguments
const args = process.argv.slice(2);
const reportFile = args.find((arg) => !arg.startsWith('--'));
const takeScreenshots = args.includes('--screenshots');
const baseUrlArg = args.findIndex((arg) => arg === '--base-url');
const baseUrl = baseUrlArg !== -1 ? args[baseUrlArg + 1] : 'https://about.bankofamerica.com';

if (!reportFile) {
  console.error('Usage: node analyze-blocks.js <path-to-report.xlsx|csv> [--screenshots] [--base-url <url>]');
  process.exit(1);
}

if (!fs.existsSync(reportFile)) {
  console.error(`Error: File not found: ${reportFile}`);
  process.exit(1);
}

// Read and parse the report file
const records = await parseReportFile(reportFile);

console.log(`\n📊 Analyzing ${records.length} pages...\n`);

// Data structures for analysis
// blockName -> { totalCount, pageCount, pages: [], parents: Map, children: Map, standalone: 0 }
const blockStats = new Map();

// Parse each page
records.forEach((row) => {
  const pagePath = row.path || row.URL || 'unknown';
  const aemBlocks = row['AEM Blocks'] || '';
  const relationships = row['Block Relationships'] || '';

  if (!aemBlocks || aemBlocks === 'None found') {
    return;
  }

  // Parse blocks: "container-layout(8), text(3), masthead(2)"
  const blockMatches = aemBlocks.match(/([a-z-]+)\((\d+)\)/g);

  if (blockMatches) {
    blockMatches.forEach((match) => {
      const [, blockName, count] = match.match(/([a-z-]+)\((\d+)\)/);
      const countNum = parseInt(count, 10);

      if (!blockStats.has(blockName)) {
        blockStats.set(blockName, {
          totalCount: 0,
          pageCount: 0,
          pages: [],
          parents: new Map(),
          children: new Map(),
          standalone: 0,
        });
      }

      const stats = blockStats.get(blockName);
      stats.totalCount += countNum;
      stats.pageCount += 1;
      stats.pages.push({ path: pagePath, count: countNum });
    });
  }

  // Parse relationships: "container-layout[p:none|c:text,image]; text[p:container-layout|c:none]"
  if (relationships && relationships !== 'None') {
    const relMatches = relationships.split('; ');
    relMatches.forEach((relString) => {
      const match = relString.match(/([a-z-]+)\[p:([^|]+)\|c:([^\]]+)\]/);
      if (match) {
        const [, blockName, parents, children] = match;

        if (blockStats.has(blockName)) {
          const stats = blockStats.get(blockName);

          // Track parent relationships
          if (parents === 'none') {
            stats.standalone += 1;
          } else {
            parents.split(',').forEach((parent) => {
              stats.parents.set(parent, (stats.parents.get(parent) || 0) + 1);
            });
          }

          // Track child relationships
          if (children !== 'none') {
            children.split(',').forEach((child) => {
              stats.children.set(child, (stats.children.get(child) || 0) + 1);
            });
          }
        }
      }
    });
  }
});

// Sort blocks by total count (most used first)
const sortedBlocks = [...blockStats.entries()]
  .sort((a, b) => b[1].totalCount - a[1].totalCount);

// Build markdown content
let markdown = '# Block Analysis Report\n\n';
markdown += `**Generated:** ${new Date().toLocaleString()}\n`;
markdown += `**Base URL:** ${baseUrl}\n`;
markdown += `**Total Pages Analyzed:** ${records.length}\n`;
markdown += `**Unique Blocks Found:** ${sortedBlocks.length}\n\n`;

markdown += '---\n\n';

// Summary table
markdown += '## Summary\n\n';
markdown += '| Block Name | Total Uses | Pages | Most Common Page |\n';
markdown += '|------------|------------|-------|------------------|\n';

sortedBlocks.forEach(([blockName, stats]) => {
  // Create anchor link to detailed section
  const anchor = blockName.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  // Find the page with the most occurrences
  const topPage = [...stats.pages].sort((a, b) => b.count - a.count)[0];
  const topPageUrl = `${baseUrl}${topPage.path}`;

  markdown += `| [${blockName}](#${anchor}) | ${stats.totalCount} | ${stats.pageCount} | [${topPage.path}](${topPageUrl}) (${topPage.count}x) |\n`;
});

markdown += '\n---\n\n';

// Detailed breakdown
markdown += '## Detailed Breakdown\n\n';

sortedBlocks.forEach(([blockName, stats]) => {
  // GitHub auto-generates anchors from heading text
  markdown += `### ${blockName}\n\n`;
  markdown += `**Total uses:** ${stats.totalCount} | **Found on:** ${stats.pageCount} page(s)`;

  // Add standalone vs nested info
  if (stats.standalone > 0) {
    const standalonePercent = ((stats.standalone / stats.totalCount) * 100).toFixed(0);
    markdown += ` | **Standalone:** ${stats.standalone} (${standalonePercent}%)`;
  }
  markdown += '\n\n';

  // Show parent relationships (blocks this appears inside)
  if (stats.parents.size > 0) {
    markdown += '**Commonly found inside:**\n';
    const sortedParents = [...stats.parents.entries()].sort((a, b) => b[1] - a[1]);
    sortedParents.forEach(([parent, count]) => {
      markdown += `- \`${parent}\` (${count}x)\n`;
    });
    markdown += '\n';
  }

  // Show child relationships (blocks found inside this)
  if (stats.children.size > 0) {
    markdown += '**Commonly contains:**\n';
    const sortedChildren = [...stats.children.entries()].sort((a, b) => b[1] - a[1]);
    sortedChildren.forEach(([child, count]) => {
      markdown += `- \`${child}\` (${count}x)\n`;
    });
    markdown += '\n';
  }

  // Sort pages by count (most usage first)
  const sortedPages = [...stats.pages].sort((a, b) => b.count - a.count);

  markdown += '**Pages:**\n\n';
  markdown += '| Count | Page URL |\n';
  markdown += '|-------|----------|\n';

  sortedPages.forEach((page) => {
    const fullUrl = `${baseUrl}${page.path}`;
    markdown += `| ${page.count}x | [${page.path}](${fullUrl}) |\n`;
  });

  markdown += '\n';
});

// Write markdown file
const markdownFile = reportFile.replace(/\.(xlsx|xls|csv)$/, '-analysis.md');
fs.writeFileSync(markdownFile, markdown);

console.log('\n✅ Analysis complete!');
console.log(`   📄 Markdown report: ${markdownFile}`);

// Export JSON for further analysis
const output = {
  summary: {
    totalPages: records.length,
    totalBlocks: sortedBlocks.length,
    analyzedAt: new Date().toISOString(),
  },
  blocks: sortedBlocks.map(([name, stats]) => ({
    name,
    totalCount: stats.totalCount,
    pageCount: stats.pageCount,
    standalone: stats.standalone,
    parents: Object.fromEntries([...stats.parents.entries()].sort((a, b) => b[1] - a[1])),
    children: Object.fromEntries([...stats.children.entries()].sort((a, b) => b[1] - a[1])),
    pages: stats.pages.sort((a, b) => b.count - a.count),
  })),
};

const jsonFile = reportFile.replace(/\.(xlsx|xls|csv)$/, '-analysis.json');
fs.writeFileSync(jsonFile, JSON.stringify(output, null, 2));
console.log(`   📊 JSON data: ${jsonFile}`);

// Take screenshots if requested
if (takeScreenshots) {
  console.log('\n📸 Taking screenshots...\n');
  await takeBlockScreenshots(sortedBlocks, baseUrl, reportFile);
}

console.log('');
