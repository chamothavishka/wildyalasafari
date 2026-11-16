import { useEffect, useId, useRef, useState } from 'react';
import { CURRENCIES, getCurrency } from '../lib/currency.js';
import Icon from './Icon.jsx';
import Flag from './Flag.jsx';

/** Accessible custom listbox for choosing the display currency. */
export default function CurrencySelector({ value, onChange, align = 'right' }) {
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(() => CURRENCIES.findIndex((c) => c.code === value));
  const [dropUp, setDropUp] = useState(true);
  const rootRef = useRef(null);
  const listRef = useRef(null);
  const id = useId();
  const current = getCurrency(value);

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', onDoc);
    const r = rootRef.current.getBoundingClientRect();
    setDropUp(r.top > window.innerHeight - r.bottom);
    requestAnimationFrame(() => {
      const el = listRef.current && listRef.current.querySelector('[aria-selected="true"]');
      if (el) el.scrollIntoView({ block: 'nearest' });
      listRef.current && listRef.current.focus({ preventScroll: true });
    });
    return () => document.removeEventListener('pointerdown', onDoc);
  }, [open]);

  const choose = (code) => {
    onChange(code);
    setOpen(false);
    rootRef.current.querySelector('button').focus();
  };

  const onListKey = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => Math.min(CURRENCIES.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(0, i - 1));
    } else if (e.key === 'Home') {
      setActiveIdx(0);
    } else if (e.key === 'End') {
      setActiveIdx(CURRENCIES.length - 1);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      choose(CURRENCIES[activeIdx].code);
    } else if (e.key === 'Escape' || e.key === 'Tab') {
      setOpen(false);
    }
  };

  useEffect(() => {
    if (!open || !listRef.current) return;
    const el = listRef.current.children[activeIdx];
    if (el) el.scrollIntoView({ block: 'nearest' });
  }, [activeIdx, open]);

  return (
    <div className={`currency ${open ? 'is-open' : ''} currency--${align}`} ref={rootRef}>
      <button
        type="button"
        className="currency__btn"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-label={`Display currency: ${current.name}`}
        onClick={() => {
          setActiveIdx(CURRENCIES.findIndex((c) => c.code === value));
          setOpen((o) => !o);
        }}
      >
        <Flag code={current.code} className="currency__flag" />
        <span className="currency__code">{current.code}</span>
        <Icon name="chevronDown" size={16} className="currency__chev" />
      </button>
      <ul
        id={`${id}-list`}
        ref={listRef}
        className={`currency__list glass ${dropUp ? 'is-up' : 'is-down'}`}
        role="listbox"
        tabIndex={-1}
        aria-label="Choose currency"
        aria-activedescendant={open ? `${id}-${CURRENCIES[activeIdx]?.code}` : undefined}
        onKeyDown={onListKey}
        hidden={!open}
      >
        {CURRENCIES.map((c, i) => (
          <li
            key={c.code}
            id={`${id}-${c.code}`}
            role="option"
            aria-selected={c.code === value}
            className={`${i === activeIdx ? 'is-active' : ''} ${c.code === value ? 'is-selected' : ''}`}
            onMouseEnter={() => setActiveIdx(i)}
            onClick={() => choose(c.code)}
          >
            <Flag code={c.code} className="currency__flag" />
            <strong>{c.code}</strong>
            <span>{c.name}</span>
            {c.code === value ? <Icon name="check" size={15} className="currency__tick" /> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
