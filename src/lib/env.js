/** Device / preference detection used to scale effects gracefully. */
const mq = (q) => typeof window !== 'undefined' && window.matchMedia && window.matchMedia(q).matches;

export const prefersReducedMotion = () => mq('(prefers-reduced-motion: reduce)');
export const isMobileViewport = () => mq('(max-width: 767px)');
export const isCoarsePointer = () => mq('(pointer: coarse)');

export function isLowPower() {
  if (typeof navigator === 'undefined') return false;
  const cores = navigator.hardwareConcurrency || 4;
  const mem = navigator.deviceMemory || 4;
  const saveData = navigator.connection && navigator.connection.saveData;
  return saveData || cores <= 2 || mem <= 2 || (isMobileViewport() && isCoarsePointer());
}

export function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch {
    return false;
  }
}

export function removeBootScreen() {
  const boot = document.getElementById('boot');
  if (!boot) return;
  boot.classList.add('boot--done');
  setTimeout(() => boot.remove(), 900);
}

export function setBootProgress(p) {
  const bar = document.querySelector('#boot .boot__bar span');
  if (bar) bar.style.transform = `scaleX(${Math.min(1, Math.max(0, p))})`;
}

/** Adds `html.low-power` so CSS can drop expensive effects (backdrop blur, grain) on weak devices. */
export function flagLowPower() {
  try {
    if (isLowPower()) document.documentElement.classList.add('low-power');
  } catch {
    /* ignore */
  }
}
