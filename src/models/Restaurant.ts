import mongoose, { Document, Schema } from "mongoose";
import { checkIsOpen } from "../utils/timeUtils";

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

restaurantSchema.index({ name: 1 });
restaurantSchema.index({ ownerId: 1, name: 1 });
restaurantSchema.index({ name: "text" });

restaurantSchema.methods.isOpen = function (): boolean {
  return checkIsOpen(this.openingTime, this.closingTime);
};

restaurantSchema.virtual("status").get(function () {
  return this.isOpen() ? "Open" : "Closed";
});

restaurantSchema.set("toJSON", { virtuals: true });
restaurantSchema.set("toObject", { virtuals: true });

export default mongoose.model<IRestaurant>("Restaurant", restaurantSchema);
