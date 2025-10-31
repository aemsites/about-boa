#!/usr/bin/env node
/* eslint-disable no-console, import/no-extraneous-dependencies */

/**
 * Create GitHub issues for blocks identified in the analysis
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'https://about.bankofamerica.com';
const ANALYSIS_URL = 'https://github.com/aemsites/about-boa/blob/main/tools/importer/import-report-analysis.md';

// Blocks to create issues for (from blocks-decision-worksheet.md)
const blocksToCreate = {
  'usage: high': [
    'notched-image',
    'icon-list',
    'locator-block',
    'story-block',
  ],
  'usage: medium': [
    'content-card', // includes variants: tile, arts-masonry-tile, modular-tiles, manual-tile
    'article-masthead', // includes variants: masthead, arts-masthead
    'social-share',
    'footnote',
    'media-kaltura',
    'opt-in-out-form',
    'highlight-block',
    'quote',
    'carousel', // includes variant: arts-carousel
  ],
  'usage: low': [
    'report-center',
    'spotlight',
  ],
};

// Read the analysis JSON
const analysisPath = path.join(__dirname, 'import-report-analysis.json');
const analysis = JSON.parse(fs.readFileSync(analysisPath, 'utf8'));

// Map block names to their data
const blockData = new Map(analysis.blocks.map((block) => [block.name, block]));

/**
 * Format the issue body for a block
 */
function createIssueBody(blockName, data, variants = []) {
  // GitHub auto-generates anchors from heading text (lowercase, hyphens for spaces/special chars)
  const anchorName = blockName.toLowerCase();

  let body = '## Overview\n';
  body += `Build the **${blockName}** block.\n\n`;

  if (variants.length > 0) {
    body += '### Variants\n';
    body += 'This block should support the following variants:\n';
    variants.forEach((variant) => {
      const variantData = blockData.get(variant);
      if (variantData) {
        body += `- **${variant}** (${variantData.totalCount} uses, ${variantData.pageCount} pages)\n`;
      }
    });
    body += '\n';
  }

  body += '## Usage Statistics\n';
  body += `- **Total Uses:** ${data.totalCount}\n`;
  body += `- **Pages:** ${data.pageCount}\n`;
  body += `- **Standalone:** ${data.standalone} (${Math.round((data.standalone / data.totalCount) * 100)}%)\n`;

  // Most common page
  const topPage = data.pages.sort((a, b) => b.count - a.count)[0];
  body += `- **Example:** ${BASE_URL}${topPage.path}\n\n`;

  // Parent/Child relationships
  if (Object.keys(data.parents).length > 0) {
    body += '### Commonly found inside\n';
    const sortedParents = Object.entries(data.parents)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    sortedParents.forEach(([parent, count]) => {
      body += `- ${parent} (${count}x)\n`;
    });
    body += '\n';
  }

  if (Object.keys(data.children).length > 0) {
    body += '### Commonly contains\n';
    const sortedChildren = Object.entries(data.children)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    sortedChildren.forEach(([child, count]) => {
      body += `- ${child} (${count}x)\n`;
    });
    body += '\n';
  }

  body += '## Page Usage\n';
  body += '<details>\n';
  body += `<summary>Full list of pages (${data.pageCount} pages, ${data.totalCount} total uses)</summary>\n\n`;

  // Sort pages by count (highest first), then alphabetically
  const sortedPages = [...data.pages].sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return a.path.localeCompare(b.path);
  });

  sortedPages.forEach((page) => {
    body += `- [${BASE_URL}${page.path}](${BASE_URL}${page.path}) (${page.count}x)\n`;
  });

  body += '\n</details>\n\n';

  body += '## Analysis\n';
  body += `See [import-report-analysis.md](${ANALYSIS_URL}#${anchorName}) for detailed breakdown.\n\n`;

  body += '## Implementation Notes\n';
  body += '- [ ] Analyze visual design and styling\n';
  body += '- [ ] Implement responsive behavior\n';
  body += '- [ ] Accessibility considerations\n';
  body += '- [ ] Test with sample content\n';
  body += '- [ ] Update importer script (`tools/importer/import.js`) with transformation rules\n';
  body += '- [ ] Re-import content to test block with real data\n';

  return body;
}

/**
 * Create a GitHub issue for a block
 */
