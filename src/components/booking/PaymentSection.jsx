import { convertFromLKR, formatNumber } from '../../lib/currency.js';
import { AnimatedNumber } from '../ui.jsx';
import Icon from '../Icon.jsx';
import Flag from '../Flag.jsx';

const BILLING = ['USD', 'LKR'];

/** Secure-looking payment panel (frontend simulation only). */
export default function PaymentSection({ price, billing, onBilling, onPay, onEnquire, busy }) {
  const amount = convertFromLKR(price.totalLKR, billing);
  const idx = BILLING.indexOf(billing);

  return (
    <section className="pay glass" aria-labelledby="pay-title">
      <div className="pay__head">
        <span className="pay__lock">
          <Icon name="lock" size={20} />
        </span>
        <div>
          <h2 id="pay-title">Secure Payment</h2>
          <p>Complete your booking through our secure payment gateway.</p>
        </div>
        <span className="pay__ssl">
          <Icon name="shield" size={15} /> SSL Secured
        </span>
      </div>

      <ul className="pay__methods" aria-label="Accepted payment methods">
        <li>
          <Icon name="card" size={18} /> Credit &amp; debit cards
        </li>
        <li>
          <Icon name="globe" size={18} /> International payments
        </li>
        <li>
          <Icon name="lock" size={18} /> Encrypted checkout
        </li>
      </ul>

      <div className="pay__amount">
        <div>
          <p className="label">Final Amount</p>
          <p className="total">
            <span className="total__code">{billing}</span>
            <AnimatedNumber value={amount} format={(v) => formatNumber(v, billing)} className="total__num" />
          </p>
          <p className="total__base">
            {price.jeeps} {price.jeeps === 1 ? 'jeep' : 'jeeps'} · {price.totalPeople} {price.totalPeople === 1 ? 'passenger' : 'passengers'}
          </p>
        </div>

        <div className="billing">
          <p className="label" id="billing-label">
            Billing Currency
          </p>
          <div className="billing__toggle" role="radiogroup" aria-labelledby="billing-label">
            <span className="billing__glider" style={{ transform: `translateX(${idx * 100}%)` }} aria-hidden="true" />
            {BILLING.map((c) => (
              <button
                key={c}
                type="button"
                role="radio"
                aria-checked={billing === c}
                className={billing === c ? 'is-active' : ''}
                onClick={() => onBilling(c)}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                    e.preventDefault();
                    onBilling(BILLING[(idx + 1) % 2]);
                  }
                }}
                tabIndex={billing === c ? 0 : -1}
              >
                <Flag code={c} /> {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="pay__actions">
        <div className="pay__primary">
          <button type="button" className="btn btn--primary btn--glow btn--xl btn--block" onClick={onPay} disabled={busy}>
            <Icon name="lock" size={18} />
            <span className="btn__label">Pay Now</span>
          </button>
          <p className="pay__secure">
            <Icon name="shield" size={14} /> Secure payment · Your details are encrypted
          </p>
        </div>
        <div className="pay__secondary">
          <button type="button" className="btn btn--ghost btn--xl btn--block" onClick={onEnquire}>
            <Icon name="chat" size={18} />
            <span className="btn__label">Enquiry Now</span>
          </button>
          <p className="pay__help">If you have any problems with payment, please contact us.</p>
        </div>
      </div>
    </section>
  );
}
