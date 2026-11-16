/**
 * Thin client for the website's own backend (same origin by default: /api/…).
 * Set VITE_API_BASE_URL only if the API is hosted on a different origin than the website.
 */
const env = (typeof import.meta !== 'undefined' && import.meta.env) || {};
const BASE = String(env.VITE_API_BASE_URL || '').replace(/\/+$/, '');

async function request(path, options = {}) {
  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      credentials: 'include',
      ...options,
      headers: { Accept: 'application/json', ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(options.headers || {}) },
    });
  } catch {
    throw Object.assign(new Error('We could not reach our booking service. Please check your connection and try again.'), { code: 'NETWORK' });
  }
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* no JSON body */
  }
  if (!res.ok) {
    const err = new Error((data && data.message) || 'Something went wrong. Please try again.');
    err.status = res.status;
    err.code = data && data.code;
    err.data = data;
    throw err;
  }
  return data;
}

/** Create a booking on the server (it recalculates the price) and receive the signed gateway checkout. */
export function createBooking(payload, idempotencyKey) {
  return request('/api/bookings', { method: 'POST', body: JSON.stringify(payload), headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {} });
}

/** Save an unpaid inquiry for the team (the guest still chooses WhatsApp or e-mail). */
export function sendInquiry(payload) {
  return request('/api/inquiries', { method: 'POST', body: JSON.stringify(payload) });
}

/** The signed-in user, or null when nobody is signed in (or the server cannot be reached). */
export async function fetchMe() {
  try {
    const data = await request('/api/auth/me');
    return (data && data.user) || null;
  } catch {
    return null;
  }
}

export function signOut() {
  return request('/api/auth/logout', { method: 'POST' });
}

export function fetchBookingStatus(ref) {
  return request(`/api/bookings/${encodeURIComponent(ref)}/status`);
}

/** A random key so that a double click / retry of the same checkout never creates two bookings. */
export function newIdempotencyKey() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID().replace(/-/g, '') + 'wys';
  return `k${Date.now().toString(36)}${Math.random().toString(36).slice(2, 14)}${Math.random().toString(36).slice(2, 10)}`;
}

/** POST the signed checkout form to the payment gateway (a full-page redirect to its hosted payment page). */
export function submitCheckout({ url, method = 'POST', fields }) {
  const form = document.createElement('form');
  form.method = method;
  form.action = url;
  form.style.display = 'none';
  Object.entries(fields).forEach(([name, value]) => {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = name;
    input.value = String(value);
    form.appendChild(input);
  });
  document.body.appendChild(form);
  form.submit();
}
