import { useEffect, useRef, useState } from 'react';
import { prefersReducedMotion } from '../lib/env.js';

const easeOutExpo = (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));

/**
 * Counts from 0 up to `value` the first time it scrolls into view: it races up quickly,
 * then settles on the final number. Reduced-motion users get the final number straight away.
 */
export default function CountUp({ value, suffix = '', duration = 2200 }) {
  const ref = useRef(null);
  const [n, setN] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (prefersReducedMotion() || typeof IntersectionObserver === 'undefined') {
      setN(value);
      return undefined;
    }
    let raf = 0;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        const start = performance.now();
        const tick = (now) => {
          const t = Math.min(1, (now - start) / duration);
          setN(Math.round(value * easeOutExpo(t)));
          if (t < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value, duration]);

  return (
    <span ref={ref}>
      <span className="sr-only">{value.toLocaleString('en-US').replace(/,/g, '')}{suffix}</span>
      <span aria-hidden="true">
        {n}
        {suffix}
      </span>
    </span>
  );
}
