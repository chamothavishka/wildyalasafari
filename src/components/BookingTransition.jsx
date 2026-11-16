import { forwardRef, useImperativeHandle, useRef } from 'react';
import { gsap } from '../lib/gsap.js';
import { prefersReducedMotion } from '../lib/env.js';

export const ARRIVE_KEY = 'wys.arrive';

/**
 * Full-screen cinematic overlay used when leaving for the Booking page.
 * The selected 3D jeep turns and drives towards the camera while the page
 * zooms through a motion-blur tunnel and fades into darkness.
 */
const BookingTransition = forwardRef(function BookingTransition(_, ref) {
  const rootRef = useRef(null);

  useImperativeHandle(ref, () => ({
    /** @param {() => Promise<void>} drive starts the 3D vehicle animation */
    async play(drive, originEl) {
      const root = rootRef.current;
      const main = document.querySelector('main');
      const html = document.documentElement;
      try {
        sessionStorage.setItem(ARRIVE_KEY, '1');
      } catch {
        /* optional */
      }
      html.classList.add('is-departing', 'scroll-locked');
      root.hidden = false;

      if (prefersReducedMotion()) {
        await gsap.to(root.querySelector('.btrans__veil'), { opacity: 1, duration: 0.35 });
        return;
      }

      // Zoom towards the vehicle viewer.
      if (originEl && main) {
        const r = originEl.getBoundingClientRect();
        const ox = r.left + r.width / 2;
        const oy = r.top + r.height / 2 + window.scrollY;
        main.style.transformOrigin = `${ox}px ${oy}px`;
        root.style.setProperty('--ox', `${(ox / window.innerWidth) * 100}%`);
        root.style.setProperty('--oy', `${((r.top + r.height / 2) / window.innerHeight) * 100}%`);
      }

      const drivePromise = drive().catch(() => {});
      const tl = gsap.timeline();
      tl.to('.nav', { autoAlpha: 0, y: -30, duration: 0.5, ease: 'power2.in' }, 0)
        .to(root.querySelector('.btrans__vignette'), { opacity: 1, duration: 1.2, ease: 'power2.inOut' }, 0.1)
        .fromTo(root.querySelector('.btrans__streaks'), { opacity: 0, scale: 0.5 }, { opacity: 0.85, scale: 2.4, duration: 1.3, ease: 'power2.in' }, 0.8)
        .to(main, { scale: 1.14, filter: 'blur(9px) brightness(0.75)', duration: 1.25, ease: 'power3.in' }, 0.85)
        .fromTo(root.querySelector('.btrans__flash'), { opacity: 0 }, { opacity: 0.9, duration: 0.25, ease: 'power2.in' }, 1.7)
        .to(root.querySelector('.btrans__veil'), { opacity: 1, duration: 0.45, ease: 'power2.inOut' }, 1.75)
        .to(root.querySelector('.btrans__flash'), { opacity: 0, duration: 0.5 }, 1.95)
        .fromTo(root.querySelector('.btrans__brand'), { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }, 2.0);
      await Promise.all([tl.then(), drivePromise]);
    },
  }));

  return (
    <div ref={rootRef} className="btrans" hidden aria-live="polite">
      <div className="btrans__vignette" />
      <div className="btrans__streaks" />
      <div className="btrans__flash" />
      <div className="btrans__veil" />
      <div className="btrans__brand">
        <img src="./brand/logo-480.webp" alt="" width="96" height="83" />
        <p>Preparing your booking…</p>
      </div>
    </div>
  );
});

export default BookingTransition;

/** Arrival half of the transition, played on the Booking page. */
export function playArrival() {
  let arriving = false;
  try {
    arriving = sessionStorage.getItem(ARRIVE_KEY) === '1';
    sessionStorage.removeItem(ARRIVE_KEY);
  } catch {
    /* optional */
  }
  const el = document.querySelector('.arrive');
  if (!el) return;
  if (!arriving || prefersReducedMotion()) {
    el.remove();
    return;
  }
  el.classList.add('is-on');
  gsap
    .timeline({ onComplete: () => el.remove() })
    .fromTo(el.querySelector('.arrive__streaks'), { opacity: 0.8, scale: 2.4 }, { opacity: 0, scale: 0.8, duration: 1.3, ease: 'power3.out' }, 0)
    .to(el.querySelector('.arrive__veil'), { opacity: 0, duration: 1.1, ease: 'power2.out' }, 0.1)
    .fromTo('.booking-main', { scale: 1.08, filter: 'blur(8px)' }, { scale: 1, filter: 'blur(0px)', duration: 1.4, ease: 'expo.out', clearProps: 'transform,filter' }, 0);
}
