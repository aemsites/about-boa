import { loadFragment } from '../fragment/fragment.js';
import { decorateIcons } from '../../scripts/scripts.js';
import ffetch from '../../scripts/ffetch.js';
import fetchLangPlaceholders from '../../scripts/placeholders.js';

const DEFAULT_NO_RESULTS_FRAGMENT = '/en/fragments/search-no-results';
const RESULTS_PER_PAGE = 10;

const searchParams = new URLSearchParams(window.location.search);

/**
 * Get placeholder with fallback
 * @param {Object} placeholders - placeholders object
 * @param {string} key - placeholder key
 * @param {string} fallback - fallback value
 * @returns {string}
 */
function getPlaceholder(placeholders, key, fallback) {
  return placeholders[key] || fallback;
}

/**
 * Check if entry matches any search terms
 * @param {Object} entry - data entry
 * @param {string[]} searchTerms - array of search terms
 * @returns {boolean} true if entry matches
 */
function matchesSearchTerms(entry, searchTerms) {
  const title = (entry.title || '').toLowerCase();
  const description = (entry.description || '').toLowerCase();
  const searchableText = `${title} ${description}`;
  return searchTerms.some((term) => searchableText.includes(term));
}

/**
 * Add match metadata to entry for ranking
 * @param {Object} entry - data entry
 * @param {string[]} searchTerms - array of search terms
 * @returns {Object} entry with match metadata
 */
function addMatchMetadata(entry, searchTerms) {
  const title = (entry.title || '').toLowerCase();
  const description = (entry.description || '').toLowerCase();
  const searchableText = `${title} ${description}`;

  const matchedTerms = searchTerms.filter((term) => searchableText.includes(term));
  const titleMatchCount = searchTerms.filter((term) => title.includes(term)).length;

  return {
    ...entry,
    matchedTerms,
    matchCount: matchedTerms.length,
    titleMatchCount,
  };
}

/**
 * Sort results by ranking criteria
 * - Title matches (desc), total matches (desc), then last modified (newest first)
 * @param {Object[]} results - array of results with match metadata
 * @returns {Object[]} sorted results
 */
function sortResults(results) {
  return results.sort((a, b) => {
    if (b.titleMatchCount !== a.titleMatchCount) {
      return b.titleMatchCount - a.titleMatchCount;
    }
    if (b.matchCount !== a.matchCount) {
      return b.matchCount - a.matchCount;
    }
    return (b.lastModified || 0) - (a.lastModified || 0);
  });
}

/**
 * Format date for display
 * @param {number|string} timestamp - timestamp or date string
 * @returns {string} formatted date
 */
function formatDate(timestamp) {
  if (!timestamp) return '';
  try {
    // Handle both Unix timestamps (seconds) and milliseconds
    const ts = typeof timestamp === 'number' && timestamp < 10000000000
      ? timestamp * 1000
      : timestamp;
    const date = new Date(ts);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return '';
  }
}

/**
 * Highlight matched terms in text (XSS-safe using DOM methods)
 * @param {string} text - original text
 * @param {string[]} terms - terms to highlight
 * @returns {DocumentFragment} fragment with highlighted text
 */
