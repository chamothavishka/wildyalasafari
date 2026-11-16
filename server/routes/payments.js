import { Router } from 'express';
import { Booking } from '../models/Booking.js';
import { verifyNotification } from '../services/payhere.js';
import { applyVerifiedNotification, markCustomerCancelled } from '../services/paymentService.js';
import { sendConfirmationEmail } from '../services/emailService.js';
import { BOOKING_REF_RE } from '../utils/ids.js';
import { log } from '../utils/logger.js';

export function paymentRoutes(cfg) {
  const r = Router();

  /**
   * PayHere's server-to-server notification. This — and only this — can confirm a payment.
   * 400 = not authentic (never retried usefully), 200 = understood (also for duplicates, so the gateway stops retrying).
   */
  r.post('/payhere/notify', async (req, res) => {
    if (!cfg.payhere.enabled) return res.status(503).send('not configured');
    const verified = verifyNotification(cfg, req.body);
    if (!verified.ok) {
      log.warn('Rejected a payment notification', { reason: verified.reason });
      return res.status(400).send('invalid notification');
    }
    const booking = BOOKING_REF_RE.test(verified.data.orderId) ? await Booking.findOne({ bookingRef: verified.data.orderId }) : null;
    if (!booking) {
      log.warn('Payment notification for an unknown order', { order: String(verified.data.orderId).slice(0, 40) });
      return res.status(404).send('unknown order');
    }

    const result = await applyVerifiedNotification(booking, verified.data);
    res.status(200).send('OK');

    // After answering the gateway: send the confirmation e-mail. The e-mail service is itself idempotent, so
    // it is safe to also call it for duplicates (this lets a previously failed e-mail recover on a repeat notification).
    if ((result.confirmed || result.outcome === 'DUPLICATE') && result.booking) {
      try {
        await sendConfirmationEmail(result.booking._id, cfg);
      } catch (err) {
        log.error('Confirmation e-mail step crashed', { error: err.message });
      }
    }
    return undefined;
  });

  /** The customer pressed "Cancel" on the PayHere page. */
  r.get('/payhere/cancel', async (req, res) => {
    const ref = String(req.query.order || '');
    if (BOOKING_REF_RE.test(ref)) await markCustomerCancelled(ref);
    res.redirect(302, `${cfg.siteUrl}/booking.html${BOOKING_REF_RE.test(ref) ? `?order=${encodeURIComponent(ref)}` : ''}`);
  });

  return r;
}
