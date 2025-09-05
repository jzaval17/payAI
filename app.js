const tapArea = document.getElementById('tap-area');
const overlay = document.getElementById('overlay');
const overlayAmount = document.getElementById('overlay-amount');
const card = document.querySelector('.fake-card');
const confettiContainer = overlay.querySelector('.confetti');

let audio;
function playChaChing() {
  if (!audio) {
    // Path is relative to your index.html
    audio = new Audio('assets/sounds/payment.mp3');
  }
  audio.currentTime = 0; // rewind to start each time
  audio.play().catch(err => console.error('Audio play failed:', err));
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

function showOverlay(amount = '$20.00') {
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
  card.addEventListener('animationend', () => {
    card.classList.remove('tilt');
  }, { once: true });
}

function handleTap() {
  triggerTilt();
  playChaChing();
  setTimeout(() => showOverlay(), 400); // delay to match tilt
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
    navigator.serviceWorker.register('/service-worker.js')
      .then(reg => console.log('Service worker registered from app.js:', reg.scope))
      .catch(err => console.warn('Service worker registration failed:', err));
  });
}
