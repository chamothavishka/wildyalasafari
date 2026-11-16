/**
 * Carries the selected package from the Safari Packages section to the
 * separate Booking page. Stored in sessionStorage and mirrored in the URL
 * (so the selection also survives a refresh or a copied link).
 */
import { calculatePrice } from './pricing.js';
import { getCurrency } from './currency.js';

const KEY = 'wys.booking.v1';

export const DEFAULT_SELECTION = {
  safariId: 'morning',
  jeepId: 'hilux',
  adults: 1,
  children: 0,
  infants: 0,
  currency: 'LKR',
  billingCurrency: 'USD',
};

function sanitise(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const s = { ...DEFAULT_SELECTION, ...raw };
  try {
    // Recalculate rather than trusting stored totals.
    const price = calculatePrice(s);
    return {
      safariId: price.safariId,
      jeepId: price.jeepId,
      adults: price.adults,
      children: price.children,
      infants: price.infants,
      currency: getCurrency(s.currency).code,
      billingCurrency: s.billingCurrency === 'LKR' ? 'LKR' : 'USD',
    };
  } catch {
    return null;
  }
}

export function encodeSelection(sel) {
  const s = sanitise(sel);
  return [s.safariId, s.jeepId, s.adults, s.children, s.infants, s.currency, s.billingCurrency].join('.');
}

function decodeSelection(str) {
  if (!str) return null;
  const [safariId, jeepId, adults, children, infants, currency, billingCurrency] = str.split('.');
  return sanitise({ safariId, jeepId, adults: +adults, children: +children, infants: +infants, currency, billingCurrency });
}

export function saveSelection(sel) {
  const s = sanitise(sel);
  if (!s) return null;
  const price = calculatePrice(s);
  const payload = { ...s, jeeps: price.jeeps, totalLKR: price.totalLKR, savedAt: Date.now() };
  try {
    sessionStorage.setItem(KEY, JSON.stringify(payload));
  } catch {
    /* storage unavailable — URL parameter still carries the state */
  }
  return payload;
}

/** @returns {{selection: object, fromUser: boolean}} */
export function loadSelection() {
  let fromUrl = null;
  try {
    fromUrl = decodeSelection(new URLSearchParams(window.location.search).get('s'));
  } catch {
    /* ignore */
  }
  if (fromUrl) return { selection: fromUrl, fromUser: true };
  try {
    const stored = sanitise(JSON.parse(sessionStorage.getItem(KEY) || 'null'));
    if (stored) return { selection: stored, fromUser: true };
  } catch {
    /* ignore */
  }
  return { selection: { ...DEFAULT_SELECTION }, fromUser: false };
}

export function bookingUrl(sel) {
  return `./booking.html?s=${encodeURIComponent(encodeSelection(sel))}`;
}
