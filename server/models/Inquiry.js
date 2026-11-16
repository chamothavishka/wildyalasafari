import mongoose from 'mongoose';

const { Schema } = mongoose;

export const INQUIRY_SOURCES = ['booking', 'contact'];
export const INQUIRY_STATUS = ['NEW', 'CONTACTED', 'CLOSED'];

/**
 * A question or "help me book" request that has NOT been paid for.
 * Paid (or checkout-started) bookings live in the `bookings` collection instead.
 */
const inquirySchema = new Schema(
  {
    source: { type: String, enum: INQUIRY_SOURCES, required: true }, // which form it came from
    via: { type: String, enum: ['whatsapp', 'email', 'form'], default: 'form' }, // the channel the guest chose
    status: { type: String, enum: INQUIRY_STATUS, default: 'NEW' }, // for the team to update in Compass

    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, lowercase: true, trim: true, maxlength: 254 },
    phone: { type: String, trim: true, maxlength: 30, default: '' },
    country: { type: String, trim: true, maxlength: 60, default: '' },
    message: { type: String, trim: true, maxlength: 2000, default: '' },
    interest: { type: String, trim: true, maxlength: 60, default: '' },

    /** Safari details, when the inquiry came from the booking page. */
    safari: {
      id: { type: String, enum: ['morning', 'evening', 'fullday'] },
      jeepId: { type: String, enum: ['hilux', 'cruiser'] },
      adults: { type: Number, min: 0 },
      children: { type: Number, min: 0 },
      infants: { type: Number, min: 0 },
      safariDate: { type: String, default: '' },
      arrivalDate: { type: String, default: '' },
      pickupLocation: { type: String, trim: true, maxlength: 300, default: '' },
      estimatedTotalLKR: { type: Number, min: 0 },
    },

    user: { type: Schema.Types.ObjectId, ref: 'User' }, // set when the guest was signed in
  },
  { timestamps: true },
);

inquirySchema.index({ createdAt: -1 });
inquirySchema.index({ status: 1, createdAt: -1 });
inquirySchema.index({ email: 1, createdAt: -1 });

export const Inquiry = mongoose.models.Inquiry || mongoose.model('Inquiry', inquirySchema);
