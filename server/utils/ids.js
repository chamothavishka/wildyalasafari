import crypto from 'node:crypto';

// Crockford base32 without I, L, O, U — easy to read out over the phone.
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

/** e.g. WYS-7K3Q9X2A4M — 10 random characters (50 bits), unguessable. */
export function newBookingRef() {
  const bytes = crypto.randomBytes(10);
  let s = '';
  for (let i = 0; i < 10; i += 1) s += ALPHABET[bytes[i] % 32];
  return `WYS-${s}`;
}
export const BOOKING_REF_RE = /^WYS-[0-9A-HJKMNP-TV-Z]{10}$/;

export const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');
export const randomToken = (bytes = 32) => crypto.randomBytes(bytes).toString('hex');
