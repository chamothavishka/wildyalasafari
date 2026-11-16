import { useEffect, useRef, useState } from 'react';
import { gsap } from '../lib/gsap.js';
import { prefersReducedMotion } from '../lib/env.js';
import Icon from './Icon.jsx';

/** Smoothly tweens between numeric values and renders them through `format`. */
export function AnimatedNumber({ value, format = (v) => Math.round(v).toLocaleString('en-US'), duration = 0.75, className = '' }) {
  const [display, setDisplay] = useState(value);
  const state = useRef({ v: value });
  useEffect(() => {
    if (prefersReducedMotion()) {
      state.current.v = value;
      setDisplay(value);
      return undefined;
    }
    const tween = gsap.to(state.current, {
      v: value,
      duration,
      ease: 'power3.out',
      onUpdate: () => setDisplay(state.current.v),
    });
    return () => tween.kill();
  }, [value, duration]);
  return <span className={`tabular ${className}`}>{format(display)}</span>;
}

export function SectionTag({ children, className = '' }) {
  return (
    <span className={`section-tag ${className}`} data-reveal="fade">
      <span className="section-tag__dot" aria-hidden="true" />
      {children}
    </span>
  );
}

/** Heading with a serif italic accent: <Heading>Choose Your <em>Safari Experience</em></Heading> */
export function Heading({ as: Tag = 'h2', children, className = '', split = true, ...rest }) {
  return (
    <Tag className={`heading ${className}`} {...(split ? { 'data-split': '' } : {})} {...rest}>
      {children}
    </Tag>
  );
}

export function Button({ as: Tag = 'button', variant = 'primary', icon, iconLeft, children, className = '', ...rest }) {
  return (
    <Tag className={`btn btn--${variant} ${className}`} {...rest}>
      {iconLeft ? <Icon name={iconLeft} size={18} /> : null}
      <span className="btn__label">{children}</span>
      {icon ? <Icon name={icon} size={18} className="btn__icon" /> : null}
    </Tag>
  );
}

/** Accessible modal shell with focus trap, Esc to close and scroll lock. */
export function Modal({ open, onClose, labelledBy, children, className = '', variant = 'center' }) {
  const panelRef = useRef(null);
  const lastFocus = useRef(null);
  const [render, setRender] = useState(open);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setRender(true);
      lastFocus.current = document.activeElement;
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
      document.documentElement.classList.add('scroll-locked');
    } else if (render) {
      setVisible(false);
      document.documentElement.classList.remove('scroll-locked');
      const t = setTimeout(() => {
        setRender(false);
        if (lastFocus.current && lastFocus.current.focus) lastFocus.current.focus();
      }, 450);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => document.documentElement.classList.remove('scroll-locked'), []);

  useEffect(() => {
    if (!visible || !panelRef.current) return undefined;
    const panel = panelRef.current;
    const focusables = () =>
      panel.querySelectorAll('button:not([disabled]), [href], input:not([disabled]), textarea, select, [tabindex]:not([tabindex="-1"])');
    const first = focusables()[0];
    if (first) first.focus({ preventScroll: true });
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab') {
        const list = Array.from(focusables());
        if (!list.length) return;
        const firstEl = list[0];
        const lastEl = list[list.length - 1];
        if (e.shiftKey && document.activeElement === firstEl) {
          e.preventDefault();
          lastEl.focus();
        } else if (!e.shiftKey && document.activeElement === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [visible, onClose]);

  if (!render) return null;
  return (
    <div className={`modal modal--${variant} ${visible ? 'is-open' : ''}`} role="presentation">
      <div className="modal__backdrop" onClick={onClose} />
      <div ref={panelRef} className={`modal__panel glass ${className}`} role="dialog" aria-modal="true" aria-labelledby={labelledBy}>
        {children}
      </div>
    </div>
  );
}

export function CloseButton({ onClick, label = 'Close' }) {
  return (
    <button type="button" className="icon-btn" onClick={onClick} aria-label={label}>
      <Icon name="close" size={18} />
    </button>
  );
}

/** Floating-label text field. */
export function Field({ id, label, required, error, textarea, className = '', icon, ...rest }) {
  const Tag = textarea ? 'textarea' : 'input';
  return (
    <div className={`field ${error ? 'field--error' : ''} ${textarea ? 'field--textarea' : ''} ${className}`}>
      {icon ? <Icon name={icon} size={18} className="field__icon" /> : null}
      <Tag id={id} className={`field__input ${icon ? 'has-icon' : ''}`} placeholder=" " aria-invalid={!!error} aria-describedby={error ? `${id}-err` : undefined} required={required} {...rest} />
      <label htmlFor={id} className="field__label">
        {label}
        {required ? <span className="field__req" aria-hidden="true"> *</span> : null}
      </label>
      {error ? (
        <span id={`${id}-err`} className="field__error" role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}

export function Stars({ value = 0, size = 16 }) {
  return (
    <span className="stars" aria-label={value ? `${value} out of 5 stars` : 'No rating yet'}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Icon key={n} name="star" size={size} className={n <= value ? 'is-on' : ''} />
      ))}
    </span>
  );
}
