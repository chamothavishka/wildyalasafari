/**
 * Frontend integration point for sign-in. No authentication runs in the browser
 * on its own: set your auth service URLs in a `.env` file (see .env.example):
 *
 *   VITE_AUTH_LOGIN_URL=https://api.example.com/auth/login
 *   VITE_AUTH_RESET_URL=https://api.example.com/auth/password-reset
 *
 * Login sends   POST { email, password, remember }  (JSON, cookies included)
 * Reset sends   POST { email }
 * A 2xx response counts as success; anything else shows an error message.
 * Until the URLs are set, the form explains that online sign-in is not available yet.
 */
const env = (typeof import.meta !== 'undefined' && import.meta.env) || {};

export const AUTH = {
  loginUrl: env.VITE_AUTH_LOGIN_URL || '',
  resetUrl: env.VITE_AUTH_RESET_URL || '',
  // Sign-up lives next to sign-in (…/login → …/register) unless set explicitly.
  registerUrl: env.VITE_AUTH_REGISTER_URL || (env.VITE_AUTH_LOGIN_URL || '').replace(/\/login\/?$/, '/register'),
};

const NOT_CONNECTED = 'Online sign-in is not available yet. To manage a booking, please contact us on WhatsApp or by email.';

async function post(url, body) {
  let res;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error('We could not reach the sign-in service. Check your connection and try again.');
  }
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* no JSON body */
  }
  if (!res.ok) {
    const msg = data && (data.message || data.error);
    const err = new Error(msg || (res.status === 401 ? 'The email or password is incorrect.' : 'Something went wrong. Please try again.'));
    err.status = res.status;
    throw err;
  }
  return data;
}

export async function signIn({ email, password, remember }) {
  if (!AUTH.loginUrl) throw new Error(NOT_CONNECTED);
  return post(AUTH.loginUrl, { email, password, remember });
}

export async function signUp({ name, email, password }) {
  if (!AUTH.registerUrl) throw new Error('Creating an account online is not available yet. Please contact us on WhatsApp or by email.');
  return post(AUTH.registerUrl, { name, email, password });
}

export async function requestPasswordReset(email) {
  if (!AUTH.resetUrl) throw new Error('Password reset is not available online yet. Please contact us on WhatsApp or by email and we will help you.');
  return post(AUTH.resetUrl, { email });
}
