import { Router } from 'express';
import { validate } from '../middleware/errors.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';
import { bookingSchema } from '../validation.js';
import { createBooking, getPublicStatus, listForUser } from '../services/bookingService.js';
import { buildCheckout } from '../services/payhere.js';
import { BOOKING_REF_RE } from '../utils/ids.js';
import { notFound, unavailable } from '../utils/errors.js';

const KEY_RE = /^[A-Za-z0-9_-]{16,64}$/;

export function bookingRoutes(cfg, { booking: bookingLimiter }) {
  const r = Router();

  /**
   * Create a PENDING booking (price calculated on the server) and return the signed
   * gateway checkout the browser must POST to. Nothing is confirmed here.
   */
  r.post('/', bookingLimiter, optionalAuth(cfg), validate(bookingSchema), async (req, res) => {
    if (!cfg.payhere.enabled) {
      throw unavailable('Online payment is not available right now. Please contact us on WhatsApp or by email to complete your booking.', 'PAYMENT_NOT_CONFIGURED');
    }
    const headerKey = req.get('idempotency-key');
    const idempotencyKey = headerKey && KEY_RE.test(headerKey) ? headerKey : undefined;
    const { booking, reused } = await createBooking(req.valid, { idempotencyKey, userId: req.user ? req.user._id : undefined });

    if (booking.paymentStatus !== 'PENDING') {
      return res.status(409).json({
        message: booking.paymentStatus === 'PAID' ? 'This booking has already been paid.' : 'This booking can no longer be paid. Please start a new booking.',
        code: 'NOT_PAYABLE',
        bookingRef: booking.bookingRef,
      });
    }
    return res.status(reused ? 200 : 201).json({
      bookingRef: booking.bookingRef,
      total: { totalLKR: booking.pricing.totalLKR, currency: booking.billing.currency, amount: booking.billing.amountFixed },
      checkout: buildCheckout(cfg, booking),
    });
  });

  /** The signed-in customer's own bookings. */
  r.get('/mine', requireAuth(cfg), async (req, res) => {
    res.set('Cache-Control', 'no-store');
    res.json({ bookings: await listForUser(req.user) });
  });

  /** Status of one booking, looked up by its unguessable reference (used by the payment return page). */
  r.get('/:ref/status', async (req, res) => {
    if (!BOOKING_REF_RE.test(req.params.ref)) throw notFound('We could not find that booking.', 'BOOKING_NOT_FOUND');
    res.set('Cache-Control', 'no-store');
    res.json(await getPublicStatus(req.params.ref));
  });

  return r;
}
