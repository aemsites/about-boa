import fetchLangPlaceholders from '../../scripts/placeholders.js';
import { loadCSS } from '../../scripts/aem.js';
import { openModal } from '../modal/modal.js';

function updateActiveSlide(slide) {
  const block = slide.closest('.carousel-slides-container');
  const slideIndex = parseInt(slide.dataset.slideIndex, 10);

  // Get the real slide count (excluding clones)
  const realSlideCount = parseInt(block.dataset.realSlideCount || '0', 10);

  // Calculate the logical index (0 to realSlideCount-1) for indicators
  let logicalIndex = slideIndex;
  if (slide.classList.contains('clone')) {
    // For clones, use the realIndex stored in dataset
    if (slide.dataset.realIndex !== undefined) {
      logicalIndex = parseInt(slide.dataset.realIndex, 10);
    } else if (realSlideCount > 0) {
      // Fallback: calculate from slideIndex
      logicalIndex = slideIndex < 0 ? realSlideCount - 1 : slideIndex % realSlideCount;
    }
  }

  // Store the logical index (0 to realSlideCount-1) for navigation
  block.dataset.activeSlide = logicalIndex;

  // Find the actual DOM position of this slide
  const allSlides = block.querySelectorAll('.carousel-slide');
  const domIndex = Array.from(allSlides).indexOf(slide);
  block.dataset.activeDomIndex = domIndex;

  const realSlides = block.querySelectorAll('.carousel-slide:not(.clone)');

  realSlides.forEach((aSlide, idx) => {
    aSlide.setAttribute('aria-hidden', idx !== logicalIndex);
    aSlide.querySelectorAll('a').forEach((link) => {
      // Remove button class from links
      link.classList.remove('button');
      if (idx !== logicalIndex) {
        link.setAttribute('tabindex', '-1');
      } else {
        link.removeAttribute('tabindex');
      }
    });
  });

  const indicators = block.querySelectorAll('.carousel-slide-indicator');
  indicators.forEach((indicator, idx) => {
    if (idx !== logicalIndex) {
      indicator.querySelector('button').removeAttribute('disabled');
    } else {
      indicator.querySelector('button').setAttribute('disabled', 'true');
    }
  });
}

function repositionIfNeeded(block) {
  const domIndex = parseInt(block.dataset.activeDomIndex || '0', 10);
  const logicalIndex = parseInt(block.dataset.activeSlide || '0', 10);
  const realSlideCount = parseInt(block.dataset.realSlideCount || '0', 10);
  const slides = block.querySelectorAll('.carousel-slide');
  const currentSlide = slides[domIndex];

  if (currentSlide && currentSlide.classList.contains('clone') && realSlideCount > 0) {
    const slidesContainer = block.querySelector('.carousel-slides');
    const allSlides = block.querySelectorAll('.carousel-slide');

    // Find the real slide with the same logical index
    const realSlide = Array.from(allSlides).find((s) => {
      const slideIdx = parseInt(s.dataset.slideIndex, 10);
      return slideIdx === logicalIndex && !s.classList.contains('clone');
    });

    if (realSlide) {
      // Instantly reposition to the real slide
      slidesContainer.style.scrollBehavior = 'auto';
      slidesContainer.scrollTo({
        top: 0,
        left: realSlide.offsetLeft,
        behavior: 'auto',
      });
      // Update DOM index
      const newDomIndex = Array.from(allSlides).indexOf(realSlide);
      block.dataset.activeDomIndex = newDomIndex;

      // Manually update the active slide to ensure indicators are correct
      updateActiveSlide(realSlide);

      requestAnimationFrame(() => {
        slidesContainer.style.scrollBehavior = '';
      });
      return true;
    }
  }
  return false;
}

