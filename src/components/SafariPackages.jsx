import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { PACKAGES, PACKAGE_MAP } from '../data/content.js';
import { calculatePrice, startingPrice, JEEPS, MAX_GROUP, MAX_PER_JEEP } from '../lib/pricing.js';
import { convertFromLKR, formatNumber, formatLKR, getCurrency } from '../lib/currency.js';
import { saveSelection, bookingUrl, DEFAULT_SELECTION } from '../lib/bookingState.js';
import { gsap, ScrollTrigger } from '../lib/gsap.js';
import { prefersReducedMotion } from '../lib/env.js';
import { SectionTag, Heading, AnimatedNumber } from './ui.jsx';
import Icon from './Icon.jsx';
import CurrencySelector from './CurrencySelector.jsx';
import { PassengerCounter, JeepSelector } from './PricingControls.jsx';
import VehicleViewer from './VehicleViewer.jsx';

const INCLUSION_ICONS = {
  'Park entry tickets': 'ticket',
  '4x4 Jeep': 'jeep',
  'Water bottles': 'water',
  'Face masks': 'mask',
  Binoculars: 'binoculars',
  Breakfast: 'coffee',
  Lunch: 'utensils',
  Snacks: 'cookie',
};

function PackageTabs({ value, onChange }) {
  const listRef = useRef(null);
  const onKey = (e) => {
    const idx = PACKAGES.findIndex((p) => p.id === value);
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const next = PACKAGES[(idx + (e.key === 'ArrowRight' ? 1 : PACKAGES.length - 1)) % PACKAGES.length];
      onChange(next.id);
      listRef.current.querySelector(`[data-pkg="${next.id}"]`)?.focus();
    }
  };
  return (
    <div className="pkgtabs glass" role="tablist" aria-label="Safari packages" ref={listRef} onKeyDown={onKey} data-reveal="up">
      {PACKAGES.map((p) => (
        <button
          key={p.id}
          type="button"
          role="tab"
          id={`tab-${p.id}`}
          data-pkg={p.id}
          aria-selected={value === p.id}
          aria-controls="package-panel"
          tabIndex={value === p.id ? 0 : -1}
          className={`pkgtab ${value === p.id ? 'is-active' : ''}`}
          onClick={() => onChange(p.id)}
        >
          <span className="pkgtab__icon">
            <Icon name={p.icon} size={22} />
          </span>
          <span className="pkgtab__text">
            <strong>{p.name}</strong>
            <span>{p.time}</span>
            <em>From {formatLKR(startingPrice(p.id))}</em>
          </span>
          <span className="pkgtab__media" aria-hidden="true" style={{ backgroundImage: `url(${p.media})` }} />
        </button>
      ))}
    </div>
  );
}

/** Full-width cinematic banner for the selected safari: photo, name, headline and time. */
function PackageHero({ pkg }) {
  return (
    <div className="pkghero" key={pkg.id}>
      <img className="pkghero__img" src={pkg.media} alt="" loading="lazy" decoding="async" width="1600" height="900" aria-hidden="true" />
      <div className="pkghero__shade" aria-hidden="true" />
      <div className="pkghero__copy">
        <p className="eyebrow">{pkg.name}</p>
        <h3 className="pkghero__title">{pkg.headline}</h3>
        <p className="time-chip">
          <Icon name="clock" size={18} />
          <span>{pkg.time}</span>
        </p>
      </div>
    </div>
  );
}

function SafariDetails({ pkg }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    if (prefersReducedMotion()) return undefined;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ref.current.querySelectorAll('.anim-in'),
        { y: 26, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.045, duration: 0.7, ease: 'power3.out' }
      );
      const line = ref.current.querySelector('.timeline__fill');
      if (line) {
        gsap.fromTo(
          line,
          { scaleY: 0 },
          {
            scaleY: 1,
            ease: 'none',
            scrollTrigger: { trigger: ref.current.querySelector('.timeline'), start: 'top 70%', end: 'bottom 60%', scrub: true },
          }
        );
      }
    }, ref);
    ScrollTrigger.refresh();
    return () => ctx.revert();
  }, [pkg.id]);

  return (
    <div className="pkg-details" ref={ref}>
      <p className="pkg-details__desc anim-in">{pkg.description}</p>

      <p className="label anim-in">Itinerary</p>
      <div className="timeline">
        <span className="timeline__track" aria-hidden="true">
          <span className="timeline__fill" />
        </span>
        <ol className="timeline__list">
        {pkg.itinerary.map((s) => (
          <li key={s.time + s.title} className="timeline__item anim-in">
            <span className="timeline__dot" aria-hidden="true" />
            <span className="timeline__time">{s.time}</span>
            <strong className="timeline__title">{s.title}</strong>
            <span className="timeline__text">{s.text}</span>
          </li>
        ))}
        </ol>
      </div>

      <p className="note anim-in">
        <Icon name="info" size={18} />
        <span>{pkg.note}</span>
      </p>

      <p className="label anim-in">Inclusions</p>
      <ul className="inclusions">
        {pkg.inclusions.map((inc) => (
          <li key={inc} className="inclusion anim-in">
            <span className="inclusion__icon">
              <Icon name={INCLUSION_ICONS[inc] || 'check'} size={18} />
            </span>
            {inc}
          </li>
        ))}
      </ul>
    </div>
  );
}

