/**
 * THIỆP MỜI DỰ LỄ TỐT NGHIỆP | VÕ THỊ NGỌC HỒNG (2026)
 * Luxury Interactive Envelope & Audio Motion Engine
 */

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const envelopeScene = document.getElementById('envelopeScene');
  const envelope = document.getElementById('envelope');
  const waxSeal = document.getElementById('waxSeal');
  const btnOpenEnvelope = document.getElementById('btnOpenEnvelope');
  const cardPresentation = document.getElementById('cardPresentation');
  const btnReplay = document.getElementById('btnReplay');
  const ambientFx = document.getElementById('ambientFx');

  // Audio Elements
  const bgMusic = document.getElementById('bgMusic');
  const musicBtn = document.getElementById('musicBtn');

  const envelopeFlap = document.getElementById('envelopeFlap');
  const cardInsert = document.getElementById('cardInsert');
  let envelopeState = 'closed';
  let sequenceController = null;
  const celebrationTimers = new Set();
  const celebrationPetals = new Set();
  let isAudioPlaying = false;

  function setEnvelopeState(state) {
    envelopeState = state;
    envelope.dataset.state = state;
    btnOpenEnvelope.disabled = state !== 'closed';
    waxSeal.setAttribute('aria-disabled', String(state !== 'closed'));
    waxSeal.tabIndex = state === 'closed' ? 0 : -1;
    btnReplay.disabled = ['retracting', 'lowering', 'closing-flap'].includes(state);
  }

  function beginSequence() {
    sequenceController?.abort();
    sequenceController = new AbortController();
    return sequenceController.signal;
  }

  // Wait for the actual CSS transitions, including reversals mid-animation.
  // Abort removes the old continuation without snapping the current transform.
  function waitForMotion(element, signal) {
    void element.offsetWidth;
    const animations = element.getAnimations();
    return new Promise((resolve) => {
      const finish = (completed) => {
        signal.removeEventListener('abort', abort);
        resolve(completed && !signal.aborted);
      };
      const abort = () => finish(false);
      if (signal.aborted) return finish(false);
      signal.addEventListener('abort', abort, { once: true });
      Promise.all(animations.map((animation) => animation.finished.catch(() => {})))
        .then(() => finish(true));
    });
  }

  function clearCelebration() {
    celebrationTimers.forEach(clearTimeout);
    celebrationTimers.clear();
    celebrationPetals.forEach((petal) => {
      petal.getAnimations().forEach((animation) => animation.cancel());
      petal.remove();
    });
    celebrationPetals.clear();
  }

  function celebrationTimeout(callback, delay) {
    const timer = setTimeout(() => {
      celebrationTimers.delete(timer);
      callback();
    }, delay);
    celebrationTimers.add(timer);
  }

  // Initialize Audio Settings
  if (bgMusic) {
    bgMusic.volume = 0.4; // 40% gentle background volume as required
  }

  /**
   * Play or Pause Audio with UI Sync
   */
  function playAudio() {
    if (!bgMusic) return;
    const playPromise = bgMusic.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          isAudioPlaying = true;
          musicBtn.classList.add('playing');
        })
        .catch((err) => {
          console.warn('Audio autoplay blocked or user interaction required:', err);
        });
    }
  }

  function pauseAudio() {
    if (!bgMusic) return;
    bgMusic.pause();
    isAudioPlaying = false;
    musicBtn.classList.remove('playing');
  }

  function toggleAudio() {
    if (isAudioPlaying) {
      pauseAudio();
    } else {
      playAudio();
    }
  }

  if (musicBtn) {
    musicBtn.addEventListener('click', toggleAudio);
    musicBtn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleAudio();
      }
    });
  }

  /**
   * Open Envelope Sequence
   */
  async function openEnvelope() {
    if (envelopeState !== 'closed') return;
    const signal = beginSequence();
    setEnvelopeState('opening-flap');
    playAudio();
    envelope.classList.add('is-open');
    clearCelebration();
    createCelebrationBurst();
    if (!await waitForMotion(envelopeFlap, signal)) return;

    envelope.classList.add('is-flap-behind');
    setEnvelopeState('lifting');
    envelope.classList.add('is-insert-visible', 'is-card-raised');
    if (!await waitForMotion(cardInsert, signal)) return;

    setEnvelopeState('revealing');
    envelopeScene.classList.add('scene-hidden');
    envelopeScene.setAttribute('aria-hidden', 'true');
    cardPresentation.style.display = 'block';
    cardPresentation.setAttribute('aria-hidden', 'false');
    void cardPresentation.offsetWidth;
    cardPresentation.classList.add('is-revealed');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (!await waitForMotion(cardPresentation, signal)) return;
    setEnvelopeState('open');
  }

  /**
   * Close Envelope / Replay Experience
   */
  async function resetEnvelope() {
    if (['closed', 'retracting', 'lowering', 'closing-flap'].includes(envelopeState)) return;
    const signal = beginSequence();
    setEnvelopeState('retracting');
    clearCelebration();
    cardPresentation.classList.remove('is-revealed');
    if (!await waitForMotion(cardPresentation, signal)) return;
    cardPresentation.style.display = 'none';
    cardPresentation.setAttribute('aria-hidden', 'true');
    envelopeScene.classList.remove('scene-hidden');
    envelopeScene.setAttribute('aria-hidden', 'false');
    window.scrollTo({ top: 0, behavior: 'instant' });
    if (!await waitForMotion(envelopeScene, signal)) return;
    if (!await waitForMotion(envelopeFlap, signal)) return;

    setEnvelopeState('lowering');
    envelope.classList.remove('is-card-raised');
    if (!await waitForMotion(cardInsert, signal)) return;
    envelope.classList.remove('is-insert-visible');

    setEnvelopeState('closing-flap');
    envelope.classList.remove('is-flap-behind');
    envelope.classList.remove('is-open');
    if (!await waitForMotion(envelopeFlap, signal)) return;
    setEnvelopeState('closed');
  }

  // Bind Open Events
  if (envelope) {
    envelope.addEventListener('click', openEnvelope);
  }
  if (waxSeal) {
    waxSeal.addEventListener('click', (e) => {
      e.stopPropagation();
      openEnvelope();
    });
    waxSeal.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openEnvelope();
      }
    });
  }
  if (btnOpenEnvelope) {
    btnOpenEnvelope.addEventListener('click', (e) => {
      e.stopPropagation();
      openEnvelope();
    });
  }
  if (btnReplay) {
    btnReplay.addEventListener('click', resetEnvelope);
  }

  /**
   * Ambient Floating Particles & Flower Petals Generator
   */
  function initAmbientParticles() {
    if (!ambientFx) return;

    // Petals
    const petalCount = 14;
    for (let i = 0; i < petalCount; i++) {
      createPetal(i * 1.2);
    }

    // Golden Sparkles
    const sparkleCount = 20;
    for (let i = 0; i < sparkleCount; i++) {
      createSparkle();
    }
  }

  function createPetal(delay = 0) {
    const petal = document.createElement('div');
    petal.classList.add('petal');

    const size = Math.random() * 10 + 12; // 12px to 22px
    petal.style.width = `${size}px`;
    petal.style.height = `${size * 1.3}px`;
    petal.style.left = `${Math.random() * 100}%`;
    petal.style.animationDuration = `${Math.random() * 6 + 9}s`; // 9s to 15s
    petal.style.animationDelay = `${delay}s`;
    ambientFx.appendChild(petal);
  }

  function createSparkle() {
    const sparkle = document.createElement('div');
    sparkle.classList.add('sparkle');
    sparkle.style.left = `${Math.random() * 100}%`;
    sparkle.style.top = `${Math.random() * 100}%`;
    sparkle.style.animationDuration = `${Math.random() * 3 + 2.5}s`;
    sparkle.style.animationDelay = `${Math.random() * 4}s`;
    ambientFx.appendChild(sparkle);
  }

  function createCelebrationBurst() {
    for (let i = 0; i < 18; i++) {
      celebrationTimeout(() => {
        const petal = document.createElement('div');
        petal.classList.add('petal');
        const size = Math.random() * 12 + 14;
        petal.style.width = `${size}px`;
        petal.style.height = `${size * 1.3}px`;
        petal.style.left = `${40 + Math.random() * 20}%`;
        petal.style.top = `30%`;
        petal.style.animationDuration = `${Math.random() * 4 + 5}s`;
        ambientFx.appendChild(petal);
        celebrationPetals.add(petal);

        celebrationTimeout(() => {
          petal.remove();
          celebrationPetals.delete(petal);
        }, 9000);
      }, i * 70);
    }
  }

  /**
   * Real-time Countdown Timer to Graduation Date:
   * 09:00 AM on Sunday, October 25, 2026 (GMT+7)
   */
  function initCountdown() {
    const targetDate = new Date('2026-10-25T09:00:00+07:00').getTime();

    const cdDays = document.getElementById('cdDays');
    const cdHours = document.getElementById('cdHours');
    const cdMins = document.getElementById('cdMins');
    const cdSecs = document.getElementById('cdSecs');

    if (!cdDays || !cdHours || !cdMins || !cdSecs) return;

    function update() {
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance <= 0) {
        cdDays.textContent = '00';
        cdHours.textContent = '00';
        cdMins.textContent = '00';
        cdSecs.textContent = '00';
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      cdDays.textContent = String(days).padStart(2, '0');
      cdHours.textContent = String(hours).padStart(2, '0');
      cdMins.textContent = String(minutes).padStart(2, '0');
      cdSecs.textContent = String(seconds).padStart(2, '0');
    }

    update();
    setInterval(update, 1000);
  }

  // Initialize
  setEnvelopeState('closed');
  initAmbientParticles();
  initCountdown();
});