function showSlide(block, logicalIndex = 0, immediate = false) {
  // Prevent navigation if already scrolling
  if (block.dataset.isScrolling === 'true' && !immediate) {
    return;
  }

  const hasInfiniteScroll = block.classList.contains('carousel-infinite-scroll');
  const realSlideCount = parseInt(block.dataset.realSlideCount || '0', 10);

  // Before navigating, check if we're on a clone and reposition if needed
  if (hasInfiniteScroll && !immediate) {
    const repositioned = repositionIfNeeded(block);
    // If we repositioned, wait a moment for it to complete
    if (repositioned) {
      // Short delay to ensure reposition completes
      setTimeout(() => {
        showSlide(block, logicalIndex, false);
      }, 50);
      return;
    }
  }

  const slides = block.querySelectorAll('.carousel-slide');
  let targetSlide = null;

  // Handle wrapping for infinite scroll
  if (hasInfiniteScroll && realSlideCount > 0) {
    // If going before first slide (prev from slide 0)
    if (logicalIndex < 0) {
      // Find the prepended clone-before (last slide clone)
      targetSlide = Array.from(slides).find((s) => s.classList.contains('clone-before'));
    } else if (logicalIndex >= realSlideCount) {
      // If going after last real slide (next from last slide)
      // This means we want the first slide's clone at the end
      const targetLogicalIndex = logicalIndex % realSlideCount;
      targetSlide = Array.from(slides).find(
        (s) => s.classList.contains('clone-after')
               && parseInt(s.dataset.realIndex, 10) === targetLogicalIndex,
      );
    } else {
      // Normal real slide - find it by logical index
      targetSlide = Array.from(slides).find(
        (s) => parseInt(s.dataset.slideIndex, 10) === logicalIndex
               && !s.classList.contains('clone'),
      );
    }
  } else {
    // Non-infinite scroll: simple wrapping
    let wrappedIndex = logicalIndex;
    if (logicalIndex < 0) wrappedIndex = slides.length - 1;
    if (logicalIndex >= slides.length) wrappedIndex = 0;
    targetSlide = slides[wrappedIndex];
  }

  if (!targetSlide) {
    return;
  }

  const slidesContainer = block.querySelector('.carousel-slides');

  targetSlide.querySelectorAll('a').forEach((link) => link.removeAttribute('tabindex'));

  // Set flags to prevent interference and duplicate navigations
  block.dataset.programmaticScroll = 'true';
  block.dataset.isScrolling = 'true';

  slidesContainer.scrollTo({
    top: 0,
    left: targetSlide.offsetLeft,
    behavior: immediate ? 'auto' : 'smooth',
  });

  // Immediately update the active slide to reflect the navigation
  // This ensures indicators update correctly before the scroll completes
  if (immediate) {
    updateActiveSlide(targetSlide);
    // Clear flags immediately for instant scrolling
    delete block.dataset.programmaticScroll;
    delete block.dataset.isScrolling;
  } else {
    // For smooth scrolling, update after a brief delay
    setTimeout(() => {
      updateActiveSlide(targetSlide);
    }, 100);

    // Clear the flags after scroll completes
    setTimeout(() => {
      delete block.dataset.programmaticScroll;
      delete block.dataset.isScrolling;
    }, 500);
  }
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
    const currentIndex = parseInt(block.dataset.activeSlide, 10);
    showSlide(block, currentIndex + 1);
  });

  const slideObserver = new IntersectionObserver((entries) => {
    // Skip if this is a programmatic scroll
    if (block.dataset.programmaticScroll === 'true') {
      return;
    }

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
  const realSlides = container.querySelectorAll('.carousel-slide:not(.clone)');
  const totalSlides = realSlides.length;
  const actualSlidesPerView = Math.min(slidesPerView, totalSlides);
  const slidesContainer = container.querySelector('.carousel-slides');

  // Get current active slide index before updating
  const currentActiveIndex = parseInt(container.dataset.activeSlide || '0', 10);
  const allSlides = container.querySelectorAll('.carousel-slide');

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
    if (slidesContainer && allSlides.length > 0) {
      // If all slides are visible, scroll to start
      if (showAllSlides) {
        showSlide(container, 0);
      } else {
        // Otherwise, maintain the current active slide index
        const targetIndex = Math.min(currentActiveIndex, allSlides.length - 1);
        const targetSlide = allSlides[targetIndex];
        if (targetSlide) {
          showSlide(container, targetIndex);
        }
      }
    }
  });
}

