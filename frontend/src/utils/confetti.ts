import confetti from 'canvas-confetti';
import { balloons } from 'balloons-js';

export function fireConfetti() {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
  });
}

export function fireSuccessConfetti() {
  // A balloon burst is the headline celebration; a light side-confetti adds sparkle.
  // Guarded so a celebration effect can never break a successful booking flow.
  try {
    balloons();
  } catch {
    /* effect-only; ignore */
  }

  const end = Date.now() + 500;
  const colors = ['#2069cf', '#3a87e0', '#93c5fd'];

  (function frame() {
    confetti({
      particleCount: 2,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors,
    });
    confetti({
      particleCount: 2,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors,
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}
