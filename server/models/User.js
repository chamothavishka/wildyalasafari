import mongoose from 'mongoose';

const { Schema } = mongoose;

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
    name: { type: String, trim: true, maxlength: 120, default: '' },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
    /** Bumped on every password change so older sessions stop working. */
    passwordVersion: { type: Number, default: 0 },
    failedLogins: { type: Number, default: 0 },
    lockUntil: { type: Date },
    reset: {
      tokenHash: { type: String },
      expiresAt: { type: Date },
    },
    lastLoginAt: { type: Date },
  },
  { timestamps: true },
);

userSchema.index({ 'reset.tokenHash': 1 }, { sparse: true });

export const User = mongoose.models.User || mongoose.model('User', userSchema);
