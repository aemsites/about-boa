import { buildBlock, loadBlock, decorateBlock } from './aem.js';

export async function loadEager() {
  // no op
}

export async function loadLazy() {
  if (document.querySelector('.author-feedback')) {
    document.querySelector('.author-feedback').remove();
  }

  const authorFeedback = buildBlock('author-feedback', '');
  document.body.appendChild(authorFeedback);

  decorateBlock(authorFeedback);
  await loadBlock(authorFeedback);
}

export async function loadDelayed() {
  // no op
}
