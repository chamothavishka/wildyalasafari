import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startTestApp, validBooking, createViaApi, futureDate, md5U } from './helpers.js';
import request from 'supertest';
import { createApp } from '../app.js';
import { Booking } from '../models/Booking.js';
import { calculatePrice } from '../../src/lib/pricing.js';

let ctx;
before(async () => {
  ctx = await startTestApp();
});
after(async () => ctx.stop());

test('health endpoint reports the database', async () => {
  const res = await ctx.api.get('/api/health');
  assert.equal(res.status, 200);
  assert.equal(res.body.database, 'up');
  assert.equal(res.body.payments, 'sandbox');
});

test('creates a PENDING booking, priced by the server, with a correctly signed PayHere checkout', async () => {
  const { res, ref, checkout } = await createViaApi(ctx);
  assert.equal(res.status, 201);
  assert.match(ref, /^WYS-[0-9A-Z]{10}$/);

  const expectedLKR = calculatePrice({ safariId: 'morning', jeepId: 'hilux', adults: 2, children: 1, infants: 0 }).totalLKR; // 52,500
  assert.equal(expectedLKR, 52500);
  assert.equal(res.body.total.totalLKR, 52500);
  assert.equal(res.body.total.amount, '175.00'); // 52,500 LKR at the site's 1 USD = 300 LKR

  const b = await Booking.findOne({ bookingRef: ref });
  assert.equal(b.paymentStatus, 'PENDING');
  assert.equal(b.bookingStatus, 'PENDING');
  assert.equal(b.pricing.totalLKR, 52500);
  assert.equal(b.billing.amountFixed, '175.00');
  assert.equal(b.customer.email, 'jane@example.com');
  assert.equal(b.jeeps, 1);
  assert.equal(b.payment.orderId, ref);
  assert.equal(b.payment.transactionId, undefined);

  // checkout form: gateway URL, fields, and the hash recomputed independently
  assert.equal(checkout.url, 'https://sandbox.payhere.lk/pay/checkout');
  const f = checkout.fields;
  assert.equal(f.merchant_id, ctx.cfg.payhere.merchantId);
  assert.equal(f.order_id, ref);
  assert.equal(f.amount, '175.00');
  assert.equal(f.currency, 'USD');
  assert.equal(f.hash, md5U(`${f.merchant_id}${f.order_id}${f.amount}${f.currency}${md5U(ctx.cfg.payhere.merchantSecret)}`));
  assert.equal(f.notify_url, 'http://localhost:4000/api/payments/payhere/notify');
  assert.ok(f.return_url.startsWith('http://localhost:4000/booking.html?order=WYS-'));
  assert.ok(!JSON.stringify(res.body).includes(ctx.cfg.payhere.merchantSecret), 'the merchant secret must never be sent to the browser');
});

test('LKR billing is charged in LKR', async () => {
  const { res } = await createViaApi(ctx, { billingCurrency: 'LKR', safariId: 'fullday', jeepId: 'cruiser', adults: 1, children: 0 });
  assert.equal(res.status, 201);
  assert.equal(res.body.checkout.fields.currency, 'LKR');
  assert.equal(res.body.checkout.fields.amount, '62000.00');
});

test('more than 6 guests automatically need a second jeep and are priced that way', async () => {
  const { res, ref } = await createViaApi(ctx, { adults: 7, children: 0, jeepId: 'cruiser', safariId: 'evening' });
  assert.equal(res.status, 201);
  const b = await Booking.findOne({ bookingRef: ref });
  assert.equal(b.jeeps, 2);
  assert.equal(b.pricing.totalLKR, 2 * 37000 + 6 * 13000);
});

test('the browser cannot choose a price: extra price fields are ignored and a stale expected total is refused', async () => {
  const sneaky = await ctx.api.post('/api/bookings').send(validBooking({ totalLKR: 1, amount: '0.01', price: 1, jeeps: 9 }));
  assert.equal(sneaky.status, 201);
  assert.equal(sneaky.body.total.totalLKR, 52500);
  assert.equal(sneaky.body.checkout.fields.amount, '175.00');

  const stale = await ctx.api.post('/api/bookings').send(validBooking({ expectedTotalLKR: 1000 }));
  assert.equal(stale.status, 409);
  assert.equal(stale.body.code, 'PRICE_MISMATCH');

  const ok = await ctx.api.post('/api/bookings').send(validBooking({ expectedTotalLKR: 52500 }));
  assert.equal(ok.status, 201);
});

