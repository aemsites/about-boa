import fetchLangPlaceholders from '../../scripts/placeholders.js';
import { loadCSS } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

/**
 * Creates and displays a modal with fragment content
 * @param {string} fragmentPath - Path to the fragment to load
 * @param {object} options - Optional configuration
 * @param {object} options.placeholders - Translated text placeholders
 * @param {Function} options.onClose - Callback function when modal closes
 * @returns {Promise<HTMLElement>} The modal overlay element
 */
export async function openModal(fragmentPath, options = {}) {
  // Load modal CSS
  loadCSS(`${window.hlx.codeBasePath}/blocks/modal/modal.css`);

  const placeholders = options.placeholders || await fetchLangPlaceholders();

  // Create modal overlay
  const modalOverlay = document.createElement('div');
  modalOverlay.classList.add('modal-overlay');
  modalOverlay.setAttribute('role', 'dialog');
  modalOverlay.setAttribute('aria-modal', 'true');
  modalOverlay.setAttribute('aria-label', placeholders.modalDialog || 'Modal Dialog');

  // Create modal content container
  const modalContent = document.createElement('div');
  modalContent.classList.add('modal-content');

  // Create close button
  const closeButton = document.createElement('button');
  closeButton.classList.add('modal-close');
  closeButton.setAttribute('type', 'button');
  closeButton.setAttribute('aria-label', placeholders.closeModal || 'Close Modal');
  closeButton.innerHTML = '<span aria-hidden="true">&times;</span>';

  // Add close button to modal
  modalContent.appendChild(closeButton);

  // Load fragment content
  try {
    const fragment = await loadFragment(fragmentPath);
    if (fragment) {
      const fragmentContent = document.createElement('div');
      fragmentContent.classList.add('modal-body');
      fragmentContent.appendChild(fragment);
      modalContent.appendChild(fragmentContent);
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to load modal fragment:', error);
    return null;
  }

  modalOverlay.appendChild(modalContent);
  document.body.appendChild(modalOverlay);

  // Store currently focused element to restore later
  const previouslyFocusedElement = document.activeElement;

  // Function to close modal
  const closeModal = () => {
    modalOverlay.classList.remove('is-open');
    setTimeout(() => {
      if (document.body.contains(modalOverlay)) {
        document.body.removeChild(modalOverlay);
      }
      document.body.classList.remove('modal-open');
      // Restore focus to previously focused element
      if (previouslyFocusedElement && document.body.contains(previouslyFocusedElement)) {
        previouslyFocusedElement.focus();
      }
      // Call onClose callback if provided
      if (options.onClose) {
        options.onClose();
      }
    }, 300); // Match transition duration
  };

  // Close button click handler
  closeButton.addEventListener('click', closeModal);

  // Close on overlay click (but not on content click)
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
      closeModal();
    }
  });

  // Close on ESC key
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      closeModal();
      document.removeEventListener('keydown', handleKeyDown);
    }
  };
  document.addEventListener('keydown', handleKeyDown);

  // Trap focus within modal
  const focusableElements = modalContent.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
  );
  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];

  if (focusableElements.length > 0) {
    modalContent.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstFocusable) {
            e.preventDefault();
            lastFocusable.focus();
          }
        } else if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable.focus();
        }
      }
    });
  }

  // Prevent body scroll when modal is open
  document.body.classList.add('modal-open');

  // Show modal with animation
  requestAnimationFrame(() => {
    modalOverlay.classList.add('is-open');
    // Focus on close button
    closeButton.focus();
  });

  return modalOverlay;
}

/**
 * Creates a modal trigger element
 * @param {string} fragmentPath - Path to the fragment to load in modal
 * @param {Element} triggerElement - Element that should trigger the modal
 * @param {object} options - Optional configuration
 */
export function createModalTrigger(fragmentPath, triggerElement, options = {}) {
  const handleClick = async (e) => {
    e.preventDefault();
    await openModal(fragmentPath, options);
  };

  triggerElement.addEventListener('click', handleClick);

  // Keyboard handler for accessibility if not already a button or link
  if (triggerElement.tagName !== 'BUTTON' && triggerElement.tagName !== 'A') {
    triggerElement.setAttribute('role', 'button');
    triggerElement.setAttribute('tabindex', '0');

    triggerElement.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleClick(e);
      }
    });
  }
}

/**
 * Decorates the modal block (if used as a standalone block)
 * This is typically not used directly, but included for completeness
 * @param {Element} block The modal block element
 */
export default async function decorate(block) {
  const link = block.querySelector('a');
  if (link) {
    const fragmentPath = new URL(link.href).pathname;
    const placeholders = await fetchLangPlaceholders();

    // Create a trigger button
    const triggerButton = document.createElement('button');
    triggerButton.textContent = link.textContent || placeholders.openModal || 'Open Modal';
    triggerButton.classList.add('modal-trigger-button');

    createModalTrigger(fragmentPath, triggerButton, { placeholders });

    block.replaceChildren(triggerButton);
  }
}