function createIssue(blockName, usageLabel, variants = []) {
  const data = blockData.get(blockName);
  if (!data) {
    console.error(`❌ Block "${blockName}" not found in analysis data`);
    return null;
  }

  // Check if screenshot exists
  const screenshotPath = path.join(__dirname, 'screenshots', 'import-report', `${blockName}.png`);
  const hasScreenshot = fs.existsSync(screenshotPath);

  // Add needs-details label if no screenshot
  const labels = `block,${usageLabel}${hasScreenshot ? '' : ',needs-details'}`;

  const title = `Build ${blockName.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} Block`;
  const body = createIssueBody(blockName, data, variants);

  // Write body to temp file (easier than escaping for command line)
  const tempFile = path.join(__dirname, '.issue-body.tmp');
  fs.writeFileSync(tempFile, body);

  try {
    const result = execSync(
      `gh issue create --title "${title}" --body-file "${tempFile}" --label "${labels}"`,
      { cwd: path.join(__dirname, '..', '..'), encoding: 'utf8' },
    );

    const issueUrl = result.trim();
    console.log(`✅ Created: ${title}`);
    console.log(`   ${issueUrl}`);

    // Clean up temp file
    fs.unlinkSync(tempFile);

    return { url: issueUrl, hasScreenshot };
  } catch (error) {
    console.error(`❌ Failed to create issue for ${blockName}:`, error.message);
    fs.unlinkSync(tempFile);
    return null;
  }
}

/**
 * Upload screenshot to an issue via GitHub API
 */
function uploadScreenshot(issueUrl, blockName) {
  const screenshotPath = path.join(__dirname, 'screenshots', 'import-report', `${blockName}.png`);

  if (!fs.existsSync(screenshotPath)) {
    console.log('   ⚠️  No screenshot - added \'needs-details\' label');
    return;
  }

  // Extract issue number from URL
  const issueNumber = issueUrl.split('/').pop();

  try {
    // Read the image and convert to base64
    const imageBuffer = fs.readFileSync(screenshotPath);
    const base64Image = imageBuffer.toString('base64');

    // Upload via GitHub API using gh CLI
    // First, we need to create a temporary file with the image data
    const uploadResult = execSync(
      `gh api -X POST /repos/aemsites/about-boa/issues/${issueNumber}/comments -f body="## Screenshot\n\n" --silent`,
      { cwd: path.join(__dirname, '..', '..'), encoding: 'utf8' },
    );

    // Since gh CLI doesn't support direct image upload, we'll use a different approach
    // Create a comment with instructions to drag-and-drop the image
    const commentBody = `## Screenshot\n\n_Screenshot: \`${blockName}.png\` (${Math.round(imageBuffer.length / 1024)}KB)_\n\n> **Note:** Please drag and drop the screenshot from \`tools/importer/screenshots/import-report/${blockName}.png\` here to upload it.`;

    execSync(
      `gh issue comment ${issueNumber} --body "${commentBody.replace(/"/g, '\\"')}"`,
      { cwd: path.join(__dirname, '..', '..'), encoding: 'utf8' },
    );

    console.log(`   📸 Screenshot placeholder added to issue #${issueNumber}`);
    console.log(`   📁 Path: ${screenshotPath}`);
  } catch (error) {
    console.error(`   ❌ Failed to add screenshot comment: ${error.message}`);
  }
}

// Main execution
console.log('\n📝 Creating GitHub issues for blocks...\n');

Object.entries(blocksToCreate).forEach(([usageLabel, blocks]) => {
  console.log(`\n## ${usageLabel.toUpperCase()}\n`);

  blocks.forEach((blockName) => {
    // Handle blocks with variants
    let variants = [];
    if (blockName === 'content-card') {
      variants = ['tile', 'arts-masonry-tile', 'modular-tiles', 'manual-tile'];
    } else if (blockName === 'article-masthead') {
      variants = ['masthead', 'arts-masthead'];
    } else if (blockName === 'story-block') {
      variants = ['arts-story-block', 'storyblock'];
    } else if (blockName === 'carousel') {
      variants = ['arts-carousel'];
    } else if (blockName === 'icon-list') {
      variants = ['icon-grid'];
    }

    const result = createIssue(blockName, usageLabel, variants);
    if (result) {
      uploadScreenshot(result.url, blockName);
    }
  });
});

console.log('\n✅ Done! Remember to manually upload screenshots to the issues.\n');
