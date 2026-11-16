import { Router } from 'express';
import { validate } from '../middleware/errors.js';
import { requireAuth } from '../middleware/auth.js';
import { loginSchema, registerSchema, resetRequestSchema, resetConfirmSchema } from '../validation.js';
import { authenticate, registerUser, signSession, startPasswordReset, completePasswordReset } from '../services/authService.js';
import { sendPasswordResetEmail } from '../services/emailService.js';
import { log } from '../utils/logger.js';

const publicUser = (u) => ({ id: String(u._id), email: u.email, name: u.name, role: u.role });

export function authRoutes(cfg, { login: loginLimiter, reset: resetLimiter, register: registerLimiter }) {
  const r = Router();
  const cookieOptions = (maxAge) => ({ httpOnly: true, secure: cfg.cookieSecure, sameSite: 'lax', path: '/', ...(maxAge ? { maxAge } : {}) });

  /** The Login page POSTs { email, password, remember }; any 2xx means "signed in". */
  r.post('/login', loginLimiter, validate(loginSchema), async (req, res) => {
    const { email, password, remember } = req.valid;
    const user = await authenticate(email, password);
    const { token, maxAgeMs } = signSession(user, { remember }, cfg);
    res.cookie(cfg.sessionCookieName, token, cookieOptions(maxAgeMs));
    res.json({ message: 'Signed in.', user: publicUser(user) });
  });

  /** The "Create account" form POSTs { name, email, password }. The new customer is signed in straight away. */
  r.post('/register', registerLimiter, validate(registerSchema), async (req, res) => {
    const user = await registerUser(req.valid);
    const { token, maxAgeMs } = signSession(user, { remember: false }, cfg);
    res.cookie(cfg.sessionCookieName, token, cookieOptions(maxAgeMs));
    res.status(201).json({ message: 'Account created.', user: publicUser(user) });
  });

  r.post('/logout', (_req, res) => {
    res.clearCookie(cfg.sessionCookieName, cookieOptions());
    res.json({ message: 'Signed out.' });
  });

  r.get('/me', requireAuth(cfg), (req, res) => {
    res.set('Cache-Control', 'no-store');
    res.json({ user: publicUser(req.user) });
  });

  /** The "Forgot password?" form POSTs { email }. The answer is the same whether or not the account exists. */
  r.post('/password-reset', resetLimiter, validate(resetRequestSchema), async (req, res) => {
    const started = await startPasswordReset(req.valid.email, cfg);
    if (started) {
      // not awaited: the response time must not reveal whether the account exists
      sendPasswordResetEmail(started, cfg).catch((err) => log.error('Password reset e-mail crashed', { error: err.message }));
    }
    res.json({ message: 'If an account exists for that email address, a reset link is on its way.' });
  });

  r.post('/password-reset/confirm', resetLimiter, validate(resetConfirmSchema), async (req, res) => {
    await completePasswordReset(req.valid.token, req.valid.password);
    res.json({ message: 'Your password has been changed. You can now sign in.' });
  });

  return r;
}
