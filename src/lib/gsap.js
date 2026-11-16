import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { SplitText } from 'gsap/SplitText';
import { prefersReducedMotion } from './env.js';

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin, SplitText);
gsap.defaults({ ease: 'power3.out', duration: 0.9 });

export { gsap, ScrollTrigger, SplitText };

const NAV_OFFSET = 88;

/** Smoothly scroll to a section id. */
export function scrollToSection(id, { offset = NAV_OFFSET } = {}) {
  const el = id === 'home' ? document.body : document.getElementById(id);
  if (!el) return;
  if (window.__smoothScrollStop) window.__smoothScrollStop();
  const reduced = prefersReducedMotion();
  gsap.to(window, {
    duration: reduced ? 0 : 1.25,
    ease: 'power3.inOut',
    scrollTo: id === 'home' ? 0 : { y: el, offsetY: id === 'packages' ? offset - 20 : offset },
    overwrite: 'auto',
  });
  if (history.replaceState) history.replaceState(null, '', id === 'home' ? ' ' : `#${id}`);
}

const VARIANTS = {
  up: { y: 48, opacity: 0 },
  fade: { opacity: 0 },
  left: { x: -60, opacity: 0 },
  right: { x: 60, opacity: 0 },
  scale: { scale: 0.92, opacity: 0, y: 30 },
  tilt: { rotateX: 14, y: 60, opacity: 0, transformPerspective: 900, transformOrigin: '50% 100%' },
};

/**
 * Scroll-triggered reveal system. Elements opt in with data-reveal="up|fade|left|right|scale|tilt",
 * optional data-delay. Headings with data-split get a line-by-line masked reveal.
 * Returns a cleanup function.
 */
export function initReveals(root = document) {
  const ctx = gsap.context(() => {
    if (prefersReducedMotion()) {
      gsap.set(root.querySelectorAll('[data-reveal]'), { clearProps: 'all', opacity: 1 });
      return;
    }

    root.querySelectorAll('[data-split]').forEach((el) => {
      const split = SplitText.create(el, { type: 'lines', mask: 'lines', linesClass: 'split-line' });
      gsap.from(split.lines, {
        yPercent: 110,
        duration: 1.1,
        stagger: 0.09,
        ease: 'expo.out',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true },
      });
    });

    Object.entries(VARIANTS).forEach(([name, from]) => {
      const els = root.querySelectorAll(`[data-reveal="${name}"]`);
      if (!els.length) return;
      gsap.set(els, from);
      ScrollTrigger.batch(els, {
        start: 'top 90%',
        once: true,
        onEnter: (batch) =>
          gsap.to(batch, {
            x: 0,
            y: 0,
            rotateX: 0,
            scale: 1,
            opacity: 1,
            duration: 1.05,
            ease: 'power3.out',
            stagger: 0.08,
            delay: parseFloat(batch[0].dataset.delay || 0),
            overwrite: true,
          }),
      });
    });
  }, root);
  return () => ctx.revert();
}
