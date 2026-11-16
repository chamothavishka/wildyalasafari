import { StrictMode, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/index.css';
import { flagLowPower } from './lib/env.js';

flagLowPower();
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import { Field, Modal, CloseButton } from './components/ui.jsx';
import Icon from './components/Icon.jsx';
import DatePicker, { toISO, formatLong } from './components/booking/DatePicker.jsx';
import BookingSummary from './components/booking/BookingSummary.jsx';
import PaymentSection from './components/booking/PaymentSection.jsx';
import PaymentModal from './components/booking/PaymentModal.jsx';
import { playArrival } from './components/BookingTransition.jsx';
import { loadSelection, saveSelection } from './lib/bookingState.js';
import { calculatePrice, JEEPS } from './lib/pricing.js';
import { formatMoney } from './lib/currency.js';
import { PACKAGE_MAP, whatsappLink, mailtoLink } from './data/content.js';
import { sendInquiry } from './lib/api.js';
import { COUNTRIES } from './data/countries.js';
import { gsap, initReveals } from './lib/gsap.js';
import { pointerParallax } from './lib/parallax.js';
import { removeBootScreen, prefersReducedMotion } from './lib/env.js';

const EMPTY = { name: '', email: '', phone: '', country: '', date: '', pickup: '', arrival: '', requests: '' };
// Everything is required except the arrival date and special requests.
const REQUIRED = {
  name: 'Please enter your full name.',
  email: 'Please enter your email address.',
  phone: 'Please enter your WhatsApp / phone number.',
  country: 'Please enter your country.',
  date: 'Please choose your safari date.',
  pickup: 'Please enter your pickup location.',
};

function validate(form) {
  const errs = {};
  Object.entries(REQUIRED).forEach(([k, msg]) => {
    if (!String(form[k]).trim()) errs[k] = msg;
  });
  if (form.email.trim() && !/^\S+@\S+\.\S+$/.test(form.email.trim())) errs.email = 'Please enter a valid email address.';
  if (form.phone.trim() && !/^[+()\d\s-]{7,20}$/.test(form.phone.trim())) errs.phone = 'Please enter a valid phone number.';
  if (form.country.trim() && form.country.trim().length < 2) errs.country = 'Please enter your country.';
  if (form.arrival && form.date && form.arrival > form.date) errs.arrival = 'Your arrival date should be on or before your safari date.';
  return errs;
}

function bookingText(sel, price, form) {
  const pkg = PACKAGE_MAP[sel.safariId];
  return [
    'Hello Wild Yala Safari, I would like to book a safari.',
    '',
    `Safari: ${pkg.name} (${pkg.time})`,
    `Jeep: ${JEEPS[sel.jeepId].name} × ${price.jeeps}`,
    `Adults: ${price.adults} · Children 6–11: ${price.children} · Children 1–5: ${price.infants}`,
    `Total: ${formatMoney(price.totalLKR, 'LKR')} (≈ ${formatMoney(price.totalLKR, 'USD')})`,
    form.date ? `Safari date: ${formatLong(form.date)}` : null,
    form.pickup ? `Pickup: ${form.pickup}` : null,
    form.arrival ? `Arrival in Sri Lanka: ${formatLong(form.arrival)}` : null,
    form.name ? `Name: ${form.name}` : null,
    form.email ? `Email: ${form.email}` : null,
    form.country ? `Country: ${form.country}` : null,
    form.phone ? `WhatsApp / Phone: ${form.phone}` : null,
    form.requests ? `Requests: ${form.requests}` : null,
  ]
    .filter((l) => l !== null)
    .join('\n');
}

/** Keep a copy of the inquiry for the team (best effort: WhatsApp / e-mail still opens if this fails). */
function saveInquiry(sel, form, via) {
  const email = form.email.trim();
  if (!form.name.trim() || !/^\S+@\S+\.\S+$/.test(email)) return; // not enough to follow up on
  const phone = form.phone.trim();
  sendInquiry({
    source: 'booking',
    via,
    name: form.name.trim(),
    email,
    phone: /^[+()\d\s-]{7,20}$/.test(phone) ? phone : '',
    country: form.country.trim(),
    message: form.requests.trim(),
    safari: {
      id: sel.safariId,
      jeepId: sel.jeepId,
      adults: sel.adults,
      children: sel.children,
      infants: sel.infants,
      safariDate: form.date || '',
      arrivalDate: form.arrival && (!form.date || form.arrival <= form.date) ? form.arrival : '',
      pickupLocation: form.pickup.trim(),
    },
  }).catch(() => {});
}

function EnquiryModal({ open, onClose, text, onSend = () => {} }) {
  return (
    <Modal open={open} onClose={onClose} labelledBy="enq-title" className="enq">
      <div className="modal__head">
        <div>
          <h3 id="enq-title">We’re Here to Help</h3>
          <p>If you have any problems with payment, please contact us. Your booking details are included in the message.</p>
        </div>
        <CloseButton onClick={onClose} />
      </div>
      <pre className="enq__preview">{text}</pre>
      <div className="enq__actions">
        <a className="btn btn--primary" href={whatsappLink(text)} target="_blank" rel="noopener noreferrer" onClick={() => onSend('whatsapp')}>
          <Icon name="whatsapp" size={18} />
          <span className="btn__label">Message on WhatsApp</span>
        </a>
        <a className="btn btn--ghost" href={mailtoLink('Safari booking enquiry', text)} onClick={() => onSend('email')}>
          <Icon name="mail" size={18} />
          <span className="btn__label">Send an Email</span>
        </a>
      </div>
    </Modal>
  );
}

function BookingApp() {
  const initial = useMemo(() => loadSelection(), []);
  const [sel, setSel] = useState(initial.selection);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState(false);
  // Back from the payment provider the URL carries ?order=<booking reference>: the checkout opens to show the real result.
  const returnRef = useMemo(() => {
    const ref = new URLSearchParams(window.location.search).get('order');
    return ref && /^WYS-[0-9A-Z]{10}$/.test(ref) ? ref : '';
  }, []);
  const [payOpen, setPayOpen] = useState(Boolean(returnRef));
  const [enqOpen, setEnqOpen] = useState(false);
  const formRef = useRef(null);
  const price = calculatePrice(sel);
  const today = toISO(new Date());

  useEffect(() => {
    removeBootScreen();
    playArrival();
    // scroll reveals: panels first, then the form's own rows in sequence (presentation only)
    document.querySelectorAll('.bform, .pay, .summary, .confirm-note').forEach((el) => el.setAttribute('data-reveal', 'scale'));
    document.querySelectorAll('.bform__head, .bform .form-row, .bform > .field').forEach((el) => el.setAttribute('data-reveal', 'up'));
    const clean = initReveals(document);
    let stopParallax = () => {};
    if (!prefersReducedMotion()) {
      // fromTo so React StrictMode's double effect in dev cannot leave the text hidden. Order: visuals (CSS) → text → steps.
      gsap.fromTo('.booking-hero > :not(.booking-hero__visual):not(.booking-hero__bg)', { y: 30, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.09, duration: 1.05, ease: 'expo.out', delay: 0.3 });
      stopParallax = pointerParallax(document.querySelector('.booking-hero'));
    }
    return () => {
      clean();
      stopParallax();
    };
  }, []);

  // Keep the stored selection (incl. billing currency) in sync.
  useEffect(() => {
    saveSelection(sel);
  }, [sel]);

  const set = (k) => (e) => {
    const v = typeof e === 'string' ? e : e.target.value;
    setForm((f) => {
      const next = { ...f, [k]: v };
      if (touched) setErrors(validate(next));
      return next;
    });
  };

  const checkForm = () => {
    setTouched(true);
    const errs = validate(form);
    setErrors(errs);
    const firstKey = ['name', 'email', 'phone', 'country', 'date', 'arrival', 'pickup'].find((k) => errs[k]);
    if (firstKey) {
      const el = document.getElementById(`bk-${firstKey}`);
      if (el) {
        el.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'center' });
        setTimeout(() => el.focus({ preventScroll: true }), 450);
      }
      if (!prefersReducedMotion()) gsap.fromTo(formRef.current, { x: -8 }, { x: 0, duration: 0.5, ease: 'elastic.out(1, 0.35)' });
      return false;
    }
    return true;
  };

  const onPay = () => {
    if (checkForm()) setPayOpen(true);
  };

  const errorCount = Object.keys(errors).length;

  return (
    <>
      <Navbar mode="page" />
      <div className="arrive" aria-hidden="true">
        <div className="arrive__veil" />
        <div className="arrive__streaks" />
      </div>
      <main id="main" className="booking-main">
        <div className="container">
          <header className="booking-hero">
            <div className="booking-hero__bg" aria-hidden="true">
              <div data-depth="5">
                <img
                  src="./media/booking-p2-1600.webp"
                  srcSet="./media/booking-p2-900.webp 900w, ./media/booking-p2-1600.webp 1600w"
                  sizes="(max-width: 900px) 100vw, 70vw"
                  alt=""
                  width="1600"
                  height="982"
                />
              </div>
            </div>
            <div className="booking-hero__visual" aria-hidden="true">
              <div className="bh-frame">
                <span className="bh-sun" data-depth="5" />
                <span className="bh-ring" data-depth="2" />
                <figure className="bh-arch" data-depth="8">
                  <img
                    src="./media/booking-p3-1100.webp"
                    srcSet="./media/booking-p3-640.webp 640w, ./media/booking-p3-1100.webp 1100w"
                    sizes="(max-width: 900px) 52vw, 24vw"
                    alt=""
                    width="1100"
                    height="1375"
                    fetchPriority="high"
                  />
                </figure>
              </div>
            </div>
            <a className="back-link" href="./index.html#packages">
              <Icon name="arrowLeft" size={16} /> Back to Safari Packages
            </a>
            <p className="eyebrow">Wild Yala Safari · Booking</p>
            <h1 className="heading">
              Book Your <em>Safari</em>
            </h1>
            <p className="lede">Plan your unforgettable Sri Lankan wildlife adventure with Wild Yala Safari.</p>
            <ol className="steps" aria-label="Booking steps">
              <li className="is-done">
                <span>1</span> Safari selected
              </li>
              <li className="is-current">
                <span>2</span> Your details
              </li>
              <li>
                <span>3</span> Payment
              </li>
            </ol>
          </header>

          <div className="booking-grid">
            <div className="booking-col">
              <form ref={formRef} className="bform glass" noValidate onSubmit={(e) => { e.preventDefault(); onPay(); }} aria-labelledby="bform-title">
                <div className="bform__head">
                  <h2 id="bform-title">Your Details</h2>
                  <p>
                    Fields marked <span className="field__req">*</span> are required.
                  </p>
                </div>
                {touched && errorCount ? (
                  <p className="bform__alert" role="alert">
                    <Icon name="info" size={16} /> Please complete the {errorCount === 1 ? 'highlighted field' : `${errorCount} highlighted fields`} to continue.
                  </p>
                ) : null}

                <div className="form-row">
                  <Field id="bk-name" label="Full Name" required icon="user" value={form.name} onChange={set('name')} error={errors.name} autoComplete="name" />
                  <Field id="bk-email" label="Email Address" required type="email" icon="mail" value={form.email} onChange={set('email')} error={errors.email} autoComplete="email" />
                </div>
                <div className="form-row">
                  <Field id="bk-phone" label="WhatsApp / Phone Number" required type="tel" icon="whatsapp" value={form.phone} onChange={set('phone')} error={errors.phone} autoComplete="tel" />
                  <Field id="bk-country" label="Country" required icon="globe" list="bk-country-list" value={form.country} onChange={set('country')} error={errors.country} autoComplete="country-name" maxLength={60} />
                  <datalist id="bk-country-list">
                    {COUNTRIES.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>
                <div className="form-row">
                  <DatePicker id="bk-date" label="Safari Date" required value={form.date} onChange={set('date')} error={errors.date} min={today} />
                  <DatePicker id="bk-arrival" label="Arrival Date to Sri Lanka (optional)" value={form.arrival} onChange={set('arrival')} error={errors.arrival} min={today} />
                </div>
                <Field id="bk-pickup" label="Pickup Location (hotel or address)" required icon="pin" value={form.pickup} onChange={set('pickup')} error={errors.pickup} autoComplete="street-address" />
                <Field id="bk-requests" label="Special Requests / Additional Information (optional)" textarea rows={4} value={form.requests} onChange={set('requests')} />
              </form>

              <PaymentSection
                price={price}
                billing={sel.billingCurrency}
                onBilling={(c) => setSel((s) => ({ ...s, billingCurrency: c }))}
                onPay={onPay}
                onEnquire={() => setEnqOpen(true)}
              />

              <p className="confirm-note">
                <Icon name="info" size={18} />
                <span>
                  <strong>Booking Confirmation:</strong> Our team will contact you via WhatsApp or email to confirm your Safari and provide payment details. Full payment is required to confirm the Safari Booking.
                </span>
              </p>
            </div>

            <div className="booking-aside">
              <BookingSummary sel={sel} price={price} fromUser={initial.fromUser} date={form.date ? formatLong(form.date) : ''} />
            </div>
          </div>
        </div>
      </main>
      <Footer mode="page" />

      <PaymentModal
        open={payOpen}
        onClose={() => {
          setPayOpen(false);
          if (returnRef) window.location.replace('./booking.html');
        }}
        sel={sel}
        price={price}
        billing={sel.billingCurrency}
        customer={{ name: form.name, date: form.date ? formatLong(form.date) : '' }}
        form={form}
        returnRef={returnRef}
      />
      <EnquiryModal open={enqOpen} onClose={() => setEnqOpen(false)} text={bookingText(sel, price, form)} onSend={(via) => saveInquiry(sel, form, via)} />
    </>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BookingApp />
  </StrictMode>
);
