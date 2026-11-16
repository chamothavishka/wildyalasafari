import { Booking } from '../models/Booking.js';
import { buildQuote } from './quote.js';
import { newBookingRef } from '../utils/ids.js';
import { conflict, notFound } from '../utils/errors.js';

const event = (type, detail) => ({ at: new Date(), type, detail });

/**
 * Create a PENDING booking. The price is always calculated here, from the selection only.
 * Repeating the call with the same idempotency key returns the same booking.
 *
 * @returns {Promise<{booking: object, reused: boolean}>}
 */
export async function createBooking(input, { idempotencyKey, userId } = {}) {
  const quote = buildQuote(input);

  if (input.expectedTotalLKR !== undefined && input.expectedTotalLKR !== quote.pricing.totalLKR) {
    throw conflict('The price has changed since you last viewed it. Please refresh the page and try again.', 'PRICE_MISMATCH', { totalLKR: quote.pricing.totalLKR });
  }

  if (idempotencyKey) {
    const existing = await Booking.findOne({ idempotencyKey });
    if (existing) {
      const same =
        existing.customer.email === input.email.toLowerCase() &&
        existing.safariDate === input.safariDate &&
        existing.safari.id === quote.safari.id &&
        existing.jeep.id === quote.jeep.id &&
        existing.adults === quote.adults &&
        existing.children === quote.children &&
        existing.infants === quote.infants &&
        existing.billing.currency === quote.billing.currency;
      if (!same) throw conflict('This request key was already used for a different booking.', 'IDEMPOTENCY_KEY_REUSED');
      return { booking: existing, reused: true };
    }
  }

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const bookingRef = newBookingRef();
    try {
      const booking = await Booking.create({
        bookingRef,
        idempotencyKey: idempotencyKey || undefined,
        customer: { name: input.name, email: input.email, phone: input.phone, country: input.country },
        safariDate: input.safariDate,
        arrivalDate: input.arrivalDate,
        pickupLocation: input.pickupLocation,
        specialRequests: input.specialRequests,
        ...quote,
        paymentStatus: 'PENDING',
        bookingStatus: 'PENDING',
        payment: { gateway: 'PAYHERE', orderId: bookingRef },
        user: userId || undefined,
        events: [event('BOOKING_CREATED', { totalLKR: quote.pricing.totalLKR, billing: `${quote.billing.amountFixed} ${quote.billing.currency}` })],
      });
      return { booking, reused: false };
    } catch (err) {
      if (err && err.code === 11000) {
        const key = Object.keys(err.keyPattern || {})[0];
        if (key === 'idempotencyKey') {
          // two identical requests raced: return the one that won
          const winner = await Booking.findOne({ idempotencyKey });
          if (winner) return { booking: winner, reused: true };
        }
        if (key === 'bookingRef') continue; // astronomically unlikely — try another reference
      }
      throw err;
    }
  }
  throw new Error('Could not allocate a unique booking reference.');
}

/** What the customer-facing page may know about a booking (it is looked up by its secret reference). */
export async function getPublicStatus(bookingRef) {
  const b = await Booking.findOne({ bookingRef }).lean();
  if (!b) throw notFound('We could not find that booking.', 'BOOKING_NOT_FOUND');
  return {
    bookingRef: b.bookingRef,
    paymentStatus: b.paymentStatus,
    bookingStatus: b.bookingStatus,
    emailStatus: b.email.status,
    customerFirstName: b.customer.name.split(/\s+/)[0],
    customerEmail: b.customer.email,
    safariName: b.safari.name,
    safariDate: b.safariDate,
    jeepName: b.jeep.name,
    jeeps: b.jeeps,
    guests: b.totalPeople,
    billing: { currency: b.billing.currency, amountFixed: b.billing.amountFixed },
  };
}

export async function listForUser(user, limit = 50) {
  return Booking.find({ $or: [{ user: user._id }, { 'customer.email': user.email }] })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('bookingRef safariDate safari jeep jeeps adults children infants billing paymentStatus bookingStatus createdAt')
    .lean();
}
