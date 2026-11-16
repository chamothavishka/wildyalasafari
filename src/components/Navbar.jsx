import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { NAV_LINKS } from '../data/content.js';
import { scrollToSection, gsap } from '../lib/gsap.js';
import Icon from './Icon.jsx';
import SocialLinks from './SocialLinks.jsx';
import { fetchMe, signOut } from '../lib/api.js';

/** Who is signed in: undefined while checking, null when nobody is. */
function useAccount() {
  const [user, setUser] = useState(undefined);
  useEffect(() => {
    let alive = true;
    fetchMe().then((u) => alive && setUser(u));
    return () => {
      alive = false;
    };
  }, []);
  const logout = async () => {
    try {
      await signOut();
    } catch {
      /* the cookie is cleared server-side; nothing else to do */
    }
    setUser(null);
  };
  return { user, logout };
}

const firstName = (u) => (u.name || u.email).trim().split(/[\s@]+/)[0];
const initial = (u) => (u.name || u.email).trim().charAt(0).toUpperCase();

/** Signed-in chip that replaces the Login link, with a small menu (e-mail + logout). */
function AccountMenu({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => {
      if (e.type === 'keydown' ? e.key === 'Escape' : !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', close);
    };
  }, [open]);
  return (
    <div className="acct" ref={ref}>
      <button type="button" className="nav__login acct__btn" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)} title={user.email}>
        <span className="acct__avatar" aria-hidden="true">
          {initial(user)}
        </span>
        <span className="acct__name">{firstName(user)}</span>
        <Icon name="chevronDown" size={14} />
      </button>
      {open ? (
        <div className="acct__menu glass" role="menu">
          <p className="acct__who">
            <strong>{user.name || 'My account'}</strong>
            <small>{user.email}</small>
          </p>
          <button type="button" role="menuitem" className="acct__item" onClick={onLogout}>
            <Icon name="arrowLeft" size={15} /> Logout
          </button>
        </div>
      ) : null}
    </div>
  );
}

/** Notch size per breakpoint — must match the hero frame inset and logo box in home.css. */
function notchDims() {
  const w = typeof window !== 'undefined' ? window.innerWidth : 1440;
  if (w <= 767) return { W: 92, H: 86, i: 6 };
  if (w <= 1040) return { W: 104, H: 96, i: 10 };
  return { W: 128, H: 118, i: 10 };
}

/**
 * The curved shape the logo sits in: one continuous path with a concave curve
 * where it meets the hero frame's top edge, a soft convex corner, and a concave
 * curve down into the frame's left edge.
 */
