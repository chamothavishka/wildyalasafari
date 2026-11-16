import { JEEPS, getRates } from '../lib/pricing.js';
import { formatLKR } from '../lib/currency.js';
import Icon from './Icon.jsx';

export function PassengerCounter({ label, sublabel, note, value, onStep, min = 0, max = 30, id }) {
  return (
    <div className="counter">
      <div className="counter__text">
        <span className="counter__label" id={`${id}-label`}>
          {label} {sublabel ? <small>{sublabel}</small> : null}
        </span>
        {note ? <span className="counter__note">{note}</span> : null}
      </div>
      <div className="counter__ctrl" role="group" aria-labelledby={`${id}-label`}>
        <button type="button" className="counter__btn" onClick={() => onStep(-1)} disabled={value <= min} aria-label={`Remove one ${label.toLowerCase()}`}>
          <Icon name="minus" size={16} />
        </button>
        <output className="counter__value" aria-live="polite" aria-label={`${value} ${label}`} key={value}>
          {value}
        </output>
        <button type="button" className="counter__btn counter__btn--plus" onClick={() => onStep(1)} disabled={value >= max} aria-label={`Add one ${label.toLowerCase()}`}>
          <Icon name="plus" size={16} />
        </button>
      </div>
    </div>
  );
}

export function JeepSelector({ safariId, value, onChange }) {
  const ids = Object.keys(JEEPS);
  const idx = ids.indexOf(value);
  const onKey = (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const next = ids[(idx + (e.key === 'ArrowRight' ? 1 : ids.length - 1)) % ids.length];
      onChange(next);
      e.currentTarget.querySelector(`[data-jeep="${next}"]`)?.focus();
    }
  };
  return (
    <div className="jeepsel" role="radiogroup" aria-label="Jeep category" onKeyDown={onKey}>
      <span className="jeepsel__glider" style={{ transform: `translateX(${idx * 100}%)` }} aria-hidden="true" />
      {ids.map((id) => (
        <button
          key={id}
          type="button"
          role="radio"
          data-jeep={id}
          aria-checked={value === id}
          tabIndex={value === id ? 0 : -1}
          className={`jeepsel__opt ${value === id ? 'is-active' : ''}`}
          onClick={() => onChange(id)}
        >
          <strong>{JEEPS[id].name}</strong>
          <span>{formatLKR(getRates(safariId, id).base)} base</span>
        </button>
      ))}
    </div>
  );
}
