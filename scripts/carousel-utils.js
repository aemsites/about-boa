import fetchLangPlaceholders from './placeholders.js';

/**
 * Updates the active slide and manages ARIA attributes and indicator states
 * @param {HTMLElement} slide - The slide element that became active
 * @param {HTMLElement} container - The carousel container
 */
function updateActiveSlide(slide, container) {
  const slideIndex = parseInt(slide.dataset.slideIndex, 10);
  container.dataset.activeSlide = slideIndex;

  const slides = container.querySelectorAll('[data-slide-index]');
  slides.forEach((aSlide, idx) => {
    aSlide.setAttribute('aria-hidden', idx !== slideIndex);
  });

  const indicators = container.querySelectorAll('.carousel-indicator');
  indicators.forEach((indicator, idx) => {
    if (idx !== slideIndex) {
      indicator.querySelector('button').removeAttribute('disabled');
    } else {
      indicator.querySelector('button').setAttribute('disabled', 'true');
    }
  });
}

/**
 * Shows a specific slide by index
 * @param {HTMLElement} container - The carousel container
 * @param {HTMLElement} slidesContainer - The element containing the slides
 * @param {number} slideIndex - The index of the slide to show
 */
function showSlide(container, slidesContainer, slideIndex = 0) {
  const slides = container.querySelectorAll('[data-slide-index]');
  let realSlideIndex = slideIndex < 0 ? slides.length - 1 : slideIndex;
  if (slideIndex >= slides.length) realSlideIndex = 0;
  const activeSlide = slides[realSlideIndex];

  slidesContainer.scrollTo({
    top: 0,
    left: activeSlide.offsetLeft,
    behavior: 'smooth',
  });
}

/**
 * Binds carousel navigation and indicator events
 * @param {HTMLElement} container - The carousel container
 * @param {HTMLElement} slidesContainer - The element containing the slides
 */
function bindEvents(container, slidesContainer) {
  const indicators = container.querySelector('.carousel-indicators');
  if (indicators) {
    indicators.querySelectorAll('button').forEach((button) => {
      button.addEventListener('click', (e) => {
        const indicator = e.currentTarget.parentElement;
        showSlide(container, slidesContainer, parseInt(indicator.dataset.targetSlide, 10));
      });
    });
  }

  const prevButton = container.querySelector('.carousel-prev');
  const nextButton = container.querySelector('.carousel-next');

  if (prevButton) {
    prevButton.addEventListener('click', () => {
      showSlide(container, slidesContainer, parseInt(container.dataset.activeSlide, 10) - 1);
    });
  }

  if (nextButton) {
    nextButton.addEventListener('click', () => {
      showSlide(container, slidesContainer, parseInt(container.dataset.activeSlide, 10) + 1);
    });
  }

  const slideObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) updateActiveSlide(entry.target, container);
    });
  }, { threshold: 0.5 });

  container.querySelectorAll('[data-slide-index]').forEach((slide) => {
    slideObserver.observe(slide);
  });
}

/**
 * Builds a carousel from a container element
 * @param {HTMLElement} container - The container element (will be modified in place)
 * @param {Object} options - Configuration options
 * @param {string} options.slidesSelector - CSS selector for slide elements
 * @param {string} options.slidesClass - Class name for the slides container
 * @param {string} options.slideClass - Class name to add to each slide
 * @param {boolean} options.showControls - Whether to show navigation controls
 * @param {boolean} options.showIndicators - Whether to show slide indicators
 * @returns {Promise<HTMLElement>} The modified container element
 */
export default async function buildCarousel(container, options = {}) {
  const {
    slidesSelector = ':scope > *',
    slidesClass = 'carousel-slides',
    slideClass = 'carousel-slide',
    showControls = true,
    showIndicators = true,
  } = options;

  const placeholders = await fetchLangPlaceholders();

  // Get existing slides
  const existingSlides = Array.from(container.querySelectorAll(slidesSelector));

  if (existingSlides.length === 0) {
    // eslint-disable-next-line no-console
    console.warn('buildCarousel: No slides found in container');
    return container;
  }

  // Create slides container
  const slidesContainer = document.createElement('div');
  slidesContainer.classList.add(slidesClass);

  // Add slides with data attributes
  existingSlides.forEach((slide, idx) => {
    slide.classList.add(slideClass);
    slide.dataset.slideIndex = idx;
    slidesContainer.append(slide);
  });

  // Clear container and add slides
  container.replaceChildren(slidesContainer);

  const isSingleSlide = existingSlides.length < 2;

  // Add controls only if there are multiple slides
  if (!isSingleSlide && (showControls || showIndicators)) {
    const controlsContainer = document.createElement('div');
    controlsContainer.classList.add('carousel-controls');

    // Add indicators
    if (showIndicators) {
      const indicatorsNav = document.createElement('nav');
      indicatorsNav.classList.add('carousel-indicators-nav');
      indicatorsNav.setAttribute('aria-label', placeholders.carouselSlideControls || 'Carousel Slide Controls');

      const indicators = document.createElement('ol');
      indicators.classList.add('carousel-indicators');

      existingSlides.forEach((slide, idx) => {
        const indicator = document.createElement('li');
        indicator.classList.add('carousel-indicator');
        indicator.dataset.targetSlide = idx;
        indicator.innerHTML = `<button type="button" aria-label="${placeholders.showSlide || 'Show Slide'} ${idx + 1} ${placeholders.of || 'of'} ${existingSlides.length}"></button>`;
        indicators.append(indicator);
      });

      indicatorsNav.append(indicators);
      controlsContainer.append(indicatorsNav);
    }

    // Add navigation buttons
    if (showControls) {
      const navButtons = document.createElement('div');
      navButtons.classList.add('carousel-navigation');
      navButtons.innerHTML = `
        <button type="button" class="carousel-prev" aria-label="${placeholders.previousSlide || 'Previous Slide'}"></button>
        <button type="button" class="carousel-next" aria-label="${placeholders.nextSlide || 'Next Slide'}"></button>
      `;
      controlsContainer.append(navButtons);
    }

    container.append(controlsContainer);
  }

  // Initialize carousel state
  container.dataset.activeSlide = '0';

  // Bind events if there are multiple slides
  if (!isSingleSlide) {
    bindEvents(container, slidesContainer);
  }

  return container;
}
