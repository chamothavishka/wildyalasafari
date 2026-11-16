import { useEffect, useRef } from 'react';
import { prefersReducedMotion } from '../lib/env.js';

const COUNT = 135;
const FPS = 25;
const W = 560;
const H = 422; // 334 + 88 px of headroom for the guide hat
const src = (n) => `./media/guide-mascot/${String(n).padStart(3, '0')}.webp`;

/**
 * The welcoming mascot (a ranger-style gorilla guide in a hat and shirt with the Wild Yala Safari badge): a transparent-background frame sequence drawn on a canvas.
 * Loads frame 1 first, then the rest in the background; plays only while on screen;
 * reduced-motion users get the still first frame.
 */
export default function MascotCanvas({ label, speaking = false }) {
  const canvasRef = useRef(null);
  const speakRef = useRef(speaking);
  speakRef.current = speaking;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const reduced = prefersReducedMotion();
    const frames = new Array(COUNT);
    let loaded = 0;
    let raf = 0;
    let visible = false;
    let start = 0;
    let lastDrawn = -1;
    let dead = false;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const size = () => {
      canvas.width = Math.round(canvas.clientWidth * dpr) || W;
      canvas.height = Math.round(canvas.clientHeight * dpr) || H;
      lastDrawn = -1;
    };
    const draw = (i) => {
      const img = frames[i] || frames.find(Boolean);
      if (!img) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      lastDrawn = i;
    };

    const load = (n) =>
      new Promise((resolve) => {
        const img = new Image();
        img.decoding = 'async';
        img.onload = () => {
          frames[n - 1] = img;
          loaded += 1;
          resolve();
        };
        img.onerror = resolve;
        img.src = src(n);
      });

    const tick = (now) => {
      raf = 0;
      if (dead || !visible) return;
      if (!start) start = now;
      // while the bot is "thinking" the clip loops faster, otherwise it plays at its natural speed
      const rate = speakRef.current ? 1.25 : 1;
      const i = Math.floor(((now - start) / 1000) * FPS * rate) % COUNT;
      if (i !== lastDrawn && loaded > COUNT * 0.6) draw(i);
      raf = requestAnimationFrame(tick);
    };
    const kick = () => {
      if (!raf && visible && !reduced && loaded > 1) raf = requestAnimationFrame(tick);
    };

    size();
    window.addEventListener('resize', size);
    load(1).then(() => {
      if (dead) return;
      draw(0);
      // the rest, a few at a time, once the first frame is on screen
      (async () => {
        const queue = Array.from({ length: COUNT - 1 }, (_, k) => k + 2);
        const worker = async () => {
          while (queue.length && !dead) await load(queue.shift());
        };
        await Promise.all([worker(), worker(), worker(), worker()]);
        kick();
      })();
    });

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) {
        start = 0;
        kick();
      } else if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    });
    io.observe(canvas);

    return () => {
      dead = true;
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener('resize', size);
    };
  }, []);

  return <canvas ref={canvasRef} className="mascot__canvas" width={W} height={H} role="img" aria-label={label} />;
}
