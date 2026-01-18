const tapArea = document.getElementById('tap-area');
const overlay = document.getElementById('overlay');
const overlayAmount = document.getElementById('overlay-amount');
const card = document.querySelector('.fake-card');
const confettiContainer = overlay.querySelector('.confetti');

// Settings and controls (declare DOM handles up-front to avoid runtime errors)
const settingsBtn = document.getElementById('settings-btn');
const settingsPanel = document.getElementById('settings-panel');
const settingsClose = document.getElementById('settings-close');
const amountInput = document.getElementById('amount-input');
const saveSettings = document.getElementById('save-settings');
const randomizeAmount = document.getElementById('randomize-amount');
const themeBtns = document.querySelectorAll('.theme-btn');
const shareApp = document.getElementById('share-app');

// Prevent the entrance animation from replaying on subsequent DOM changes.
// When the initial 'slideInCard' animation ends, turn off the animation property so
// later class toggles (tilt, ripple) won't cause the card to 'load up' again.
window.addEventListener('load', () => {
  if (!card) return;
  const onAnimEnd = (e) => {
    try {
      if (e && e.animationName === 'slideInCard') {
        card.style.animation = 'none';
      }
    } catch (err) {
      // ignore
    }
  };
  card.addEventListener('animationend', onAnimEnd, { once: true });
});

let audio;
function playChaChing() {
  if (!soundEnabled) return;
  if (!audio) {
    // Path is relative to your index.html
    audio = new Audio('assets/sounds/payment.mp3');
  }
  audio.currentTime = 0; // rewind to start each time
  audio.play().catch(err => console.error('Audio play failed:', err));
}

// Play the chime and wait until it ends or until a minimum time (ms) elapses.
// This prevents navigation from cutting the sound short.
function playChaChingAndWait(minMs = 600) {
  if (!audio) audio = new Audio('assets/sounds/payment.mp3');
  audio.currentTime = 0;
  // Hint to browser to preload audio where possible
  audio.preload = 'auto';
  // Try to play; if play() is rejected (autoplay policy), resolve immediately.
  const playPromise = audio.play().catch(err => {
    console.error('Audio play failed:', err);
    return Promise.resolve();
  });

  return playPromise.then(() => {
    return new Promise((resolve) => {
      let resolved = false;
      const finish = () => { if (!resolved) { resolved = true; cleanup(); resolve(); } };
      const cleanup = () => {
        audio.removeEventListener('ended', finish);
        audio.removeEventListener('loadedmetadata', onMeta);
        if (timeoutId) clearTimeout(timeoutId);
      };

      // If we know the duration, wait for either the ended event or until that duration completes
      const onMeta = () => {
        // duration may be NaN or Infinity if not available
        const dur = Number.isFinite(audio.duration) && audio.duration > 0 ? Math.ceil(audio.duration * 1000) : null;
        if (dur) {
          // ensure minimum wait and small safety buffer (50-150ms)
          const waitMs = Math.max(minMs, dur + 120);
          timeoutId = setTimeout(finish, waitMs);
        }
      };

      // canplaythrough is a stronger signal that audio can be played fully without buffering
      const onCanPlay = () => {
        if (!timeoutId) {
          const dur = Number.isFinite(audio.duration) && audio.duration > 0 ? Math.ceil(audio.duration * 1000) : minMs;
          timeoutId = setTimeout(finish, Math.max(minMs, dur + 120));
        }
      };

      let timeoutId = null;
      audio.addEventListener('ended', finish, { once: true });
  audio.addEventListener('loadedmetadata', onMeta, { once: true });
  audio.addEventListener('canplaythrough', onCanPlay, { once: true });

      // Fallback minimum timeout in case metadata isn't available or events don't fire
      timeoutId = setTimeout(finish, minMs + 250);
    });
  });
}

function launchConfetti() {
  confettiContainer.innerHTML = '';
  for (let i = 0; i < 20; i++) {
    const piece = document.createElement('div');
    piece.classList.add('confetti-piece');
    piece.style.setProperty('--hue', Math.floor(Math.random() * 360));
    piece.style.left = Math.random() * 100 + '%';
    piece.style.animationDelay = (Math.random() * 0.5) + 's';
    confettiContainer.appendChild(piece);
  }
}

