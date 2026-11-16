import { useState } from 'react';
import { CONTACT, CONTACT_COPY, BRAND, whatsappLink, mailtoLink } from '../data/content.js';
import { scrollToSection } from '../lib/gsap.js';
import { sendInquiry } from '../lib/api.js';
import { SectionTag, Heading, Field, Button } from './ui.jsx';
import Icon from './Icon.jsx';

function ContactCard({ icon, label, value, href, action, external, delay }) {
  const Tag = href ? 'a' : 'div';
  return (
    <Tag
      className={`ccard glass ${href ? 'ccard--link' : ''}`}
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      data-reveal="up"
      data-delay={delay}
    >
      <span className="ccard__icon">
        <Icon name={icon} size={22} />
      </span>
      <span className="ccard__label">{label}</span>
      <strong className="ccard__value">{value}</strong>
      {action ? (
        <span className="ccard__action">
          {action} <Icon name="arrowUpRight" size={14} />
        </span>
      ) : null}
    </Tag>
  );
}

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', interest: CONTACT_COPY.interests[0], message: '' });
  const [errors, setErrors] = useState({});
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Please enter your name.';
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) errs.email = 'Please enter a valid email address.';
    if (form.message.trim().length < 5) errs.message = 'Please add a short message.';
    setErrors(errs);
    return !Object.keys(errs).length;
  };

  const message = () =>
    `Hello Wild Yala Safari,\n\nName: ${form.name.trim()}\nEmail: ${form.email.trim()}\nInterested in: ${form.interest}\n\n${form.message.trim()}`;

  const send = (via) => (e) => {
    e.preventDefault();
    if (!validate()) return;
    // Keep a copy for the team; WhatsApp / e-mail still opens even if this fails.
    sendInquiry({ source: 'contact', via, name: form.name.trim(), email: form.email.trim(), interest: form.interest, message: form.message.trim() }).catch(() => {});
    if (via === 'whatsapp') window.open(whatsappLink(message()), '_blank', 'noopener');
    else window.location.href = mailtoLink(`Safari enquiry — ${form.interest}`, message());
  };

  return (
    <section id="contact" className="section contact" aria-labelledby="contact-title">
      <div className="contact__ambient" aria-hidden="true">
        <div className="contact__leopard" style={{ backgroundImage: 'url(./media/eye-sm.webp)' }} />
      </div>
      <div className="container">
        <SectionTag>Contact</SectionTag>
        <Heading id="contact-title">
          Plan Your <em>Wild Escape</em>
        </Heading>
        <p className="lede" data-reveal="up">
          Questions about a safari, group bookings or pick-up locations? Our team is happy to help — reach us on WhatsApp, by email or by phone.
        </p>

        <div className="contact__grid">
          <div className="contact__cards">
            <ContactCard icon="whatsapp" label="WhatsApp" value="Chat with our team" href={whatsappLink('Hello Wild Yala Safari! I would like to ask about a safari.')} action="Start a chat" external />
            <ContactCard icon="mail" label="Email" value={CONTACT.email} href={mailtoLink('Safari enquiry')} action="Send an email" delay="0.05" />
            {CONTACT.phone ? (
              <ContactCard icon="phone" label="Phone" value={CONTACT.phone} href={`tel:${CONTACT.phone.replace(/\s/g, '')}`} action="Call us" delay="0.1" />
            ) : null}
            <ContactCard icon="pin" label="Location" value={CONTACT.location} href={CONTACT.mapUrl} action="Open in Google Maps" external delay="0.15" />

            <a
              className="where glass"
              href="https://www.google.com/maps/search/?api=1&query=Yala+National+Park+Sri+Lanka"
              target="_blank"
              rel="noopener noreferrer"
              data-reveal="up"
            >
              <span className="where__radar" aria-hidden="true">
                <span />
                <span />
                <span />
                <i />
              </span>
              <span className="where__text">
                <span className="ccard__label">Where we explore</span>
                <strong>Yala National Park</strong>
                <small>{BRAND.coords} · Southern Province</small>
              </span>
              <span className="ccard__action">
                Open map <Icon name="arrowUpRight" size={14} />
              </span>
            </a>
          </div>

          <form className="enquiry glass" onSubmit={send('whatsapp')} noValidate data-reveal="right" aria-labelledby="enquiry-title">
            <h3 id="enquiry-title">Send an Enquiry</h3>
            <p className="enquiry__sub">Tell us your plans and we will reply as soon as possible.</p>
            <div className="form-row">
              <Field id="en-name" label="Your name" required value={form.name} onChange={set('name')} error={errors.name} autoComplete="name" />
              <Field id="en-email" label="Email address" required type="email" value={form.email} onChange={set('email')} error={errors.email} autoComplete="email" />
            </div>
            <fieldset className="chips">
              <legend className="label">Interested in</legend>
              {CONTACT_COPY.interests.map((opt) => (
                <label key={opt} className={`chip-opt ${form.interest === opt ? 'is-on' : ''}`}>
                  <input type="radio" name="interest" value={opt} checked={form.interest === opt} onChange={set('interest')} />
                  {opt}
                </label>
              ))}
            </fieldset>
            <Field id="en-msg" label="Message" required textarea rows={4} value={form.message} onChange={set('message')} error={errors.message} />
            <div className="enquiry__actions">
              <Button type="submit" iconLeft="whatsapp">
                Send via WhatsApp
              </Button>
              <Button type="button" variant="ghost" iconLeft="send" onClick={send('email')}>
                Send via Email
              </Button>
            </div>
            <p className="form-fine">Your message opens in WhatsApp or your email app, ready to send.</p>
          </form>
        </div>

      </div>

      <div className="finale">
        <div className="finale__bg" data-parallax-bg aria-hidden="true" style={{ backgroundImage: 'url(./media/finale-leopard.webp)' }} />
        <div className="container finale__inner">
          <p className="eyebrow" data-reveal="fade">
            Explore the Wild
          </p>
          <Heading className="finale__title">
            Ready for Your <em>Yala</em> Adventure?
          </Heading>
          <div className="finale__actions" data-reveal="up">
            <a className="btn btn--primary btn--glow" href="#packages" onClick={(e) => { e.preventDefault(); scrollToSection('packages'); }}>
              <span className="btn__label">Book Your Safari</span>
              <Icon name="arrowUpRight" size={18} className="btn__icon" />
            </a>
            <a className="btn btn--ghost" href={whatsappLink('Hello Wild Yala Safari!')} target="_blank" rel="noopener noreferrer">
              <Icon name="whatsapp" size={18} />
              <span className="btn__label">WhatsApp Us</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
