import mongoose from 'mongoose';

const { Schema } = mongoose;

export const PAYMENT_STATUS = ['PENDING', 'PAID', 'FAILED', 'CANCELLED', 'CHARGEDBACK'];
export const BOOKING_STATUS = ['PENDING', 'CONFIRMED', 'CANCELLED'];
export const EMAIL_STATUS = ['NOT_SENT', 'SENDING', 'SENT', 'FAILED'];

const eventSchema = new Schema(
  {
    at: { type: Date, default: Date.now },
    type: { type: String, required: true },
    detail: { type: Schema.Types.Mixed },
  },
  { _id: false },
);

const bookingSchema = new Schema(
  {
    /** Public booking / order ID (also the order_id sent to the payment gateway). */
    bookingRef: { type: String, required: true, unique: true, immutable: true },
    /** Client-supplied key that makes "create booking" safe to repeat (double click / retry). */
    idempotencyKey: { type: String, immutable: true },

    customer: {
      name: { type: String, required: true, trim: true, maxlength: 120 },
      email: { type: String, required: true, lowercase: true, trim: true, maxlength: 254 },
      phone: { type: String, trim: true, maxlength: 30, default: '' },
      country: { type: String, trim: true, maxlength: 60, default: '' },
    },
    safariDate: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ }, // YYYY-MM-DD (Sri Lanka calendar day)
    arrivalDate: { type: String, default: '', match: /^(\d{4}-\d{2}-\d{2})?$/ },
    pickupLocation: { type: String, required: true, trim: true, maxlength: 300 },
    specialRequests: { type: String, default: '', trim: true, maxlength: 1500 },

    safari: {
      id: { type: String, required: true, enum: ['morning', 'evening', 'fullday'] },
      name: { type: String, required: true },
      time: { type: String, required: true },
    },
    jeep: {
      id: { type: String, required: true, enum: ['hilux', 'cruiser'] },
      name: { type: String, required: true },
    },
    jeeps: { type: Number, required: true, min: 1 },
    adults: { type: Number, required: true, min: 1 },
    children: { type: Number, required: true, min: 0, default: 0 }, // aged 6–11
    infants: { type: Number, required: true, min: 0, default: 0 }, // aged 1–5 (free)
    totalPeople: { type: Number, required: true, min: 1 },

    /** Server-calculated price (LKR is the base currency). */
    pricing: {
      totalLKR: { type: Number, required: true, min: 0 },
      baseCost: { type: Number, required: true },
      extraAdultCost: { type: Number, required: true },
      childCost: { type: Number, required: true },
    },
    /** What the customer is charged by the gateway. */
    billing: {
      currency: { type: String, required: true, enum: ['USD', 'LKR'] },
      amount: { type: Number, required: true, min: 0 },
      amountFixed: { type: String, required: true }, // "106.67" — exactly what is sent to / expected back from the gateway
      lkrPerUnit: { type: Number, required: true },
    },

    paymentStatus: { type: String, enum: PAYMENT_STATUS, default: 'PENDING', required: true },
    bookingStatus: { type: String, enum: BOOKING_STATUS, default: 'PENDING', required: true },

    payment: {
      gateway: { type: String, default: 'PAYHERE' },
      orderId: { type: String }, // = bookingRef
      transactionId: { type: String }, // gateway payment_id, set only after verified success
      method: { type: String },
      statusCode: { type: Number },
      statusMessage: { type: String },
      paidAt: { type: Date },
      verifiedAt: { type: Date },
    },

    /** Confirmation e-mail state — independent of the payment state. */
    email: {
      status: { type: String, enum: EMAIL_STATUS, default: 'NOT_SENT' },
      attempts: { type: Number, default: 0 },
      lastError: { type: String },
      claimedAt: { type: Date },
      sentAt: { type: Date },
      messageId: { type: String },
    },

    user: { type: Schema.Types.ObjectId, ref: 'User' }, // set when the customer was signed in
    events: { type: [eventSchema], default: [] }, // audit trail (gateway notifications, status changes)
  },
  { timestamps: true },
);

bookingSchema.index({ idempotencyKey: 1 }, { unique: true, partialFilterExpression: { idempotencyKey: { $type: 'string' } } });
bookingSchema.index({ 'payment.transactionId': 1 }, { unique: true, partialFilterExpression: { 'payment.transactionId': { $type: 'string' } } });
bookingSchema.index({ 'customer.email': 1, createdAt: -1 });
bookingSchema.index({ safariDate: 1, bookingStatus: 1 });
bookingSchema.index({ paymentStatus: 1, createdAt: -1 });
bookingSchema.index({ 'email.status': 1, paymentStatus: 1 });

export const Booking = mongoose.models.Booking || mongoose.model('Booking', bookingSchema);