function PricingCalculator({ sel, setSel, price, onBook, viewerRef, booking }) {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const cur = getCurrency(sel.currency);
  const totalConverted = convertFromLKR(price.totalLKR, sel.currency);
  const remaining = MAX_GROUP - price.totalPeople;
  const set = (k) => (v) => setSel((s) => ({ ...s, [k]: v }));
  // Functional updates so rapid repeated taps never read a stale count.
  const step = (k, min) => (d) =>
    setSel((s) => {
      const people = s.adults + s.children + s.infants;
      if (d > 0 && people >= MAX_GROUP) return s;
      return { ...s, [k]: Math.max(min, s[k] + d) };
    });

  return (
    <div className="calc glass" id="calculator">
      <div className="calc__stage">
        <div className="calc__stage-head">
          <div>
            <p className="eyebrow">Your Safari Jeep</p>
            <p className="calc__jeep-name" aria-live="polite" key={sel.jeepId}>
              {JEEPS[sel.jeepId].name}
            </p>
          </div>
          <span className="chip">4x4 · Max {MAX_PER_JEEP} guests</span>
        </div>
        <VehicleViewer ref={viewerRef} jeepId={sel.jeepId} />
      </div>

      <div className="calc__body">
        <p className="label">Jeep Category</p>
        <JeepSelector safariId={sel.safariId} value={sel.jeepId} onChange={set('jeepId')} />

        <h4 className="calc__title">Build Your Group and Get an Instant Price</h4>
        <PassengerCounter
          id="c-adults"
          label="Adults"
          note={`${formatLKR(price.rates.base)} base + ${formatLKR(price.rates.extraAdult)} each extra`}
          value={sel.adults}
          min={1}
          max={sel.adults + remaining}
          onStep={step('adults', 1)}
        />
        <PassengerCounter
          id="c-children"
          label="Children"
          sublabel="Age 6–11"
          note={`${formatLKR(price.rates.extraChild)} per child`}
          value={sel.children}
          max={sel.children + remaining}
          onStep={step('children', 0)}
        />
        <PassengerCounter
          id="c-infants"
          label="Children"
          sublabel="Age 1–5"
          note={<span className="free">Always free</span>}
          value={sel.infants}
          max={sel.infants + remaining}
          onStep={step('infants', 0)}
        />
        {remaining <= 0 ? <p className="calc__cap">For groups of more than {MAX_GROUP} guests, please contact us for a tailored quote.</p> : null}

        <div className="calc__jeeps">
          <span className="calc__jeeps-icon">
            <Icon name="jeep" size={22} />
          </span>
          <div>
            <strong>
              <AnimatedNumber value={price.jeeps} format={(v) => Math.round(v)} duration={0.4} /> {price.jeeps === 1 ? 'Jeep' : 'Jeeps'} Required
            </strong>
            <span>
              {price.totalPeople} {price.totalPeople === 1 ? 'guest' : 'guests'} · max {MAX_PER_JEEP} per jeep
            </span>
          </div>
        </div>

        <button type="button" className="calc__toggle" aria-expanded={showBreakdown} aria-controls="breakdown" onClick={() => setShowBreakdown((v) => !v)}>
          Price breakdown
          <Icon name="chevronDown" size={16} />
        </button>
        <dl id="breakdown" className={`breakdown ${showBreakdown ? 'is-open' : ''}`}>
          <div>
            <dt>
              {price.jeeps} × {JEEPS[sel.jeepId].name} (incl. 1st adult)
            </dt>
            <dd>{formatLKR(price.baseCost)}</dd>
          </div>
          <div>
            <dt>
              {price.extraAdults} × extra adult
            </dt>
            <dd>{formatLKR(price.extraAdultCost)}</dd>
          </div>
          <div>
            <dt>{price.children} × child (6–11)</dt>
            <dd>{formatLKR(price.childCost)}</dd>
          </div>
          <div>
            <dt>{price.infants} × child (1–5)</dt>
            <dd>Free</dd>
          </div>
        </dl>

        <div className="calc__total">
          <div>
            <p className="label">Total Price</p>
            <p className="total" aria-live="polite">
              <span className="total__code">{cur.code}</span>
              <AnimatedNumber value={totalConverted} format={(v) => formatNumber(v, cur.code)} className="total__num" />
            </p>
            {sel.currency !== 'LKR' ? <p className="total__base">≈ {formatLKR(price.totalLKR)}</p> : null}
          </div>
          <CurrencySelector value={sel.currency} onChange={set('currency')} />
        </div>

        <button type="button" className="btn btn--primary btn--glow btn--block btn--xl" onClick={onBook} disabled={booking}>
          <span className="btn__label">Book This Tour</span>
          <Icon name="arrowRight" size={20} className="btn__icon" />
        </button>
        <p className="calc__fine">Converted prices use indicative exchange rates. Payment is made in USD or LKR.</p>
      </div>
    </div>
  );
}

