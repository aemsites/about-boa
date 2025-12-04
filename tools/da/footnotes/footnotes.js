/* eslint-disable import/no-unresolved */
import DA_SDK from 'https://da.live/nx/utils/sdk.js';

let selectedFootnote = null;
let pageUrl = '';

/**
 * Generate a unique back-reference ID for tracking where footnotes are referenced
 */
function generateBackRefId() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `fnref-${timestamp}-${random}`;
}

/**
 * Update the preview when a footnote is selected
 */
function updatePreview() {
  const previewContainer = document.getElementById('reference-preview');
  const referenceOptions = document.getElementById('reference-options');
  const insertButton = document.getElementById('insert-reference');
  const referenceTextInput = document.getElementById('reference-text');
  const referenceTitleInput = document.getElementById('reference-title');

  if (!selectedFootnote) {
    previewContainer.innerHTML = `
      <div class="empty-state">
        <p>Select a footnote to create a reference</p>
      </div>
    `;
    referenceOptions.style.display = 'none';
    insertButton.disabled = true;
    return;
  }

  // Show options
  referenceOptions.style.display = 'block';
  insertButton.disabled = false;

  // Get reference text and title
  const refText = referenceTextInput.value.trim() || '[1]';
  const refTitle = referenceTitleInput.value.trim() || selectedFootnote.text;

  // Update preview
  const backRefId = generateBackRefId();
  const previewHtml = `
    <div class="preview-box">
      <div class="preview-label">Reference will look like:</div>
      <div class="preview-example">
        <sup>
          <a href="${pageUrl}#${selectedFootnote.id}" 
             id="${backRefId}"
             title="${refTitle}"
             class="footnote-ref">${refText}</a>
        </sup>
      </div>
      <div class="preview-details">
        <strong>Links to:</strong> ${selectedFootnote.text}
        ${refTitle !== selectedFootnote.text ? `<br><strong>Hover text:</strong> ${refTitle}` : ''}
      </div>
    </div>
  `;

  previewContainer.innerHTML = previewHtml;
}

/**
 * Scan the page for footnotes block and extract individual footnotes
 */
async function scanPageForFootnotes() {
  const statusMessage = document.getElementById('status-message');
  const mainContent = document.getElementById('main-content');
  const footnotesList = document.getElementById('footnotes-list');

  statusMessage.textContent = 'Scanning page for footnotes block...';
  statusMessage.className = 'status-message loading';

  try {
    const { context } = await DA_SDK;
    pageUrl = `https://main--${context.repo}--${context.org}.aem.page${context.path}`;

    const response = await fetch(pageUrl);
    if (!response.ok) {
      throw new Error('Could not fetch preview page');
    }

    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Look for footnotes block
    const footnotesBlock = doc.querySelector('.footnotes, .block.footnotes, [class*="footnotes"]');

    if (!footnotesBlock) {
      statusMessage.textContent = 'No footnotes block found on this page. Please add a footnotes block first.';
      statusMessage.className = 'status-message error';
      return;
    }

    // Extract individual footnotes
    // Look for common patterns: ol > li, div with data-footnote, paragraphs, etc.
    const footnotes = [];

    // Try ordered list items first (most common pattern)
    const listItems = footnotesBlock.querySelectorAll('ol > li, ul > li');
    if (listItems.length > 0) {
      listItems.forEach((item, index) => {
        const text = item.textContent.trim();
        const id = item.id || `footnote-${index + 1}`;

        if (text) {
          footnotes.push({
            id,
            text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
            fullText: text,
            index: index + 1,
          });
        }
      });
    } else {
      // Fallback: look for paragraphs or divs
      const items = footnotesBlock.querySelectorAll('p, div[id], [data-footnote]');
      items.forEach((item, index) => {
        const text = item.textContent.trim();
        const id = item.id || item.getAttribute('data-footnote') || `footnote-${index + 1}`;

        if (text && text.length > 10) { // Filter out empty or very short items
          footnotes.push({
            id,
            text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
            fullText: text,
            index: index + 1,
          });
        }
      });
    }

    if (footnotes.length === 0) {
      statusMessage.textContent = 'No footnotes found in the footnotes block. Please add footnotes first.';
      statusMessage.className = 'status-message error';
      return;
    }

    // Display footnotes
    footnotesList.innerHTML = '';

    footnotes.forEach((footnote) => {
      const footnoteCard = document.createElement('div');
      footnoteCard.className = 'footnote-card';
      footnoteCard.innerHTML = `
        <div class="footnote-number">${footnote.index}</div>
        <div class="footnote-content">
          <div class="footnote-text">${footnote.text}</div>
          <div class="footnote-id">#${footnote.id}</div>
        </div>
      `;

      footnoteCard.addEventListener('click', () => {
        // Remove previous selection
        document.querySelectorAll('.footnote-card').forEach((card) => {
          card.classList.remove('selected');
        });

        // Select this footnote
        footnoteCard.classList.add('selected');
        selectedFootnote = footnote;

        // Update reference text with the footnote number
        document.getElementById('reference-text').value = `[${footnote.index}]`;
        document.getElementById('reference-title').value = footnote.text;

        updatePreview();
      });

      footnotesList.appendChild(footnoteCard);
    });

    statusMessage.textContent = `Found ${footnotes.length} footnote${footnotes.length !== 1 ? 's' : ''} on the page.`;
    statusMessage.className = 'status-message success';
    mainContent.style.display = 'block';
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error scanning page:', error);
    statusMessage.textContent = 'Could not scan page. Please preview your page first, then try again.';
    statusMessage.className = 'status-message error';
  }
}

/**
 * Insert the footnote reference into the document
 */
async function insertFootnoteReference() {
  if (!selectedFootnote) return;

  const referenceText = document.getElementById('reference-text').value.trim() || `[${selectedFootnote.index}]`;
  const referenceTitle = document.getElementById('reference-title').value.trim() || selectedFootnote.text;
  const backRefId = generateBackRefId();

  // Create the footnote reference HTML
  // Using sup for superscript styling, with a link to the footnote
  const referenceHtml = `<sup><a href="${pageUrl}#${selectedFootnote.id}" id="${backRefId}" title="${referenceTitle}" class="footnote-ref">${referenceText}</a></sup>`;

  try {
    const { actions } = await DA_SDK;
    await actions.sendHTML(referenceHtml);

    // Show success message
    const statusMessage = document.getElementById('status-message');
    statusMessage.textContent = `Footnote reference inserted! The reference links to #${selectedFootnote.id}`;
    statusMessage.className = 'status-message success';

    // Optionally close the plugin after insertion
    // Commenting out to allow multiple insertions
    // actions.closeLibrary();

    // Reset selection for next insertion
    document.querySelectorAll('.footnote-card').forEach((card) => {
      card.classList.remove('selected');
    });
    selectedFootnote = null;
    updatePreview();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error inserting reference:', error);
    const statusMessage = document.getElementById('status-message');
    statusMessage.textContent = 'Failed to insert reference. Please try again.';
    statusMessage.className = 'status-message error';
  }
}

/**
 * Initialize the plugin
 */
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('scan-page').addEventListener('click', scanPageForFootnotes);
  document.getElementById('insert-reference').addEventListener('click', insertFootnoteReference);

  // Update preview when reference text or title changes
  document.getElementById('reference-text').addEventListener('input', updatePreview);
  document.getElementById('reference-title').addEventListener('input', updatePreview);
});
