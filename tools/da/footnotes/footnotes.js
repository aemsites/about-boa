/* eslint-disable import/no-unresolved */
import DA_SDK from 'https://da.live/nx/utils/sdk.js';

let selectedFootnote = null;
let pageUrl = '';

// DOM element cache
const $ = (id) => document.getElementById(id);

/**
 * Truncate text with ellipsis
 */
const truncate = (text, max = 100) => (text.length > max ? `${text.substring(0, max)}...` : text);

/**
 * Create footnote object from element
 */
const createFootnote = (el, index) => {
  const text = el.textContent.trim();
  if (!text || (el.tagName === 'P' && text.length <= 10)) return null;
  return {
    id: el.id || el.getAttribute('data-footnote') || `footnote-${index + 1}`,
    text: truncate(text),
    fullText: text,
    index: index + 1,
  };
};

/**
 * Extract footnotes from a parsed document
 */
function extractFootnotesFromDoc(doc) {
  const block = doc.querySelector('.footnotes, .block.footnotes, [class*="footnotes"]');
  if (!block) return { error: 'No footnotes block found on this page. Please add a footnotes block first.' };

  // Try different selectors in order of preference
  const selectors = [':scope > div', 'ol > li, ul > li', 'p, div[id], [data-footnote]'];
  let footnotes = [];

  selectors.some((selector) => {
    footnotes = [...block.querySelectorAll(selector)].map(createFootnote).filter(Boolean);
    return footnotes.length > 0;
  });

  return footnotes.length
    ? { footnotes }
    : { error: 'No footnotes found in the footnotes block. Please add footnotes first.' };
}

/**
 * Update the preview when a footnote is selected
 */
function updatePreview() {
  const preview = $('reference-preview');
  const options = $('reference-options');
  const btn = $('insert-reference');

  if (!selectedFootnote) {
    preview.innerHTML = '<div class="empty-state"><p>Select a footnote to create a reference</p></div>';
    options.style.display = 'none';
    btn.disabled = true;
    return;
  }

  options.style.display = 'block';
  btn.disabled = false;

  const refText = $('reference-text').value.trim() || selectedFootnote.index;
  const refTitle = $('reference-title').value.trim() || selectedFootnote.text;

  preview.innerHTML = `
    <div class="preview-box">
      <div class="preview-label">Reference will look like:</div>
      <div class="preview-example">
        <a href="${pageUrl}#${selectedFootnote.id}" title="${refTitle}"><sup>${refText}</sup></a>
      </div>
      <div class="preview-details">
        <strong>Links to:</strong> ${selectedFootnote.text}
        ${refTitle !== selectedFootnote.text ? `<br><strong>Hover text:</strong> ${refTitle}` : ''}
      </div>
    </div>`;
}

/**
 * Handle footnote card selection
 */
function selectFootnote(card, footnote) {
  document.querySelectorAll('.footnote-card').forEach((c) => c.classList.remove('selected'));
  card.classList.add('selected');
  selectedFootnote = footnote;
  $('reference-text').value = footnote.index;
  $('reference-title').value = footnote.text;
  updatePreview();
}

/**
 * Process and display footnotes from a parsed document
 */
function displayFootnotes(doc) {
  const status = $('status-message');
  const { footnotes, error } = extractFootnotesFromDoc(doc);

  if (error) {
    status.textContent = error;
    status.className = 'status-message error';
    return;
  }

  const list = $('footnotes-list');
  list.innerHTML = footnotes.map((fn) => `
    <div class="footnote-card" data-index="${fn.index - 1}">
      <div class="footnote-number">${fn.index}</div>
      <div class="footnote-content">
        <div class="footnote-text">${fn.text}</div>
        <div class="footnote-id">#${fn.id}</div>
      </div>
    </div>`).join('');

  // Event delegation for card clicks
  list.onclick = (e) => {
    const card = e.target.closest('.footnote-card');
    if (card) selectFootnote(card, footnotes[card.dataset.index]);
  };

  status.textContent = `Found ${footnotes.length} footnote${footnotes.length !== 1 ? 's' : ''} on the page.`;
  status.className = 'status-message success';
  $('main-content').style.display = 'block';
}

/**
 * Fetch and parse HTML document
 */
async function fetchAndParse(url, token) {
  const opts = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  const resp = await fetch(url, opts);
  if (!resp.ok) throw new Error(`Could not fetch: ${resp.status}`);
  return new DOMParser().parseFromString(await resp.text(), 'text/html');
}

/**
 * Scan the page for footnotes block and extract individual footnotes
 */
async function scanPageForFootnotes() {
  const status = $('status-message');
  status.textContent = 'Scanning page for footnotes block...';
  status.className = 'status-message loading';

  try {
    const { context, token } = await DA_SDK;
    if (!context) throw new Error('DA SDK context not available. Please make sure you are in the DA editor.');

    pageUrl = `https://main--${context.repo}--${context.org}.aem.page${context.path}`;

    const doc = token
      ? await fetchAndParse(`https://admin.da.live/source/${context.org}/${context.repo}${context.path}.html`, token)
      : await fetchAndParse(pageUrl);

    displayFootnotes(doc);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error scanning page:', err);
    status.textContent = `Could not scan page: ${err.message}. Make sure you are logged in to DA.`;
    status.className = 'status-message error';
  }
}

/**
 * Insert the footnote reference into the document
 */
async function insertFootnoteReference() {
  if (!selectedFootnote) return;

  const refText = $('reference-text').value.trim() || selectedFootnote.index;
  const refTitle = $('reference-title').value.trim() || selectedFootnote.text;
  const html = `<a href="${pageUrl}#${selectedFootnote.id}" title="${refTitle}"><sup>${refText}</sup></a>`;

  try {
    const { actions } = await DA_SDK;
    await actions.sendHTML(html);

    $('status-message').textContent = `Footnote reference inserted! Links to #${selectedFootnote.id}`;
    $('status-message').className = 'status-message success';

    await actions.closeLibrary();

    document.querySelectorAll('.footnote-card').forEach((c) => c.classList.remove('selected'));
    selectedFootnote = null;
    updatePreview();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error inserting reference:', err);
    $('status-message').textContent = 'Failed to insert reference. Please try again.';
    $('status-message').className = 'status-message error';
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  $('insert-reference').addEventListener('click', insertFootnoteReference);
  $('reference-text').addEventListener('input', updatePreview);
  $('reference-title').addEventListener('input', updatePreview);
  scanPageForFootnotes();
});
