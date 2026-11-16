import { NAV_LINKS, PACKAGES, CONTACT, BRAND, whatsappLink, mailtoLink } from '../data/content.js';
import { scrollToSection, gsap } from '../lib/gsap.js';
import { prefersReducedMotion } from '../lib/env.js';
import Icon from './Icon.jsx';
import SocialLinks from './SocialLinks.jsx';

export default function Footer({ mode = 'home' }) {
  const home = mode === 'home';
  const href = (id) => (home ? `#${id === 'home' ? '' : id}` : `./index.html${id === 'home' ? '' : `#${id}`}`);
  const go = (id) => (e) => {
    if (!home) return;
    e.preventDefault();
    scrollToSection(id);
  };
  const toTop = () => {
    if (window.__smoothScrollStop) window.__smoothScrollStop();
    gsap.to(window, { scrollTo: 0, duration: prefersReducedMotion() ? 0 : 1.6, ease: 'power3.inOut' });
  };

  return (
    <footer className="footer">
      <div className="footer__glow" aria-hidden="true" />
      <div className="container">
        <div className="footer__grid">
          <div className="footer__brand">
            <img src="./brand/logo-480.webp" alt="Wild Yala Safari" width="120" height="104" loading="lazy" />
            <p>Private 4x4 jeep safaris through Yala National Park — guided by local experts and built around unforgettable encounters with Sri Lanka’s wildlife.</p>
            <SocialLinks className="footer__social" onlyLinked skip={['whatsapp']} />
          </div>

          <nav aria-label="Footer">
            <p className="footer__h">Explore</p>
            <ul className="footer__links">
              {NAV_LINKS.map((l) => (
                <li key={l.id}>
                  <a href={href(l.id)} onClick={go(l.id)}>
                    {l.label}
                  </a>
                </li>
              ))}
              <li>
                <a href="./login.html">Login</a>
              </li>
            </ul>
          </nav>

          <div>
            <p className="footer__h">Safaris</p>
            <ul className="footer__links footer__links--safaris">
              {PACKAGES.map((p) => (
                <li key={p.id}>
                  <a href={href('packages')} onClick={go('packages')}>
                    {p.name}
                    <small>{p.time}</small>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="footer__h">Contact</p>
            <ul className="footer__contact">
              <li>
                <a href={whatsappLink()} target="_blank" rel="noopener noreferrer">
                  <Icon name="whatsapp" size={17} /> WhatsApp
                </a>
              </li>
              <li>
                <a href={mailtoLink()}>
                  <Icon name="mail" size={17} /> {CONTACT.email}
                </a>
              </li>
              {CONTACT.phone ? (
                <li>
                  <a href={`tel:${CONTACT.phone.replace(/\s/g, '')}`}>
                    <Icon name="phone" size={17} /> {CONTACT.phone}
                  </a>
                </li>
              ) : null}
              <li>
                <a href={CONTACT.mapUrl} target="_blank" rel="noopener noreferrer">
                  <Icon name="pin" size={17} /> {CONTACT.location}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <svg className="footer__wordmark" viewBox="0 0 1200 130" aria-hidden="true" focusable="false">
          <defs>
            <linearGradient id="wm-grad" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#f68f2f" stopOpacity="0.32" />
              <stop offset="100%" stopColor="#f68f2f" stopOpacity="0" />
            </linearGradient>
          </defs>
          <text x="600" y="112" textAnchor="middle" textLength="1190" lengthAdjust="spacingAndGlyphs" fill="url(#wm-grad)">
            WILD YALA SAFARI
          </text>
        </svg>

        <div className="footer__bottom">
          <span>© {new Date().getFullYear()} Crafted with passion by Avishka</span>
          <span className="footer__tag">{BRAND.tagline}</span>
          <button type="button" className="footer__top" onClick={toTop}>
            Back to top
            <span className="icon-btn icon-btn--sm">
              <Icon name="arrowUp" size={16} />
            </span>
          </button>
        </div>
      </div>
    </footer>
  );
}