let carouselId = 0;
export async function buildCarousel(slidesContainer, slidesPerView = 1, infiniteScroll = true) {
  const placeholders = await fetchLangPlaceholders();
  loadCSS(`${window.hlx.codeBasePath}/blocks/carousel/carousel-base.css`);

  carouselId += 1;
  const id = `carousel-${carouselId}`;
  const container = document.createElement('div');
  container.classList.add('carousel-slides-container');
  container.setAttribute('id', id);
  container.setAttribute('role', 'group');
  container.setAttribute('aria-roledescription', placeholders.carousel || 'Carousel');

  slidesContainer.classList.add('carousel-slides');
  slidesContainer.before(container);
  container.append(slidesContainer);

  const slides = [...slidesContainer.children];
  const isSingleSlide = slides.length < 2;

  // Store the real slide count for infinite scroll
  container.dataset.realSlideCount = slides.length;

  let slideIndicators;
  if (!isSingleSlide) {
    const slideIndicatorsNav = document.createElement('nav');
    slideIndicatorsNav.classList.add('carousel-slide-indicators-nav');
    slideIndicatorsNav.setAttribute('aria-label', placeholders.carouselSlideControls || 'Carousel Slide Controls');
    slideIndicators = document.createElement('ol');
    slideIndicators.classList.add('carousel-slide-indicators');
    slideIndicatorsNav.append(slideIndicators);

    const slideNavButtons = document.createElement('div');
    slideNavButtons.classList.add('carousel-navigation-buttons');
    slideNavButtons.innerHTML = `
      <button type="button" class= "slide-prev" aria-label="${placeholders.previousSlide || 'Previous Slide'}"></button>
      <button type="button" class="slide-next" aria-label="${placeholders.nextSlide || 'Next Slide'}"></button>
    `;

    // Insert the slide indicators nav after the previous button
    slideNavButtons.querySelector('.slide-prev')?.insertAdjacentElement('afterend', slideIndicatorsNav);

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

  // Add cloned slides for infinite scroll
  if (!isSingleSlide && infiniteScroll && slides.length > 1) {
    container.classList.add('carousel-infinite-scroll');

    // Clone last slide and prepend to the beginning for backward infinite scrolling
    const lastSlideClone = slides[slides.length - 1].cloneNode(true);
    lastSlideClone.classList.add('clone', 'clone-before');
    lastSlideClone.dataset.slideIndex = -1;
    lastSlideClone.dataset.realIndex = slides.length - 1;
    lastSlideClone.setAttribute('id', `carousel-${id}-slide-clone-before`);
    lastSlideClone.setAttribute('aria-hidden', 'true');
    // Remove button class from links in clones
    lastSlideClone.querySelectorAll('a').forEach((link) => link.classList.remove('button'));
    slidesContainer.prepend(lastSlideClone);

    // Clone all slides and append to the end for forward infinite scrolling
    slides.forEach((slide, idx) => {
      const clone = slide.cloneNode(true);
      clone.classList.add('clone', 'clone-after');
      clone.dataset.slideIndex = slides.length + idx;
      clone.dataset.realIndex = idx;
      clone.setAttribute('id', `carousel-${id}-slide-clone-after-${idx}`);
      clone.setAttribute('aria-hidden', 'true');
      // Remove button class from links in clones
      clone.querySelectorAll('a').forEach((link) => link.classList.remove('button'));
      slidesContainer.append(clone);
    });
  }

  if (!isSingleSlide) bindEvents(container);

  // Initialize slides-per-view to 1 (default)
  updateCarousel(container, slidesPerView);

  // If infinite scroll is enabled, start at the first real slide (index 0)
  // This accounts for the prepended clone
  if (!isSingleSlide && infiniteScroll && slides.length > 1) {
    container.dataset.activeSlide = 0;
    // Instantly position to the first real slide
    requestAnimationFrame(() => {
      const allSlides = slidesContainer.querySelectorAll('.carousel-slide');
      const firstRealSlide = slidesContainer.querySelector('.carousel-slide:not(.clone)');
      if (firstRealSlide) {
        const slidesContainerEl = container.querySelector('.carousel-slides');
        const domIndex = Array.from(allSlides).indexOf(firstRealSlide);
        container.dataset.activeDomIndex = domIndex;

        slidesContainerEl.style.scrollBehavior = 'auto';
        slidesContainerEl.scrollTo({
          top: 0,
          left: firstRealSlide.offsetLeft,
          behavior: 'auto',
        });
        requestAnimationFrame(() => {
          slidesContainerEl.style.scrollBehavior = '';
        });
      }
    });
  }

  return container;
}

function createSlide(row, isModal = false) {
  const slide = document.createElement('li');

  row.querySelectorAll(':scope > div').forEach((column) => {
    column.classList.add(`carousel-slide-${column.querySelector('picture > img') ? 'image' : 'content'}`);
    slide.append(column);
  });

  // For modal variant, extract and store the modal path, then remove the link
  if (isModal) {
    const link = slide.querySelector('a');
    if (link) {
      const url = new URL(link.href);
      slide.dataset.modalPath = url.pathname;
      // Remove the link element but keep the slide structure
      link.parentElement.remove();
    }
  }

  return slide;
}

export default async function decorate(block) {
  const isModal = block.classList.contains('modal');
  const placeholders = await fetchLangPlaceholders();

  const slidesWrapper = document.createElement('ul');
  const rows = block.querySelectorAll(':scope > div');
  rows.forEach((row) => {
    const slide = createSlide(row, isModal);
    slidesWrapper.append(slide);
  });
  block.replaceChildren(slidesWrapper);

  await buildCarousel(slidesWrapper);

  // Set up modal functionality if this is a modal variant
  if (isModal) {
    // Attach click handlers to all slides (including clones)
    const slides = block.querySelectorAll('.carousel-slide');
    slides.forEach((slide) => {
      const { modalPath } = slide.dataset;
      if (modalPath) {
        const isClone = slide.classList.contains('clone');

        // Make the entire slide clickable
        slide.style.cursor = 'pointer';

        // Only set ARIA attributes on real slides, not clones
        if (!isClone) {
          slide.setAttribute('role', 'button');
          slide.setAttribute('tabindex', '0');
        }

        // Click handler
        const handleClick = (e) => {
          // Don't open modal if clicking on navigation buttons or indicators
          if (e.target.closest('.carousel-navigation-buttons, .carousel-slide-indicators')) {
            return;
          }
          openModal(modalPath, { placeholders });
        };

        slide.addEventListener('click', handleClick);

        // Keyboard handler for accessibility (only on real slides)
        if (!isClone) {
          slide.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleClick(e);
            }
          });
        }
      }
    });
  }
}
