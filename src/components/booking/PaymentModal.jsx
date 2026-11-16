import { useEffect, useRef, useState } from 'react';
import { PACKAGE_MAP, BRAND, whatsappLink } from '../../data/content.js';
import { convertFromLKR, formatNumber } from '../../lib/currency.js';
import { createBooking, fetchBookingStatus, submitCheckout, newIdempotencyKey } from '../../lib/api.js';
import { Modal, CloseButton } from '../ui.jsx';
import { formatLong } from './DatePicker.jsx';
import Icon from '../Icon.jsx';

const POLL_MS = 2500;
const POLL_MAX = 36; // ~90 seconds of waiting for the gateway's confirmation

/**
 * Secure checkout overlay. The customer's card is entered on the payment provider's own hosted page (PayHere), so card
 * details never touch this website or our server. Pressing Pay creates the booking on the server (which calculates the
 * price itself) and sends the customer to the provider. When they come back (`returnRef`), the booking's real status is
 * read from the server — it only says "paid" after the provider's signed notification has been verified there.
 */
export default function PaymentModal({ open, onClose, sel, price, billing, customer, form, returnRef }) {
  const [step, setStep] = useState(returnRef ? 'checking' : 'form'); // form | processing | checking | done | failed | cancelled | waiting | error
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const keyRef = useRef('');
  const pkg = PACKAGE_MAP[sel.safariId];

  const amount = result
    ? `${result.billing.currency} ${formatNumber(Number(result.billing.amountFixed), result.billing.currency)}`
    : `${billing} ${formatNumber(convertFromLKR(price.totalLKR, billing), billing)}`;
  const summary = result
    ? `${result.safariName} · ${result.jeeps} ${result.jeeps === 1 ? 'jeep' : 'jeeps'} · ${result.guests} ${result.guests === 1 ? 'guest' : 'guests'}`
    : `${pkg.name} · ${price.jeeps} ${price.jeeps === 1 ? 'jeep' : 'jeeps'} · ${price.totalPeople} ${price.totalPeople === 1 ? 'guest' : 'guests'}`;

  useEffect(() => {
    if (open && !returnRef) {
      setStep('form');
      setError('');
      keyRef.current = newIdempotencyKey(); // one key per checkout attempt
    }
  }, [open, returnRef]);

  // Back from the payment provider: wait for the server to confirm (or reject) the payment.
  useEffect(() => {
    if (!open || !returnRef) return undefined;
    let stop = false;
    let timer = 0;
    let tries = 0;
    setStep('checking');
    const tick = async () => {
      try {
        const s = await fetchBookingStatus(returnRef);
        if (stop) return;
        setResult(s);
        if (s.paymentStatus === 'PAID') return setStep('done');
        if (s.paymentStatus === 'FAILED') return setStep('failed');
        if (s.paymentStatus === 'CANCELLED') return setStep('cancelled');
      } catch (err) {
        if (stop) return;
        if (err.status === 404) {
          setError('We could not find that booking. If you were charged, please contact us with your booking reference.');
          return setStep('error');
        }
      }
      tries += 1;
      if (tries >= POLL_MAX) return setStep('waiting');
      timer = setTimeout(tick, POLL_MS);
      return undefined;
    };
    timer = setTimeout(tick, 400);
    return () => {
      stop = true;
      clearTimeout(timer);
    };
  }, [open, returnRef]);

  // Coming back with the browser's Back button from the provider's page: show the form again.
  useEffect(() => {
    const onShow = (e) => {
      if (e.persisted) setStep((s) => (s === 'processing' ? 'form' : s));
    };
    window.addEventListener('pageshow', onShow);
    return () => window.removeEventListener('pageshow', onShow);
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setStep('processing');
    try {
      const data = await createBooking(
        {
          name: form.name,
          email: form.email,
          phone: form.phone,
          country: form.country,
          safariDate: form.date,
          arrivalDate: form.arrival,
          pickupLocation: form.pickup,
          specialRequests: form.requests,
          safariId: sel.safariId,
          jeepId: sel.jeepId,
          adults: sel.adults,
          children: sel.children,
          infants: sel.infants,
          billingCurrency: billing,
          expectedTotalLKR: price.totalLKR,
        },
        keyRef.current,
      );
      submitCheckout(data.checkout); // leaves this page for the provider's secure payment page
    } catch (err) {
      setError(err.message);
      setStep('error');
    }
  };

  const busy = step === 'processing' || step === 'checking';
  const first = (result && result.customerFirstName) || (customer.name ? customer.name.split(' ')[0] : '');

  return (
    <Modal open={open} onClose={busy ? () => {} : onClose} labelledBy="checkout-title" className="checkout" variant="sheet">
      <div className="checkout__glow" aria-hidden="true" />
      <div className="modal__head">
        <div className="checkout__merchant">
          <img src="./brand/logo-480.webp" alt="" width="44" height="38" />
          <div>
            <h3 id="checkout-title">{step === 'done' ? 'Payment Received' : 'Secure Checkout'}</h3>
            <p>{BRAND.name}</p>
          </div>
        </div>
        {!busy ? <CloseButton onClick={onClose} /> : null}
      </div>

      <div className="checkout__amount">
        <span>{summary}</span>
        <strong>{amount}</strong>
      </div>

      {step === 'form' ? (
        <form onSubmit={submit} noValidate className="checkout__form">
          <button type="submit" className="btn btn--primary btn--glow btn--xl btn--block">
            <Icon name="lock" size={18} />
            <span className="btn__label">Pay {amount}</span>
          </button>
          <div className="checkout__trust">
            <span>
              <Icon name="shield" size={14} /> SSL encrypted
            </span>
            <span>
              <Icon name="lock" size={14} /> Secure checkout
            </span>
          </div>
          <p className="checkout__demo">You will be taken to our payment partner’s secure page to enter your card details. Your card is never stored on this website.</p>
        </form>
      ) : null}

      {step === 'processing' ? (
        <div className="checkout__state" role="status">
          <span className="checkout__spinner" />
          <strong>Taking you to the secure payment page…</strong>
          <span>Please keep this window open.</span>
        </div>
      ) : null}

      {step === 'checking' ? (
        <div className="checkout__state" role="status">
          <span className="checkout__spinner" />
          <strong>Confirming your payment…</strong>
          <span>This usually takes a few seconds. Please keep this window open.</span>
        </div>
      ) : null}

      {step === 'done' && result ? (
        <div className="checkout__state checkout__state--done" role="status">
          <span className="checkout__tick">
            <svg viewBox="0 0 52 52" aria-hidden="true">
              <circle cx="26" cy="26" r="24" />
              <path d="M15 27l7 7 15-16" />
            </svg>
          </span>
          <strong>Thank you{first ? `, ${first}` : ''}!</strong>
          <span>
            Booking reference <b>{result.bookingRef}</b>
          </span>
          <p>
            Your safari{result.safariDate ? ` on ${formatLong(result.safariDate)}` : ''} is confirmed.{' '}
            {result.emailStatus === 'SENT' ? `A confirmation email has been sent to ${result.customerEmail}.` : `Your confirmation email is on its way to ${result.customerEmail}.`}
          </p>
          <a className="btn btn--ghost" href="./index.html">
            <span className="btn__label">Back to Home</span>
          </a>
        </div>
      ) : null}

      {step === 'failed' || step === 'cancelled' || step === 'waiting' || step === 'error' ? (
        <div className="checkout__state" role="status">
          <span className="checkout__tick" aria-hidden="true">
            <Icon name="info" size={40} />
          </span>
          <strong>
            {step === 'failed' ? 'Your payment was not completed' : step === 'cancelled' ? 'Payment cancelled' : step === 'waiting' ? 'Still waiting for confirmation' : 'We could not start your payment'}
          </strong>
          <p>
            {step === 'failed' && 'The payment was declined or could not be processed, and you have not been charged for this booking. You can try again or use another card.'}
            {step === 'cancelled' && 'No payment was taken and your safari has not been booked. You can start again whenever you are ready.'}
            {step === 'waiting' && `We have not yet heard back from the payment provider. If you were charged, your booking${result ? ` (${result.bookingRef})` : ''} will be confirmed and emailed to you shortly — or contact us and we will check straight away.`}
            {step === 'error' && error}
          </p>
          {step !== 'waiting' ? (
            <button type="button" className="btn btn--primary" onClick={() => (returnRef ? onClose() : setStep('form'))}>
              <span className="btn__label">Try again</span>
            </button>
          ) : null}
          <a className="btn btn--ghost" href={whatsappLink(`Hello ${BRAND.name}! I need help with my booking${result ? ` ${result.bookingRef}` : ''}.`)} target="_blank" rel="noopener noreferrer">
            <span className="btn__label">Contact us</span>
          </a>
        </div>
      ) : null}
    </Modal>
  );
}
