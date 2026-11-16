import { CONTACT, BRAND } from '../../src/data/content.js';
import { esc, row, badge, layout, heading, paragraph, COLORS } from './layout.js';

const LKR = (n) => `LKR ${Number(n).toLocaleString('en-US')}`;
const longDate = (iso) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

const money = (b) => `${b.billing.currency} ${Number(b.billing.amountFixed).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/**
 * Booking confirmation. Only ever built for a booking whose payment was verified server-side.
 * @returns {{subject:string, html:string, text:string}}
 */
export function confirmationEmail(booking, siteUrl) {
  const b = booking;
  const first = b.customer.name.split(/\s+/)[0];
  const guests = [`${b.adults} adult${b.adults === 1 ? '' : 's'}`, b.children ? `${b.children} child${b.children === 1 ? '' : 'ren'} (6–11)` : '', b.infants ? `${b.infants} child${b.infants === 1 ? '' : 'ren'} (1–5, free)` : '']
    .filter(Boolean)
    .join(', ');
  const total = money(b);
  const alsoLKR = b.billing.currency === 'LKR' ? '' : ` <span style="color:${COLORS.muted};font-weight:400">(${LKR(b.pricing.totalLKR)})</span>`;
  const subject = `Your safari is confirmed — ${b.bookingRef}`;

  const rows = [
    row('Booking ID', `<b>${esc(b.bookingRef)}</b>`, { strong: true }),
    row('Safari', `${esc(b.safari.name)}<br><span style="color:${COLORS.muted}">${esc(b.safari.time)}</span>`),
    row('Safari date', esc(longDate(b.safariDate))),
    row('Jeep type', `${esc(b.jeep.name)}`),
    row('Number of jeeps', esc(b.jeeps)),
    row('Passengers', esc(guests)),
    row('Pickup location', esc(b.pickupLocation)),
    b.specialRequests ? row('Special requests', esc(b.specialRequests)) : '',
    row('Total paid', `<b>${esc(total)}</b>${alsoLKR}`, { strong: true }),
    row('Payment status', badge('PAID — PAYMENT CONFIRMED')),
    row('Booking status', badge('CONFIRMED')),
    row('Transaction reference', esc(b.payment.transactionId || '—')),
  ].join('');

  const contactLines = [CONTACT.phone ? `WhatsApp / phone: ${esc(CONTACT.phone)}` : '', `Email: ${esc(CONTACT.email)}`].filter(Boolean).join(' &nbsp;·&nbsp; ');

  const body = `
    <p style="margin:6px 0 0;text-align:center;font:600 11px 'Segoe UI',Arial,sans-serif;letter-spacing:.24em;color:${COLORS.orange}">BOOKING CONFIRMED</p>
    ${heading(`Ayubowan, ${esc(first)}!`)}
    ${paragraph(`Thank you — your payment has been received and your safari booking with <b>${esc(BRAND.name)}</b> is <b>confirmed</b>.`, true)}
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:22px">${rows}</table>
    ${paragraph(`Your guide will collect you from your pickup location on the morning of your safari. Timings can vary slightly with your hotel location, park conditions and weather; we will contact you on WhatsApp or by email if anything changes.`)}
    ${paragraph(`Please keep this email — quote your Booking ID <b>${esc(b.bookingRef)}</b> whenever you contact us. Wildlife sightings can never be guaranteed; every drive is a real wildlife encounter.`)}
    <p style="margin:22px 0 4px;text-align:center"><a href="${esc(siteUrl)}" style="display:inline-block;padding:12px 26px;border-radius:999px;background:${COLORS.orange};color:#1c1007;font:700 13px 'Segoe UI',Arial,sans-serif;text-decoration:none;letter-spacing:.06em">VISIT WILD YALA SAFARI</a></p>`;

  const html = layout({
    title: subject,
    preheader: `Booking ${b.bookingRef} is confirmed — ${b.safari.name} on ${longDate(b.safariDate)}.`,
    logoUrl: `${siteUrl}/brand/logo.png`,
    bodyHtml: body,
    footerHtml: `${esc(BRAND.name)} — ${esc(BRAND.tagline)}<br>${esc(CONTACT.location)}<br>${contactLines}`,
  });

  const text = [
    `Ayubowan, ${first}!`,
    '',
    `Your payment has been received and your safari booking with ${BRAND.name} is CONFIRMED.`,
    '',
    `Booking ID:        ${b.bookingRef}`,
    `Safari:            ${b.safari.name} (${b.safari.time})`,
    `Safari date:       ${longDate(b.safariDate)}`,
    `Jeep type:         ${b.jeep.name}`,
    `Number of jeeps:   ${b.jeeps}`,
    `Passengers:        ${guests}`,
    `Pickup location:   ${b.pickupLocation}`,
    b.specialRequests ? `Special requests:  ${b.specialRequests}` : null,
    `Total paid:        ${total}${b.billing.currency === 'LKR' ? '' : ` (${LKR(b.pricing.totalLKR)})`}`,
    `Payment status:    PAID - PAYMENT CONFIRMED`,
    `Booking status:    CONFIRMED`,
    `Transaction ref:   ${b.payment.transactionId || '-'}`,
    '',
    `Questions? ${CONTACT.phone ? `WhatsApp/phone ${CONTACT.phone} · ` : ''}${CONTACT.email}`,
    `${BRAND.name} — ${CONTACT.location}`,
  ]
    .filter((l) => l !== null)
    .join('\n');

  return { subject, html, text };
}
