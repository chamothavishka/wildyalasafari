import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import { makeLimiters, originGuard } from './middleware/security.js';
import { apiNotFound, errorHandler } from './middleware/errors.js';
import { authRoutes } from './routes/auth.js';
import { inquiryRoutes } from './routes/inquiries.js';
import { bookingRoutes } from './routes/bookings.js';
import { paymentRoutes } from './routes/payments.js';
import { resetPageRoutes } from './routes/resetPage.js';
import { randomToken } from './utils/ids.js';
import { log } from './utils/logger.js';

const here = path.dirname(fileURLToPath(import.meta.url));
export const DIST_DIR = path.resolve(here, '../dist');

/** Build the Express app. It serves the API under /api and the built website (dist/) from the same origin. */
export function createApp(config) {
  const cfg = { ...config };
  if (!cfg.jwtSecret && !cfg.isProd) cfg.jwtSecret = randomToken(32); // dev/test only: sessions end when the server restarts

  const limiters = makeLimiters(cfg);
  const app = express();
  app.disable('x-powered-by');
  if (cfg.trustProxy) app.set('trust proxy', cfg.trustProxy);

  const payhereHosts = ['https://sandbox.payhere.lk', 'https://www.payhere.lk'];
  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: false,
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
          imgSrc: ["'self'", 'data:', 'blob:'],
          mediaSrc: ["'self'", 'blob:'],
          connectSrc: ["'self'", ...cfg.corsOrigins],
          workerSrc: ["'self'", 'blob:'],
          objectSrc: ["'none'"],
          baseUri: ["'self'"],
          frameAncestors: ["'self'"],
          formAction: ["'self'", ...payhereHosts],
          ...(cfg.cookieSecure ? { upgradeInsecureRequests: [] } : {}),
        },
      },
      crossOriginEmbedderPolicy: false, // the site loads Google Fonts
      hsts: cfg.cookieSecure ? { maxAge: 31536000, includeSubDomains: true } : false,
    }),
  );
  app.use(compression());

  if (cfg.corsOrigins.length) {
    app.use('/api', cors({ origin: cfg.corsOrigins, credentials: true, methods: ['GET', 'POST', 'OPTIONS'], allowedHeaders: ['Content-Type', 'Idempotency-Key', 'Authorization'], maxAge: 600 }));
  }
  app.use(cookieParser());

  // ---- API
  app.use('/api', limiters.api, express.json({ limit: '20kb' }), express.urlencoded({ extended: false, limit: '20kb' }), originGuard(cfg));
  app.get('/api/health', (_req, res) => {
    res.set('Cache-Control', 'no-store');
    const dbUp = mongoose.connection.readyState === 1;
    res.status(dbUp ? 200 : 503).json({ status: dbUp ? 'ok' : 'degraded', database: dbUp ? 'up' : 'down', payments: cfg.payhere.enabled ? cfg.payhere.mode : 'not configured', email: cfg.email.enabled ? 'configured' : 'not configured' });
  });
  app.use('/api/auth', authRoutes(cfg, limiters));
  app.use('/api/bookings', bookingRoutes(cfg, limiters));
  app.use('/api/inquiries', inquiryRoutes(cfg, limiters));
  app.use('/api/payments', paymentRoutes(cfg));
  app.use('/api', apiNotFound);

  // ---- password-reset page linked from the reset e-mail
  app.use('/reset-password', express.urlencoded({ extended: false, limit: '4kb' }));
  app.use(resetPageRoutes(cfg, limiters));

  // ---- the website (built by `npm run build`)
  if (fs.existsSync(path.join(DIST_DIR, 'index.html'))) {
    app.use(
      express.static(DIST_DIR, {
        extensions: ['html'],
        index: 'index.html',
        setHeaders(res, filePath) {
          if (filePath.endsWith('.html')) res.setHeader('Cache-Control', 'no-cache');
          else if (filePath.includes(`${path.sep}assets${path.sep}`)) res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
          else res.setHeader('Cache-Control', 'public, max-age=604800');
        },
      }),
    );
    app.use((req, res, next) => {
      if (req.method === 'GET' && !path.extname(req.path) && req.accepts('html')) return res.status(404).sendFile(path.join(DIST_DIR, 'index.html'));
      return next();
    });
  } else if (!cfg.isTest) {
    log.warn('dist/ not found — run "npm run build" to serve the website from this server (the API still works).');
  }

  app.use(errorHandler);
  return app;
}
