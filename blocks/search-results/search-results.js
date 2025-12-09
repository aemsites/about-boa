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
 * Sort results by date
 * @param {Object[]} results - array of results
 * @param {string} direction - 'newest' or 'oldest'
 * @returns {Object[]} sorted results
 */
function sortByDate(results, direction) {
  return [...results].sort((a, b) => {
    const dateA = a.date ? new Date(a.date).getTime() : 0;
    const dateB = b.date ? new Date(b.date).getTime() : 0;
    return direction === 'newest' ? dateB - dateA : dateA - dateB;
  });
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
 * @param {string} sort - sort option
 */
function updateURL(query, page, sort) {
  const url = new URL(window.location.href);
  if (query) url.searchParams.set('q', query);
  if (page > 1) {
    url.searchParams.set('p', page);
  } else {
    url.searchParams.delete('p');
  }
  if (sort && sort !== 'relevance') {
    url.searchParams.set('sort', sort);
  } else {
    url.searchParams.delete('sort');
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

  for (let i = 1; i <= totalPages; i += 1) {
    const li = document.createElement('li');
    const button = document.createElement('button');
    button.textContent = i;
    button.setAttribute('aria-label', getPlaceholder(placeholders, 'searchPageLabel', `Page ${i}`).replace('{number}', i));

    if (i === currentPage) {
      button.setAttribute('aria-current', 'page');
      button.disabled = true;
    } else {
      button.addEventListener('click', () => onPageChange(i));
    }

    li.append(button);
    list.append(li);
  }

  nav.append(list);
  return nav;
}

/**
 * Create sort controls
 * @param {string} currentSort - current sort option
 * @param {Object} placeholders - placeholders
 * @param {Function} onSortChange - callback for sort change
 * @returns {HTMLElement}
 */
function createSortControls(currentSort, placeholders, onSortChange) {
  const container = document.createElement('div');
  container.className = 'search-results-sort';

  const label = document.createElement('span');
  label.className = 'search-results-sort-label';
  label.textContent = getPlaceholder(placeholders, 'searchSortBy', 'Sort by:');

  const options = document.createElement('ul');
  options.className = 'search-results-sort-options';

  const sortOptions = [
    { value: 'relevance', label: getPlaceholder(placeholders, 'searchSortRelevance', 'Relevance') },
    { value: 'newest', label: getPlaceholder(placeholders, 'searchSortNewest', 'Newest') },
    { value: 'oldest', label: getPlaceholder(placeholders, 'searchSortOldest', 'Oldest') },
  ];

  sortOptions.forEach((option) => {
    const li = document.createElement('li');
    const button = document.createElement('button');
    button.textContent = option.label;
    button.setAttribute('aria-label', `Sort results by ${option.label}`);

    if (option.value === currentSort) {
      button.disabled = true;
      button.setAttribute('aria-pressed', 'true');
    } else {
      button.addEventListener('click', () => onSortChange(option.value));
    }

    li.append(button);
    options.append(li);
  });

  container.append(label, options);
  return container;
}

/**
 * Render search results
 * @param {HTMLElement} block - block element
 * @param {Object} state - current state
 */
async function renderResults(block, state) {
  const {
    results, currentPage, currentSort, placeholders, noResultsFragmentPath,
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
    // Sort controls
    const sortControls = createSortControls(currentSort, placeholders, (newSort) => {
      state.currentSort = newSort;
      state.currentPage = 1;

      if (newSort === 'relevance') {
        state.results = state.originalResults;
      } else {
        state.results = sortByDate(state.originalResults, newSort);
      }

      updateURL(state.query, 1, newSort);
      renderResults(block, state);
    });
    resultsContainer.append(sortControls);

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
        updateURL(state.query, newPage, state.currentSort);
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
      state.originalResults = [];
    } else {
      const filtered = filterData(searchTerms, allData);
      state.originalResults = filtered;

      // Apply sort if not relevance
      if (state.currentSort === 'relevance') {
        state.results = filtered;
      } else {
        state.results = sortByDate(filtered, state.currentSort);
      }
    }

    await renderResults(block, state);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Search failed:', error);
    resultsContainer.innerHTML = '<p class="search-results-error">An error occurred while searching. Please try again.</p>';
  }
}

export default async function decorate(block) {
  const placeholders = await fetchLangPlaceholders();

  // Get no-results fragment path from block content or use default
  // The link may have been auto-blocked as a fragment, so check for both cases
  let noResultsFragmentPath = DEFAULT_NO_RESULTS_FRAGMENT;

  // Check for auto-blocked fragment first (link was converted to fragment block)
  const fragmentBlock = block.querySelector('.fragment');
  if (fragmentBlock) {
    const fragmentLink = fragmentBlock.querySelector('a[href]');
    if (fragmentLink) {
      noResultsFragmentPath = fragmentLink.getAttribute('href');
    }
    // Remove the fragment block to prevent it from trying to load
    fragmentBlock.remove();
  } else {
    // Check for direct link (not auto-blocked)
    const link = block.querySelector('a[href]');
    if (link) {
      noResultsFragmentPath = link.getAttribute('href');
    }
  }

  // Get search parameters from URL
  const query = searchParams.get('q') || '';
  const page = parseInt(searchParams.get('p'), 10) || 1;
  const sort = searchParams.get('sort') || 'relevance';

  // Initialize state
  const state = {
    query,
    currentPage: page,
    currentSort: sort,
    results: [],
    originalResults: [],
    placeholders,
    noResultsFragmentPath,
  };

  // Clear block and create structure
  block.innerHTML = '';

  const container = document.createElement('div');
  container.className = 'search-results-container';
  block.append(container);

  // Execute search if query exists
  if (query) {
    await executeSearch(block, state);
  } else {
    // No query - show no results
    state.results = [];
    state.originalResults = [];
    await renderResults(block, state);
  }
}
