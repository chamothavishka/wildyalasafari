import { useEffect, useRef, useState } from 'react';
import { HERO_CHAPTERS, BRAND } from '../data/content.js';
import { FrameSequence, pickFrameSet } from '../lib/frameSequence.js';
import { gsap, ScrollTrigger, scrollToSection } from '../lib/gsap.js';
import { prefersReducedMotion, isMobileViewport, removeBootScreen, setBootProgress, isLowPower } from '../lib/env.js';
import Icon from './Icon.jsx';

const lerp = (a, b, t) => a + (b - a) * t;
const clamp01 = (v) => Math.min(1, Math.max(0, v));

/** Floating light motes drifting through the scene. */
function startDust(canvas, count) {
  const ctx = canvas.getContext('2d');
  let w = 0;
  let h = 0;
  let raf = 0;
  let running = false;
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  const motes = Array.from({ length: count }, () => ({
    x: Math.random(),
    y: Math.random(),
    r: 0.6 + Math.random() * 1.9,
    s: 0.00015 + Math.random() * 0.0005,
    drift: (Math.random() - 0.5) * 0.0003,
    a: 0.15 + Math.random() * 0.55,
    tw: Math.random() * Math.PI * 2,
  }));
  const resize = () => {
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  const tick = (time) => {
    ctx.clearRect(0, 0, w, h);
    motes.forEach((m) => {
      m.y -= m.s;
      m.x += m.drift + Math.sin(time * 0.0004 + m.tw) * 0.00012;
      if (m.y < -0.05) {
        m.y = 1.05;
        m.x = Math.random();
      }
      const alpha = m.a * (0.6 + 0.4 * Math.sin(time * 0.002 + m.tw));
      ctx.beginPath();
      ctx.fillStyle = `rgba(255, 196, 120, ${alpha})`;
      ctx.shadowColor = 'rgba(255, 170, 80, 0.8)';
      ctx.shadowBlur = m.r * 4;
      ctx.arc(m.x * w, m.y * h, m.r, 0, Math.PI * 2);
      ctx.fill();
    });
    raf = requestAnimationFrame(tick);
  };
  resize();
  window.addEventListener('resize', resize);
  return {
    play() {
      if (!running) {
        running = true;
        raf = requestAnimationFrame(tick);
      }
    },
    pause() {
      running = false;
      cancelAnimationFrame(raf);
    },
    destroy() {
      this.pause();
      window.removeEventListener('resize', resize);
    },
  };
}

export default function Hero() {
  const sectionRef = useRef(null);
  const frameRef = useRef(null);
  const canvasRef = useRef(null);
  const dustRef = useRef(null);
  const chaptersRef = useRef([]);
  const [activeChapter, setActiveChapter] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const reduced = prefersReducedMotion();
    const mobile = isMobileViewport();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { alpha: false });
    const seq = new FrameSequence(pickFrameSet(), { concurrency: mobile ? 4 : 6 });
    const last = seq.count - 1;

    const view = { w: 0, h: 0 };
    const state = {
      target: 0, // scroll progress 0..1
      current: 0, // smoothed frame position
      mouseX: 0,
      mouseY: 0,
      mx: 0,
      my: 0,
      pan: 0,
      panTarget: 0,
      idle: true,
      idleStart: performance.now(),
      visible: true,
    };

    const dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 1.75);
    const resize = () => {
      view.w = canvas.clientWidth;
      view.h = canvas.clientHeight;
      canvas.width = Math.round(view.w * dpr);
      canvas.height = Math.round(view.h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingQuality = 'high';
      render(true);
    };

    let raf = 0;
    let lastIdleFrame = -1;
    const IDLE_LOOP = Math.min(10, last); // frames used for the "alive" idle loop

    function render(force = false) {
      const p = state.target;
      // Idle "breathing" loop while resting at the very top.
      let framePos;
      const now = performance.now();
      if (!reduced && p < 0.004) {
        const period = 3600;
        const tt = ((now - state.idleStart) % period) / period; // 0..1
        // forward walk then soft dissolve back to the start
        framePos = tt < 0.82 ? (tt / 0.82) * IDLE_LOOP : IDLE_LOOP * (1 - (tt - 0.82) / 0.18);
        state.current = lerp(state.current, framePos, 0.25);
      } else {
        framePos = p * last;
        state.current = lerp(state.current, framePos, reduced ? 1 : 0.14);
      }
      state.mx = lerp(state.mx, state.mouseX, 0.06);
      state.my = lerp(state.my, state.mouseY, 0.06);
      state.pan = lerp(state.pan, state.panTarget, 0.05);

      const breathe = reduced ? 0 : Math.sin(now * 0.0005) * 0.008;
      const zoom = 1.06 + p * 0.1 + breathe;
      const settled =
        Math.abs(state.current - framePos) < 0.01 &&
        Math.abs(state.mx - state.mouseX) < 0.001 &&
        Math.abs(state.pan - state.panTarget) < 0.5;

      ctx.fillStyle = '#0c0906';
      ctx.fillRect(0, 0, view.w, view.h);
      seq.draw(ctx, state.current, {
        w: view.w,
        h: view.h,
        zoom,
        panX: state.pan * view.w - state.mx * 18,
        panY: -state.my * 12,
      });

      const keepGoing = state.visible && (!settled || p < 0.004 || force);
      if (keepGoing && !reduced) {
        raf = requestAnimationFrame(() => render());
      } else {
        raf = 0;
      }
      lastIdleFrame = framePos;
    }
    const kick = () => {
      if (!raf && state.visible) raf = requestAnimationFrame(() => render());
    };

    // Loading + boot screen
    const offProgress = seq.onProgress((ratio, idx) => {
      setBootProgress(Math.min(1, seq.loadedCount / Math.min(16, seq.count)));
      if (idx === 0) kick();
      if (seq.loadedCount >= Math.min(16, seq.count) && !state.bootDone) {
        state.bootDone = true;
        finishBoot();
      }
      if (ratio > 0.9) kick();
    });
    const bootTimeout = setTimeout(() => {
      if (!state.bootDone) {
        state.bootDone = true;
        finishBoot();
      }
    }, 4500);

    function finishBoot() {
      removeBootScreen();
      setReady(true);
      kick();
      if (!reduced) {
        gsap.fromTo(frameRef.current, { scale: 1.08 }, { scale: 1, duration: 2.2, ease: 'expo.out' });
        gsap.fromTo(frameRef.current.querySelector('.hero__fade'), { opacity: 1 }, { opacity: 0, duration: 1.8, ease: 'power2.out' });
        const intro = chaptersRef.current[0];
        if (intro) {
          gsap.fromTo(
            intro.querySelectorAll('.hero-ch__line'),
            { yPercent: 120, opacity: 0 },
            { yPercent: 0, opacity: 1, duration: 1.4, stagger: 0.12, ease: 'expo.out', delay: 0.35 }
          );
        }
        gsap.fromTo('.hero__chrome', { opacity: 0 }, { opacity: 1, duration: 1.2, delay: 1, stagger: 0.1 });
      }
    }

    seq.load();
    resize();
    window.addEventListener('resize', resize);

    // Mouse parallax (desktop only)
    const onMove = (e) => {
      state.mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      state.mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
      kick();
    };
    if (!mobile && !reduced) window.addEventListener('pointermove', onMove, { passive: true });

    // Dust motes
    const dust = !reduced ? startDust(dustRef.current, mobile || isLowPower() ? 22 : 55) : null;

    // Pause everything off-screen
    const io = new IntersectionObserver(([entry]) => {
      state.visible = entry.isIntersecting;
      if (entry.isIntersecting) {
        kick();
        dust && dust.play();
      } else {
        dust && dust.pause();
      }
    });
    io.observe(sectionRef.current);

    // Scroll-driven story
    const gctx = gsap.context(() => {
      const chapters = chaptersRef.current;
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: 'top top',
        end: 'bottom bottom',
        scrub: true,
        onUpdate: (self) => {
          state.target = self.progress;
          const idx = HERO_CHAPTERS.findIndex((c) => self.progress >= c.start && self.progress < c.end);
          const ch = HERO_CHAPTERS[Math.max(0, idx)];
          state.panTarget = ch.align === 'left' ? 0.035 : ch.align === 'right' ? -0.035 : 0;
          setActiveChapter(Math.max(0, idx));
          kick();
        },
      });

      if (reduced) return;
      // Chapter text in/out, scrubbed against the section scroll.
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: sectionRef.current, start: 'top top', end: 'bottom bottom', scrub: 0.6 },
      });
      HERO_CHAPTERS.forEach((c, i) => {
        const el = chapters[i];
        if (!el) return;
        const span = c.end - c.start;
        if (i > 0) {
          tl.fromTo(el, { autoAlpha: 0, y: 60 }, { autoAlpha: 1, y: 0, duration: span * 0.25 }, c.start + span * 0.05);
        }
        if (i < HERO_CHAPTERS.length - 1) {
          tl.to(el, { autoAlpha: 0, y: -60, duration: span * 0.22 }, c.start + span * 0.72);
        }
      });
      // Cinematic exit: frame recedes into the page as About approaches.
      tl.to(frameRef.current, { scale: 0.94, borderRadius: 48, duration: 0.08 }, 0.92);
      tl.to('.hero__scroll', { autoAlpha: 0, duration: 0.03 }, 0.01);
      tl.set({}, {}, 1);
    }, sectionRef);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(bootTimeout);
      offProgress();
      seq.abort();
      io.disconnect();
      dust && dust.destroy();
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onMove);
      gctx.revert();
    };
  }, []);

  const jumpToChapter = (i) => {
    const sec = sectionRef.current;
    const total = sec.offsetHeight - window.innerHeight;
    const c = HERO_CHAPTERS[i];
    const y = sec.offsetTop + total * (c.start + (c.end - c.start) * (i === 0 ? 0 : 0.4));
    gsap.to(window, { scrollTo: y, duration: prefersReducedMotion() ? 0 : 1.6, ease: 'power2.inOut' });
  };

  return (
    <section id="home" ref={sectionRef} className={`hero ${ready ? 'is-ready' : ''}`} aria-label="Wild Yala Safari — introduction">
      <div className="hero__sticky">
        <div className="hero__frame" ref={frameRef}>
          <canvas ref={canvasRef} className="hero__canvas" role="img" aria-label="A Sri Lankan leopard moving through the forests of Yala National Park" />
          <div className="hero__grade" aria-hidden="true" />
          <div className="hero__mist" aria-hidden="true" />
          <canvas ref={dustRef} className="hero__dust" aria-hidden="true" />
          <div className="hero__letterbox" aria-hidden="true" />
          <div className="hero__fade" aria-hidden="true" />

          {HERO_CHAPTERS.map((c, i) => (
            <div key={c.id} ref={(el) => (chaptersRef.current[i] = el)} className={`hero-ch hero-ch--${c.align} ${i === 0 ? 'hero-ch--intro' : ''}`} aria-hidden={activeChapter !== i}>
              {i === 0 ? (
                <>
                  <div className="hero-ch__top">
                    <p className="hero-ch__eyebrow">
                      <span className="hero-ch__line">{c.eyebrow}</span>
                    </p>
                    <p className="hero-ch__kicker">
                      <span className="hero-ch__line">
                        {c.kicker.split('Wild Heart').flatMap((part, k) => (k === 0 ? [part] : [<em key={k}>Wild Heart</em>, part]))}
                      </span>
                    </p>
                  </div>
                  <h1 className="hero-ch__brand">
                    <span className="hero-ch__mask">
                      <span className="hero-ch__line hero-ch__brand-accent">Wild Yala Safari</span>
                    </span>
                  </h1>
                  <div className="hero-ch__bottom">
                    <p className="hero-ch__body">
                      <span className="hero-ch__line">{c.body}</span>
                    </p>
                    <div className="hero-ch__actions">
                      <span className="hero-ch__line">
                        <a className="btn btn--primary" href="#packages" onClick={(e) => { e.preventDefault(); scrollToSection('packages'); }}>
                          <span className="btn__label">Explore Safari Packages</span>
                          <Icon name="arrowRight" size={18} className="btn__icon" />
                        </a>
                        <a className="btn btn--ghost" href="#about" onClick={(e) => { e.preventDefault(); scrollToSection('about'); }}>
                          <span className="btn__label">Discover Yala</span>
                        </a>
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <p className="hero-ch__eyebrow">{c.eyebrow}</p>
                  <h2 className="hero-ch__title">
                    {c.title} <em>{c.accent}</em>
                  </h2>
                  <p className="hero-ch__body">{c.body}</p>
                  {c.cta ? (
                    <div className="hero-ch__actions">
                      <a className="btn btn--primary" href="#packages" onClick={(e) => { e.preventDefault(); scrollToSection('packages'); }}>
                        <span className="btn__label">Choose Your Safari</span>
                        <Icon name="arrowRight" size={18} className="btn__icon" />
                      </a>
                      <a className="btn btn--ghost" href="#about" onClick={(e) => { e.preventDefault(); scrollToSection('about'); }}>
                        <span className="btn__label">About Us</span>
                      </a>
                    </div>
                  ) : null}
                </>
              )}
            </div>
          ))}

          <ol className="hero__rail hero__chrome" aria-label="Story chapters">
            {HERO_CHAPTERS.map((c, i) => (
              <li key={c.id}>
                <button type="button" className={activeChapter === i ? 'is-active' : ''} onClick={() => jumpToChapter(i)} aria-label={`Go to chapter ${i + 1}`}>
                  0{i + 1}
                </button>
              </li>
            ))}
          </ol>

          <div className="hero__coords hero__chrome" aria-hidden="true">
            {BRAND.coords}
          </div>

          <div className="hero__scroll hero__chrome" aria-hidden="true">
            <span>Scroll to explore</span>
            <i />
          </div>
        </div>
      </div>
    </section>
  );
}
