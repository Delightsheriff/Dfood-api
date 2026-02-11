import mongoose, { Document, Schema } from "mongoose";

export interface IFoodItem extends Document {
  restaurantId: mongoose.Types.ObjectId;
  name: string;
  description: string;
  images: string[];
  price: number;
  categoryIds: string[];
  rating: number;
  totalReviews: number;
  calories?: number;
  createdAt: Date;
  updatedAt: Date;
}

const foodItemSchema = new Schema<IFoodItem>(
  {
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, "Food name is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },
    images: {
      type: [String],
      default: [],
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: 0,
    },
    categoryIds: {
      type: [String],
      required: true,
      validate: {
        validator: (v: string[]) => v.length >= 1 && v.length <= 3,
        message: "Food item must have 1-3 categories",
      },
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
    calories: {
      type: Number,
      min: 0,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes
foodItemSchema.index({ restaurantId: 1, name: 1 });
foodItemSchema.index({ categoryIds: 1 });
foodItemSchema.index({ price: 1 });
foodItemSchema.index({ name: "text", description: "text" });

export default mongoose.model<IFoodItem>("FoodItem", foodItemSchema);
