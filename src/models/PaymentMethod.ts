import mongoose, { Document, Schema } from "mongoose";

export interface IPaymentMethod extends Document {
  userId: mongoose.Types.ObjectId;
  type: "cash" | "card";

  // Card details (only if type = 'card')
  authorizationCode?: string; // Paystack reusable token
  cardLast4?: string;
  cardBrand?: string;
  cardExpMonth?: string;
  cardExpYear?: string;
  bank?: string;

  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const paymentMethodSchema = new Schema<IPaymentMethod>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["cash", "card"],
      required: true,
    },

    // Card-specific fields
    authorizationCode: {
      type: String,
      select: false, // Don't return in queries by default (security)
    },
    cardLast4: {
      type: String,
    },
    cardBrand: {
      type: String,
    },
    cardExpMonth: {
      type: String,
    },
    cardExpYear: {
      type: String,
    },
    bank: {
      type: String,
    },

    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

paymentMethodSchema.index({ userId: 1, isDefault: 1 });

export default mongoose.model<IPaymentMethod>(
  "PaymentMethod",
  paymentMethodSchema,
);
