import { Router } from 'express';
import { validate } from '../middleware/errors.js';
import { optionalAuth } from '../middleware/auth.js';
import { inquirySchema } from '../validation.js';
import { Inquiry } from '../models/Inquiry.js';
import { calculatePrice } from '../../src/lib/pricing.js';

export function inquiryRoutes(cfg, { booking: limiter }) {
  const r = Router();

  /** Save an unpaid inquiry. The guest still contacts us on WhatsApp / e-mail; this keeps a record for the team. */
  r.post('/', limiter, optionalAuth(cfg), validate(inquirySchema), async (req, res) => {
    const v = req.valid;
    const doc = { source: v.source, via: v.via, name: v.name, email: v.email, phone: v.phone, country: v.country, message: v.message, interest: v.interest };
    if (v.safari && v.safari.id) {
      const s = v.safari;
      // The estimate is calculated here, never trusted from the browser.
      const price = calculatePrice({ safariId: s.id, jeepId: s.jeepId || 'hilux', adults: s.adults || 1, children: s.children || 0, infants: s.infants || 0 });
      doc.safari = { ...s, estimatedTotalLKR: price.totalLKR };
    }
    if (req.user) doc.user = req.user._id;
    const inquiry = await Inquiry.create(doc);
    res.status(201).json({ message: 'Thank you, we received your inquiry.', id: String(inquiry._id) });
  });

  return r;
}
