import { StrictMode, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/index.css';
import { flagLowPower } from './lib/env.js';

flagLowPower();
import Navbar from './components/Navbar.jsx';
import Hero from './components/Hero.jsx';
import About from './components/About.jsx';
import SafariPackages from './components/SafariPackages.jsx';
import Gallery from './components/Gallery.jsx';
import Reviews from './components/Reviews.jsx';
import Contact from './components/Contact.jsx';
import Footer from './components/Footer.jsx';
import BookingTransition from './components/BookingTransition.jsx';
import { initReveals, gsap, ScrollTrigger, scrollToSection } from './lib/gsap.js';
import { initSmoothScroll } from './lib/smoothScroll.js';
import { prefersReducedMotion } from './lib/env.js';

function HomeApp() {
  const transitionRef = useRef(null);

  useEffect(() => {
    const cleanReveals = initReveals(document);
    const cleanSmooth = initSmoothScroll();

    // Gentle parallax on full-bleed backgrounds.
    const ctx = gsap.context(() => {
      if (prefersReducedMotion()) return;
      document.querySelectorAll('[data-parallax-bg]').forEach((el) => {
        gsap.fromTo(el, { yPercent: -12 }, { yPercent: 12, ease: 'none', scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
      });
    });

    // Arriving from another page with a #section hash.
    const hash = window.location.hash.replace('#', '');
    let hashTimer;
    if (hash && document.getElementById(hash)) {
      hashTimer = setTimeout(() => scrollToSection(hash), 700);
    }

    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener('load', refresh);
    document.fonts && document.fonts.ready.then(refresh);

    // Returning via the back button after the booking transition: start fresh.
    const onShow = (e) => e.persisted && window.location.reload();
    window.addEventListener('pageshow', onShow);

    return () => {
      cleanReveals();
      cleanSmooth();
      ctx.revert();
      clearTimeout(hashTimer);
      window.removeEventListener('load', refresh);
      window.removeEventListener('pageshow', onShow);
    };
  }, []);

  // The cinematic transition never blocks navigation for more than 4.5 s.
  const onBookTransition = (drive, originEl) =>
    Promise.race([
      transitionRef.current ? transitionRef.current.play(drive, originEl) : Promise.resolve(),
      new Promise((r) => setTimeout(r, 4500)),
    ]);

  return (
    <>
      <Navbar mode="home" />
      <main id="main">
        <Hero />
        <About />
        <SafariPackages onBookTransition={onBookTransition} />
        <Gallery />
        <Reviews />
        <Contact />
      </main>
      <Footer mode="home" />
      <BookingTransition ref={transitionRef} />
    </>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HomeApp />
  </StrictMode>
);
