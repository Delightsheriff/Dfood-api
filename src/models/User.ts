import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcrypt";
import { UserRole, VendorStatus } from "../types/auth";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  googleId?: string;

  // Vendor-specific fields
  vendorStatus?: VendorStatus;
  businessName?: string;
  businessAddress?: string;
  businessPhone?: string;

  resetOTP?: string;
  resetOTPExpire?: Date;
  createdAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  isActiveVendor(): boolean;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: function (this: IUser) {
        return !this.googleId;
      },
      select: false,
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.CUSTOMER,
    },
    googleId: {
      type: String,
      sparse: true,
    },
    // Vendor fields
    vendorStatus: {
      type: String,
      enum: Object.values(VendorStatus),
      required: function (this: IUser) {
        return this.role === UserRole.VENDOR;
      },
    },
    businessName: {
      type: String,
      required: function (this: IUser) {
        return this.role === UserRole.VENDOR;
      },
      trim: true,
    },
    businessAddress: {
      type: String,
      required: function (this: IUser) {
        return this.role === UserRole.VENDOR;
      },
    },
    businessPhone: {
      type: String,
      required: function (this: IUser) {
        return this.role === UserRole.VENDOR;
      },
    },

    resetOTP: {
      type: String,
      select: false,
    },
    resetOTPExpire: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true,
  },
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (error: any) {
    throw error;
  }
});

userSchema.methods.comparePassword = async function (
  candidatePassword: string,
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.isActiveVendor = function (): boolean {
  return (
    this.role === UserRole.VENDOR && this.vendorStatus === VendorStatus.ACTIVE
  );
};

export default mongoose.model<IUser>("User", userSchema);