function showOverlay(amount = '$50.00') {
  overlayAmount.textContent = amount;
  overlay.hidden = false;
  launchConfetti();
  // Keep overlay visible longer and save timeout id so user can dismiss early
  if (overlay._hideTimeout) clearTimeout(overlay._hideTimeout);
  overlay._hideTimeout = setTimeout(() => hideOverlay(), 4000);
}

function hideOverlay() {
  if (!overlay.hidden) {
    overlay.hidden = true;
  }
  if (overlay._hideTimeout) {
    clearTimeout(overlay._hideTimeout);
    overlay._hideTimeout = null;
  }
}

function triggerTilt() {
  card.classList.add('tilt');
  // Add a ripple effect on the chip for visual feedback
  const chip = card.querySelector('.card-chip');
  let ripple;
  if (chip) {
    ripple = document.createElement('div');
    ripple.className = 'chip-ripple';
    chip.appendChild(ripple);
  }

  card.addEventListener('animationend', () => {
    card.classList.remove('tilt');
    if (ripple && ripple.parentNode) {
      // let the animation finish then remove
      setTimeout(() => ripple.remove(), 500);
    }
  }, { once: true });
}

async function handleTap() {
  // If settings are open, block the main tap action
  if (typeof settingsOpen !== 'undefined' && settingsOpen) return;
  triggerTilt();
  // Play sound and wait for it (or for min timeout) before navigating so it's not cut off
  try {
    await playChaChingAndWait(700);
  } catch (e) {
    // ignore and continue
  }

  // After sound/animation, navigate to receipt
  const amount = '$20.00';
  const txid = Math.random().toString(36).slice(2, 12);
  const params = new URLSearchParams({ amount, status: 'Cleared', id: txid });
  // Use replace so the receipt doesn't remain in history stack
  location.replace('receipt.html?' + params.toString());
}

tapArea.addEventListener('click', handleTap);

tapArea.addEventListener('keydown', (e) => {
  const key = e.key.toLowerCase();
  if (key === 'enter' || key === ' ') {
    e.preventDefault();
    handleTap();
  }
});

// Overlay dismiss controls
const overlayCloseBtn = document.getElementById('overlay-close');
overlayCloseBtn.addEventListener('click', () => hideOverlay());

// Click outside content closes overlay
overlay.addEventListener('click', (e) => {
  if (e.target === overlay) hideOverlay();
});

// Escape key to close
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') hideOverlay();
});

// Register service worker for PWA (registered here instead of inline in index.html)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js')
      .then(reg => {
        console.log('Service worker registered from app.js:', reg.scope);

        // If there's an update installing, listen for state changes
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          console.log('Service worker update found:', newWorker);
          newWorker.addEventListener('statechange', () => {
            console.log('New SW state:', newWorker.state);
            // When the new worker is installed, ask it to skip waiting
            if (newWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                // A new update is available; tell the worker to skip waiting
                newWorker.postMessage({ type: 'SKIP_WAITING' });
              }
            }
          });
        });

      }).catch(err => console.warn('Service worker registration failed:', err));

    // Listen for messages from the service worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (!event.data) return;
      if (event.data.type === 'SW_ACTIVATED') {
        console.log('Service worker activated, reloading to apply new version');
        // Reload to allow the new service worker to control the page immediately
        window.location.reload();
      }
    });

    // Reload when controller changes (another safety hook)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('Service worker controller changed, reloading page');
      window.location.reload();
    });
  });
}

// PWA install prompt handling
let deferredPrompt;
const installBtn = document.getElementById('install-btn');

window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent the mini-infobar from appearing on mobile
  e.preventDefault();
  deferredPrompt = e;
  // Show the install button
  if (installBtn) {
    installBtn.hidden = false;
    installBtn.setAttribute('aria-hidden', 'false');
  }
});

