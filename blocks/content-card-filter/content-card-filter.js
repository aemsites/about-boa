const ALL_CAUSES_LABEL = 'All Causes';
const MAX_VISIBLE_CARDS = 6;
const DEFAULT_LABEL = 'Filter by category';
const DEFAULT_PLACEHOLDER = 'Select a category';

/**
 * Extract unique categories from content-card blocks
 * @param {Element} contentCardBlock - The content-card block element
 * @returns {Array<string>} Array of unique category values
 */
function extractCategories(contentCardBlock) {
  const categories = new Set();

  // Get all card items - they're in a ul with class content-card-list
  const cardList = contentCardBlock.querySelector('.content-card-list');
  if (cardList) {
    // Block is already decorated, extract from decorated structure
    const cards = cardList.querySelectorAll('.content-card-item');
    cards.forEach((card) => {
      // Category is stored in a data attribute
      const { category } = card.dataset;
      if (category) {
        categories.add(category);
      }
    });
  } else {
    // Block hasn't been decorated yet, extract from raw structure
    // Each row is a direct child div of the block
    const rows = Array.from(contentCardBlock.children);
    rows.forEach((row) => {
      // Each row has cells as children
      const cells = Array.from(row.children);
      // Third cell contains the category (index 2)
      if (cells.length >= 3) {
        const categoryCell = cells[2];
        const categoryText = categoryCell.textContent.trim();
        if (categoryText) {
          categories.add(categoryText);
        }
      }
    });
  }

  return Array.from(categories).sort();
}

/**
 * Filter content cards based on selected category
 * @param {Element} contentCardBlock - The content-card block element
 * @param {string} selectedCategory - The selected category value
 * @param {number} maxVisible - Maximum number of cards to show initially
 * @param {Element} viewAllButton - The "View all" button element
 */
function filterContentCards(
  contentCardBlock,
  selectedCategory,
  maxVisible = MAX_VISIBLE_CARDS,
  viewAllButton = null,
) {
  const cardList = contentCardBlock.querySelector('.content-card-list');

  if (cardList) {
    // Block is decorated - filter card items
    const cards = cardList.querySelectorAll('.content-card-item');
    let visibleCount = 0;
    let hiddenCount = 0;

    cards.forEach((card) => {
      const { category } = card.dataset;
      const shouldShow = selectedCategory === ALL_CAUSES_LABEL || selectedCategory === '' || category === selectedCategory;

      if (shouldShow) {
        visibleCount += 1;
        const shouldHide = maxVisible > 0 && visibleCount > maxVisible && !card.classList.contains('show-all');

        card.style.display = shouldHide ? 'none' : '';
        card.toggleAttribute('aria-hidden', shouldHide);
        card.classList.toggle('hidden-card', shouldHide);

        if (shouldHide) hiddenCount += 1;
      } else {
        card.style.display = 'none';
        card.setAttribute('aria-hidden', 'true');
        card.classList.remove('hidden-card');
      }
    });

    // Show/hide "View all" button based on hidden cards
    if (viewAllButton) {
      if (hiddenCount > 0) {
        viewAllButton.style.display = '';
      } else {
        viewAllButton.style.display = 'none';
      }
    }
  } else {
    // Block hasn't been decorated yet - filter raw rows
    const rows = Array.from(contentCardBlock.children);
    let visibleCount = 0;
    let hiddenCount = 0;

    rows.forEach((row) => {
      const cells = Array.from(row.children);
      if (cells.length >= 3) {
        const categoryCell = cells[2];
        const categoryText = categoryCell.textContent.trim();
        const shouldShow = selectedCategory === ALL_CAUSES_LABEL || selectedCategory === '' || categoryText === selectedCategory;

        if (shouldShow) {
          visibleCount += 1;
          const shouldHide = maxVisible > 0 && visibleCount > maxVisible && !row.classList.contains('show-all');

          row.style.display = shouldHide ? 'none' : '';
          row.toggleAttribute('aria-hidden', shouldHide);
          row.classList.toggle('hidden-card', shouldHide);

          if (shouldHide) hiddenCount += 1;
        } else {
          row.style.display = 'none';
          row.setAttribute('aria-hidden', 'true');
          row.classList.remove('hidden-card');
        }
      }
    });

    // Show/hide "View all" button based on hidden cards
    if (viewAllButton && hiddenCount > 0) {
      viewAllButton.style.display = '';
    } else if (viewAllButton) {
      viewAllButton.style.display = 'none';
    }
  }
}

/**
 * Create the filter form UI
 * @param {Array<string>} categories - Array of category values
 * @param {string} label - Label text for the dropdown
 * @param {string} placeholder - Placeholder text for the dropdown
 * @param {Function} onChange - Callback function when selection changes
 * @returns {Element} The filter form element
 */
