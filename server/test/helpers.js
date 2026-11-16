import crypto from 'node:crypto';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { loadConfig } from '../config.js';
import { createApp } from '../app.js';
import { setSilent } from '../utils/logger.js';
import { setTransportOverride } from '../services/emailService.js';
import { Booking } from '../models/Booking.js';
import { User } from '../models/User.js';

setSilent(true);

/** TEST-ONLY values. They are not real credentials for anything. */
export const TEST_ENV = {
  NODE_ENV: 'test',
  SITE_URL: 'http://localhost:4000',
  JWT_SECRET: 'test-only-jwt-secret-0123456789abcdef0123456789',
  PAYHERE_MODE: 'sandbox',
  PAYHERE_MERCHANT_ID: '1230000',
  PAYHERE_MERCHANT_SECRET: 'test-only-merchant-secret',
  EMAIL_HOST: 'smtp.test.invalid',
  EMAIL_FROM: 'Wild Yala Safari <bookings@test.invalid>',
  RATE_LIMIT_API: '100000',
  RATE_LIMIT_BOOKING: '100000',
  RATE_LIMIT_LOGIN: '100000',
  RATE_LIMIT_RESET: '100000',
};

/** Independent MD5 helper (written separately from the production code on purpose). */
export const md5U = (s) => crypto.createHash('md5').update(s).digest('hex').toUpperCase();

export async function startTestApp(extraEnv = {}) {
  const mongod = await MongoMemoryServer.create();
  const env = { ...TEST_ENV, MONGODB_URI: mongod.getUri('wys_test'), ...extraEnv };
  const cfg = loadConfig(env);
  await mongoose.connect(cfg.mongodbUri);
  await Promise.all([Booking.init(), User.init()]);

  const mails = [];
  const mailer = {
    failNext: 0,
    async sendMail(msg) {
      if (mailer.failNext > 0) {
        mailer.failNext -= 1;
        throw new Error('SMTP connection refused (simulated)');
      }
      mails.push(msg);
      return { messageId: `<test-${mails.length}@wys>` };
    },
  };
  setTransportOverride(mailer);

  const app = createApp(cfg);
  return {
    app,
    cfg,
    mails,
    mailer,
    api: request(app),
    async stop() {
      setTransportOverride(null);
      await mongoose.disconnect();
      await mongod.stop();
    },
  };
}

export const futureDate = (days = 14) => {
  const d = new Date(Date.now() + days * 86400000);
  return d.toISOString().slice(0, 10);
};

export const validBooking = (over = {}) => ({
  name: 'Jane Traveller',
  email: 'jane@example.com',
  phone: '+44 7700 900123',
  country: 'United Kingdom',
  safariDate: futureDate(),
  arrivalDate: '',
  pickupLocation: 'Elephant Hotel, Tissamaharama',
  specialRequests: 'Early start please',
  safariId: 'morning',
  jeepId: 'hilux',
  adults: 2,
  children: 1,
  infants: 0,
  billingCurrency: 'USD',
  ...over,
});

/** Build a PayHere-style notification body, signed exactly as PayHere documents it. */
let paymentSeq = 320000000000;
export function notifyBody(cfg, { orderId, paymentId = String((paymentSeq += 1)), amount, currency, statusCode = 2, method = 'VISA', sign = true, extra = {} }) {
  const body = {
    merchant_id: cfg.payhere.merchantId,
    order_id: orderId,
    payment_id: paymentId,
    payhere_amount: amount,
    payhere_currency: currency,
    status_code: String(statusCode),
    status_message: statusCode === 2 ? 'Successfully received the payment' : 'Not successful',
    method,
    ...extra,
  };
  body.md5sig = sign ? md5U(`${body.merchant_id}${body.order_id}${body.payhere_amount}${body.payhere_currency}${body.status_code}${md5U(cfg.payhere.merchantSecret)}`) : 'DEADBEEF';
  return body;
}

export const postNotify = (ctx, body) => ctx.api.post('/api/payments/payhere/notify').type('form').send(body);

/** Create a booking through the API and return { ref, total, checkout }. */
export async function createViaApi(ctx, over = {}, headers = {}) {
  const res = await ctx.api.post('/api/bookings').set(headers).send(validBooking(over));
  return { res, ref: res.body.bookingRef, checkout: res.body.checkout, total: res.body.total };
}

export const waitFor = async (fn, { timeout = 3000, step = 25 } = {}) => {
  const end = Date.now() + timeout;
  for (;;) {
    const v = await fn();
    if (v) return v;
    if (Date.now() > end) throw new Error('waitFor timed out');
    await new Promise((r) => setTimeout(r, step));
  }
};