if (installBtn) {
  installBtn.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    // Show the browser install prompt
    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    console.log('User choice for install:', choice);
    // Hide the install button after prompt
    installBtn.hidden = true;
    installBtn.setAttribute('aria-hidden', 'true');
    deferredPrompt = null;
  });
}

// Share app
const shareApp = document.getElementById('share-app');
shareApp.addEventListener('click', () => {
  const url = window.location.href;
  const text = 'Check out this fun PrankPay app!';
  if (navigator.share) {
    navigator.share({
      title: 'PrankPay',
      text: text,
      url: url
    });
  } else {
    // Fallback: copy to clipboard
    navigator.clipboard.writeText(url).then(() => {
      alert('Link copied to clipboard!');
    });
  }
});

// Load saved settings
const savedAmount = localStorage.getItem('prankpay-amount') || '20.00';
const savedTheme = localStorage.getItem('prankpay-theme') || 'pear';
const savedSound = localStorage.getItem('prankpay-sound') !== 'false'; // default true
let soundEnabled = savedSound;
overlayAmount.textContent = '$' + savedAmount;
amountInput.value = savedAmount;
card.className = `fake-card ${savedTheme}`;
document.getElementById(`theme-${savedTheme}`).classList.add('active');
document.getElementById('sound-toggle').checked = soundEnabled;

// Sound toggle change
document.getElementById('sound-toggle').addEventListener('change', () => {
  soundEnabled = document.getElementById('sound-toggle').checked;
  localStorage.setItem('prankpay-sound', soundEnabled);
});

// Live preview for amount input
amountInput.addEventListener('input', () => {
  const val = amountInput.value.trim();
  if (val) {
    overlayAmount.textContent = '$' + val;
    localStorage.setItem('prankpay-amount', val); // Save on change
  }
});

// State for settings
let settingsOpen = false;

// Start hidden and set aria
settingsPanel.style.display = 'none';
settingsPanel.setAttribute('aria-hidden', 'true');

function showSettings(event) {
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }
  settingsPanel.style.display = 'flex';
  settingsPanel.setAttribute('aria-hidden', 'false');
  settingsBtn.setAttribute('aria-expanded', 'true');
  settingsOpen = true;
  const first = settingsPanel.querySelector('input, button, [tabindex]');
  if (first) first.focus();
}

function hideSettings() {
  settingsPanel.style.display = 'none';
  settingsPanel.setAttribute('aria-hidden', 'true');
  settingsBtn.setAttribute('aria-expanded', 'false');
  settingsOpen = false;
  settingsBtn.focus();
}

// Wire up openers (handle click/touch/pointer)
['click', 'touchstart', 'pointerdown'].forEach(evt => {
  settingsBtn.addEventListener(evt, showSettings);
});

// Close settings
settingsClose.addEventListener('click', hideSettings);
settingsClose.addEventListener('keyup', (e) => { if (e.key === 'Enter') hideSettings(); });

// Close on Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && settingsOpen) hideSettings();
});

// Close when clicking outside the panel (but not when clicking the settings button)
document.addEventListener('click', (e) => {
  if (!settingsOpen) return;
  const isInside = settingsPanel.contains(e.target) || settingsBtn.contains(e.target);
  if (!isInside) hideSettings();
});

// Randomize amount
randomizeAmount.addEventListener('click', () => {
  const dollars = Math.floor(Math.random() * 1000) + 1; // 1-1000
  const cents = Math.floor(Math.random() * 100); // 0-99
  const amount = `${dollars}.${cents.toString().padStart(2, '0')}`;
  amountInput.value = amount;
  overlayAmount.textContent = '$' + amount; // Update preview
  localStorage.setItem('prankpay-amount', amount); // Save immediately
});

// Theme switching
themeBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const theme = btn.id.replace('theme-', '');
    themeBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    card.className = `fake-card ${theme}`;
    localStorage.setItem('prankpay-theme', theme); // Save immediately
  });
});

// Save settings
saveSettings.addEventListener('click', () => {
  const newAmount = amountInput.value.trim();
  if (newAmount) {
    localStorage.setItem('prankpay-amount', newAmount);
  }
  // Theme and sound already saved on change
  settingsPanel.style.display = 'none';
});