function createFilterForm(categories, label, placeholder, allCauseLabel, onChange) {
  const form = document.createElement('form');
  form.className = 'content-card-filter-form';
  form.setAttribute('role', 'search');
  form.setAttribute('aria-label', 'Filter content cards by category');

  const filterGroup = document.createElement('div');
  filterGroup.className = 'filter-group';

  // Create label
  const labelEl = document.createElement('label');
  labelEl.textContent = label;
  labelEl.setAttribute('for', 'category-select');
  labelEl.className = 'filter-label';

  // Create select dropdown
  const select = document.createElement('select');
  select.id = 'category-select';
  select.name = 'category';
  select.className = 'filter-select';

  // Add placeholder as first option
  const placeholderOption = document.createElement('option');
  placeholderOption.value = '';
  placeholderOption.textContent = placeholder;
  placeholderOption.setAttribute('disabled', '');
  placeholderOption.setAttribute('selected', '');
  select.appendChild(placeholderOption);

  // Add category options
  categories.forEach((category) => {
    const option = document.createElement('option');
    option.value = category;
    option.textContent = category;
    select.appendChild(option);
  });

  // Add "All Causes" at the end
  const allOption = document.createElement('option');
  allOption.value = allCauseLabel;
  allOption.textContent = allCauseLabel;
  select.appendChild(allOption);

  // Handle selection change
  select.addEventListener('change', (e) => {
    onChange(e.target.value);
  });

  filterGroup.appendChild(labelEl);
  filterGroup.appendChild(select);
  form.appendChild(filterGroup);

  return form;
}

/**
 * Load form definition from JSON
 * @param {string} formPath - Path to the form JSON
 * @returns {Promise<Object>} Form definition object
 */
async function loadFormDefinition(formPath) {
  try {
    const response = await fetch(formPath);
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

/**
 * Decorate the content-card-filter block
 * @param {Element} block - The content-card-filter block element
 */
export default async function decorate(block) {
  // Get the form URL from the block content
  const link = block.querySelector('a[href*="/forms/"]');
  if (!link) {
    block.textContent = 'Error: No form URL provided';
    return;
  }

  const formUrl = link.href;

  // Find the next content-card block
  // Look in the same section first, then in the next section
  const section = block.closest('.section');
  if (!section) {
    block.remove();
    return;
  }

  // Find the wrapper that contains this block
  const wrapper = block.closest('.content-card-filter-wrapper');
  let contentCardBlock = null;

  // Look for content-card in the same section or next section
  contentCardBlock = wrapper?.nextElementSibling?.querySelector('.content-card')
    || section.nextElementSibling?.querySelector('.content-card');

  if (!contentCardBlock) {
    // No content-card block found, don't render anything
    block.remove();
    return;
  }

  // Load form definition
  const formDef = await loadFormDefinition(formUrl);
  let label = DEFAULT_LABEL;
  let placeholder = DEFAULT_PLACEHOLDER;
  let allCauseLabel = ALL_CAUSES_LABEL;

  if (formDef && formDef.data && formDef.data.length > 0) {
    const field = formDef.data[0];
    label = field.Label || label;
    placeholder = field.Placeholder || placeholder;
    allCauseLabel = field.Options || allCauseLabel;
  }

  // Extract unique categories
  const categories = extractCategories(contentCardBlock);

  if (categories.length === 0) {
    // No categories found, don't render filter
    block.remove();
    return;
  }

  const viewAllButton = document.createElement('button');
  viewAllButton.className = 'button secondary';
  viewAllButton.textContent = 'View all runners';
  viewAllButton.style.display = 'none';

  viewAllButton.addEventListener('click', () => {
    const cardList = contentCardBlock.querySelector('.content-card-list');
    if (cardList) {
      const hiddenCards = cardList.querySelectorAll('.hidden-card');
      hiddenCards.forEach((card) => {
        card.classList.add('show-all');
        card.style.display = '';
        card.removeAttribute('aria-hidden');
        card.classList.remove('hidden-card');
      });
      viewAllButton.style.display = 'none';
    }
  });

  const contentCardWrapper = contentCardBlock.closest('.content-card-wrapper');
  if (contentCardWrapper && contentCardWrapper.parentElement) {
    const buttonWrapper = document.createElement('div');
    buttonWrapper.className = 'view-all-button-wrapper';
    buttonWrapper.appendChild(viewAllButton);
    contentCardWrapper.parentElement.insertBefore(
      buttonWrapper,
      contentCardWrapper.nextSibling,
    );
  }

  // Create filter form
  const filterForm = createFilterForm(
    categories,
    label,
    placeholder,
    allCauseLabel,
    (selectedCategory) => {
      // Reset show-all state when filter changes
      const cardList = contentCardBlock.querySelector('.content-card-list');
      if (cardList) {
        cardList.querySelectorAll('.show-all').forEach((card) => {
          card.classList.remove('show-all');
        });
      }
      filterContentCards(contentCardBlock, selectedCategory, MAX_VISIBLE_CARDS, viewAllButton);
    },
  );

  block.replaceChildren(filterForm);

  // Wait for content-card block to be decorated before applying initial filter
  const waitForDecoration = new Promise((resolve) => {
    if (contentCardBlock.querySelector('.content-card-list')) {
      resolve();
    } else {
      const observer = new MutationObserver(() => {
        if (contentCardBlock.querySelector('.content-card-list')) {
          observer.disconnect();
          resolve();
        }
      });
      observer.observe(contentCardBlock, { childList: true, subtree: true });

      // Timeout after 5 seconds
      setTimeout(() => {
        observer.disconnect();
        resolve();
      }, 5000);
    }
  });

  waitForDecoration.then(() => {
    filterContentCards(contentCardBlock, allCauseLabel, MAX_VISIBLE_CARDS, viewAllButton);
  });
}
