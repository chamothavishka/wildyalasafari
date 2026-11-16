import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { SMTPServer } from 'smtp-server';
import { simpleParser } from 'mailparser';
import { startTestApp, createViaApi, notifyBody, postNotify, waitFor } from './helpers.js';
import { Booking } from '../models/Booking.js';

let ctx;
let sink;
const received = [];

before(async () => {
  sink = new SMTPServer({
    authOptional: false,
    allowInsecureAuth: true,
    disabledCommands: ['STARTTLS'],
    onAuth: (a, _s, cb) => (a.username === 'mailer' && a.password === 'secret-mail-pass' ? cb(null, { user: 'x' }) : cb(new Error('Invalid login'))),
    onData(stream, _s, cb) {
      const chunks = [];
      stream.on('data', (c) => chunks.push(c));
      stream.on('end', async () => {
        received.push(await simpleParser(Buffer.concat(chunks)));
        cb();
      });
    },
  });
  await new Promise((r) => sink.listen(0, '127.0.0.1', r));
  ctx = await startTestApp();
});
after(async () => {
  await ctx.stop();
  await new Promise((r) => sink.close(r));
});

// async on purpose: the test's own SMTP server lives in this process and must be free to answer while the command runs
const runCheck = (extraArgs = [], env = {}) =>
  new Promise((resolve) => {
  const child = execFile('node', ['server/scripts/check-setup.js', ...extraArgs], {
    encoding: 'utf8',
    env: {
      ...process.env,
      MONGODB_URI: ctx.cfg.mongodbUri,
      JWT_SECRET: 'x'.repeat(40),
      SITE_URL: 'http://localhost:4000',
      PAYHERE_MERCHANT_ID: '1230000',
      PAYHERE_MERCHANT_SECRET: 'check-test-merchant-secret',
      EMAIL_HOST: '127.0.0.1',
      EMAIL_PORT: String(sink.server.address().port),
      EMAIL_SECURE: 'false',
      EMAIL_USER: 'mailer',
      EMAIL_PASSWORD: 'secret-mail-pass',
      EMAIL_FROM: 'Wild Yala Safari <bookings@wildyala.test>',
      ...env,
    },
  }, (err, stdout, stderr) => resolve({ status: err ? err.code : 0, stdout, stderr }));
  child.stdin && child.stdin.end();
  });

test('`npm run check` lists saved bookings, their payment/e-mail state, and never prints secrets', async () => {
  const { ref, checkout } = await createViaApi(ctx, { email: 'checker@example.com' });
  await postNotify(ctx, notifyBody(ctx.cfg, { orderId: ref, amount: checkout.fields.amount, currency: checkout.fields.currency }));
  await waitFor(async () => (await Booking.findOne({ bookingRef: ref })).email.status === 'SENT');
  await createViaApi(ctx, { email: 'unpaid@example.com' });

  const out = await runCheck();
  assert.equal(out.status, 0, out.stdout + out.stderr);
  assert.match(out.stdout, /Connected to MongoDB/);
  assert.match(out.stdout, /2 booking\(s\) saved/);
  assert.match(out.stdout, new RegExp(ref));
  assert.match(out.stdout, /payment PAID · booking CONFIRMED · confirmation e-mail SENT/);
  assert.match(out.stdout, /payment PENDING · booking PENDING/);
  assert.match(out.stdout, /The mail server accepted the login/);
  assert.match(out.stdout, /All checks passed/);
  for (const secret of ['secret-mail-pass', 'check-test-merchant-secret', ctx.cfg.mongodbUri]) assert.ok(!out.stdout.includes(secret) && !out.stderr.includes(secret), 'no secret may be printed');
});

test('`npm run check -- --send-test` really sends an e-mail over SMTP', async () => {
  const before = received.length;
  const out = await runCheck(['--send-test', 'owner@example.com']);
  assert.equal(out.status, 0, out.stdout + out.stderr);
  assert.match(out.stdout, /Test e-mail sent to owner@example.com/);
  await waitFor(() => received.length === before + 1);
  assert.equal(received.at(-1).to.value[0].address, 'owner@example.com');
});

test('`npm run check` flags wrong e-mail settings and paid bookings whose e-mail never went out', async () => {
  const { ref, checkout } = await createViaApi(ctx, { email: 'late@example.com' });
  ctx.mailer.failNext = 1;
  await postNotify(ctx, notifyBody(ctx.cfg, { orderId: ref, amount: checkout.fields.amount, currency: checkout.fields.currency }));
  await waitFor(async () => (await Booking.findOne({ bookingRef: ref })).email.status === 'FAILED');
  const out = await runCheck([], { EMAIL_PASSWORD: 'wrong-password' });
  assert.equal(out.status, 1);
  assert.match(out.stdout, /The mail server check failed/);
  assert.match(out.stdout, /NOT had their confirmation e-mail sent/);
  assert.match(out.stdout, /npm run emails:retry/);
  assert.ok(!out.stdout.includes('wrong-password'));
});