test('validation rejects bad input with a clear message', async () => {
  const cases = [
    [{ name: '' }, /full name/i],
    [{ email: 'nope' }, /valid email/i],
    [{ phone: 'abc' }, /phone/i],
    [{ phone: '' }, /phone/i],
    [{ country: '' }, /country/i],
    [{ pickupLocation: '' }, /pickup/i],
    [{ safariDate: '2020-01-01' }, /today or later/i],
    [{ safariDate: '2026-02-31' }, /real calendar date/i],
    [{ safariDate: 'tomorrow' }, /YYYY-MM-DD/],
    [{ arrivalDate: futureDate(60) }, /on or before/i],
    [{ safariId: 'night' }, null],
    [{ jeepId: 'bus' }, null],
    [{ adults: 0 }, null],
    [{ adults: 1.5 }, null],
    [{ adults: 31 }, null],
    [{ adults: 20, children: 15 }, /more than 30/i],
    [{ billingCurrency: 'EUR' }, null],
  ];
  for (const [over, re] of cases) {
    const res = await ctx.api.post('/api/bookings').send(validBooking(over));
    assert.equal(res.status, 400, JSON.stringify(over));
    assert.equal(res.body.code, 'VALIDATION_ERROR');
    if (re) assert.match(res.body.message, re, JSON.stringify(over));
  }
  const empty = await ctx.api.post('/api/bookings').send({});
  assert.equal(empty.status, 400);
  assert.ok(Object.keys(empty.body.fields).length >= 5);
});

test('text fields are trimmed and stripped of control characters; stored text is not interpreted', async () => {
  const { ref } = await createViaApi(ctx, { name: '  Jane\u0000 Traveller  ', pickupLocation: '<b>Hotel</b>\u0007' });
  const b = await Booking.findOne({ bookingRef: ref });
  assert.equal(b.customer.name, 'Jane Traveller');
  assert.equal(b.pickupLocation, '<b>Hotel</b>');
});

test('an Idempotency-Key makes repeated submissions return the same booking', async () => {
  const key = 'idem-key-0123456789abcdef';
  const before = await Booking.countDocuments();
  const first = await createViaApi(ctx, {}, { 'Idempotency-Key': key });
  const second = await createViaApi(ctx, {}, { 'Idempotency-Key': key });
  assert.equal(first.res.status, 201);
  assert.equal(second.res.status, 200);
  assert.equal(second.ref, first.ref);
  assert.equal(await Booking.countDocuments(), before + 1);

  const concurrent = await Promise.all(Array.from({ length: 6 }, () => createViaApi(ctx, { name: 'Race Test' }, { 'Idempotency-Key': 'race-key-0123456789abcdef' })));
  assert.equal(new Set(concurrent.map((c) => c.ref)).size, 1, 'six simultaneous identical requests must create exactly one booking');

  const different = await ctx.api.post('/api/bookings').set({ 'Idempotency-Key': key }).send(validBooking({ adults: 3 }));
  assert.equal(different.status, 409);
  assert.equal(different.body.code, 'IDEMPOTENCY_KEY_REUSED');
});

test('the public status endpoint returns only safe fields and rejects malformed references', async () => {
  const { ref } = await createViaApi(ctx);
  const res = await ctx.api.get(`/api/bookings/${ref}/status`);
  assert.equal(res.status, 200);
  assert.equal(res.body.paymentStatus, 'PENDING');
  assert.equal(res.body.customerFirstName, 'Jane');
  assert.equal(res.body.pickupLocation, undefined);
  assert.equal(res.body.phone, undefined);
  assert.equal((await ctx.api.get('/api/bookings/WYS-NOTAREALREF/status')).status, 404);
  assert.equal((await ctx.api.get('/api/bookings/WYS-ZZZZZZZZZZ/status')).status, 404);
  assert.equal((await ctx.api.get('/api/bookings/mine')).status, 401);
});

test('without payment credentials no booking is created and the customer gets a clear message', async () => {
  const bare = request(createApp({ ...ctx.cfg, payhere: { ...ctx.cfg.payhere, merchantId: '', merchantSecret: '', enabled: false } }));
  const before = await Booking.countDocuments();
  const res = await bare.post('/api/bookings').send(validBooking());
  assert.equal(res.status, 503);
  assert.equal(res.body.code, 'PAYMENT_NOT_CONFIGURED');
  assert.equal(await Booking.countDocuments(), before);
});
