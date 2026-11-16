import { PACKAGE_MAP } from '../../data/content.js';
import { JEEPS } from '../../lib/pricing.js';
import { convertFromLKR, formatNumber, formatLKR, getCurrency } from '../../lib/currency.js';
import { AnimatedNumber } from '../ui.jsx';
import Icon from '../Icon.jsx';
import Flag from '../Flag.jsx';
import VehicleViewer from '../VehicleViewer.jsx';

/** Auto-populated summary of the selection made in the Safari Packages section. */
export default function BookingSummary({ sel, price, fromUser, date }) {
  const pkg = PACKAGE_MAP[sel.safariId];
  const cur = getCurrency(sel.currency);
  const rows = [
    { icon: pkg.icon, k: 'Safari Type', v: pkg.name, sub: pkg.time },
    { icon: 'jeep', k: 'Jeep Category', v: JEEPS[sel.jeepId].name },
    { icon: 'jeep', k: 'Number of Jeeps', v: price.jeeps },
    { icon: 'user', k: 'Adults', v: price.adults },
    { icon: 'users', k: 'Children (Age 6–11)', v: price.children },
    { icon: 'users', k: 'Children (Age 1–5)', v: price.infants, sub: price.infants ? 'Free' : null },
    { icon: 'users', k: 'Number of Passengers', v: price.totalPeople },
    { icon: 'pin', k: 'Safari Location', v: 'Yala National Park' },
  ];
  if (date) rows.splice(1, 0, { icon: 'calendar', k: 'Safari Date', v: date });

  return (
    <aside className="summary glass" aria-labelledby="summary-title">
      <div className="summary__stage">
        <VehicleViewer jeepId={sel.jeepId} compact />
        <div className="summary__stage-label">
          <p className="eyebrow">Booking Summary</p>
          <h2 id="summary-title">{pkg.name}</h2>
        </div>
      </div>

      {!fromUser ? (
        <p className="summary__notice">
          <Icon name="info" size={16} /> No package was selected, so the default Morning Safari is shown.{' '}
          <a href="./index.html#packages">Choose your safari</a>
        </p>
      ) : null}

      <dl className="summary__list">
        {rows.map((r) => (
          <div key={r.k} className="summary__row">
            <dt>
              <Icon name={r.icon} size={16} />
              {r.k}
            </dt>
            <dd>
              {r.v}
              {r.sub ? <small>{r.sub}</small> : null}
            </dd>
          </div>
        ))}
      </dl>

      <div className="summary__total">
        <div>
          <p className="label">Final Total Price</p>
          <p className="total total--sm">
            <span className="total__code">{cur.code}</span>
            <AnimatedNumber value={convertFromLKR(price.totalLKR, cur.code)} format={(v) => formatNumber(v, cur.code)} className="total__num" />
          </p>
          {cur.code !== 'LKR' ? <p className="total__base">≈ {formatLKR(price.totalLKR)}</p> : null}
        </div>
        <span className="summary__cur" title={cur.name}>
          <Flag code={cur.code} /> {cur.code}
          <small>Selected currency</small>
        </span>
      </div>

      <a className="summary__edit" href="./index.html#packages">
        <Icon name="pen" size={15} /> Edit your selection
      </a>
    </aside>
  );
}
