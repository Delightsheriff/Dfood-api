import mongoose, { Document, Schema } from "mongoose";

export type NotificationType =
  | "new_order" // Vendor: new order received
  | "order_cancelled" // Vendor: customer cancelled order
  | "new_vendor_signup"; // Admin: new vendor signed up

export interface INotification extends Document {
  recipientId: mongoose.Types.ObjectId; // User who receives notification
  type: NotificationType;
  title: string;
  message: string;
  data?: any; // Additional data (orderId, vendorId, etc.)
  read: boolean;
  createdAt: Date;
  expiresAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    recipientId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["new_order", "order_cancelled", "new_vendor_signup"],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    data: {
      type: Schema.Types.Mixed,
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true, // For TTL cleanup
    },
  },
  {
    timestamps: true,
  },
);

// Compound index for efficient queries
notificationSchema.index({ recipientId: 1, read: 1, createdAt: -1 });

// TTL index - MongoDB automatically deletes expired documents
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model<INotification>(
  "Notification",
  notificationSchema,
);
