import mongoose, { Document, Schema } from "mongoose";

export interface IRestaurant extends Document {
  ownerId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  images: string[];
  address?: string;
  deliveryFee: number;
  openingTime: string;
  closingTime: string;
  tags: string[];
  rating: number;
  totalReviews: number;
  createdAt: Date;
  updatedAt: Date;
  isOpen(): boolean;
}

const restaurantSchema = new Schema<IRestaurant>(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, "Restaurant name is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    images: {
      type: [String],
      default: [],
    },
    address: {
      type: String,
      trim: true,
    },
    deliveryFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    openingTime: {
      type: String,
      required: [true, "Opening time is required"],
    },
    closingTime: {
      type: String,
      required: [true, "Closing time is required"],
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalReviews: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes
restaurantSchema.index({ name: 1 });
restaurantSchema.index({ ownerId: 1, name: 1 });

// Virtual: Check if restaurant is currently open
restaurantSchema.methods.isOpen = function (): boolean {
  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  const [openHour, openMin] = this.openingTime.split(":").map(Number);
  const [closeHour, closeMin] = this.closingTime.split(":").map(Number);
  const [currHour, currMin] = currentTime.split(":").map(Number);

  const openMinutes = openHour * 60 + openMin;
  const closeMinutes = closeHour * 60 + closeMin;
  const currMinutes = currHour * 60 + currMin;

  // Handle overnight closing (e.g., 22:00 - 02:00)
  if (closeMinutes < openMinutes) {
    return currMinutes >= openMinutes || currMinutes < closeMinutes;
  }

  return currMinutes >= openMinutes && currMinutes < closeMinutes;
};

// Virtual: Status field (computed)
restaurantSchema.virtual("status").get(function () {
  return this.isOpen() ? "Open" : "Closed";
});

// Ensure virtuals are included in JSON
restaurantSchema.set("toJSON", { virtuals: true });
restaurantSchema.set("toObject", { virtuals: true });

export default mongoose.model<IRestaurant>("Restaurant", restaurantSchema);