function highlightTerms(text, terms) {
  const fragment = document.createDocumentFragment();

  if (!terms || terms.length === 0) {
    fragment.append(document.createTextNode(text));
    return fragment;
  }

  // Create regex pattern for all terms (case-insensitive)
  const pattern = new RegExp(`(${terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
  const parts = text.split(pattern);

  parts.forEach((part) => {
    if (terms.some((term) => part.toLowerCase() === term.toLowerCase())) {
      const mark = document.createElement('mark');
      mark.textContent = part;
      fragment.append(mark);
    } else {
      fragment.append(document.createTextNode(part));
    }
  });

  return fragment;
}

/**
 * Update URL with search parameters
 * @param {string} query - search query
 * @param {number} page - page number
 */
function updateURL(query, page) {
  const url = new URL(window.location.href);
  if (query) url.searchParams.set('q', query);
  if (page > 1) {
    url.searchParams.set('p', page);
  } else {
    url.searchParams.delete('p');
  }
  window.history.replaceState({}, '', url.toString());
}

/**
 * Create a single result item with highlighted terms
 * @param {Object} result - result data with matchedTerms
 * @returns {HTMLElement}
 */
function createResultItem(result) {
  const item = document.createElement('div');
  item.className = 'search-results-item';

  const link = document.createElement('a');
  link.href = result.path;
  link.className = 'search-results-item-title';
  link.append(highlightTerms(result.title || result.path, result.matchedTerms));

  const description = document.createElement('p');
  description.className = 'search-results-item-description';
  description.append(highlightTerms(result.description || '', result.matchedTerms));

  const date = document.createElement('p');
  date.className = 'search-results-item-date';
  date.textContent = formatDate(result.lastModified);

  item.append(link, description, date);
  return item;
}

/**
 * Get visible page numbers for pagination
 * @param {number} currentPage - current page
 * @param {number} totalPages - total pages
 * @returns {Array} array of page numbers and ellipsis markers
 */
function getVisiblePages(currentPage, totalPages) {
  const pages = [];
  const maxVisible = 5;

  if (totalPages <= maxVisible + 2) {
    // Show all pages if total is small enough
    for (let i = 1; i <= totalPages; i += 1) {
      pages.push(i);
    }
  } else if (currentPage <= 3) {
    // Near the start: 1 2 3 4 ... last
    for (let i = 1; i <= 4; i += 1) {
      pages.push(i);
    }
    pages.push('...');
    pages.push(totalPages);
  } else if (currentPage >= totalPages - 2) {
    // Near the end: 1 ... last-3 last-2 last-1 last
    pages.push(1);
    pages.push('...');
    for (let i = totalPages - 3; i <= totalPages; i += 1) {
      pages.push(i);
    }
  } else {
    // In the middle: 1 ... curr-1 curr curr+1 ... last
    pages.push(1);
    pages.push('...');
    pages.push(currentPage - 1);
    pages.push(currentPage);
    pages.push(currentPage + 1);
    pages.push('...');
    pages.push(totalPages);
  }

  return pages;
}

/**
 * Create pagination
 * @param {number} currentPage - current page
 * @param {number} totalPages - total pages
 * @param {Object} placeholders - placeholders
 * @param {Function} onPageChange - callback for page change
 * @returns {HTMLElement}
 */
function createPagination(currentPage, totalPages, placeholders, onPageChange) {
  const nav = document.createElement('nav');
  nav.className = 'search-results-pagination';
  nav.setAttribute('aria-label', getPlaceholder(placeholders, 'searchPaginationLabel', 'Search Pagination'));

  const list = document.createElement('ul');

  // Previous button
  const prevLi = document.createElement('li');
  const prevButton = document.createElement('button');
  prevButton.className = 'pagination-prev';
  prevButton.textContent = getPlaceholder(placeholders, 'searchPaginationPrev', 'Prev');
  prevButton.setAttribute('aria-label', getPlaceholder(placeholders, 'searchPaginationPrevLabel', 'Previous page'));
  if (currentPage === 1) {
    prevButton.disabled = true;
  } else {
    prevButton.addEventListener('click', () => onPageChange(currentPage - 1));
  }
  prevLi.append(prevButton);
  list.append(prevLi);

  // Page numbers
  const visiblePages = getVisiblePages(currentPage, totalPages);
  visiblePages.forEach((page) => {
    const li = document.createElement('li');

    if (page === '...') {
      const ellipsis = document.createElement('span');
      ellipsis.className = 'pagination-ellipsis';
      ellipsis.textContent = '...';
      li.append(ellipsis);
    } else {
      const button = document.createElement('button');
      button.textContent = page;
      button.setAttribute('aria-label', getPlaceholder(placeholders, 'searchPageLabel', `Page ${page}`).replace('{number}', page));

      if (page === currentPage) {
        button.setAttribute('aria-current', 'page');
        button.disabled = true;
      } else {
        button.addEventListener('click', () => onPageChange(page));
      }
      li.append(button);
    }

    list.append(li);
  });

  // Next button
  const nextLi = document.createElement('li');
  const nextButton = document.createElement('button');
  nextButton.className = 'pagination-next';
  nextButton.textContent = getPlaceholder(placeholders, 'searchPaginationNext', 'Next');
  nextButton.setAttribute('aria-label', getPlaceholder(placeholders, 'searchPaginationNextLabel', 'Next page'));
  if (currentPage === totalPages) {
    nextButton.disabled = true;
  } else {
    nextButton.addEventListener('click', () => onPageChange(currentPage + 1));
  }
  nextLi.append(nextButton);
  list.append(nextLi);

  nav.append(list);
  return nav;
}

/**
 * Render search results
 * @param {HTMLElement} block - block element
 * @param {Object} state - current state
 */
async function renderResults(block, state) {
  const {
    results, currentPage, placeholders, noResultsFragmentPath,
  } = state;

  const resultsContainer = block.querySelector('.search-results-container');
  resultsContainer.innerHTML = '';

  const totalResults = results.length;
  const totalPages = Math.ceil(totalResults / RESULTS_PER_PAGE);
  const start = (currentPage - 1) * RESULTS_PER_PAGE;
  const end = Math.min(start + RESULTS_PER_PAGE, totalResults);
  const pageResults = results.slice(start, end);

  // Results count
  const countText = totalResults === 0
    ? getPlaceholder(placeholders, 'searchShowingNoResults', 'Showing 0 results')
    : getPlaceholder(placeholders, 'searchShowingResults', `Showing ${start + 1}-${end} of ${totalResults} results`)
      .replace('{start}', start + 1)
      .replace('{end}', end)
      .replace('{total}', totalResults);

  const count = document.createElement('p');
  count.className = 'search-results-count';
  count.textContent = countText;
  resultsContainer.append(count);

  if (totalResults === 0) {
    // Load no-results fragment
    const noResultsWrapper = document.createElement('div');
    noResultsWrapper.className = 'search-results-no-results';

    const fragment = await loadFragment(noResultsFragmentPath);
    if (fragment) {
      noResultsWrapper.append(...fragment.childNodes);
    }

    resultsContainer.append(noResultsWrapper);
  } else {
    // Results list
    const list = document.createElement('div');
    list.className = 'search-results-list';

    pageResults.forEach((result) => {
      list.append(createResultItem(result));
    });

    resultsContainer.append(list);

    // Pagination
    if (totalPages > 1) {
      const pagination = createPagination(currentPage, totalPages, placeholders, (newPage) => {
        state.currentPage = newPage;
        updateURL(state.query, newPage);
        renderResults(block, state);
        // Scroll to top of results
        block.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      resultsContainer.append(pagination);
    }
  }
}

/**
 * Execute search
 * @param {HTMLElement} block - block element
 * @param {Object} state - current state
 */
async function executeSearch(block, state) {
  const resultsContainer = block.querySelector('.search-results-container');
  resultsContainer.innerHTML = `<p class="search-results-loading">${getPlaceholder(state.placeholders, 'searchLoading', 'Loading results...')}</p>`;

  try {
    // Parse search terms (min 3 chars each)
    const searchTerms = state.query.toLowerCase().split(/\s+/).filter((term) => term.length >= 3);

    if (searchTerms.length === 0) {
      state.results = [];
    } else {
      // Use ffetch's filter and map for streaming efficiency
      const results = await ffetch('/query-index.json')
        .filter((entry) => matchesSearchTerms(entry, searchTerms))
        .map((entry) => addMatchMetadata(entry, searchTerms))
        .all();

      // Sort results (ffetch doesn't have built-in sort)
      state.results = sortResults(results);
    }

    await renderResults(block, state);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Search failed:', error);
    resultsContainer.innerHTML = '<p class="search-results-error">An error occurred while searching. Please try again.</p>';
  }
}

/**
 * Create the search bar
 * @param {Object} state - current state
 * @param {Object} placeholders - placeholders
 * @param {Function} onSearch - callback for search submission
 * @returns {HTMLElement}
 */
function createSearchBar(state, placeholders, onSearch) {
  const wrapper = document.createElement('div');
  wrapper.className = 'search-results-search-bar';

  const form = document.createElement('form');
  form.setAttribute('role', 'search');

  const inputWrapper = document.createElement('div');
  inputWrapper.className = 'search-results-input-wrapper';

  const icon = document.createElement('span');
  icon.className = 'icon icon-search';

  const input = document.createElement('input');
  input.type = 'search';
  input.name = 'q';
  input.className = 'search-results-input';
  input.placeholder = getPlaceholder(placeholders, 'searchPlaceholder', 'Suggested Keywords');
  input.value = state.query;
  input.setAttribute('aria-label', getPlaceholder(placeholders, 'searchInputLabel', 'Search'));

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const newQuery = input.value.trim();
    if (newQuery) {
      onSearch(newQuery);
    }
  });

  inputWrapper.append(icon, input);
  form.append(inputWrapper);
  wrapper.append(form);
  return wrapper;
}

export default async function decorate(block) {
  const placeholders = await fetchLangPlaceholders();

  // Get no-results fragment path from block content or use default
  const link = block.querySelector('a[href]');
  const noResultsFragmentPath = link ? link.getAttribute('href') : DEFAULT_NO_RESULTS_FRAGMENT;

  // Get search parameters from URL
  const query = searchParams.get('q') || '';
  const page = parseInt(searchParams.get('p'), 10) || 1;

  // Initialize state
  const state = {
    query,
    currentPage: page,
    results: [],
    placeholders,
    noResultsFragmentPath,
  };

  // Clear block and create structure
  block.innerHTML = '';

  // Search bar
  const searchBar = createSearchBar(state, placeholders, (newQuery) => {
    state.query = newQuery;
    state.currentPage = 1;
    updateURL(newQuery, 1);
    executeSearch(block, state);
  });
  decorateIcons(searchBar);
  block.append(searchBar);

  const container = document.createElement('div');
  container.className = 'search-results-container';
  block.append(container);

  // Execute search if query exists
  if (query) {
    await executeSearch(block, state);
  } else {
    // No query - show no results
    state.results = [];
    await renderResults(block, state);
  }
}
