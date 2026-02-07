import mongoose, { Document, Schema } from "mongoose";

export interface ICategory extends Document {
  name: string;
  image: string;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      unique: true,
      trim: true,
    },
    image: {
      type: String,
      required: [true, "Category image is required"],
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model<ICategory>("Category", categorySchema);