function LogoNotch() {
  const [d, setD] = useState(notchDims);
  useEffect(() => {
    const on = () => setD(notchDims());
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  const { W, H, i } = d;
  const R = 22; // inverse corners
  const C = 30; // main corner
  // Starts 40px outside the viewport corner so no sliver of the hero frame can show above/left of the shape at any zoom.
  const path = `M-40 -40H${W + R}V${i}A${R} ${R} 0 0 0 ${W} ${i + R}V${H - C}A${C} ${C} 0 0 1 ${W - C} ${H}H${i + R}A${R} ${R} 0 0 0 ${i} ${H + R}H-40Z`;
  return (
    <svg className="nav__notch" width={W + R} height={H + R} viewBox={`0 0 ${W + R} ${H + R}`} aria-hidden="true" focusable="false">
      <path d={path} />
    </svg>
  );
}

/**
 * Floating navigation. `mode="home"` uses in-page smooth scrolling with an active-section
 * indicator; on other pages links point back to the home page sections.
 */
export default function Navbar({ mode = 'home', onBook }) {
  const [active, setActive] = useState('home');
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useAccount();
  const linksRef = useRef(null);
  const pillRef = useRef(null);
  const menuRef = useRef(null);
  const barRef = useRef(null);

  // Short bar for the whole hero story (Home); the long bar takes over as the hero recedes and About arrives.
  // Different thresholds going down and up (hysteresis) stop it flickering at the boundary.
  useEffect(() => {
    const onScroll = () => {
      const about = mode === 'home' ? document.getElementById('about') : null;
      if (!about) {
        setScrolled((was) => (was ? window.scrollY > 14 : window.scrollY > 56));
        return;
      }
      const top = about.getBoundingClientRect().top;
      setScrolled((was) => (was ? top < window.innerHeight * 1.45 : top < window.innerHeight * 1.3));
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [mode]);

  // Active section tracking
  useEffect(() => {
    if (mode !== 'home') return undefined;
    const sections = NAV_LINKS.map((l) => document.getElementById(l.id)).filter(Boolean);
    const onScroll = () => {
      const mid = window.innerHeight * 0.38;
      let current = 'home';
      sections.forEach((s) => {
        const r = s.getBoundingClientRect();
        if (r.top <= mid) current = s.id;
      });
      setActive(current);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [mode]);

  // Sliding active pill
  useLayoutEffect(() => {
    const list = linksRef.current;
    const pill = pillRef.current;
    if (!list || !pill) return;
    const place = () => {
      const el = mode === 'home' ? list.querySelector(`[data-id="${active}"]`) : null;
      if (!el) {
        pill.style.opacity = '0';
        return;
      }
      pill.style.opacity = '1';
      pill.style.width = `${el.offsetWidth}px`;
      pill.style.transform = `translateX(${el.offsetLeft}px)`;
    };
    place();
    window.addEventListener('resize', place);
    document.fonts && document.fonts.ready.then(place);
    return () => window.removeEventListener('resize', place);
  }, [active, mode]);

  // The short (top-of-page) bar is the plate clipped down to the menu pill + button (or just the burger on phones).
  useLayoutEffect(() => {
    const bar = barRef.current;
    if (!bar) return undefined;
    const measure = () => {
      const links = linksRef.current && linksRef.current.closest('.nav__links');
      const first = links && links.offsetParent ? links : bar.querySelector('.nav__burger');
      if (!first) return;
      const gap = first.getBoundingClientRect().left - bar.getBoundingClientRect().left - 10;
      bar.style.setProperty('--short-left', `${Math.max(0, Math.round(gap))}px`);
    };
    measure();
    window.addEventListener('resize', measure);
    document.fonts && document.fonts.ready.then(measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  // Mobile menu animation
  useEffect(() => {
    const menu = menuRef.current;
    if (!menu) return;
    document.documentElement.classList.toggle('scroll-locked', menuOpen);
    if (menuOpen) {
      gsap.fromTo(
        menu.querySelectorAll('.mmenu__item'),
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.06, duration: 0.7, delay: 0.25, ease: 'expo.out' }
      );
      const onKey = (e) => e.key === 'Escape' && setMenuOpen(false);
      document.addEventListener('keydown', onKey);
      return () => document.removeEventListener('keydown', onKey);
    }
    return undefined;
  }, [menuOpen]);

  const go = (e, id) => {
    if (mode !== 'home') return; // normal navigation to ./index.html#id
    e.preventDefault();
    setMenuOpen(false);
    setTimeout(() => scrollToSection(id), menuOpen ? 350 : 0);
  };

  const href = (id) => (mode === 'home' ? `#${id === 'home' ? '' : id}` : `./index.html${id === 'home' ? '' : `#${id}`}`);

  const book = (e) => {
    setMenuOpen(false);
    if (onBook) {
      e.preventDefault();
      onBook();
    } else if (mode === 'home') {
      e.preventDefault();
      scrollToSection('packages');
    }
  };

  return (
    <>
      <a className="skip-link" href={mode === 'home' ? '#about' : '#main'}>
        Skip to content
      </a>
      <header className={`nav ${scrolled ? 'nav--scrolled' : ''} ${mode !== 'home' ? 'nav--page' : ''}`}>
        <div className="nav__bar" ref={barRef}>
          <a className="nav__logo" href={href('home')} onClick={(e) => go(e, 'home')} aria-label="Wild Yala Safari — home">
            {mode === 'home' ? <LogoNotch /> : null}
            <img src="./brand/logo-480.webp" alt="Wild Yala Safari" width="480" height="415" />
          </a>

          <nav className="nav__links" aria-label="Primary">
            <div className="nav__track" ref={linksRef}>
            <span ref={pillRef} className="nav__pill" aria-hidden="true" />
            <ul>
              {NAV_LINKS.map((l) => (
                <li key={l.id}>
                  <a
                    data-id={l.id}
                    href={href(l.id)}
                    onClick={(e) => go(e, l.id)}
                    className={active === l.id && mode === 'home' ? 'is-active' : ''}
                    aria-current={active === l.id && mode === 'home' ? 'true' : undefined}
                  >
                    {l.label}
                  </a>
                </li>
              ))}
              <li>
                {user ? (
                  <AccountMenu user={user} onLogout={logout} />
                ) : (
                  <a href="./login.html" data-id="login" className="nav__login">
                    <Icon name="login" size={16} />
                    Login
                  </a>
                )}
              </li>
            </ul>
            </div>
          </nav>

          <a className="btn btn--primary nav__cta" href={mode === 'home' ? '#packages' : './index.html#packages'} onClick={book}>
            <span className="btn__label">Book a Safari</span>
          </a>

          <button
            type="button"
            className={`nav__burger ${menuOpen ? 'is-open' : ''}`}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen((o) => !o)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </header>

      <div id="mobile-menu" ref={menuRef} className={`mmenu ${menuOpen ? 'is-open' : ''}`} aria-hidden={!menuOpen} inert={!menuOpen}>
        <div className="mmenu__bg" aria-hidden="true" />
        <nav className="mmenu__inner" aria-label="Mobile">
          <ul>
            {NAV_LINKS.map((l) => (
              <li key={l.id} className="mmenu__item">
                <a href={href(l.id)} onClick={(e) => go(e, l.id)} className={active === l.id && mode === 'home' ? 'is-active' : ''}>
                  {l.label}
                  <Icon name="arrowRight" size={16} className="mmenu__arrow" />
                </a>
              </li>
            ))}
            {user ? (
              <li className="mmenu__item mmenu__acct">
                <span className="acct__avatar" aria-hidden="true">
                  {initial(user)}
                </span>
                <span className="mmenu__acct-who">
                  <strong>{user.name || firstName(user)}</strong>
                  <small>{user.email}</small>
                </span>
                <button type="button" className="link-btn" onClick={logout}>
                  Logout
                </button>
              </li>
            ) : (
              <li className="mmenu__item">
                <a href="./login.html">
                  Login
                  <Icon name="login" size={16} className="mmenu__arrow" />
                </a>
              </li>
            )}
          </ul>
          <div className="mmenu__item mmenu__foot">
            <a className="btn btn--primary btn--block" href={href('packages')} onClick={book}>
              <span className="btn__label">Book a Safari</span>
              <Icon name="arrowRight" size={18} className="btn__icon" />
            </a>
            <div className="mmenu__social">
              <p className="mmenu__social-label">Follow our safaris</p>
              <SocialLinks />
            </div>
            <p className="mmenu__tag">Explore the Wild · Yala, Sri Lanka</p>
          </div>
        </nav>
      </div>
    </>
  );
}
