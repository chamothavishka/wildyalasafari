/**
 * Sends through the REAL SMTP code path (Nodemailer -> an SMTP server on localhost) and reads the
 * message back, proving the e-mail that reaches an inbox contains the right details.
 */
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { SMTPServer } from 'smtp-server';
import { simpleParser } from 'mailparser';
import { startTestApp, createViaApi, notifyBody, postNotify, waitFor } from './helpers.js';
import { setTransportOverride } from '../services/emailService.js';
import { Booking } from '../models/Booking.js';

let ctx;
let sink;
const received = [];

before(async () => {
  sink = new SMTPServer({
    authOptional: false,
    allowInsecureAuth: true,
    disabledCommands: ['STARTTLS'],
    onAuth(auth, _session, cb) {
      if (auth.username === 'mailer' && auth.password === 'mailer-pass') return cb(null, { user: 'mailer' });
      return cb(new Error('Invalid login'));
    },
    onData(stream, _session, cb) {
      const chunks = [];
      stream.on('data', (c) => chunks.push(c));
      stream.on('end', async () => {
        received.push(await simpleParser(Buffer.concat(chunks)));
        cb();
      });
    },
  });
  await new Promise((r) => sink.listen(0, '127.0.0.1', r));
  const { port } = sink.server.address();
  ctx = await startTestApp({ EMAIL_HOST: '127.0.0.1', EMAIL_PORT: String(port), EMAIL_SECURE: 'false', EMAIL_USER: 'mailer', EMAIL_PASSWORD: 'mailer-pass', EMAIL_FROM: 'Wild Yala Safari <bookings@wildyala.test>' });
  setTransportOverride(null); // use the real Nodemailer SMTP transport configured from the environment
});
after(async () => {
  await ctx.stop();
  await new Promise((r) => sink.close(r));
});

test('a verified payment delivers a real, well-formed confirmation e-mail over SMTP', async () => {
  const { ref, checkout } = await createViaApi(ctx, { name: 'Amal Perera', pickupLocation: 'Hotel <script>alert(1)</script> Yala', email: 'amal@example.com' });
  const res = await postNotify(ctx, notifyBody(ctx.cfg, { orderId: ref, amount: checkout.fields.amount, currency: checkout.fields.currency, paymentId: '910000000001' }));
  assert.equal(res.status, 200);
  await waitFor(() => received.length === 1, { timeout: 5000 });

  const m = received[0];
  assert.equal(m.to.value[0].address, 'amal@example.com');
  assert.equal(m.from.value[0].address, 'bookings@wildyala.test');
  assert.match(m.subject, new RegExp(`confirmed — ${ref}`));
  assert.ok(m.html.includes('PAID'));
  assert.ok(m.html.includes('CONFIRMED'));
  assert.ok(m.html.includes('910000000001'));
  assert.ok(m.html.includes(ref));
  assert.ok(!m.html.includes('<script>'), 'customer-supplied text is HTML-escaped');
  assert.ok(m.html.includes('&lt;script&gt;'));
  assert.ok(m.text.includes('Booking ID:') && m.text.includes(ref));
  assert.equal((await Booking.findOne({ bookingRef: ref })).email.status, 'SENT');

  // a duplicate gateway notification must not produce another message
  await postNotify(ctx, notifyBody(ctx.cfg, { orderId: ref, amount: checkout.fields.amount, currency: checkout.fields.currency, paymentId: '910000000001' }));
  await new Promise((r) => setTimeout(r, 400));
  assert.equal(received.length, 1);
});

test('wrong SMTP credentials: the payment stays PAID/CONFIRMED and the e-mail is recorded as FAILED', async () => {
  ctx.cfg.email.password = 'wrong-password';
  const { ref, checkout } = await createViaApi(ctx, { email: 'bob@example.com' });
  await postNotify(ctx, notifyBody(ctx.cfg, { orderId: ref, amount: checkout.fields.amount, currency: checkout.fields.currency }));
  await waitFor(async () => ['SENT', 'FAILED'].includes((await Booking.findOne({ bookingRef: ref })).email.status), { timeout: 8000 });
  const b = await Booking.findOne({ bookingRef: ref });
  assert.equal(b.paymentStatus, 'PAID');
  assert.equal(b.bookingStatus, 'CONFIRMED');
  assert.equal(b.email.status, 'FAILED');
  assert.ok(b.email.lastError.length > 0);
  assert.ok(!b.email.lastError.includes('wrong-password'), 'the error never echoes the password');
});
