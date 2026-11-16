import { prefersReducedMotion, isCoarsePointer, isMobileViewport } from './env.js';

/**
 * Subtle mouse parallax for the Login and Booking pages.
 * Elements inside `root` with data-depth="<px>" drift by up to that many pixels (in the opposite direction of the pointer).
 * Uses the independent CSS `translate` property, so it never fights GSAP/CSS `transform` animations.
 * Elements with data-spot also get --mx/--my (cursor position inside them, px) for a soft spotlight.
 * The loop only runs while something is still moving; it is skipped for touch devices, phones and reduced motion.
 * Returns a cleanup function.
 */
export function pointerParallax(root, { ease = 0.08 } = {}) {
  if (!root || prefersReducedMotion() || isCoarsePointer() || isMobileViewport()) return () => {};
  const layers = [...root.querySelectorAll('[data-depth]')].map((el) => ({ el, depth: parseFloat(el.dataset.depth) || 0 }));
  const spots = [...root.querySelectorAll('[data-spot]')];
  if (!layers.length && !spots.length) return () => {};
  let px = 0;
  let py = 0;
  let tx = 0;
  let ty = 0;
  let cx = 0;
  let cy = 0;
  let raf = 0;

  const frame = () => {
    raf = 0;
    cx += (tx - cx) * ease;
    cy += (ty - cy) * ease;
    layers.forEach(({ el, depth }) => {
      el.style.translate = `${(-cx * depth).toFixed(2)}px ${(-cy * depth).toFixed(2)}px`;
    });
    // cursor spotlight: position relative to each [data-spot] element, exposed as --mx / --my
    spots.forEach((el) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${(px - r.left).toFixed(0)}px`);
      el.style.setProperty('--my', `${(py - r.top).toFixed(0)}px`);
    });
    if (Math.abs(tx - cx) > 0.002 || Math.abs(ty - cy) > 0.002) raf = requestAnimationFrame(frame);
  };
  const kick = () => {
    if (!raf) raf = requestAnimationFrame(frame);
  };
  const onMove = (e) => {
    px = e.clientX;
    py = e.clientY;
    tx = (e.clientX / window.innerWidth - 0.5) * 2;
    ty = (e.clientY / window.innerHeight - 0.5) * 2;
    kick();
  };
  const onLeave = () => {
    tx = 0;
    ty = 0;
    kick();
  };
  window.addEventListener('pointermove', onMove, { passive: true });
  document.addEventListener('pointerleave', onLeave);
  return () => {
    window.removeEventListener('pointermove', onMove);
    document.removeEventListener('pointerleave', onLeave);
    if (raf) cancelAnimationFrame(raf);
    layers.forEach(({ el }) => el.style.removeProperty('translate'));
    spots.forEach((el) => {
      el.style.removeProperty('--mx');
      el.style.removeProperty('--my');
    });
  };
}
