import { useCallback, useEffect, useRef, useState } from 'react';
import { GALLERY } from '../data/content.js';
import { FrameSequence, FRAME_SETS } from '../lib/frameSequence.js';
import { gsap, scrollToSection } from '../lib/gsap.js';
import { prefersReducedMotion, isCoarsePointer } from '../lib/env.js';
import { SectionTag, Heading, Modal, CloseButton } from './ui.jsx';
import Icon from './Icon.jsx';
import GuestMoments from './GuestMoments.jsx';

const LIGHTBOX_ITEMS = GALLERY.filter((g) => !g.cta).map((g) =>
  g.living ? { ...g, src: './media/chase.webp', thumb: './media/chase-sm.webp' } : g
);

/** A gallery tile that plays a short stretch of the leopard sequence. */
function LivingFrame({ from, to, playing }) {
  const canvasRef = useRef(null);
  const seqRef = useRef(null);
  const stateRef = useRef({ pos: 0, raf: 0, playing: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const seq = new FrameSequence(FRAME_SETS.desktop, { range: [from, to], concurrency: 3 });
    seqRef.current = seq;
    const size = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    };
    const draw = () => seq.draw(ctx, stateRef.current.pos, { w: canvas.clientWidth, h: canvas.clientHeight, zoom: 1.04 });
    stateRef.current.draw = draw;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        seq.load();
        io.disconnect();
      }
    }, { rootMargin: '300px' });
    io.observe(canvas);
    const off = seq.onProgress((r, idx) => idx === 0 && draw());
    window.addEventListener('resize', size);
    size();
    return () => {
      off();
      seq.abort();
      io.disconnect();
      window.removeEventListener('resize', size);
      cancelAnimationFrame(stateRef.current.raf);
    };
  }, [from, to]);

  useEffect(() => {
    const st = stateRef.current;
    const seq = seqRef.current;
    if (!seq) return undefined;
    let last = performance.now();
    cancelAnimationFrame(st.raf);
    if (!playing || prefersReducedMotion()) return undefined;
    const loop = (now) => {
      const dt = now - last;
      last = now;
      st.pos = (st.pos + dt * 0.012) % (seq.count - 1);
      st.draw && st.draw();
      st.raf = requestAnimationFrame(loop);
    };
    st.raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(st.raf);
  }, [playing]);

  return <canvas ref={canvasRef} className="living__canvas" aria-hidden="true" />;
}

