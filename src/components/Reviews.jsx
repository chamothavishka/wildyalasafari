import { useState } from 'react';
import { REVIEWS, mailtoLink } from '../data/content.js';
import { SectionTag, Heading, Modal, CloseButton, Field, Stars, Button } from './ui.jsx';
import Icon from './Icon.jsx';
import { COUNTRIES } from '../data/countries.js';

function ReviewCard({ review }) {
  return (
    <li className="review glass">
      <div className="review__top">
        <Icon name="quote" size={30} className="review__quote" />
        <Stars value={review.rating} />
      </div>
      <p className="review__text">{review.text}</p>
      <div className="review__who">
        {review.photo ? (
          <img className="review__avatar review__avatar--photo" src={review.photo} alt="" width="40" height="40" loading="lazy" decoding="async" />
        ) : (
          <span className="review__avatar" aria-hidden="true">
            {review.name.slice(0, 1)}
          </span>
        )}
        <span>
          <strong>{review.name}</strong>
          {review.role ? <small className="review__role">{review.role}</small> : null}
          <small>{[review.country, review.safari, review.date].filter(Boolean).join(' · ')}</small>
        </span>
      </div>
    </li>
  );
}

/** Placeholder slot shown until genuine reviews are added. */
function ReviewSlot({ hidden }) {
  return (
    <li className="review review--slot glass" aria-hidden={hidden || undefined}>
      <div className="review__top">
        <Icon name="quote" size={30} className="review__quote" />
        <span className="chip chip--sm">Review slot</span>
      </div>
      <Stars value={0} />
      <span className="review__bar" style={{ width: '92%' }} />
      <span className="review__bar" style={{ width: '78%' }} />
      <span className="review__bar" style={{ width: '64%' }} />
      <div className="review__who">
        <span className="review__avatar review__avatar--empty" />
        <span className="review__bar review__bar--name" />
      </div>
    </li>
  );
}

function ShareModal({ open, onClose }) {
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [country, setCountry] = useState('');
  const [text, setText] = useState('');
  const [errors, setErrors] = useState({});

  const submit = (e) => {
    e.preventDefault();
    const errs = {};
    if (!name.trim()) errs.name = 'Please enter your name.';
    if (country.trim().length < 2) errs.country = 'Please enter your country.';
    if (text.trim().length < 10) errs.text = 'Please write a few words about your safari.';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    const body = [`Rating: ${rating}/5`, `Name: ${name.trim()}`, role.trim() ? `Role: ${role.trim()}` : null, `Country: ${country.trim()}`, '', text.trim()]
      .filter((l) => l !== null)
      .join('\n');
    window.location.href = mailtoLink(`Safari review from ${name.trim()} (${rating}/5)`, body);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} labelledBy="share-title" className="share">
      <div className="modal__head">
        <div>
          <h3 id="share-title">Share Your Safari Story</h3>
          <p>Travelled with Wild Yala Safari? Tell us about your experience — your words help other travellers plan their adventure.</p>
        </div>
        <CloseButton onClick={onClose} />
      </div>
      <form onSubmit={submit} noValidate>
        <p className="label">Your rating</p>
        <div className="rate" role="radiogroup" aria-label="Your rating" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              aria-label={`${n} star${n > 1 ? 's' : ''}`}
              className={`rate__star ${(hover || rating) >= n ? 'is-on' : ''}`}
              onMouseEnter={() => setHover(n)}
              onClick={() => setRating(n)}
            >
              <Icon name="star" size={28} />
            </button>
          ))}
        </div>
        <Field id="rv-name" label="Your name" required value={name} onChange={(e) => setName(e.target.value)} error={errors.name} autoComplete="name" />
        <div className="form-row">
          <Field id="rv-role" label="Role (e.g. Wildlife Photographer)" value={role} onChange={(e) => setRole(e.target.value)} maxLength={60} />
          <Field id="rv-country" label="Country" required list="rv-country-list" value={country} onChange={(e) => setCountry(e.target.value)} error={errors.country} autoComplete="country-name" maxLength={60} />
          <datalist id="rv-country-list">
            {COUNTRIES.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
        <Field id="rv-text" label="Your review" required textarea rows={4} value={text} onChange={(e) => setText(e.target.value)} error={errors.text} />
        <Button type="submit" className="btn--block" iconLeft="pen">
          Send My Review
        </Button>
        <p className="form-fine">This opens your email app with your review ready to send.</p>
      </form>
    </Modal>
  );
}

export default function Reviews() {
  const [open, setOpen] = useState(false);
  const hasReviews = REVIEWS.length > 0;
  const rowA = hasReviews ? REVIEWS : Array.from({ length: 5 });
  const rowB = hasReviews ? [...REVIEWS].reverse() : Array.from({ length: 5 });
  const avg = hasReviews ? REVIEWS.reduce((s, r) => s + r.rating, 0) / REVIEWS.length : 0;

  const renderRow = (items, reverse) => (
    <div className={`marquee ${reverse ? 'marquee--reverse' : ''}`}>
      <ul className="marquee__track">
        {[...items, ...items].map((r, i) =>
          hasReviews ? <ReviewCard key={i} review={r} /> : <ReviewSlot key={i} hidden={i >= items.length} />
        )}
      </ul>
    </div>
  );

  return (
    <section id="reviews" className="section reviews" aria-labelledby="reviews-title">
      <div className="reviews__ambient" aria-hidden="true" />
      <div className="container reviews__head">
        <div>
          <SectionTag>Reviews</SectionTag>
          <Heading id="reviews-title">
            Stories from the <em>Wild</em>
          </Heading>
          <p className="lede" data-reveal="up">
            What our guests say about their time in Yala with Wild Yala Safari.
          </p>
        </div>
        <div className="reviews__card glass" data-reveal="right">
          <div className="reviews__card-top">
            <span className="reviews__badge">
              <Icon name="chat" size={20} />
            </span>
            <div>
              <strong>{hasReviews ? `${avg.toFixed(1)} average rating` : 'Guest reviews coming soon'}</strong>
              <Stars value={Math.round(avg)} size={14} />
            </div>
          </div>
          <p>
            {hasReviews
              ? `Based on ${REVIEWS.length} verified guest ${REVIEWS.length === 1 ? 'review' : 'reviews'}.`
              : 'We are gathering verified reviews from our guests. Travelled with us? We would love to hear about your safari.'}
          </p>
          <Button variant="ghost" className="btn--block" iconLeft="pen" onClick={() => setOpen(true)}>
            Share Your Experience
          </Button>
        </div>
      </div>

      <div className="reviews__rows" data-reveal="fade">
        {renderRow(rowA, false)}
        {renderRow(rowB, true)}
      </div>

      <ShareModal open={open} onClose={() => setOpen(false)} />
    </section>
  );
}
