import confetti from 'canvas-confetti';

// Simple, elegant Web Audio API sound synthesizer
// Requires zero external sound assets, has 0 latency, and never breaks offline.

let audioCtx: AudioContext | null = null;
let isSoundMuted = false;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioCtxClass) {
      audioCtx = new AudioCtxClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function toggleMuteSound(): boolean {
  isSoundMuted = !isSoundMuted;
  return isSoundMuted;
}

export function isAudioMuted(): boolean {
  return isSoundMuted;
}

let lastChimeTime = 0;
let isChimePlaying = false;

/**
 * Sweet, gentle professional chime (luxurious, warm, crystalline fintech bell)
 * Designed to be soft, pleasing, and never loop or beep repeatedly.
 * Strictly debounced with a 2.5s cooldown and playback lock.
 */
export function playSuccessChime() {
  if (isSoundMuted || isChimePlaying) return;
  const nowMs = Date.now();
  // Cooldown guard: strictly prevent repetitive triggering within 2.5 seconds
  if (nowMs - lastChimeTime < 2500) {
    return;
  }
  lastChimeTime = nowMs;
  isChimePlaying = true;

  try {
    const ctx = getAudioContext();
    if (!ctx || ctx.state === 'suspended') {
      isChimePlaying = false;
      return;
    }

    const now = ctx.currentTime;
    // Sweet, crystalline 2-note ascending chime (C6 at 1046.5Hz -> G6 at 1567.98Hz)
    // Very gentle gain (0.045) and soft envelope for a sweet, professional tone
    const tones = [
      { freq: 1046.50, time: 0, gain: 0.045, duration: 0.28 },    // C6 crystal bell
      { freq: 1567.98, time: 0.09, gain: 0.038, duration: 0.38 }, // G6 sweet harmonic shimmer
    ];

    tones.forEach((tone) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(tone.freq, now + tone.time);

      gain.gain.setValueAtTime(0, now + tone.time);
      gain.gain.linearRampToValueAtTime(tone.gain, now + tone.time + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + tone.time + tone.duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + tone.time);
      osc.stop(now + tone.time + tone.duration + 0.01);
    });

    setTimeout(() => {
      isChimePlaying = false;
    }, 500);

    triggerHaptic('success');
  } catch {
    isChimePlaying = false;
    // Gracefully ignore any browser autoplay policy restrictions
  }
}

/**
 * Sweet, polite alert tone for banners and notices
 */
export function playSweetAlertSound() {
  playSuccessChime();
}

/**
 * Cheerful coin / funding chime
 */
export function playCoinSound() {
  if (isSoundMuted) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [987.77, 1318.51]; // B5, E6

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.09);

      gain.gain.setValueAtTime(0, now + idx * 0.09);
      gain.gain.linearRampToValueAtTime(0.14, now + idx * 0.09 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.09 + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.09);
      osc.stop(now + idx * 0.09 + 0.42);
    });

    triggerHaptic('medium');
  } catch {
    // Ignore
  }
}

/**
 * Subtle tactile micro-tap for keypad presses and button taps
 */
export function playTapSound() {
  if (isSoundMuted) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.025);

    gain.gain.setValueAtTime(0.035, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.025);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.03);

    triggerHaptic('light');
  } catch {
    // Ignore
  }
}

/**
 * Soft error tone for invalid PIN or failed verification
 */
export function playErrorTone() {
  if (isSoundMuted) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.linearRampToValueAtTime(130, now + 0.2);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.23);

    triggerHaptic('warning');
  } catch {
    // Ignore
  }
}

/**
 * Trigger vibration on mobile devices if supported
 */
export function triggerHaptic(type: 'light' | 'medium' | 'success' | 'warning' = 'light') {
  if (typeof window === 'undefined' || !navigator.vibrate) return;
  try {
    switch (type) {
      case 'light':
        navigator.vibrate(12);
        break;
      case 'medium':
        navigator.vibrate(25);
        break;
      case 'success':
        navigator.vibrate([20, 40, 35]);
        break;
      case 'warning':
        navigator.vibrate([40, 40, 40]);
        break;
    }
  } catch {
    // Ignore if not permitted
  }
}

/**
 * Launch festive confetti cannon
 */
export function triggerConfetti() {
  try {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#0047cc', '#ffdb3c', '#00c853', '#ff5252', '#38bdf8'],
      disableForReducedMotion: true,
    });
  } catch {
    // Fallback if canvas is unavailable
  }
}
