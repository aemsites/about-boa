import fetchLangPlaceholders from '../../scripts/placeholders.js';
import { loadCSS } from '../../scripts/aem.js';

function updateActiveSlide(slide) {
  const block = slide.closest('.carousel-slides-container');
  const slideIndex = parseInt(slide.dataset.slideIndex, 10);
  block.dataset.activeSlide = slideIndex;

  const slides = block.querySelectorAll('.carousel-slide');

  slides.forEach((aSlide, idx) => {
    aSlide.setAttribute('aria-hidden', idx !== slideIndex);
    aSlide.querySelectorAll('a').forEach((link) => {
      if (idx !== slideIndex) {
        link.setAttribute('tabindex', '-1');
      } else {
        link.removeAttribute('tabindex');
      }
    });
  });

  const indicators = block.querySelectorAll('.carousel-slide-indicator');
  indicators.forEach((indicator, idx) => {
    if (idx !== slideIndex) {
      indicator.querySelector('button').removeAttribute('disabled');
    } else {
      indicator.querySelector('button').setAttribute('disabled', 'true');
    }
  });
}

function showSlide(block, slideIndex = 0) {
  const slides = block.querySelectorAll('.carousel-slide');
  let realSlideIndex = slideIndex < 0 ? slides.length - 1 : slideIndex;
  if (slideIndex >= slides.length) realSlideIndex = 0;
  const activeSlide = slides[realSlideIndex];

  activeSlide.querySelectorAll('a').forEach((link) => link.removeAttribute('tabindex'));
  block.querySelector('.carousel-slides').scrollTo({
    top: 0,
    left: activeSlide.offsetLeft,
    behavior: 'smooth',
  });
}

function bindEvents(block) {
  const slideIndicators = block.querySelector('.carousel-slide-indicators');
  if (!slideIndicators) return;

  slideIndicators.querySelectorAll('button').forEach((button) => {
    button.addEventListener('click', (e) => {
      const slideIndicator = e.currentTarget.parentElement;
      showSlide(block, parseInt(slideIndicator.dataset.targetSlide, 10));
    });
  });

  block.querySelector('.slide-prev').addEventListener('click', () => {
    showSlide(block, parseInt(block.dataset.activeSlide, 10) - 1);
  });
  block.querySelector('.slide-next').addEventListener('click', () => {
    showSlide(block, parseInt(block.dataset.activeSlide, 10) + 1);
  });

  const slideObserver = new IntersectionObserver((entries) => {
    // Find all intersecting slides
    const intersectingSlides = entries
      .filter((entry) => entry.isIntersecting)
      .map((entry) => entry.target);

    if (intersectingSlides.length > 0) {
      // When multiple slides are visible, select the leftmost one
      const leftmostSlide = intersectingSlides.reduce((leftmost, current) => {
        const leftmostLeft = leftmost.offsetLeft;
        const currentLeft = current.offsetLeft;
        return currentLeft < leftmostLeft ? current : leftmost;
      });
      updateActiveSlide(leftmostSlide);
    }
  }, { threshold: 0.5 });
  block.querySelectorAll('.carousel-slide').forEach((slide) => {
    slideObserver.observe(slide);
  });
}

export function updateCarousel(container, slidesPerView = 1) {
  const slides = container.querySelectorAll('.carousel-slide');
  const totalSlides = slides.length;
  const actualSlidesPerView = Math.min(slidesPerView, totalSlides);
  const slidesContainer = container.querySelector('.carousel-slides');

  // Get current active slide index before updating
  const currentActiveIndex = parseInt(container.dataset.activeSlide || '0', 10);

  // Get computed gap value from the slides container
  let gapValue = '0px';
  if (slidesContainer) {
    const computedGap = window.getComputedStyle(slidesContainer).gap;
    // Handle cases where gap might be "normal", empty, or invalid
    // Parse gap - it might be "row-gap column-gap" format, we want column-gap (horizontal)
    const gapParts = computedGap.split(' ');
    const horizontalGap = gapParts[gapParts.length - 1] || computedGap;

    // Check if it's a valid length value (contains px, rem, em, %, etc.)
    if (horizontalGap && horizontalGap !== 'normal' && horizontalGap !== '0') {
      gapValue = horizontalGap;
    }
  }
  container.style.setProperty('--carousel-gap', gapValue);

  // Calculate number of gaps (slides - 1)
  const gapsCount = Math.max(0, actualSlidesPerView - 1);
  container.style.setProperty('--carousel-gaps-count', gapsCount);

  // Set CSS custom property for styling
  container.style.setProperty('--slides-per-view', actualSlidesPerView);

  // Add class to hide controls when all slides are visible
  const showAllSlides = actualSlidesPerView >= totalSlides;
  if (showAllSlides) {
    container.classList.add('carousel-all-slides-visible');
  } else {
    container.classList.remove('carousel-all-slides-visible');
  }

  // After layout recalculation, update scroll position and active slide
  // Use requestAnimationFrame to ensure layout has updated
  requestAnimationFrame(() => {
    if (slidesContainer && slides.length > 0) {
      // If all slides are visible, scroll to start
      if (showAllSlides) {
        showSlide(container, 0);
      } else {
        // Otherwise, maintain the current active slide index
        const targetIndex = Math.min(currentActiveIndex, slides.length - 1);
        const targetSlide = slides[targetIndex];
        if (targetSlide) {
          showSlide(container, targetIndex);
        }
      }
    }
  });
}

