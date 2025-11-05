import { createOptimizedPicture } from '../../scripts/aem.js';
import fetchLangPlaceholders from '../../scripts/placeholders.js';

function updateActiveSlide(slide) {
  const block = slide.closest('.tile');
  const slideIndex = parseInt(slide.dataset.slideIndex, 10);
  block.dataset.activeSlide = slideIndex;

  const slides = block.querySelectorAll('.tile-item');

  slides.forEach((aSlide, idx) => {
    aSlide.setAttribute('aria-hidden', idx !== slideIndex);
  });

  const indicators = block.querySelectorAll('.tile-slide-indicator');
  indicators.forEach((indicator, idx) => {
    if (idx !== slideIndex) {
      indicator.querySelector('button').removeAttribute('disabled');
    } else {
      indicator.querySelector('button').setAttribute('disabled', 'true');
    }
  });
}

function showSlide(block, slideIndex = 0) {
  const slides = block.querySelectorAll('.tile-item');
  let realSlideIndex = slideIndex < 0 ? slides.length - 1 : slideIndex;
  if (slideIndex >= slides.length) realSlideIndex = 0;
  const activeSlide = slides[realSlideIndex];

  block.querySelector('.tile-slides').scrollTo({
    top: 0,
    left: activeSlide.offsetLeft,
    behavior: 'smooth',
  });
}

function bindEvents(block) {
  const slideIndicators = block.querySelector('.tile-slide-indicators');
  if (!slideIndicators) return;

  slideIndicators.querySelectorAll('button').forEach((button) => {
    button.addEventListener('click', (e) => {
      const slideIndicator = e.currentTarget.parentElement;
      showSlide(block, parseInt(slideIndicator.dataset.targetSlide, 10));
    });
  });

  block.querySelector('.tile-slide-prev').addEventListener('click', () => {
    showSlide(block, parseInt(block.dataset.activeSlide, 10) - 1);
  });
  block.querySelector('.tile-slide-next').addEventListener('click', () => {
    showSlide(block, parseInt(block.dataset.activeSlide, 10) + 1);
  });

  const slideObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) updateActiveSlide(entry.target);
    });
  }, { threshold: 0.5 });
  block.querySelectorAll('.tile-item').forEach((slide) => {
    slideObserver.observe(slide);
  });
}

/**
 * Decorate the tile block
 * @param {Element} block the block
 */
export default async function decorate(block) {
  const placeholders = await fetchLangPlaceholders();

  // Transform block structure to ul/li
  const ul = document.createElement('ul');
  ul.classList.add('tile-slides');
  [...block.children].forEach((row, idx) => {
    const li = document.createElement('li');
    li.classList.add('tile-item');
    li.dataset.slideIndex = idx;

    while (row.firstElementChild) li.append(row.firstElementChild);

    // Add semantic classes to child divs
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) {
        div.className = 'tile-item-image';
      } else {
        div.className = 'tile-item-body';
      }
    });

    ul.append(li);
  });

  // Optimize images
  ul.querySelectorAll('picture > img').forEach((img) => {
    img.closest('picture').replaceWith(
      createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]),
    );
  });

  // Create slide controls for mobile
  const slideCount = block.children.length;
  const controls = document.createElement('div');
  controls.classList.add('tile-controls');

  // Slide indicators
  const slideIndicatorsNav = document.createElement('nav');
  slideIndicatorsNav.classList.add('tile-slide-indicators-nav');
  slideIndicatorsNav.setAttribute('aria-label', placeholders.carouselSlideControls || 'Slide Controls');
  const slideIndicators = document.createElement('ol');
  slideIndicators.classList.add('tile-slide-indicators');

  [...block.children].forEach((row, idx) => {
    const indicator = document.createElement('li');
    indicator.classList.add('tile-slide-indicator');
    indicator.dataset.targetSlide = idx;
    indicator.innerHTML = `<button type="button" aria-label="${placeholders.showSlide || 'Show Slide'} ${idx + 1} ${placeholders.of || 'of'} ${slideCount}"></button>`;
    slideIndicators.append(indicator);
  });

  slideIndicatorsNav.append(slideIndicators);
  controls.append(slideIndicatorsNav);

  // Navigation buttons
  const slideNavButtons = document.createElement('div');
  slideNavButtons.classList.add('tile-navigation-buttons');
  slideNavButtons.innerHTML = `
    <button type="button" class="tile-slide-prev" aria-label="${placeholders.previousSlide || 'Previous Slide'}"></button>
    <button type="button" class="tile-slide-next" aria-label="${placeholders.nextSlide || 'Next Slide'}"></button>
  `;
  controls.append(slideNavButtons);

  block.replaceChildren(ul, controls);
  bindEvents(block);
}
