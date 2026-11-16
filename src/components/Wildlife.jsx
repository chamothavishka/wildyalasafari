import { useEffect, useRef } from 'react';
import { WILDLIFE } from '../data/content.js';
import { gsap } from '../lib/gsap.js';
import { prefersReducedMotion } from '../lib/env.js';
import Icon from './Icon.jsx';
import { Heading } from './ui.jsx';
import WildEncounters from './WildEncounters.jsx';

const TYPE_ICON = { Mammal: 'paw', Bird: 'feather', Reptile: 'scale' };

function AnimalCard({ animal, index, hidden }) {
  return (
    <li className="animal" aria-hidden={hidden || undefined}>
      <div className="animal__inner">
        <span className="animal__num">{String(index + 1).padStart(2, '0')}</span>
        <div className={`animal__visual ${animal.fit === 'contain' ? 'is-contain' : ''}`} style={animal.fit === 'contain' ? { '--photo': `url(${animal.image})` } : undefined}>
          {animal.image ? (
            <img src={animal.image} alt={hidden ? '' : animal.name} loading="lazy" decoding="async" width="640" height="800" style={{ objectPosition: animal.focus || '50% 30%' }} />
          ) : (
            <span className="animal__mark" aria-hidden="true">
              <Icon name={TYPE_ICON[animal.type]} size={88} strokeWidth={1.1} />
            </span>
          )}
        </div>
        <div className="animal__body">
          <span className="chip chip--sm">
            <Icon name={TYPE_ICON[animal.type]} size={13} /> {animal.type}
          </span>
          <h3>{animal.name}</h3>
          <p>{animal.text}</p>
        </div>
      </div>
    </li>
  );
}

/** Continuous right-to-left wildlife carousel with drag, hover-pause and arrow nudges. */
export default function Wildlife() {
  const viewportRef = useRef(null);
  const trackRef = useRef(null);
  const ctrl = useRef({ nudge: () => {} });

  useEffect(() => {
    const track = trackRef.current;
    const viewport = viewportRef.current;
    const reduced = prefersReducedMotion();
    let x = 0;
    let half = track.scrollWidth / 2;
    let speed = reduced ? 0 : 0.068; // px per ms (slightly faster, still calm)
    let targetSpeed = speed;
    let dragging = false;
    let lastX = 0;
    let velocity = 0;
    let visible = false;
    const base = speed;

    const wrap = () => {
      if (x <= -half) x += half;
      if (x > 0) x -= half;
    };
    const tick = (time, delta) => {
      if (!visible) return;
      const dt = Math.min(delta, 48); // avoid jumps after tab switches or slow frames
      speed += (targetSpeed - speed) * 0.05;
      if (!dragging) {
        x -= speed * dt + velocity;
        velocity *= 0.92;
      }
      wrap();
      track.style.transform = `translate3d(${x}px,0,0)`;
    };
    gsap.ticker.add(tick);

    const onResize = () => {
      half = track.scrollWidth / 2;
    };
    window.addEventListener('resize', onResize);
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(viewport);

    const enter = () => (targetSpeed = 0);
    const leave = () => (targetSpeed = base);
    viewport.addEventListener('pointerenter', enter);
    viewport.addEventListener('pointerleave', leave);
    viewport.addEventListener('focusin', enter);
    viewport.addEventListener('focusout', leave);

    const down = (e) => {
      dragging = true;
      lastX = e.clientX;
      velocity = 0;
      viewport.setPointerCapture(e.pointerId);
      viewport.classList.add('is-dragging');
    };
    const move = (e) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      lastX = e.clientX;
      x += dx;
      velocity = -dx * 0.5;
      wrap();
    };
    const up = () => {
      dragging = false;
      viewport.classList.remove('is-dragging');
    };
    viewport.addEventListener('pointerdown', down);
    viewport.addEventListener('pointermove', move);
    viewport.addEventListener('pointerup', up);
    viewport.addEventListener('pointercancel', up);

    ctrl.current.nudge = (dir) => {
      const card = track.querySelector('.animal');
      const step = card ? card.offsetWidth + 24 : 320;
      const obj = { v: x };
      gsap.to(obj, {
        v: x - dir * step,
        duration: 0.8,
        ease: 'power3.out',
        onUpdate: () => {
          x = obj.v;
          wrap();
        },
      });
    };

    return () => {
      gsap.ticker.remove(tick);
      window.removeEventListener('resize', onResize);
      io.disconnect();
      viewport.removeEventListener('pointerenter', enter);
      viewport.removeEventListener('pointerleave', leave);
      viewport.removeEventListener('focusin', enter);
      viewport.removeEventListener('focusout', leave);
      viewport.removeEventListener('pointerdown', down);
      viewport.removeEventListener('pointermove', move);
      viewport.removeEventListener('pointerup', up);
      viewport.removeEventListener('pointercancel', up);
    };
  }, []);

  return (
    <div className="wildlife" aria-labelledby="wildlife-title">
      <div className="container wildlife__head">
        <Heading id="wildlife-title" as="h3" className="wildlife__title">
          Explore the <em>Wildlife</em> of Yala
        </Heading>
        <div className="wildlife__side" data-reveal="fade">
          <p>Yala’s forests, grasslands and lagoons shelter an extraordinary variety of wildlife. Here are some of the residents you may meet.</p>
          <div className="wildlife__arrows">
            <button type="button" className="icon-btn" aria-label="Previous animals" onClick={() => ctrl.current.nudge(-1)}>
              <Icon name="chevronLeft" size={20} />
            </button>
            <button type="button" className="icon-btn" aria-label="Next animals" onClick={() => ctrl.current.nudge(1)}>
              <Icon name="chevronRight" size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="wildlife__viewport" ref={viewportRef} role="region" aria-label="Wildlife of Yala carousel" tabIndex={0}>
        <ul className="wildlife__track" ref={trackRef}>
          {WILDLIFE.map((a, i) => (
            <AnimalCard key={a.name} animal={a} index={i} />
          ))}
          {WILDLIFE.map((a, i) => (
            <AnimalCard key={`${a.name}-dup`} animal={a} index={i} hidden />
          ))}
        </ul>
      </div>

      <div className="container">
        <WildEncounters />
      </div>
    </div>
  );
}
