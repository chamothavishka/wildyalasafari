import { useEffect, useRef, useState } from 'react';
import { gsap, scrollToSection } from '../lib/gsap.js';
import { prefersReducedMotion } from '../lib/env.js';
import { MEDIA } from '../data/content.js';
import Icon from './Icon.jsx';
import { Button, Heading, SectionTag } from './ui.jsx';

const HIGHLIGHTS = [
  { icon: 'water', title: 'Herds at the water’s edge', text: 'Family groups gather at Yala’s lagoons and waterholes, especially in the dry season.' },
  { icon: 'paw', title: 'Leopards on the rocks', text: 'One of the highest leopard densities in the world, in the same wilderness.' },
  { icon: 'shield', title: 'Guided with care', text: 'Experienced local trackers keep the jeep at a safe, respectful distance.' },
];

const FADE_OUT = 1.1; // seconds before the end at which the film starts to fade away

/** "A World of Wild Encounters" — cinematic film card. The film fades in from the page, and dips to black at each loop. */
export default function WildEncounters() {
  const rootRef = useRef(null);
  const mediaRef = useRef(null);
  const videoRef = useRef(null);
  const [state, setState] = useState('idle'); // idle | playing | fading | still
  const reduced = prefersReducedMotion();

  useEffect(() => {
    const v = videoRef.current;
    if (!v || reduced) {
      setState('still');
      return undefined;
    }
    let visible = false;
    let restarting = false;

    const play = () => {
      const p = v.play();
      if (p && p.catch) p.catch(() => setState('still'));
    };
    const restart = () => {
      if (restarting) return;
      restarting = true;
      // hold on the dark frame for a beat, then start over and fade back in
      setTimeout(() => {
        v.currentTime = 0;
        restarting = false;
        if (visible) play();
      }, 650);
    };
    const onPlaying = () => setState('playing');
    const onTime = () => {
      if (v.duration && v.duration - v.currentTime < FADE_OUT) setState((s) => (s === 'playing' ? 'fading' : s));
    };
    const onEnded = restart;
    const onError = () => setState('still');
    v.addEventListener('playing', onPlaying);
    v.addEventListener('timeupdate', onTime);
    v.addEventListener('ended', onEnded);
    v.addEventListener('error', onError);

    const io = new IntersectionObserver(
      ([e]) => {
        visible = e.isIntersecting;
        if (visible) play();
        else v.pause();
      },
      { rootMargin: '200px 0px' },
    );
    io.observe(v);
    return () => {
      io.disconnect();
      v.removeEventListener('playing', onPlaying);
      v.removeEventListener('timeupdate', onTime);
      v.removeEventListener('ended', onEnded);
      v.removeEventListener('error', onError);
    };
  }, [reduced]);

  useEffect(() => {
    if (reduced) return undefined;
    const ctx = gsap.context(() => {
      // slow push-in on the film as the section passes through the viewport
      gsap.fromTo(
        mediaRef.current.querySelector('.wenc__film'),
        { scale: 1.12, yPercent: 3 },
        { scale: 1, yPercent: -3, ease: 'none', scrollTrigger: { trigger: rootRef.current, start: 'top bottom', end: 'bottom top', scrub: 0.8 } },
      );
    }, rootRef);
    return () => ctx.revert();
  }, [reduced]);

  return (
    <section ref={rootRef} className={`wenc is-${state}`} aria-labelledby="wenc-title" data-reveal="scale">
      <div className="wenc__media" ref={mediaRef}>
        <div className="wenc__film">
          <img className="wenc__poster" src={MEDIA.elephantPoster} alt="A herd of Asian elephants grazing beside a lagoon in Yala National Park" width="1600" height="900" decoding="async" />
          {reduced ? null : (
            <video ref={videoRef} className="wenc__video" muted playsInline preload="none" poster={MEDIA.elephantPoster} aria-hidden="true" tabIndex={-1}>
              {MEDIA.elephantVideo.map((s) => (
                <source key={s.src} src={s.src} type={s.type} />
              ))}
            </video>
          )}
        </div>
      </div>
      <div className="wenc__shade" aria-hidden="true" />

      <span className="wenc__pill">
        <i aria-hidden="true" /> Yala National Park
      </span>

      <div className="wenc__inner">
        <div className="wenc__copy">
          <SectionTag>Sri Lanka’s Wild Heart</SectionTag>
          <Heading id="wenc-title" as="h3" className="wenc__title">
            A World of <em>Wild</em> Encounters
          </Heading>
          <p className="wenc__lede" data-reveal="up">
            Stretching from the southeastern coast of Sri Lanka into dry monsoon forest, Yala National Park is a mosaic of scrubland, grassy plains, rocky outcrops and freshwater lagoons. It is one of the best places in the world to see leopards in the wild — and every drive brings the chance of a new encounter.
          </p>
          <div className="wenc__cta" data-reveal="up">
            <Button as="a" href="#packages" icon="arrowRight" onClick={(e) => { e.preventDefault(); scrollToSection('packages'); }}>
              Plan Your Safari
            </Button>
            <small>Sightings are never guaranteed — every drive is a real wildlife encounter.</small>
          </div>
        </div>

        <ol className="wenc__list">
          {HIGHLIGHTS.map((h, i) => (
            <li key={h.title} data-reveal="up" data-delay={0.07 * i}>
              <span className="wenc__icon" aria-hidden="true">
                <Icon name={h.icon} size={20} strokeWidth={1.5} />
              </span>
              <div>
                <span className="wenc__num">{String(i + 1).padStart(2, '0')}</span>
                <h4>{h.title}</h4>
                <p>{h.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
