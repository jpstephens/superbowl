'use client';

import confetti from 'canvas-confetti';

/**
 * Celebration effects for game day moments
 */

/**
 * Fire standard confetti burst
 */
export function fireCelebration() {
  const count = 200;
  const defaults = {
    origin: { y: 0.7 },
    zIndex: 9999,
  };

  function fire(particleRatio: number, opts: confetti.Options) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio),
    });
  }

  fire(0.25, { spread: 26, startVelocity: 55 });
  fire(0.2, { spread: 60 });
  fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
  fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
  fire(0.1, { spread: 120, startVelocity: 45 });
}

/**
 * Fire gold/trophy celebration for winners
 */
export function fireWinnerCelebration() {
  const duration = 3000;
  const end = Date.now() + duration;

  const gold = '#CDA33B';
  const yellow = '#FFD700';

  (function frame() {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: [gold, yellow, '#FFA500'],
      zIndex: 9999,
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: [gold, yellow, '#FFA500'],
      zIndex: 9999,
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  })();
}

/**
 * Fire team-colored confetti for touchdowns
 */
export function fireTouchdownCelebration(teamColors: string[] = ['#E31837', '#FFB612']) {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: teamColors,
    zIndex: 9999,
  });
}

/**
 * Fire fireworks effect for major moments
 */
export function fireFireworks() {
  const duration = 5000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

  function randomInRange(min: number, max: number) {
    return Math.random() * (max - min) + min;
  }

  const interval: any = setInterval(function () {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    const particleCount = 50 * (timeLeft / duration);

    // Random position bursts
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
    });
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
    });
  }, 250);
}

/**
 * Fire school/cannon effect from sides
 */
export function fireSchoolPride(colors: string[] = ['#CDA33B', '#1A1A1A']) {
  function fire(angle: number, origin: { x: number; y: number }) {
    confetti({
      particleCount: 40,
      angle,
      spread: 80,
      origin,
      colors,
      zIndex: 9999,
    });
  }

  // Left side
  fire(55, { x: 0, y: 0.8 });
  setTimeout(() => fire(55, { x: 0, y: 0.6 }), 100);

  // Right side
  setTimeout(() => fire(125, { x: 1, y: 0.8 }), 200);
  setTimeout(() => fire(125, { x: 1, y: 0.6 }), 300);
}

/**
 * Quarter end celebration
 */
export function fireQuarterEnd(quarter: number) {
  if (quarter === 4) {
    // Game end - big celebration
    fireFireworks();
  } else if (quarter === 2) {
    // Halftime
    fireSchoolPride();
  } else {
    // Regular quarter end
    fireCelebration();
  }
}

/**
 * Confetti rain for extended celebration
 */
export function fireConfettiRain(duration = 5000) {
  const end = Date.now() + duration;

  (function frame() {
    confetti({
      particleCount: 2,
      angle: 90,
      spread: 180,
      origin: { x: Math.random(), y: -0.1 },
      gravity: 0.5,
      scalar: 1.2,
      drift: Math.random() - 0.5,
      zIndex: 9999,
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  })();
}

/**
 * Clear all confetti
 */
export function clearConfetti() {
  confetti.reset();
}

