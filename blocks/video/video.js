import { loadScript } from '../../scripts/aem.js';

const KALTURA_PARTNER_ID = '4699762';
const KALTURA_UI_CONF_ID = '51133253';

function createTranscriptButton() {
  const button = document.createElement('div');
  button.className = 'playkit-control-button-container playkit-control-transcript';
  button.innerHTML = `
    <button type="button" tabindex="0" aria-label="Transcript" 
            class="playkit-control-button video-transcript-toggle" 
            aria-expanded="false">
      <svg width="28" height="28" viewBox="0 0 28 28" class="playkit-icon">
        <g fill="currentColor">
          <rect x="6" y="8" width="28" height="2" rx="2"/>
          <rect x="6" y="13" width="28" height="2" rx="2"/>
          <rect x="6" y="18" width="28" height="2" rx="2"/>
          <rect x="6" y="23" width="20" height="2" rx="2"/>
        </g>
      </svg>
    </button>
  `;
  return button;
}

function createTranscriptPanel(transcriptionHtml) {
  const panel = document.createElement('div');
  panel.className = 'video-transcript-panel';
  panel.setAttribute('aria-hidden', 'true');
  panel.innerHTML = `
    <div class="video-transcript-header">
      <h3>Transcript</h3>
      <button type="button" class="video-transcript-close" aria-label="Close transcript">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
        </svg>
      </button>
    </div>
    <div class="video-transcript-content">${transcriptionHtml}</div>
  `;
  return panel;
}

function setupTranscriptToggle(player, toggleBtn, closeBtn, panel) {
  const toggle = () => {
    const isOpen = panel.classList.contains('open');
    panel.classList.toggle('open');
    panel.setAttribute('aria-hidden', isOpen ? 'true' : 'false');
    toggleBtn.setAttribute('aria-expanded', isOpen ? 'false' : 'true');

    if (!isOpen && player.isPlaying()) {
      player.pause();
    }
  };

  toggleBtn.addEventListener('click', toggle);
  closeBtn.addEventListener('click', toggle);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && panel.classList.contains('open')) {
      toggle();
    }
  });
}

function addTranscriptControls(player, container, transcriptionHtml) {
  const checkInterval = setInterval(() => {
    const rightControls = container.querySelector('.playkit-bottom-bar .playkit-right-controls');
    const fullscreenBtn = container.querySelector('.playkit-control-fullscreen');

    if (rightControls && fullscreenBtn && !container.querySelector('.playkit-control-transcript')) {
      clearInterval(checkInterval);

      const transcriptBtn = createTranscriptButton();
      rightControls.insertBefore(transcriptBtn, fullscreenBtn);

      const transcriptPanel = createTranscriptPanel(transcriptionHtml);
      container.appendChild(transcriptPanel);

      const toggleBtn = transcriptBtn.querySelector('.video-transcript-toggle');
      const closeBtn = transcriptPanel.querySelector('.video-transcript-close');

      setupTranscriptToggle(player, toggleBtn, closeBtn, transcriptPanel);
    }
  }, 100);

  setTimeout(() => clearInterval(checkInterval), 10000);
}

async function waitForKalturaPlayer() {
  return new Promise((resolve) => {
    if (window.KalturaPlayer) {
      resolve();
      return;
    }

    const checkInterval = setInterval(() => {
      if (window.KalturaPlayer) {
        clearInterval(checkInterval);
        resolve();
      }
    }, 100);

    // Timeout after 10 seconds
    setTimeout(() => {
      clearInterval(checkInterval);
      if (!window.KalturaPlayer) {
        // eslint-disable-next-line no-console
        console.error('Kaltura Player failed to load');
      }
      resolve();
    }, 10000);
  });
}

async function loadKalturaPlayer(playerId, entryId, transcriptionHtml, container) {
  const playerElement = document.getElementById(playerId);

  if (!playerElement) {
    setTimeout(() => loadKalturaPlayer(playerId, entryId, transcriptionHtml, container), 500);
    return;
  }

  if (playerElement.innerHTML) {
    return;
  }

  const scriptUrl = `https://cdnapisec.kaltura.com/p/${KALTURA_PARTNER_ID}/embedPlaykitJs/uiconf_id/${KALTURA_UI_CONF_ID}/langs/en,es`;
  await loadScript(scriptUrl);
  await waitForKalturaPlayer();

  if (!window.KalturaPlayer) {
    return;
  }

  const config = {
    targetId: playerId,
    provider: {
      partnerId: parseInt(KALTURA_PARTNER_ID, 10),
      uiConfId: parseInt(KALTURA_UI_CONF_ID, 10),
    },
    playback: {
      autoplay: false,
      preload: 'auto',
    },
  };

  const player = window.KalturaPlayer.setup(config);
  player.loadMedia({ entryId });

  if (transcriptionHtml) {
    addTranscriptControls(player, container, transcriptionHtml);
  }
}

/**
 * Decorates the video block with Kaltura player
 * @param {Element} block - The video block element
 */
export default async function decorate(block) {
  const playerId = `kaltura-player-${Math.random().toString(36).substring(2, 15)}`;
  let entryId = '';
  let transcription = null;

  const rows = [...block.children];
  rows.forEach((row) => {
    const cells = [...row.children];
    cells.forEach((cell) => {
      const textContent = cell.textContent.trim();

      // Check for entry ID
      if (textContent.match(/^\d+_[\w-]+$/)) {
        entryId = textContent;
      }

      // Check for transcription content
      if (cell.querySelector('p, ul, ol, h1, h2, h3, h4, h5, h6') && !textContent.match(/^\d+_[\w-]+$/)) {
        if (!transcription) {
          transcription = document.createElement('div');
        }
        [...cell.children].forEach((child) => {
          transcription.appendChild(child.cloneNode(true));
        });
      }
    });
  });

  if (!entryId) {
    // eslint-disable-next-line no-console
    console.error('Video entry ID is missing.');
    return;
  }

  const playerContainer = document.createElement('div');
  playerContainer.id = playerId;
  playerContainer.className = 'video-player-container';

  const wrapper = document.createElement('div');
  wrapper.className = 'video-wrapper';
  wrapper.appendChild(playerContainer);

  block.replaceChildren(wrapper);

  try {
    const transcriptionHtml = transcription ? transcription.innerHTML.trim() : '';
    await loadKalturaPlayer(playerId, entryId, transcriptionHtml, block);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error initializing Kaltura player:', error);
  }
}
