import mongoose, { Document, Schema } from "mongoose";

export interface IFavorite extends Document {
  userId: mongoose.Types.ObjectId;
  foodItemId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const favoriteSchema = new Schema<IFavorite>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    foodItemId: {
      type: Schema.Types.ObjectId,
      ref: "FoodItem",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

// Compound index: one favorite per user per food item
favoriteSchema.index({ userId: 1, foodItemId: 1 }, { unique: true });

export default mongoose.model<IFavorite>("Favorite", favoriteSchema);