let carouselId = 0;
export async function buildCarousel(slidesContainer, slidesPerView = 1) {
  const placeholders = await fetchLangPlaceholders();
  loadCSS(`${window.hlx.codeBasePath}/blocks/carousel/carousel-base.css`);

  carouselId += 1;
  const id = `carousel-${carouselId}`;
  const container = document.createElement('div');
  container.classList.add('carousel-slides-container');
  container.setAttribute('id', id);
  container.setAttribute('role', 'region');
  container.setAttribute('aria-roledescription', placeholders.carousel || 'Carousel');

  slidesContainer.classList.add('carousel-slides');
  slidesContainer.before(container);
  container.append(slidesContainer);

  const slides = [...slidesContainer.children];
  const isSingleSlide = slides.length < 2;

  let slideIndicators;
  if (!isSingleSlide) {
    const slideIndicatorsNav = document.createElement('nav');
    slideIndicatorsNav.classList.add('carousel-slide-indicators-nav');
    slideIndicatorsNav.setAttribute('aria-label', placeholders.carouselSlideControls || 'Carousel Slide Controls');
    slideIndicators = document.createElement('ol');
    slideIndicators.classList.add('carousel-slide-indicators');
    slideIndicatorsNav.append(slideIndicators);
    container.append(slideIndicatorsNav);

    const slideNavButtons = document.createElement('div');
    slideNavButtons.classList.add('carousel-navigation-buttons');
    slideNavButtons.innerHTML = `
      <button type="button" class= "slide-prev" aria-label="${placeholders.previousSlide || 'Previous Slide'}"></button>
      <button type="button" class="slide-next" aria-label="${placeholders.nextSlide || 'Next Slide'}"></button>
    `;

    container.append(slideNavButtons);
  }

  slides.forEach((slide, idx) => {
    slide.classList.add('carousel-slide');
    slide.dataset.slideIndex = idx;
    slide.setAttribute('id', `carousel-${id}-slide-${idx}`);

    const labeledBy = slide.querySelector('h1, h2, h3, h4, h5, h6');
    if (labeledBy) {
      slide.setAttribute('aria-labelledby', labeledBy.getAttribute('id'));
    }

    if (slideIndicators) {
      const indicator = document.createElement('li');
      indicator.classList.add('carousel-slide-indicator');
      indicator.dataset.targetSlide = idx;
      indicator.innerHTML = `<button type="button" aria-label="${placeholders.showSlide || 'Show Slide'} ${idx + 1} ${placeholders.of || 'of'} ${slides.length}"></button>`;
      slideIndicators.append(indicator);
    }
  });

  if (!isSingleSlide) bindEvents(container);

  // Initialize slides-per-view to 1 (default)
  updateCarousel(container, slidesPerView);

  return container;
}

async function createSlide(row, isContentCard = false) {
  if (isContentCard) {
    // eslint-disable-next-line import/no-cycle
    const { buildContentCard } = await import('../content-card/content-card.js');
    // Use content-card builder for content-card carousel variant
    const contentCard = buildContentCard(row, 'default', 'light');
    contentCard.classList.add('carousel-slide');
    return contentCard;
  }

  // Default carousel slide
  const slide = document.createElement('li');

  row.querySelectorAll(':scope > div').forEach((column, colIdx) => {
    column.classList.add(`carousel-slide-${colIdx === 0 ? 'image' : 'content'}`);
    slide.append(column);
  });

  return slide;
}

export default async function decorate(block) {
  const slidesWrapper = document.createElement('ul');
  const rows = block.querySelectorAll(':scope > div');

  // Check if this is a content-card carousel variant
  const isContentCard = block.classList.contains('content-card');

  rows.forEach(async (row, idx) => {
    const slide = await createSlide(row, isContentCard, idx, carouselId);
    slidesWrapper.append(slide);
  });
  block.replaceChildren(slidesWrapper);

  await buildCarousel(slidesWrapper);
}
