import { rateLimit, ipKeyGenerator } from 'express-rate-limit';
import { HttpError } from '../utils/errors.js';

const limited = (message) => (_req, res) => res.status(429).json({ message, code: 'RATE_LIMITED' });

/** Build the limiters from cfg.rateLimits (tests raise them; production uses the defaults in config.js). */
export function makeLimiters(cfg) {
  const L = cfg.rateLimits;
  const base = { standardHeaders: 'draft-7', legacyHeaders: false };
  return {
    /** Generic ceiling for every /api request. */
    api: rateLimit({ ...base, windowMs: 60_000, limit: L.api, handler: limited('Too many requests. Please slow down and try again shortly.') }),
    /** Creating bookings / payment sessions: a person needs a handful, a bot needs thousands. */
    booking: rateLimit({ ...base, windowMs: 60 * 60_000, limit: L.booking, handler: limited('Too many booking attempts. Please try again later or contact us on WhatsApp.') }),
    /** Sign-in attempts are limited per IP and e-mail address. */
    login: rateLimit({
      ...base,
      windowMs: 15 * 60_000,
      limit: L.login,
      keyGenerator: (req) => `${ipKeyGenerator(req.ip || '')}|${String((req.body && req.body.email) || '').toLowerCase().slice(0, 254)}`,
      handler: limited('Too many sign-in attempts. Please try again in 15 minutes.'),
    }),
    reset: rateLimit({ ...base, windowMs: 60 * 60_000, limit: L.reset, handler: limited('Too many requests. Please try again later.') }),
    /** New accounts per IP: plenty for a family sharing Wi-Fi, too few for a sign-up bot. */
    register: rateLimit({ ...base, windowMs: 60 * 60_000, limit: L.register ?? 10, handler: limited('Too many new accounts from this network. Please try again later.') }),
  };
}

/**
 * Cookie-based sessions are protected against cross-site requests by SameSite=Lax, JSON-only bodies and this check:
 * if a browser sends an Origin header on a state-changing request, it must be one of our own origins.
 */
export function originGuard(cfg) {
  const allowed = new Set([cfg.siteUrl, ...cfg.corsOrigins].filter(Boolean));
  const local = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
  return (req, _res, next) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
    const origin = req.get('origin');
    if (!origin) return next(); // non-browser clients (the payment gateway, curl) send none
    if (allowed.has(origin) || (!cfg.isProd && local.test(origin))) return next();
    return next(new HttpError(403, 'This request was blocked for your protection.', 'BAD_ORIGIN'));
  };
}