export default function SafariPackages({ onBookTransition }) {
  const [sel, setSel] = useState({ ...DEFAULT_SELECTION });
  const [booking, setBooking] = useState(false);
  const [stickyVisible, setStickyVisible] = useState(false);
  const viewerRef = useRef(null);
  const sectionRef = useRef(null);
  const price = calculatePrice(sel);
  const pkg = PACKAGE_MAP[sel.safariId];
  const cur = getCurrency(sel.currency);

  // Mobile sticky price bar: visible while in the section but the calculator total is off-screen.
  useEffect(() => {
    const section = sectionRef.current;
    const totalEl = section.querySelector('.calc__total');
    let inSection = false;
    let totalVisible = false;
    const update = () => setStickyVisible(inSection && !totalVisible);
    const io1 = new IntersectionObserver(([e]) => {
      inSection = e.isIntersecting;
      update();
    }, { rootMargin: '-30% 0px -30% 0px' });
    const io2 = new IntersectionObserver(([e]) => {
      totalVisible = e.isIntersecting;
      update();
    });
    io1.observe(section);
    io2.observe(totalEl);
    return () => {
      io1.disconnect();
      io2.disconnect();
    };
  }, []);

  const onBook = async () => {
    if (booking) return;
    setBooking(true);
    const payload = saveSelection(sel);
    const url = bookingUrl(payload);
    try {
      await onBookTransition(
        () => (viewerRef.current ? viewerRef.current.driveForward() : Promise.resolve()),
        sectionRef.current.querySelector('.vstage')
      );
    } finally {
      window.location.href = url;
    }
  };

  const scrollToCalc = () => {
    const el = document.getElementById('calculator');
    gsap.to(window, { scrollTo: { y: el.querySelector('.calc__total'), offsetY: window.innerHeight * 0.35 }, duration: 1, ease: 'power3.inOut' });
  };

  return (
    <section id="packages" className="section packages" ref={sectionRef} aria-labelledby="packages-title">
      <div className="packages__ambient" aria-hidden="true" />
      <div className="container">
        <SectionTag>Safari Packages</SectionTag>
        <Heading id="packages-title">
          Choose Your <em>Safari Experience</em>
        </Heading>
        <p className="lede" data-reveal="up">
          Select your adults and children to get an instant price. Children aged 1–5 are free on all tours. Each jeep carries a maximum of 6 guests — larger groups get an additional jeep at the same rate.
        </p>

        <PackageTabs value={sel.safariId} onChange={(id) => setSel((s) => ({ ...s, safariId: id }))} />

        <div className="pkg-panel" id="package-panel" role="tabpanel" aria-labelledby={`tab-${sel.safariId}`}>
          <PackageHero pkg={pkg} />
          <div className="pkg-grid">
            <SafariDetails pkg={pkg} />
            <div className="pkg-grid__aside">
              <PricingCalculator sel={sel} setSel={setSel} price={price} onBook={onBook} viewerRef={viewerRef} booking={booking} />
            </div>
          </div>
        </div>
      </div>

      <div className={`mbar glass ${stickyVisible ? 'is-visible' : ''}`} aria-hidden={!stickyVisible}>
        <button type="button" className="mbar__info" onClick={scrollToCalc} tabIndex={stickyVisible ? 0 : -1}>
          <span>
            {pkg.name} · {price.jeeps} {price.jeeps === 1 ? 'jeep' : 'jeeps'}
          </span>
          <strong>
            {cur.code} {formatNumber(convertFromLKR(price.totalLKR, sel.currency), sel.currency)}
          </strong>
        </button>
        <button type="button" className="btn btn--primary" onClick={onBook} tabIndex={stickyVisible ? 0 : -1} disabled={booking}>
          <span className="btn__label">Book</span>
          <Icon name="arrowRight" size={16} className="btn__icon" />
        </button>
      </div>
    </section>
  );
}
