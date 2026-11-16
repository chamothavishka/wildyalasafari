/**
 * Central, validated configuration. Every secret comes from environment variables
 * (see .env.example) — nothing sensitive is ever hard-coded or sent to the browser.
 */
import 'dotenv/config';

const bool = (v, d = false) => (v === undefined || v === '' ? d : ['1', 'true', 'yes', 'on'].includes(String(v).toLowerCase()));
const int = (v, d) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : d;
};
const trimSlash = (s) => String(s || '').replace(/\/+$/, '');
const list = (v) => String(v || '').split(',').map((s) => s.trim()).filter(Boolean);

/** Build the config object from an env map (the argument makes it testable). */
export function loadConfig(env = process.env) {
  const nodeEnv = env.NODE_ENV || 'development';
  const isProd = nodeEnv === 'production';
  const port = int(env.PORT, 4000);

  const defaultCorsOrigins = ['https://wildyalasafari.com', 'https://www.wildyalasafari.com'];

  const cfg = {
    nodeEnv,
    isProd,
    isTest: nodeEnv === 'test',
    port,
    // Public base URL of the website (used in gateway return/notify URLs and e-mail links).
    siteUrl: trimSlash(env.SITE_URL || (isProd ? '' : `http://localhost:${port}`)),
    // Browser origins allowed to call the API cross-origin (in addition to same-origin requests).
    corsOrigins: [...new Set([...list(env.CORS_ORIGINS).map(trimSlash), ...defaultCorsOrigins])].filter(Boolean),
    // Number of reverse-proxy hops to trust (Render/Railway/nginx = 1). 0 = none.
    trustProxy: int(env.TRUST_PROXY, isProd ? 1 : 0),
    mongodbUri: env.MONGODB_URI || '',
    jwtSecret: env.JWT_SECRET || '',
    rateLimits: { api: int(env.RATE_LIMIT_API, 240), booking: int(env.RATE_LIMIT_BOOKING, 30), login: int(env.RATE_LIMIT_LOGIN, 10), reset: int(env.RATE_LIMIT_RESET, 8), register: int(env.RATE_LIMIT_REGISTER, 10) },
    sessionCookieName: env.SESSION_COOKIE_NAME || 'wys_session',
    passwordResetTtlMinutes: int(env.PASSWORD_RESET_TTL_MINUTES, 60),
    payhere: {
      mode: (env.PAYHERE_MODE || 'sandbox').toLowerCase() === 'live' ? 'live' : 'sandbox',
      merchantId: env.PAYHERE_MERCHANT_ID || '',
      merchantSecret: env.PAYHERE_MERCHANT_SECRET || '',
      notifyUrl: env.PAYHERE_NOTIFY_URL || '', // optional override; default is SITE_URL/api/payments/payhere/notify
    },
    email: {
      host: env.EMAIL_HOST || '',
      port: int(env.EMAIL_PORT, 587),
      secure: bool(env.EMAIL_SECURE, int(env.EMAIL_PORT, 587) === 465),
      user: env.EMAIL_USER || '',
      password: env.EMAIL_PASSWORD || '',
      from: env.EMAIL_FROM || '',
    },
  };
  cfg.payhere.enabled = Boolean(cfg.payhere.merchantId && cfg.payhere.merchantSecret);
  cfg.email.enabled = Boolean(cfg.email.host && cfg.email.from);
  cfg.cookieSecure = isProd && cfg.siteUrl.startsWith('https://');
  return cfg;
}

/** Problems that make the server unsafe or unable to start (throws) and softer warnings (returned). */
export function validateConfig(cfg) {
  const fatal = [];
  const warnings = [];
  if (!cfg.mongodbUri) fatal.push('MONGODB_URI is required.');
  if (!cfg.jwtSecret || cfg.jwtSecret.length < 32) {
    if (cfg.isProd) fatal.push('JWT_SECRET is required in production and must be at least 32 characters.');
    else warnings.push('JWT_SECRET is missing or short — fine for local development only.');
  }
  if (cfg.isProd && !cfg.siteUrl) fatal.push('SITE_URL is required in production (e.g. https://www.yourdomain.com).');
  if (cfg.isProd && cfg.siteUrl && !cfg.siteUrl.startsWith('https://')) warnings.push('SITE_URL is not https:// — cookies will not be marked Secure and the payment gateway may refuse the callback URLs.');
  if (!cfg.payhere.enabled) warnings.push('PayHere is not configured (PAYHERE_MERCHANT_ID / PAYHERE_MERCHANT_SECRET): bookings cannot be paid until it is.');
  if (!cfg.email.enabled) warnings.push('E-mail is not configured (EMAIL_HOST / EMAIL_FROM …): confirmation e-mails will be queued as FAILED until it is.');
  if (cfg.payhere.enabled && cfg.payhere.mode === 'sandbox' && cfg.isProd) warnings.push('PAYHERE_MODE is "sandbox" in production — no real money will be taken.');
  return { fatal, warnings };
}
