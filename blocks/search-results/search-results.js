import { loadFragment } from '../fragment/fragment.js';
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
 * Filter data based on search terms
 * @param {string[]} searchTerms - array of search terms
 * @param {Object[]} data - array of data entries
 * @returns {Object[]} filtered and sorted results
 */
function filterData(searchTerms, data) {
  const foundInTitle = [];
  const foundInMeta = [];

  data.forEach((result) => {
    let minIdx = -1;

    // Search in title first
    searchTerms.forEach((term) => {
      const idx = (result.title || '').toLowerCase().indexOf(term);
      if (idx >= 0 && (minIdx < 0 || idx < minIdx)) minIdx = idx;
    });

    if (minIdx >= 0) {
      foundInTitle.push({ minIdx, result });
      return;
    }

    // Search in description and path
    const metaContents = `${result.title || ''} ${result.description || ''} ${result.path.split('/').pop()}`.toLowerCase();
    searchTerms.forEach((term) => {
      const idx = metaContents.indexOf(term);
      if (idx >= 0 && (minIdx < 0 || idx < minIdx)) minIdx = idx;
    });

    if (minIdx >= 0) {
      foundInMeta.push({ minIdx, result });
    }
  });

  return [
    ...foundInTitle.sort((a, b) => a.minIdx - b.minIdx),
    ...foundInMeta.sort((a, b) => a.minIdx - b.minIdx),
  ].map((item) => item.result);
}

/**
 * Format date for display
 * @param {string} dateStr - date string
 * @returns {string} formatted date
 */
function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
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
 * Create a single result item
 * @param {Object} result - result data
 * @returns {HTMLElement}
 */
function createResultItem(result) {
  const item = document.createElement('div');
  item.className = 'search-results-item';

  const link = document.createElement('a');
  link.href = result.path;
  link.className = 'search-results-item-title';
  link.textContent = result.title || result.path;

  const description = document.createElement('p');
  description.className = 'search-results-item-description';
  description.textContent = result.description || '';

  const date = document.createElement('p');
  date.className = 'search-results-item-date';
  date.textContent = formatDate(result.date);

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
    // Fetch all data from query-index
    const allData = await ffetch('/query-index.json').all();

    // Filter by search terms
    const searchTerms = state.query.toLowerCase().split(/\s+/).filter((term) => term.length >= 3);

    if (searchTerms.length === 0) {
      state.results = [];
    } else {
      state.results = filterData(searchTerms, allData);
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
