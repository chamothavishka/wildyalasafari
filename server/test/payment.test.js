import test, { before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { startTestApp, createViaApi, notifyBody, postNotify, waitFor } from './helpers.js';
import { Booking } from '../models/Booking.js';
import { retryPendingConfirmations, sendConfirmationEmail } from '../services/emailService.js';

let ctx;
before(async () => {
  ctx = await startTestApp();
});
after(async () => ctx.stop());
beforeEach(() => {
  ctx.mails.length = 0;
  ctx.mailer.failNext = 0;
});

const fresh = async (over = {}) => {
  const { ref, checkout } = await createViaApi(ctx, over);
  return { ref, amount: checkout.fields.amount, currency: checkout.fields.currency };
};
const load = (ref) => Booking.findOne({ bookingRef: ref });
const emailSettled = (ref) => waitFor(async () => ['SENT', 'FAILED'].includes((await load(ref)).email.status));

test('returning to the website does NOT pay or confirm anything', async () => {
  const { ref } = await fresh();
  const status = await ctx.api.get(`/api/bookings/${ref}/status`);
  assert.equal(status.body.paymentStatus, 'PENDING');
  const b = await load(ref);
  assert.equal(b.paymentStatus, 'PENDING');
  assert.equal(b.bookingStatus, 'PENDING');
  assert.equal(ctx.mails.length, 0);
});

test('SUCCESS: verified notification -> PAID + CONFIRMED + exactly one confirmation e-mail with the right details', async () => {
  const { ref, amount, currency } = await fresh();
  const res = await postNotify(ctx, notifyBody(ctx.cfg, { orderId: ref, amount, currency, paymentId: '320000000777' }));
  assert.equal(res.status, 200);

  let b = await load(ref);
  assert.equal(b.paymentStatus, 'PAID');
  assert.equal(b.bookingStatus, 'CONFIRMED');
  assert.equal(b.payment.transactionId, '320000000777');
  assert.equal(b.payment.method, 'VISA');
  assert.ok(b.payment.verifiedAt);

  await emailSettled(ref);
  b = await load(ref);
  assert.equal(b.email.status, 'SENT');
  assert.equal(ctx.mails.length, 1);
  const mail = ctx.mails[0];
  assert.equal(mail.to, 'jane@example.com');
  for (const needle of [ref, 'Jane', 'Morning Safari', 'Toyota Hilux', '320000000777', 'PAID', 'CONFIRMED', 'Elephant Hotel, Tissamaharama', '2 adults', '1 child', 'USD 175.00', 'LKR 52,500']) {
    assert.ok(mail.html.includes(needle) || mail.text.includes(needle), `e-mail should contain "${needle}"`);
  }
  assert.match(mail.subject, new RegExp(ref));

  const status = await ctx.api.get(`/api/bookings/${ref}/status`);
  assert.equal(status.body.paymentStatus, 'PAID');
  assert.equal(status.body.bookingStatus, 'CONFIRMED');
});

test('DUPLICATE notification: no second payment, no second booking change, no second e-mail', async () => {
  const { ref, amount, currency } = await fresh();
  const body = notifyBody(ctx.cfg, { orderId: ref, amount, currency });
  const count = await Booking.countDocuments();
  assert.equal((await postNotify(ctx, body)).status, 200);
  await emailSettled(ref);
  for (let i = 0; i < 3; i += 1) assert.equal((await postNotify(ctx, body)).status, 200);
  await new Promise((r) => setTimeout(r, 150));
  assert.equal(ctx.mails.length, 1, 'only one confirmation e-mail');
  assert.equal(await Booking.countDocuments(), count, 'no extra booking records');
  const b = await load(ref);
  assert.equal(b.paymentStatus, 'PAID');
  assert.equal(b.events.filter((e) => e.type === 'PAYMENT_VERIFIED').length, 1);
  assert.equal(b.events.filter((e) => e.type === 'DUPLICATE_NOTIFICATION').length, 3);
});

test('CONCURRENT duplicate notifications are processed once (race-safe)', async () => {
  const { ref, amount, currency } = await fresh();
  const body = notifyBody(ctx.cfg, { orderId: ref, amount, currency });
  const results = await Promise.all(Array.from({ length: 12 }, () => postNotify(ctx, body)));
  assert.ok(results.every((r) => r.status === 200));
  await emailSettled(ref);
  await new Promise((r) => setTimeout(r, 200));
  assert.equal(ctx.mails.length, 1, 'exactly one e-mail from 12 simultaneous notifications');
  const b = await load(ref);
  assert.equal(b.events.filter((e) => e.type === 'PAYMENT_VERIFIED').length, 1);
  assert.equal(b.email.attempts, 1);
});

test('FAILED payment: payment FAILED, booking not confirmed, no e-mail', async () => {
  const { ref, amount, currency } = await fresh();
  const res = await postNotify(ctx, notifyBody(ctx.cfg, { orderId: ref, amount, currency, statusCode: -2, paymentId: '' }));
  assert.equal(res.status, 200);
  const b = await load(ref);
  assert.equal(b.paymentStatus, 'FAILED');
  assert.notEqual(b.bookingStatus, 'CONFIRMED');
  assert.equal(b.payment.transactionId, undefined);
  assert.equal(ctx.mails.length, 0);
  assert.equal(b.email.status, 'NOT_SENT');
});

test('CANCELLED by the gateway (status -1): payment CANCELLED, booking not confirmed, no e-mail', async () => {
  const { ref, amount, currency } = await fresh();
  await postNotify(ctx, notifyBody(ctx.cfg, { orderId: ref, amount, currency, statusCode: -1, paymentId: '' }));
  const b = await load(ref);
  assert.equal(b.paymentStatus, 'CANCELLED');
  assert.notEqual(b.bookingStatus, 'CONFIRMED');
  assert.equal(ctx.mails.length, 0);
});

test('CANCELLED by the customer (cancel_url): payment CANCELLED, then redirected back to the booking page', async () => {
  const { ref } = await fresh();
  const res = await ctx.api.get(`/api/payments/payhere/cancel?order=${ref}`);
  assert.equal(res.status, 302);
  assert.equal(res.headers.location, `http://localhost:4000/booking.html?order=${ref}`);
  const b = await load(ref);
  assert.equal(b.paymentStatus, 'CANCELLED');
  assert.notEqual(b.bookingStatus, 'CONFIRMED');
  assert.equal(ctx.mails.length, 0);
});

test('a cancel link can never undo a payment that was already verified', async () => {
  const { ref, amount, currency } = await fresh();
  await postNotify(ctx, notifyBody(ctx.cfg, { orderId: ref, amount, currency }));
  await ctx.api.get(`/api/payments/payhere/cancel?order=${ref}`);
  await postNotify(ctx, notifyBody(ctx.cfg, { orderId: ref, amount, currency, statusCode: -2, paymentId: '' }));
  const b = await load(ref);
  assert.equal(b.paymentStatus, 'PAID');
  assert.equal(b.bookingStatus, 'CONFIRMED');
});

test('a late success after an earlier cancel/failure still confirms (verified success always wins)', async () => {
  const { ref, amount, currency } = await fresh();
  await ctx.api.get(`/api/payments/payhere/cancel?order=${ref}`);
  assert.equal((await load(ref)).paymentStatus, 'CANCELLED');
  await postNotify(ctx, notifyBody(ctx.cfg, { orderId: ref, amount, currency }));
  const b = await load(ref);
  assert.equal(b.paymentStatus, 'PAID');
  assert.equal(b.bookingStatus, 'CONFIRMED');
});

test('PENDING notification (status 0) changes nothing', async () => {
  const { ref, amount, currency } = await fresh();
  await postNotify(ctx, notifyBody(ctx.cfg, { orderId: ref, amount, currency, statusCode: 0, paymentId: '' }));
  const b = await load(ref);
  assert.equal(b.paymentStatus, 'PENDING');
  assert.equal(ctx.mails.length, 0);
});

test('FORGED / tampered notifications are rejected and change nothing', async () => {
  const { ref, amount, currency } = await fresh();
  const forged = await postNotify(ctx, notifyBody(ctx.cfg, { orderId: ref, amount, currency, sign: false }));
  assert.equal(forged.status, 400);

  // valid signature but for a different (lower) amount than the booking: signature is fine, amount check must stop it
  const cheap = await postNotify(ctx, notifyBody(ctx.cfg, { orderId: ref, amount: '1.00', currency }));
  assert.equal(cheap.status, 200);
  // right amount, wrong currency
  await postNotify(ctx, notifyBody(ctx.cfg, { orderId: ref, amount, currency: 'LKR' }));
  // tampered after signing
  const t = notifyBody(ctx.cfg, { orderId: ref, amount: '1.00', currency });
  t.payhere_amount = amount;
  assert.equal((await postNotify(ctx, t)).status, 400);
  // wrong merchant
  const wrongMerchant = notifyBody(ctx.cfg, { orderId: ref, amount, currency });
  wrongMerchant.merchant_id = '999';
  assert.equal((await postNotify(ctx, wrongMerchant)).status, 400);
  // missing fields
  assert.equal((await ctx.api.post('/api/payments/payhere/notify').type('form').send({ order_id: ref })).status, 400);
  // unknown order (validly signed)
  assert.equal((await postNotify(ctx, notifyBody(ctx.cfg, { orderId: 'WYS-ZZZZZZZZZZ', amount, currency }))).status, 404);

  const b = await load(ref);
  assert.equal(b.paymentStatus, 'PENDING');
  assert.equal(b.bookingStatus, 'PENDING');
  assert.equal(b.events.filter((e) => e.type === 'AMOUNT_MISMATCH').length, 2);
  assert.equal(ctx.mails.length, 0);
});

test('amounts are compared numerically (12000 equals 12000.00)', async () => {
  const { ref } = await fresh({ billingCurrency: 'LKR', safariId: 'evening', adults: 1, children: 0 }); // 32,000 LKR
  const res = await postNotify(ctx, notifyBody(ctx.cfg, { orderId: ref, amount: '32000', currency: 'LKR' }));
  assert.equal(res.status, 200);
  assert.equal((await load(ref)).paymentStatus, 'PAID');
});

test('E-MAIL FAILURE after a verified payment: booking stays PAID + CONFIRMED, failure is recorded, retry sends once', async () => {
  const { ref, amount, currency } = await fresh();
  ctx.mailer.failNext = 1;
  const body = notifyBody(ctx.cfg, { orderId: ref, amount, currency });
  const res = await postNotify(ctx, body);
  assert.equal(res.status, 200, 'the gateway is still told everything is fine');
  await emailSettled(ref);

  let b = await load(ref);
  assert.equal(b.paymentStatus, 'PAID');
  assert.equal(b.bookingStatus, 'CONFIRMED');
  assert.equal(b.email.status, 'FAILED');
  assert.match(b.email.lastError, /SMTP connection refused/);
  assert.equal(ctx.mails.length, 0);

  // the gateway repeats its notification -> the failed e-mail recovers, still only one e-mail
  await postNotify(ctx, body);
  await waitFor(async () => (await load(ref)).email.status === 'SENT');
  assert.equal(ctx.mails.length, 1);
  b = await load(ref);
  assert.equal(b.paymentStatus, 'PAID');
  assert.equal(b.email.attempts, 2);
});

test('retry job sends pending confirmations exactly once and skips unpaid / already-sent bookings', async () => {
  const paid = await fresh();
  ctx.mailer.failNext = 1;
  await postNotify(ctx, notifyBody(ctx.cfg, { orderId: paid.ref, amount: paid.amount, currency: paid.currency }));
  await emailSettled(paid.ref);
  const unpaid = await fresh();
  assert.equal((await load(paid.ref)).email.status, 'FAILED');

  const first = await retryPendingConfirmations(ctx.cfg);
  assert.ok(first.sent >= 1);
  assert.equal((await load(paid.ref)).email.status, 'SENT');
  const second = await retryPendingConfirmations(ctx.cfg);
  assert.equal(second.sent, 0);
  assert.equal(ctx.mails.filter((m) => m.html.includes(paid.ref)).length, 1);
  assert.equal(ctx.mails.filter((m) => m.html.includes(unpaid.ref)).length, 0);
  assert.equal((await sendConfirmationEmail((await load(unpaid.ref))._id, ctx.cfg)).sent, false, 'an unpaid booking can never be e-mailed');
});

test('a second, different payment id on an already-paid booking is flagged, not confirmed again', async () => {
  const { ref, amount, currency } = await fresh();
  await postNotify(ctx, notifyBody(ctx.cfg, { orderId: ref, amount, currency, paymentId: '111' }));
  await emailSettled(ref);
  await postNotify(ctx, notifyBody(ctx.cfg, { orderId: ref, amount, currency, paymentId: '222' }));
  await new Promise((r) => setTimeout(r, 100));
  const b = await load(ref);
  assert.equal(b.payment.transactionId, '111');
  assert.equal(b.events.filter((e) => e.type === 'SECOND_PAYMENT_ATTEMPT').length, 1);
  assert.equal(ctx.mails.length, 1);
});

test('chargeback is recorded for review without silently changing the booking', async () => {
  const { ref, amount, currency } = await fresh();
  await postNotify(ctx, notifyBody(ctx.cfg, { orderId: ref, amount, currency }));
  await emailSettled(ref);
  await postNotify(ctx, notifyBody(ctx.cfg, { orderId: ref, amount, currency, statusCode: -3 }));
  const b = await load(ref);
  assert.equal(b.paymentStatus, 'CHARGEDBACK');
  assert.ok(b.events.some((e) => e.type === 'CHARGEBACK_REVIEW_NEEDED'));
});

test('notify endpoint is unavailable (503) rather than guessing when PayHere is not configured', async () => {
  const { createApp } = await import('../app.js');
  const request = (await import('supertest')).default;
  const app = request(createApp({ ...ctx.cfg, payhere: { ...ctx.cfg.payhere, enabled: false } }));
  const res = await app.post('/api/payments/payhere/notify').type('form').send({ order_id: 'x' });
  assert.equal(res.status, 503);
});
