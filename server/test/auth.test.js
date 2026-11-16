import test, { before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { startTestApp } from './helpers.js';
import { createUser } from '../services/authService.js';
import { User } from '../models/User.js';
import { Booking } from '../models/Booking.js';
import { createApp } from '../app.js';

let ctx;
const PASSWORD = 'Correct-Horse-7';
before(async () => {
  ctx = await startTestApp();
  await createUser({ email: 'guest@example.com', password: PASSWORD, name: 'Guest User' });
});
after(async () => ctx.stop());
beforeEach(async () => {
  ctx.mails.length = 0;
  await User.updateOne({ email: 'guest@example.com' }, { $set: { failedLogins: 0 }, $unset: { lockUntil: '' } });
});

const login = (body, agent = ctx.api) => agent.post('/api/auth/login').send(body);

test('passwords are stored as bcrypt hashes, never plain text', async () => {
  const u = await User.findOne({ email: 'guest@example.com' }).select('+passwordHash');
  assert.match(u.passwordHash, /^\$2[aby]\$12\$/);
  assert.ok(!u.passwordHash.includes(PASSWORD));
});

test('login with the right password sets an httpOnly session cookie; the body matches what the Login page expects', async () => {
  const res = await login({ email: 'Guest@Example.com', password: PASSWORD, remember: false });
  assert.equal(res.status, 200);
  assert.equal(res.body.user.email, 'guest@example.com');
  assert.equal(res.body.user.passwordHash, undefined);
  const cookie = res.headers['set-cookie'].find((c) => c.startsWith('wys_session='));
  assert.ok(/HttpOnly/i.test(cookie));
  assert.ok(/SameSite=Lax/i.test(cookie));
  assert.ok(!/Max-Age/i.test(cookie), 'a session cookie unless "remember me" is ticked');
  assert.ok(!res.text.includes(cookie.split(';')[0].split('=')[1]), 'the token is only in the cookie, not in the body');
});

test('"remember me" gives a long-lived cookie', async () => {
  const res = await login({ email: 'guest@example.com', password: PASSWORD, remember: true });
  const cookie = res.headers['set-cookie'].find((c) => c.startsWith('wys_session='));
  assert.match(cookie, /Max-Age=2592000/);
});

test('wrong password and unknown e-mail get the same generic 401', async () => {
  const wrong = await login({ email: 'guest@example.com', password: 'nope-nope-1' });
  const unknown = await login({ email: 'nobody@example.com', password: 'nope-nope-1' });
  assert.equal(wrong.status, 401);
  assert.equal(unknown.status, 401);
  assert.equal(wrong.body.message, 'The email or password is incorrect.');
  assert.deepEqual(wrong.body, unknown.body);
});

test('invalid login input is rejected with a message the Login page can show', async () => {
  const res = await login({ email: 'not-an-email', password: '' });
  assert.equal(res.status, 400);
  assert.ok(res.body.message);
});

test('/me and /bookings/mine need a session; with one they work; logout ends it client-side', async () => {
  assert.equal((await ctx.api.get('/api/auth/me')).status, 401);
  assert.equal((await ctx.api.get('/api/bookings/mine')).status, 401);
  const agent = request.agent(ctx.app);
  assert.equal((await login({ email: 'guest@example.com', password: PASSWORD }, agent)).status, 200);
  const me = await agent.get('/api/auth/me');
  assert.equal(me.status, 200);
  assert.equal(me.body.user.name, 'Guest User');

  await Booking.create({
    bookingRef: 'WYS-AAAAAAAAAA', customer: { name: 'Guest User', email: 'guest@example.com' }, safariDate: '2030-01-01', pickupLocation: 'x',
    safari: { id: 'morning', name: 'Morning Safari', time: '4:45 AM – 11:30 AM' }, jeep: { id: 'hilux', name: 'Toyota Hilux' }, jeeps: 1, adults: 1, children: 0, infants: 0, totalPeople: 1,
    pricing: { totalLKR: 32000, baseCost: 32000, extraAdultCost: 0, childCost: 0 }, billing: { currency: 'USD', amount: 106.67, amountFixed: '106.67', lkrPerUnit: 300 },
  });
  const mine = await agent.get('/api/bookings/mine');
  assert.equal(mine.status, 200);
  assert.equal(mine.body.bookings.length, 1);
  assert.equal(mine.body.bookings[0].bookingRef, 'WYS-AAAAAAAAAA');
  assert.equal(mine.body.bookings[0].customer, undefined, 'no personal data beyond what is needed');

  const out = await agent.post('/api/auth/logout');
  assert.equal(out.status, 200);
  assert.match(out.headers['set-cookie'][0], /wys_session=;/);
});

test('a forged or tampered session token is rejected', async () => {
  const bad = await ctx.api.get('/api/auth/me').set('Cookie', 'wys_session=eyJhbGciOiJub25lIn0.eyJzdWIiOiIxIn0.');
  assert.equal(bad.status, 401);
  const garbage = await ctx.api.get('/api/auth/me').set('Authorization', 'Bearer not.a.token');
  assert.equal(garbage.status, 401);
});

test('five wrong passwords lock the account temporarily — even the right password is refused', async () => {
  for (let i = 0; i < 5; i += 1) assert.equal((await login({ email: 'guest@example.com', password: 'wrong-pass-1' })).status, 401);
  const locked = await login({ email: 'guest@example.com', password: PASSWORD });
  assert.equal(locked.status, 429);
  assert.equal(locked.body.code, 'ACCOUNT_LOCKED');
});

test('login is rate limited per IP + e-mail', async () => {
  const limited = request(createApp({ ...ctx.cfg, rateLimits: { ...ctx.cfg.rateLimits, login: 3 } }));
  const statuses = [];
  for (let i = 0; i < 5; i += 1) statuses.push((await limited.post('/api/auth/login').send({ email: 'rate@example.com', password: 'x-wrong-1' })).status);
  assert.deepEqual(statuses.slice(0, 3), [401, 401, 401]);
  assert.deepEqual(statuses.slice(3), [429, 429]);
});

test('password reset: generic answer for everyone, e-mail with a one-time link for real accounts, new password works, old sessions end', async () => {
  const unknown = await ctx.api.post('/api/auth/password-reset').send({ email: 'ghost@example.com' });
  const known = await ctx.api.post('/api/auth/password-reset').send({ email: 'guest@example.com' });
  assert.equal(unknown.status, 200);
  assert.deepEqual(unknown.body, known.body);
  await new Promise((r) => setTimeout(r, 150));
  assert.equal(ctx.mails.length, 1, 'only the real account receives an e-mail');
  const mail = ctx.mails[0];
  assert.equal(mail.to, 'guest@example.com');
  const token = /reset-password\?token=([a-f0-9]{64})/.exec(mail.text)[1];

  const stored = await User.findOne({ email: 'guest@example.com' });
  assert.ok(stored.reset.tokenHash && stored.reset.tokenHash !== token, 'only a hash of the token is stored');

  const agent = request.agent(ctx.app);
  await login({ email: 'guest@example.com', password: PASSWORD }, agent);
  assert.equal((await agent.get('/api/auth/me')).status, 200);

  assert.equal((await ctx.api.get(`/reset-password?token=${token}`)).status, 200);
  assert.equal((await ctx.api.post('/api/auth/password-reset/confirm').send({ token, password: 'short' })).status, 400);
  const ok = await ctx.api.post('/reset-password').type('form').send({ token, password: 'Brand-New-Pass-42' });
  assert.equal(ok.status, 200);
  assert.match(ok.text, /Password changed/);

  assert.equal((await agent.get('/api/auth/me')).status, 401, 'older sessions stop working after a password change');
  assert.equal((await login({ email: 'guest@example.com', password: PASSWORD })).status, 401);
  assert.equal((await login({ email: 'guest@example.com', password: 'Brand-New-Pass-42' })).status, 200);
  const reuse = await ctx.api.post('/reset-password').type('form').send({ token, password: 'Another-Pass-99' });
  assert.equal(reuse.status, 400, 'the link works only once');
  await User.updateOne({ email: 'guest@example.com' }, { $set: { passwordHash: (await createUser({ email: 'tmp@example.com', password: PASSWORD })).passwordHash } });
  await User.deleteOne({ email: 'tmp@example.com' });
});

test('expired and malformed reset links are refused', async () => {
  assert.equal((await ctx.api.get('/reset-password?token=abc')).status, 400);
  assert.equal((await ctx.api.post('/api/auth/password-reset/confirm').send({ token: 'f'.repeat(64), password: 'Valid-Pass-123' })).status, 400);
});

test('sign-up creates a customer account, signs it in, and stores only a hash', async () => {
  const agent = request.agent(ctx.app);
  const res = await agent.post('/api/auth/register').send({ name: 'New Guest', email: 'New.Guest@Example.com', password: 'Fresh-Safari-2026', role: 'admin' });
  assert.equal(res.status, 201);
  assert.equal(res.body.user.email, 'new.guest@example.com');
  assert.equal(res.body.user.role, 'customer', 'sign-up can never create an admin');
  assert.ok(res.headers['set-cookie'].some((c) => c.startsWith('wys_session=')));
  assert.equal((await agent.get('/api/auth/me')).status, 200, 'signed in straight away');
  const u = await User.findOne({ email: 'new.guest@example.com' }).select('+passwordHash');
  assert.match(u.passwordHash, /^\$2[aby]\$12\$/);
  assert.equal((await login({ email: 'new.guest@example.com', password: 'Fresh-Safari-2026' })).status, 200);
  await User.deleteOne({ email: 'new.guest@example.com' });
});

test('sign-up refuses a taken e-mail and weak or missing fields', async () => {
  const taken = await ctx.api.post('/api/auth/register').send({ name: 'Copy', email: 'GUEST@example.com', password: 'Another-Pass-99' });
  assert.equal(taken.status, 409);
  assert.equal(taken.body.code, 'EMAIL_TAKEN');
  assert.equal((await ctx.api.post('/api/auth/register').send({ name: 'Weak', email: 'weak@example.com', password: 'short' })).status, 400);
  assert.equal((await ctx.api.post('/api/auth/register').send({ name: 'Weak', email: 'weak@example.com', password: 'onlyletterspassword' })).status, 400);
  assert.equal((await ctx.api.post('/api/auth/register').send({ email: 'noname@example.com', password: 'Valid-Pass-123' })).status, 400);
  assert.equal(await User.countDocuments({ email: { $in: ['weak@example.com', 'noname@example.com'] } }), 0);
});
