/**
 * PayHere (Sri Lanka) hosted-checkout adapter. https://support.payhere.lk/api-&-mobile-sdk/payhere-checkout
 *
 *  - The customer is sent to PayHere's own page, so card details never touch this server.
 *  - The result is delivered to `notify_url` as a server-to-server POST signed with
 *    md5sig = MD5(merchant_id + order_id + payhere_amount + payhere_currency + status_code + MD5(merchant_secret)).
 *    That signature, plus the order, amount, currency and merchant checks, is what
 *    "verified" means here. The customer's browser returning to a page proves nothing.
 */
import crypto from 'node:crypto';

const md5Upper = (s) => crypto.createHash('md5').update(s, 'utf8').digest('hex').toUpperCase();

export const PAYHERE_URLS = {
  sandbox: 'https://sandbox.payhere.lk/pay/checkout',
  live: 'https://www.payhere.lk/pay/checkout',
};

/** status_code values PayHere sends. */
export const STATUS = { SUCCESS: 2, PENDING: 0, CANCELED: -1, FAILED: -2, CHARGEDBACK: -3 };

/** hash = UPPER(MD5(merchant_id + order_id + amount(2dp) + currency + UPPER(MD5(merchant_secret)))) */
export function checkoutHash({ merchantId, orderId, amount, currency, merchantSecret }) {
  return md5Upper(`${merchantId}${orderId}${amount}${currency}${md5Upper(merchantSecret)}`);
}

export function notifySignature({ merchantId, orderId, amount, currency, statusCode, merchantSecret }) {
  return md5Upper(`${merchantId}${orderId}${amount}${currency}${statusCode}${md5Upper(merchantSecret)}`);
}

const safeEqual = (a, b) => {
  const A = Buffer.from(String(a || '').toUpperCase());
  const B = Buffer.from(String(b || '').toUpperCase());
  return A.length === B.length && crypto.timingSafeEqual(A, B);
};

function splitName(full) {
  const parts = String(full).trim().split(/\s+/);
  if (parts.length === 1) return { first: parts[0], last: '-' };
  return { first: parts.slice(0, -1).join(' '), last: parts[parts.length - 1] };
}

/** The signed form the browser POSTs to PayHere. */
export function buildCheckout(cfg, booking) {
  const { merchantId, merchantSecret, mode } = cfg.payhere;
  const orderId = booking.bookingRef;
  const amount = booking.billing.amountFixed;
  const currency = booking.billing.currency;
  const { first, last } = splitName(booking.customer.name);
  const notifyUrl = cfg.payhere.notifyUrl || `${cfg.siteUrl}/api/payments/payhere/notify`;
  const fields = {
    merchant_id: merchantId,
    return_url: `${cfg.siteUrl}/booking.html?order=${encodeURIComponent(orderId)}`,
    cancel_url: `${cfg.siteUrl}/api/payments/payhere/cancel?order=${encodeURIComponent(orderId)}`,
    notify_url: notifyUrl,
    order_id: orderId,
    items: `${booking.safari.name} - ${booking.jeep.name} x ${booking.jeeps}`,
    currency,
    amount,
    first_name: first,
    last_name: last,
    email: booking.customer.email,
    phone: booking.customer.phone || '0000000000',
    address: booking.pickupLocation,
    city: 'Yala',
    country: booking.customer.country || 'Sri Lanka',
    custom_1: booking.safariDate,
    hash: checkoutHash({ merchantId, orderId, amount, currency, merchantSecret }),
  };
  return { url: PAYHERE_URLS[mode], method: 'POST', fields };
}

/**
 * Authenticate a notification. Returns { ok: true, data } or { ok: false, reason }.
 * Amount / currency / order are compared by the caller against the stored booking.
 */
export function verifyNotification(cfg, body) {
  const b = body || {};
  const required = ['merchant_id', 'order_id', 'payhere_amount', 'payhere_currency', 'status_code', 'md5sig'];
  for (const k of required) if (b[k] === undefined || b[k] === '') return { ok: false, reason: `missing ${k}` };
  if (String(b.merchant_id) !== String(cfg.payhere.merchantId)) return { ok: false, reason: 'merchant mismatch' };
  const expected = notifySignature({
    merchantId: b.merchant_id,
    orderId: b.order_id,
    amount: b.payhere_amount,
    currency: b.payhere_currency,
    statusCode: b.status_code,
    merchantSecret: cfg.payhere.merchantSecret,
  });
  if (!safeEqual(expected, b.md5sig)) return { ok: false, reason: 'bad signature' };
  return {
    ok: true,
    data: {
      orderId: String(b.order_id),
      paymentId: b.payment_id ? String(b.payment_id) : '',
      amount: String(b.payhere_amount),
      currency: String(b.payhere_currency),
      statusCode: Number(b.status_code),
      statusMessage: b.status_message ? String(b.status_message).slice(0, 200) : '',
      method: b.method ? String(b.method).slice(0, 40) : '',
    },
  };
}

/** Compare amounts numerically (PayHere may send 12000 or 12000.00). */
export const sameAmount = (a, b) => Math.abs(Number(a) - Number(b)) < 0.005;
