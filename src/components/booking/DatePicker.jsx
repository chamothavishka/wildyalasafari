import { useEffect, useId, useRef, useState } from 'react';
import Icon from '../Icon.jsx';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const sameDay = (a, b) => a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
export const toISO = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const fromISO = (s) => {
  if (!s) return null;
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};
export const formatLong = (s) =>
  s ? fromISO(s).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' }) : '';

/**
 * Premium calendar picker with floating label, keyboard navigation
 * (arrows, PageUp/PageDown, Home/End, Enter, Esc) and min/max limits.
 */
export default function DatePicker({ id, label, value, onChange, required, error, min, max, hint }) {
  const [open, setOpen] = useState(false);
  const selected = fromISO(value);
  const minDate = min ? startOfDay(fromISO(min)) : null;
  const maxDate = max ? startOfDay(fromISO(max)) : null;
  const [view, setView] = useState(() => selected || minDate || new Date());
  const [focus, setFocus] = useState(() => selected || minDate || new Date());
  const rootRef = useRef(null);
  const gridRef = useRef(null);
  const uid = useId();

  const disabled = (d) => (minDate && d < minDate) || (maxDate && d > maxDate);

  useEffect(() => {
    if (!open) return undefined;
    const start = selected || (minDate && minDate > new Date() ? minDate : startOfDay(new Date()));
    setView(new Date(start.getFullYear(), start.getMonth(), 1));
    setFocus(start);
    const onDoc = (e) => rootRef.current && !rootRef.current.contains(e.target) && setOpen(false);
    document.addEventListener('pointerdown', onDoc);
    return () => document.removeEventListener('pointerdown', onDoc);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open || !gridRef.current) return;
    const btn = gridRef.current.querySelector(`[data-date="${toISO(focus)}"]`);
    if (btn) btn.focus({ preventScroll: true });
  }, [focus, open, view]);

  const first = new Date(view.getFullYear(), view.getMonth(), 1);
  const offset = (first.getDay() + 6) % 7; // Monday-first
  const daysInMonth = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < offset; i += 1) cells.push(null);
  for (let d = 1; d <= daysInMonth; d += 1) cells.push(new Date(view.getFullYear(), view.getMonth(), d));
  while (cells.length % 7) cells.push(null);

  const shiftMonth = (n) => setView((v) => new Date(v.getFullYear(), v.getMonth() + n, 1));
  const prevDisabled = minDate && new Date(view.getFullYear(), view.getMonth(), 0) < minDate;
  const nextDisabled = maxDate && new Date(view.getFullYear(), view.getMonth() + 1, 1) > maxDate;

  const moveFocus = (days, months = 0) => {
    const n = new Date(focus.getFullYear(), focus.getMonth() + months, focus.getDate() + days);
    if (disabled(n)) return;
    setFocus(n);
    if (n.getMonth() !== view.getMonth() || n.getFullYear() !== view.getFullYear()) setView(new Date(n.getFullYear(), n.getMonth(), 1));
  };

  const pick = (d) => {
    if (disabled(d)) return;
    onChange(toISO(d));
    setOpen(false);
    rootRef.current.querySelector('.dp__trigger').focus();
  };

  const onGridKey = (e) => {
    const map = { ArrowLeft: [-1], ArrowRight: [1], ArrowUp: [-7], ArrowDown: [7], PageUp: [0, -1], PageDown: [0, 1] };
    if (map[e.key]) {
      e.preventDefault();
      moveFocus(...map[e.key]);
    } else if (e.key === 'Home') {
      e.preventDefault();
      moveFocus(-((focus.getDay() + 6) % 7));
    } else if (e.key === 'End') {
      e.preventDefault();
      moveFocus(6 - ((focus.getDay() + 6) % 7));
    } else if (e.key === 'Escape') {
      setOpen(false);
      rootRef.current.querySelector('.dp__trigger').focus();
    }
  };

  const today = startOfDay(new Date());

  return (
    <div className={`field dp ${error ? 'field--error' : ''} ${value ? 'has-value' : ''} ${open ? 'is-open' : ''}`} ref={rootRef}>
      <Icon name="calendar" size={18} className="field__icon" />
      <button
        type="button"
        id={id}
        className="field__input has-icon dp__trigger"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={`${uid}-cal`}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined}
        aria-label={`${label}${required ? ' (required)' : ''}${value ? `: ${formatLong(value)}` : ''}`}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => e.key === 'ArrowDown' && (e.preventDefault(), setOpen(true))}
      >
        <span className="dp__value">{value ? formatLong(value) : ' '}</span>
        <Icon name="chevronDown" size={16} className="dp__chev" />
      </button>
      <span className="field__label" aria-hidden="true">
        {label}
        {required ? <span className="field__req"> *</span> : null}
      </span>
      {hint && !error ? (
        <span id={`${id}-hint`} className="field__hint">
          {hint}
        </span>
      ) : null}
      {error ? (
        <span id={`${id}-err`} className="field__error" role="alert">
          {error}
        </span>
      ) : null}

      <div id={`${uid}-cal`} className="dp__pop glass" role="dialog" aria-modal="false" aria-label={`Choose ${label.toLowerCase()}`} hidden={!open}>
        <div className="dp__head">
          <button type="button" className="icon-btn icon-btn--sm" onClick={() => shiftMonth(-1)} disabled={prevDisabled} aria-label="Previous month">
            <Icon name="chevronLeft" size={16} />
          </button>
          <strong aria-live="polite">
            {MONTHS[view.getMonth()]} {view.getFullYear()}
          </strong>
          <button type="button" className="icon-btn icon-btn--sm" onClick={() => shiftMonth(1)} disabled={nextDisabled} aria-label="Next month">
            <Icon name="chevronRight" size={16} />
          </button>
        </div>
        <div className="dp__dow" aria-hidden="true">
          {DAYS.map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>
        <div className="dp__grid" role="grid" ref={gridRef} onKeyDown={onGridKey}>
          {cells.map((d, i) =>
            d ? (
              <button
                key={i}
                type="button"
                role="gridcell"
                data-date={toISO(d)}
                tabIndex={sameDay(d, focus) ? 0 : -1}
                disabled={disabled(d)}
                aria-selected={sameDay(d, selected)}
                aria-current={sameDay(d, today) ? 'date' : undefined}
                aria-label={d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                className={`dp__day ${sameDay(d, selected) ? 'is-selected' : ''} ${sameDay(d, today) ? 'is-today' : ''}`}
                onClick={() => pick(d)}
              >
                {d.getDate()}
              </button>
            ) : (
              <span key={i} className="dp__blank" />
            )
          )}
        </div>
        <div className="dp__foot">
          <span>
            <i className="dp__legend dp__legend--today" /> Today
          </span>
          {value ? (
            <button type="button" className="link-btn" onClick={() => { onChange(''); setOpen(false); }}>
              Clear
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
