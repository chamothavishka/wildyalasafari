/**
 * E-mail sending (SMTP via Nodemailer; credentials come from the environment).
 *
 * The confirmation e-mail is claimed with one atomic update (NOT_SENT/FAILED -> SENDING) so that
 * duplicate payment notifications, retries or two server instances can never send it twice.
 * A failure here is recorded on the booking (email.status = FAILED) and NEVER touches the
 * payment or booking status — a paid booking stays PAID and CONFIRMED.
 */
import nodemailer from 'nodemailer';
import { Booking } from '../models/Booking.js';
import { confirmationEmail } from '../emails/confirmation.js';
import { passwordResetEmail } from '../emails/passwordReset.js';
import { log } from '../utils/logger.js';

const STALE_CLAIM_MS = 10 * 60 * 1000; // a SENDING claim older than this is considered abandoned (crashed process)

let override = null; // tests inject a transport here
let cached = null;
let cachedKey = '';

export const setTransportOverride = (t) => {
  override = t;
};

function getTransport(cfg) {
  if (override) return override;
  const e = cfg.email;
  const key = `${e.host}|${e.port}|${e.secure}|${e.user}|${e.password}`;
  if (cached && cachedKey === key) return cached;
  cached = nodemailer.createTransport({
    host: e.host,
    port: e.port,
    secure: e.secure,
    auth: e.user ? { user: e.user, pass: e.password } : undefined,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });
  cachedKey = key;
  return cached;
}

const emailConfigured = (cfg) => Boolean(override || cfg.email.enabled);
const shortError = (err) => String((err && err.message) || err || 'unknown error').replace(/\s+/g, ' ').slice(0, 300);

/**
 * Send the booking confirmation for a PAID + CONFIRMED booking, at most once.
 * @returns {Promise<{sent:boolean, reason?:string}>}
 */
export async function sendConfirmationEmail(bookingId, cfg) {
  const now = new Date();
  const claimed = await Booking.findOneAndUpdate(
    {
      _id: bookingId,
      paymentStatus: 'PAID',
      bookingStatus: 'CONFIRMED',
      $or: [{ 'email.status': { $in: ['NOT_SENT', 'FAILED'] } }, { 'email.status': 'SENDING', 'email.claimedAt': { $lt: new Date(now.getTime() - STALE_CLAIM_MS) } }],
    },
    { $set: { 'email.status': 'SENDING', 'email.claimedAt': now }, $inc: { 'email.attempts': 1 } },
    { returnDocument: 'after' },
  );
  if (!claimed) return { sent: false, reason: 'already sent, in progress, or booking not paid' };

  if (!emailConfigured(cfg)) {
    await Booking.updateOne({ _id: bookingId }, { $set: { 'email.status': 'FAILED', 'email.lastError': 'E-mail service is not configured (EMAIL_HOST / EMAIL_FROM).' } });
    log.error('Confirmation e-mail NOT sent: e-mail is not configured', { ref: claimed.bookingRef });
    return { sent: false, reason: 'email not configured' };
  }

  try {
    const mail = confirmationEmail(claimed, cfg.siteUrl);
    const info = await getTransport(cfg).sendMail({ from: cfg.email.from, to: claimed.customer.email, subject: mail.subject, text: mail.text, html: mail.html });
    await Booking.updateOne({ _id: bookingId }, { $set: { 'email.status': 'SENT', 'email.sentAt': new Date(), 'email.messageId': info && info.messageId ? String(info.messageId) : undefined }, $unset: { 'email.lastError': '' } });
    log.info('Confirmation e-mail sent', { ref: claimed.bookingRef });
    return { sent: true };
  } catch (err) {
    await Booking.updateOne({ _id: bookingId }, { $set: { 'email.status': 'FAILED', 'email.lastError': shortError(err) } });
    log.error('Confirmation e-mail failed — booking stays PAID/CONFIRMED; retry with "npm run emails:retry"', { ref: claimed.bookingRef, error: shortError(err) });
    return { sent: false, reason: 'send failed' };
  }
}

/** Retry every paid booking whose confirmation e-mail has not gone out. Returns counts. */
export async function retryPendingConfirmations(cfg) {
  const stale = new Date(Date.now() - STALE_CLAIM_MS);
  const due = await Booking.find({
    paymentStatus: 'PAID',
    bookingStatus: 'CONFIRMED',
    $or: [{ 'email.status': { $in: ['NOT_SENT', 'FAILED'] } }, { 'email.status': 'SENDING', 'email.claimedAt': { $lt: stale } }],
  }).select('_id');
  let sent = 0;
  for (const b of due) {
    const r = await sendConfirmationEmail(b._id, cfg);
    if (r.sent) sent += 1;
  }
  return { due: due.length, sent };
}

export async function sendPasswordResetEmail({ user, token }, cfg) {
  if (!emailConfigured(cfg)) {
    log.error('Password reset e-mail NOT sent: e-mail is not configured');
    return false;
  }
  try {
    const resetUrl = `${cfg.siteUrl}/reset-password?token=${token}`;
    const mail = passwordResetEmail({ name: user.name, resetUrl, minutes: cfg.passwordResetTtlMinutes, siteUrl: cfg.siteUrl });
    await getTransport(cfg).sendMail({ from: cfg.email.from, to: user.email, subject: mail.subject, text: mail.text, html: mail.html });
    return true;
  } catch (err) {
    log.error('Password reset e-mail failed', { error: shortError(err) });
    return false;
  }
}

/** Diagnostics for `npm run check`: is the SMTP login accepted? (sends nothing) */
export async function verifyEmailSetup(cfg) {
  if (!emailConfigured(cfg)) return { ok: false, error: 'EMAIL_HOST / EMAIL_FROM are not set' };
  try {
    await getTransport(cfg).verify();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: shortError(err) };
  }
}

/** Diagnostics for `npm run check -- --send-test you@example.com`: sends one plain test message. */
export async function sendTestEmail(to, cfg) {
  if (!emailConfigured(cfg)) return { ok: false, error: 'EMAIL_HOST / EMAIL_FROM are not set' };
  try {
    const info = await getTransport(cfg).sendMail({
      from: cfg.email.from,
      to,
      subject: 'Wild Yala Safari — e-mail test',
      text: 'If you can read this, your Wild Yala Safari server can send e-mail. Booking confirmations will be delivered the same way.',
    });
    return { ok: true, messageId: info && info.messageId };
  } catch (err) {
    return { ok: false, error: shortError(err) };
  }
}
