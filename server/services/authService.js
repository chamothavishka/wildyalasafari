import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { HttpError, unauthorized, badRequest, conflict } from '../utils/errors.js';
import { randomToken, sha256 } from '../utils/ids.js';

const ROUNDS = 12;
const MAX_FAILED = 5;
const LOCK_MS = 15 * 60 * 1000;
// Compared against when the e-mail is unknown so that "no such user" and "wrong password" take the same time.
const DUMMY_HASH = bcrypt.hashSync('wild-yala-safari-not-a-real-password', ROUNDS);

export const hashPassword = (plain) => bcrypt.hash(plain, ROUNDS);

export async function createUser({ email, password, name = '', role = 'customer' }) {
  const passwordHash = await hashPassword(password);
  return User.create({ email, name, role, passwordHash });
}

/** Self sign-up from the website. Always a customer account; a taken e-mail gives a 409. */
export async function registerUser({ name, email, password }) {
  const lower = email.toLowerCase();
  const taken = () => conflict('An account with this email already exists. Please sign in instead.', 'EMAIL_TAKEN');
  if (await User.exists({ email: lower })) throw taken();
  try {
    return await createUser({ email: lower, password, name, role: 'customer' });
  } catch (err) {
    if (err && err.code === 11000) throw taken(); // two sign-ups racing for the same e-mail
    throw err;
  }
}

/** Verify e-mail + password. Throws a generic 401 for any failure; locks the account after repeated failures. */
export async function authenticate(email, password) {
  const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
  const now = new Date();
  if (user && user.lockUntil && user.lockUntil > now) {
    throw new HttpError(429, 'Too many sign-in attempts. Please try again in a few minutes.', 'ACCOUNT_LOCKED');
  }
  const ok = await bcrypt.compare(password, user ? user.passwordHash : DUMMY_HASH);
  if (!user || !ok) {
    if (user) {
      const failed = (user.failedLogins || 0) + 1;
      const set = failed >= MAX_FAILED ? { failedLogins: 0, lockUntil: new Date(now.getTime() + LOCK_MS) } : { failedLogins: failed };
      await User.updateOne({ _id: user._id }, { $set: set });
    }
    throw unauthorized('The email or password is incorrect.', 'INVALID_CREDENTIALS');
  }
  await User.updateOne({ _id: user._id }, { $set: { failedLogins: 0, lastLoginAt: now }, $unset: { lockUntil: '' } });
  return user;
}

export function signSession(user, { remember }, cfg) {
  const expiresIn = remember ? '30d' : '12h';
  const token = jwt.sign({ sub: String(user._id), role: user.role, pv: user.passwordVersion }, cfg.jwtSecret, { algorithm: 'HS256', expiresIn });
  return { token, maxAgeMs: remember ? 30 * 24 * 3600 * 1000 : undefined };
}

/** @returns the user for a valid session token, or null. */
export async function userFromToken(token, cfg) {
  if (!token || !cfg.jwtSecret) return null;
  try {
    const payload = jwt.verify(token, cfg.jwtSecret, { algorithms: ['HS256'] });
    const user = await User.findById(payload.sub);
    if (!user || user.passwordVersion !== payload.pv) return null;
    return user;
  } catch {
    return null;
  }
}

/**
 * Begin a password reset. Returns { user, token } when the account exists, otherwise null.
 * (The route answers identically either way, so account existence is never revealed.)
 */
export async function startPasswordReset(email, cfg) {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) return null;
  const token = randomToken(32);
  user.reset = { tokenHash: sha256(token), expiresAt: new Date(Date.now() + cfg.passwordResetTtlMinutes * 60 * 1000) };
  await user.save();
  return { user, token };
}

export async function completePasswordReset(token, newPassword) {
  const user = await User.findOne({ 'reset.tokenHash': sha256(token), 'reset.expiresAt': { $gt: new Date() } }).select('+passwordHash');
  if (!user) throw badRequest('This reset link is invalid or has expired. Please request a new one.', 'INVALID_RESET_TOKEN');
  user.passwordHash = await hashPassword(newPassword);
  user.passwordVersion += 1; // signs out every existing session
  user.failedLogins = 0;
  user.lockUntil = undefined;
  user.reset = undefined;
  await user.save();
  return user;
}