function Tile({ item, index, onOpen }) {
  const ref = useRef(null);
  const [playing, setPlaying] = useState(false);

  // touch devices: play living frames while visible
  useEffect(() => {
    if (!item.living || !isCoarsePointer()) return undefined;
    const io = new IntersectionObserver(([e]) => setPlaying(e.isIntersecting), { threshold: 0.5 });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [item.living]);

  const onMove = (e) => {
    if (prefersReducedMotion() || isCoarsePointer()) return;
    const r = ref.current.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    ref.current.style.setProperty('--rx', `${(-y * 6).toFixed(2)}deg`);
    ref.current.style.setProperty('--ry', `${(x * 8).toFixed(2)}deg`);
    ref.current.style.setProperty('--mx', `${(x + 0.5) * 100}%`);
    ref.current.style.setProperty('--my', `${(y + 0.5) * 100}%`);
  };
  const onLeave = () => {
    ref.current.style.setProperty('--rx', '0deg');
    ref.current.style.setProperty('--ry', '0deg');
    if (item.living && !isCoarsePointer()) setPlaying(false);
  };

  if (item.cta) {
    return (
      <div className={`tile tile--${item.size} tile--cta`} data-reveal="up">
        <div className="tile__cta-glow" aria-hidden="true" />
        <p className="eyebrow">Your Turn</p>
        <p className="tile__cta-text">Create your own moments in the wild heart of Yala.</p>
        <a className="btn btn--primary" href="#packages" onClick={(e) => { e.preventDefault(); scrollToSection('packages'); }}>
          <span className="btn__label">Plan My Safari</span>
          <Icon name="arrowUpRight" size={18} className="btn__icon" />
        </a>
      </div>
    );
  }

  const lbIndex = LIGHTBOX_ITEMS.findIndex((l) => l.title === item.title);
  return (
    <button
      type="button"
      ref={ref}
      className={`tile tile--${item.size} ${item.living ? 'tile--living' : ''}`}
      onPointerMove={onMove}
      onPointerEnter={() => item.living && !isCoarsePointer() && setPlaying(true)}
      onPointerLeave={onLeave}
      onClick={() => onOpen(lbIndex)}
      aria-label={`Open ${item.title} in full screen`}
      data-reveal="up"
      data-delay={(index % 3) * 0.06}
    >
      <span className="tile__media" data-parallax>
        {item.living ? (
          <LivingFrame from={item.from} to={item.to} playing={playing} />
        ) : (
          <img src={item.thumb} srcSet={`${item.thumb} 640w, ${item.src} 1280w`} sizes="(max-width: 767px) 100vw, 50vw" alt={item.caption} loading="lazy" decoding="async" width="1280" height="720" style={item.pos ? { objectPosition: item.pos } : undefined} />
        )}
      </span>
      <span className="tile__shade" aria-hidden="true" />
      <span className="tile__sheen" aria-hidden="true" />
      {item.living ? (
        <span className="chip chip--live">
          <Icon name="play" size={12} /> Living Frame
        </span>
      ) : null}
      <span className="tile__caption">
        <span className="tile__num">{String(index + 1).padStart(2, '0')}</span>
        <span className="tile__title">{item.title}</span>
        <span className="tile__sub">{item.caption}</span>
      </span>
      <span className="tile__expand" aria-hidden="true">
        <Icon name="expand" size={16} />
      </span>
    </button>
  );
}

function Lightbox({ index, onClose, onNav }) {
  const item = index >= 0 ? LIGHTBOX_ITEMS[index] : null;
  const imgRef = useRef(null);
  const touch = useRef(null);

  useEffect(() => {
    if (index < 0) return undefined;
    const onKey = (e) => {
      if (e.key === 'ArrowRight') onNav(1);
      if (e.key === 'ArrowLeft') onNav(-1);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [index, onNav]);

  useEffect(() => {
    if (!imgRef.current || prefersReducedMotion()) return;
    gsap.fromTo(imgRef.current, { opacity: 0, scale: 1.04 }, { opacity: 1, scale: 1, duration: 0.7, ease: 'power3.out' });
  }, [index]);

  return (
    <Modal open={index >= 0} onClose={onClose} labelledBy="lb-title" variant="full" className="lightbox">
      {item ? (
        <div
          className="lightbox__inner"
          onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
          onTouchEnd={(e) => {
            if (touch.current == null) return;
            const dx = e.changedTouches[0].clientX - touch.current;
            if (Math.abs(dx) > 50) onNav(dx < 0 ? 1 : -1);
            touch.current = null;
          }}
        >
          <div className="lightbox__top">
            <span className="lightbox__count">
              {String(index + 1).padStart(2, '0')} / {String(LIGHTBOX_ITEMS.length).padStart(2, '0')}
            </span>
            <CloseButton onClick={onClose} />
          </div>
          <figure className="lightbox__figure">
            <img ref={imgRef} key={item.src} src={item.src} alt={item.caption} width="1280" height="720" style={{ objectFit: 'contain' }} />
            <figcaption>
              <h3 id="lb-title">{item.title}</h3>
              <p>{item.caption}</p>
            </figcaption>
          </figure>
          <button type="button" className="icon-btn lightbox__nav lightbox__nav--prev" onClick={() => onNav(-1)} aria-label="Previous image">
            <Icon name="chevronLeft" size={22} />
          </button>
          <button type="button" className="icon-btn lightbox__nav lightbox__nav--next" onClick={() => onNav(1)} aria-label="Next image">
            <Icon name="chevronRight" size={22} />
          </button>
          <div className="lightbox__thumbs">
            {LIGHTBOX_ITEMS.map((l, i) => (
              <button key={l.title} type="button" className={i === index ? 'is-active' : ''} onClick={() => onNav(i - index)} aria-label={`Show ${l.title}`}>
                <img src={l.thumb} alt="" loading="lazy" width="96" height="54" />
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </Modal>
  );
}

export default function Gallery() {
  const [lb, setLb] = useState(-1);
  const sectionRef = useRef(null);
  const nav = useCallback((d) => setLb((i) => (i + d + LIGHTBOX_ITEMS.length) % LIGHTBOX_ITEMS.length), []);

  // Inner-image parallax
  useEffect(() => {
    if (prefersReducedMotion()) return undefined;
    const ctx = gsap.context(() => {
      sectionRef.current.querySelectorAll('[data-parallax]').forEach((el) => {
        gsap.fromTo(el, { yPercent: -6 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section id="gallery" className="section gallery" ref={sectionRef} aria-labelledby="gallery-title">
      <div className="container">
        <SectionTag>Gallery</SectionTag>
        <div className="gallery__head">
          <div>
            <Heading id="gallery-title">
              Moments from the <em>Wild</em>
            </Heading>
            <p className="lede" data-reveal="up">
              Frames from the life of a Yala leopard — the approach, the chase, the roar and the quiet gaze.
            </p>
          </div>
          <button type="button" className="btn btn--ghost" onClick={() => setLb(0)} data-reveal="fade">
            <span className="btn__label">View Full Screen</span>
            <Icon name="expand" size={18} className="btn__icon" />
          </button>
        </div>

        <div className="bento">
          {GALLERY.map((item, i) => (
            <Tile key={item.title || `cta-${i}`} item={item} index={i} onOpen={setLb} />
          ))}
        </div>

        <GuestMoments />
      </div>
      <Lightbox index={lb} onClose={() => setLb(-1)} onNav={nav} />
    </section>
  );
}
