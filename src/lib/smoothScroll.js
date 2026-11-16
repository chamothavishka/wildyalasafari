/**
 * Lightweight inertial smooth scrolling for mouse-wheel users (Lenis-style).
 * - Only active for fine pointers and when reduced motion is not requested.
 * - Keeps native scrolling for touch, keyboard, scrollbar dragging and trackpads'
 *   own momentum (it simply eases wheel deltas).
 * - Respects modals / menus that lock scrolling via `html.scroll-locked`,
 *   and nested scrollable elements (e.g. the currency list).
 */
import { ScrollTrigger } from './gsap.js';
import { prefersReducedMotion, isCoarsePointer } from './env.js';

export function initSmoothScroll() {
  if (prefersReducedMotion() || isCoarsePointer()) return () => {};

  let target = window.scrollY;
  let current = window.scrollY;
  let raf = 0;
  let active = false;
  const ease = 0.11;

  const maxScroll = () => document.documentElement.scrollHeight - window.innerHeight;

  const canScrollInside = (el, dy) => {
    while (el && el !== document.body && el !== document.documentElement) {
      const style = getComputedStyle(el);
      const scrollable = /(auto|scroll)/.test(style.overflowY) && el.scrollHeight > el.clientHeight + 1;
      if (scrollable) {
        if (dy < 0 && el.scrollTop > 0) return true;
        if (dy > 0 && el.scrollTop + el.clientHeight < el.scrollHeight - 1) return true;
      }
      el = el.parentElement;
    }
    return false;
  };

  const step = () => {
    current += (target - current) * ease;
    if (Math.abs(target - current) < 0.5) current = target;
    window.scrollTo(0, current);
    ScrollTrigger.update();
    if (current !== target) raf = requestAnimationFrame(step);
    else {
      active = false;
      raf = 0;
    }
  };

  const onWheel = (e) => {
    if (e.ctrlKey || document.documentElement.classList.contains('scroll-locked')) return;
    if (canScrollInside(e.target, e.deltaY)) return;
    e.preventDefault();
    if (!active) {
      current = window.scrollY;
      target = window.scrollY;
    }
    const delta = e.deltaMode === 1 ? e.deltaY * 32 : e.deltaMode === 2 ? e.deltaY * window.innerHeight : e.deltaY;
    target = Math.max(0, Math.min(maxScroll(), target + delta));
    active = true;
    if (!raf) raf = requestAnimationFrame(step);
  };

  // Any non-wheel scroll (keyboard, scrollbar, programmatic GSAP scrollTo) resyncs the target.
  const onScroll = () => {
    if (!active) {
      current = window.scrollY;
      target = window.scrollY;
    }
  };
  const stop = () => {
    cancelAnimationFrame(raf);
    raf = 0;
    active = false;
    current = target = window.scrollY;
  };

  window.addEventListener('wheel', onWheel, { passive: false });
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('keydown', stop);
  window.addEventListener('pointerdown', stop);
  window.__smoothScrollStop = stop;

  return () => {
    stop();
    window.removeEventListener('wheel', onWheel);
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('keydown', stop);
    window.removeEventListener('pointerdown', stop);
  };
}
