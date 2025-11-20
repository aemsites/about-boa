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
 */
function filterContentCards(contentCardBlock, selectedCategory) {
  const cardList = contentCardBlock.querySelector('.content-card-list');

  if (cardList) {
    // Block is decorated - filter card items
    const cards = cardList.querySelectorAll('.content-card-item');
    cards.forEach((card) => {
      const { category } = card.dataset;

      if (selectedCategory === 'All Causes' || selectedCategory === '' || category === selectedCategory) {
        card.style.display = '';
        card.removeAttribute('aria-hidden');
      } else {
        card.style.display = 'none';
        card.setAttribute('aria-hidden', 'true');
      }
    });
  } else {
    // Block hasn't been decorated yet - filter raw rows
    const rows = Array.from(contentCardBlock.children);
    rows.forEach((row) => {
      const cells = Array.from(row.children);
      if (cells.length >= 3) {
        const categoryCell = cells[2];
        const categoryText = categoryCell.textContent.trim();

        if (selectedCategory === 'All Causes' || selectedCategory === '' || categoryText === selectedCategory) {
          row.style.display = '';
          row.removeAttribute('aria-hidden');
        } else {
          row.style.display = 'none';
          row.setAttribute('aria-hidden', 'true');
        }
      }
    });
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
    if (!response.ok) {
      throw new Error(`Failed to load form: ${response.status}`);
    }
    const json = await response.json();
    return json;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error loading form definition:', error);
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

  // First, look for content-card in the same section after this block's wrapper
  if (wrapper && wrapper.nextElementSibling) {
    contentCardBlock = wrapper.nextElementSibling.querySelector('.content-card');
  }

  // If not found in same section, check next section
  if (!contentCardBlock && section.nextElementSibling) {
    contentCardBlock = section.nextElementSibling.querySelector('.content-card');
  }

  if (!contentCardBlock) {
    // No content-card block found, don't render anything
    block.remove();
    return;
  }

  // Load form definition
  const formDef = await loadFormDefinition(formUrl);
  let label = 'Filter by category';
  let placeholder = 'Select a category';
  let allCauseLabel = 'All Causes';

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

  // Create filter form
  const filterForm = createFilterForm(
    categories,
    label,
    placeholder,
    allCauseLabel,
    (selectedCategory) => {
      filterContentCards(contentCardBlock, selectedCategory);
    },
  );

  // Replace block content with filter form
  block.replaceChildren(filterForm);

  // Set default to show all cards
  filterContentCards(contentCardBlock, 'All Causes');
}
