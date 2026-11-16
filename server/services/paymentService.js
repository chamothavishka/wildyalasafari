/**
 * Payment state machine. The ONLY way a booking becomes PAID / CONFIRMED is a gateway
 * notification that has already passed signature + order + amount + currency checks.
 *
 * Every transition is a single atomic findOneAndUpdate guarded by the current status, so
 * duplicate or concurrent notifications can never create a second payment, a second
 * confirmation or a second e-mail — whichever request flips the status first "wins" and
 * the rest are recorded as duplicates.
 */
import { Booking } from '../models/Booking.js';
import { STATUS, sameAmount } from './payhere.js';
import { log } from '../utils/logger.js';

const event = (type, detail) => ({ at: new Date(), type, detail });
const push = (ev) => ({ events: { $each: [ev], $slice: -100 } });
const OPEN = ['PENDING', 'FAILED', 'CANCELLED'];

/**
 * @param {import('mongoose').Document} booking
 * @param {{orderId:string,paymentId:string,amount:string,currency:string,statusCode:number,statusMessage:string,method:string}} n verified notification
 * @returns {Promise<{outcome:string, booking:object|null, confirmed:boolean}>}
 */
export async function applyVerifiedNotification(booking, n) {
  // The notification must describe exactly what we asked the customer to pay.
  if (n.currency !== booking.billing.currency || !sameAmount(n.amount, booking.billing.amountFixed)) {
    await Booking.updateOne(
      { _id: booking._id },
      { $push: push(event('AMOUNT_MISMATCH', { got: `${n.amount} ${n.currency}`, expected: `${booking.billing.amountFixed} ${booking.billing.currency}`, statusCode: n.statusCode })) },
    );
    log.error('Payment amount mismatch — booking not updated', { ref: booking.bookingRef });
    return { outcome: 'AMOUNT_MISMATCH', booking, confirmed: false };
  }

  const now = new Date();

  if (n.statusCode === STATUS.SUCCESS) {
    if (!n.paymentId) return { outcome: 'REJECTED_NO_PAYMENT_ID', booking, confirmed: false };
    const updated = await Booking.findOneAndUpdate(
      { _id: booking._id, paymentStatus: { $in: OPEN } },
      {
        $set: {
          paymentStatus: 'PAID',
          bookingStatus: 'CONFIRMED',
          'payment.transactionId': n.paymentId,
          'payment.method': n.method,
          'payment.statusCode': n.statusCode,
          'payment.statusMessage': n.statusMessage,
          'payment.paidAt': now,
          'payment.verifiedAt': now,
        },
        $push: push(event('PAYMENT_VERIFIED', { paymentId: n.paymentId, method: n.method })),
      },
      { returnDocument: 'after' },
    );
    if (updated) return { outcome: 'PAID', booking: updated, confirmed: true };
    // Already PAID (or charged back): a repeat notification. Nothing is created or sent again.
    const current = await Booking.findById(booking._id);
    const sameTxn = Boolean(current) && current.payment.transactionId === n.paymentId;
    await Booking.updateOne({ _id: booking._id }, { $push: push(event(sameTxn ? 'DUPLICATE_NOTIFICATION' : 'SECOND_PAYMENT_ATTEMPT', { paymentId: n.paymentId })) });
    if (!sameTxn) log.warn('A second, different payment id was reported for an already paid booking — review it in PayHere', { ref: booking.bookingRef });
    return { outcome: sameTxn ? 'DUPLICATE' : 'SECOND_PAYMENT', booking: current, confirmed: false };
  }

  if (n.statusCode === STATUS.FAILED || n.statusCode === STATUS.CANCELED) {
    const paymentStatus = n.statusCode === STATUS.FAILED ? 'FAILED' : 'CANCELLED';
    const updated = await Booking.findOneAndUpdate(
      { _id: booking._id, paymentStatus: { $in: OPEN } },
      {
        $set: { paymentStatus, bookingStatus: 'CANCELLED', 'payment.statusCode': n.statusCode, 'payment.statusMessage': n.statusMessage },
        $push: push(event(`PAYMENT_${paymentStatus}`, { statusMessage: n.statusMessage })),
      },
      { returnDocument: 'after' },
    );
    return { outcome: updated ? paymentStatus : 'IGNORED_ALREADY_FINAL', booking: updated || booking, confirmed: false };
  }

  if (n.statusCode === STATUS.CHARGEDBACK) {
    const updated = await Booking.findOneAndUpdate(
      { _id: booking._id, paymentStatus: 'PAID' },
      {
        $set: { paymentStatus: 'CHARGEDBACK', 'payment.statusCode': n.statusCode, 'payment.statusMessage': n.statusMessage },
        $push: push(event('CHARGEBACK_REVIEW_NEEDED', { paymentId: n.paymentId })),
      },
      { returnDocument: 'after' },
    );
    if (updated) log.error('Chargeback reported — review this booking', { ref: booking.bookingRef });
    return { outcome: updated ? 'CHARGEDBACK' : 'IGNORED', booking: updated || booking, confirmed: false };
  }

  // status 0 (pending) or anything else: keep a record only.
  await Booking.updateOne({ _id: booking._id }, { $push: push(event('NOTIFICATION_RECORDED', { statusCode: n.statusCode })) });
  return { outcome: 'RECORDED', booking, confirmed: false };
}

/** The customer pressed "cancel" on the gateway page. Only an unpaid booking can be cancelled this way. */
export async function markCustomerCancelled(bookingRef) {
  return Booking.findOneAndUpdate(
    { bookingRef, paymentStatus: 'PENDING' },
    { $set: { paymentStatus: 'CANCELLED', bookingStatus: 'CANCELLED' }, $push: push(event('PAYMENT_CANCELLED', { by: 'customer' })) },
    { returnDocument: 'after' },
  );
}
