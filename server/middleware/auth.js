import { userFromToken } from '../services/authService.js';
import { unauthorized } from '../utils/errors.js';

const tokenFrom = (req, cfg) => {
  const bearer = req.get('authorization');
  if (bearer && bearer.startsWith('Bearer ')) return bearer.slice(7);
  return req.cookies ? req.cookies[cfg.sessionCookieName] : undefined;
};

/** Attach req.user when a valid session exists; never fails. */
export const optionalAuth = (cfg) => async (req, _res, next) => {
  try {
    req.user = (await userFromToken(tokenFrom(req, cfg), cfg)) || null;
  } catch {
    req.user = null;
  }
  next();
};

/** Require a valid session. */
export const requireAuth = (cfg) => async (req, _res, next) => {
  try {
    const user = await userFromToken(tokenFrom(req, cfg), cfg);
    if (!user) return next(unauthorized());
    req.user = user;
    return next();
  } catch (err) {
    return next(err);
  }
};
