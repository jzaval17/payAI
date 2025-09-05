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
  setTimeout(() => overlay.hidden = true, 2000);
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
