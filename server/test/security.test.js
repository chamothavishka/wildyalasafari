import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { startTestApp, validBooking } from './helpers.js';
import { createApp } from '../app.js';
import { loadConfig, validateConfig } from '../config.js';

let ctx;
before(async () => {
  ctx = await startTestApp();
});
after(async () => ctx.stop());

test('security headers are set, including a strict CSP that allows the PayHere form post', async () => {
  const res = await ctx.api.get('/api/health');
  const csp = res.headers['content-security-policy'];
  assert.ok(csp);
  assert.match(csp, /default-src 'self'/);
  assert.match(csp, /script-src 'self'(;|$)/);
  assert.match(csp, /form-action 'self' https:\/\/sandbox\.payhere\.lk https:\/\/www\.payhere\.lk/);
  assert.match(csp, /object-src 'none'/);
  assert.equal(res.headers['x-content-type-options'], 'nosniff');
  assert.equal(res.headers['x-powered-by'], undefined);
  assert.equal(res.headers['referrer-policy'], 'no-referrer');
});

test('unknown API routes return JSON 404, not an HTML page', async () => {
  const res = await ctx.api.get('/api/does-not-exist');
  assert.equal(res.status, 404);
  assert.equal(res.body.code, 'NOT_FOUND');
});

test('malformed and oversized JSON are rejected cleanly', async () => {
  const bad = await ctx.api.post('/api/bookings').set('Content-Type', 'application/json').send('{"name": ');
  assert.equal(bad.status, 400);
  assert.equal(bad.body.code, 'BAD_JSON');
  const big = await ctx.api.post('/api/bookings').send({ ...validBooking(), specialRequests: 'x'.repeat(40_000) });
  assert.equal(big.status, 413);
});

test('cross-site requests are blocked by the Origin check, same-site and server-to-server are not', async () => {
  const evil = await ctx.api.post('/api/auth/login').set('Origin', 'https://evil.example').send({ email: 'a@b.co', password: 'x' });
  assert.equal(evil.status, 403);
  assert.equal(evil.body.code, 'BAD_ORIGIN');
  const own = await ctx.api.post('/api/auth/login').set('Origin', 'http://localhost:4000').send({ email: 'a@b.co', password: 'x' });
  assert.equal(own.status, 401);
  const noOrigin = await ctx.api.post('/api/auth/login').send({ email: 'a@b.co', password: 'x' });
  assert.equal(noOrigin.status, 401);
});

test('in production the Origin check has no localhost exception', async () => {
  const prod = request(createApp({ ...ctx.cfg, isProd: true, isTest: true, cookieSecure: true, siteUrl: 'https://www.example.com' }));
  const local = await prod.post('/api/auth/login').set('Origin', 'http://localhost:5180').send({ email: 'a@b.co', password: 'x' });
  assert.equal(local.status, 403);
  const own = await prod.post('/api/auth/login').set('Origin', 'https://www.example.com').send({ email: 'a@b.co', password: 'x' });
  assert.equal(own.status, 401);
});

test('CORS: only listed origins may call the API with credentials', async () => {
  const app = request(createApp({ ...ctx.cfg, corsOrigins: ['https://site.example'] }));
  const ok = await app.get('/api/health').set('Origin', 'https://site.example');
  assert.equal(ok.headers['access-control-allow-origin'], 'https://site.example');
  assert.equal(ok.headers['access-control-allow-credentials'], 'true');
  const no = await app.get('/api/health').set('Origin', 'https://other.example');
  assert.equal(no.headers['access-control-allow-origin'], undefined);
});

test('booking creation is rate limited', async () => {
  const app = request(createApp({ ...ctx.cfg, rateLimits: { ...ctx.cfg.rateLimits, booking: 2 } }));
  const s = [];
  for (let i = 0; i < 4; i += 1) s.push((await app.post('/api/bookings').send(validBooking())).status);
  assert.deepEqual(s, [201, 201, 429, 429]);
});

test('no response ever contains a secret', async () => {
  const bodies = [];
  bodies.push((await ctx.api.get('/api/health')).text);
  bodies.push((await ctx.api.post('/api/bookings').send(validBooking())).text);
  bodies.push((await ctx.api.post('/api/bookings').send({})).text);
  bodies.push((await ctx.api.get('/api/auth/me')).text);
  for (const b of bodies) {
    for (const secret of [ctx.cfg.payhere.merchantSecret, ctx.cfg.jwtSecret, ctx.cfg.mongodbUri]) assert.ok(!b.includes(secret));
  }
});

test('configuration validation: production refuses to start without the essentials, warns about the rest', () => {
  const prod = validateConfig(loadConfig({ NODE_ENV: 'production' }));
  assert.ok(prod.fatal.some((f) => /MONGODB_URI/.test(f)));
  assert.ok(prod.fatal.some((f) => /JWT_SECRET/.test(f)));
  assert.ok(prod.fatal.some((f) => /SITE_URL/.test(f)));
  assert.ok(prod.warnings.some((w) => /PayHere is not configured/.test(w)));
  assert.ok(prod.warnings.some((w) => /E-mail is not configured/.test(w)));

  const good = validateConfig(loadConfig({ NODE_ENV: 'production', MONGODB_URI: 'mongodb://x/y', JWT_SECRET: 'a'.repeat(40), SITE_URL: 'https://example.com', PAYHERE_MERCHANT_ID: '1', PAYHERE_MERCHANT_SECRET: 's', PAYHERE_MODE: 'live', EMAIL_HOST: 'h', EMAIL_FROM: 'f@x.co' }));
  assert.deepEqual(good.fatal, []);
  assert.deepEqual(good.warnings, []);
  const sandboxProd = validateConfig(loadConfig({ NODE_ENV: 'production', MONGODB_URI: 'm', JWT_SECRET: 'a'.repeat(40), SITE_URL: 'https://example.com', PAYHERE_MERCHANT_ID: '1', PAYHERE_MERCHANT_SECRET: 's', EMAIL_HOST: 'h', EMAIL_FROM: 'f' }));
  assert.ok(sandboxProd.warnings.some((w) => /sandbox/.test(w)));
});
