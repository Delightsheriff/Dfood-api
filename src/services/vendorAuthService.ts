import User from "../models/User";
import Restaurant from "../models/Restaurant";
import { UserRole } from "../types/auth";
import { ConflictError } from "../types/errors";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { notificationService } from "./notificationService";

interface VendorSignupInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  restaurantName: string;
  restaurantAddress: string;
  deliveryFee: number;
  openingTime: string;
  closingTime: string;
  description?: string;
}

export class VendorAuthService {
  async createVendorWithRestaurant(data: VendorSignupInput) {
    // Check if email exists
    const existingUser = await User.findOne({
      email: data.email.toLowerCase(),
    });

    if (existingUser) {
      throw new ConflictError("Email already registered");
    }

    // Create user with vendor role
    const user = await User.create({
      name: `${data.firstName} ${data.lastName}`,
      email: data.email.toLowerCase(),
      password: data.password,
      phone: data.phone,
      role: UserRole.VENDOR,
    });

    // Create restaurant (images empty, will be added later)
    const restaurant = await Restaurant.create({
      ownerId: user._id,
      name: data.restaurantName,
      address: data.restaurantAddress,
      deliveryFee: data.deliveryFee,
      openingTime: data.openingTime,
      closingTime: data.closingTime,
      description: data.description || "",
      images: [], // Empty - vendor adds later
    });

    // NOTIFY ADMINS ABOUT NEW VENDOR

    await notificationService.notifyAdminsNewVendor(
      user.name,
      user._id.toString(),
      restaurant.name,
    );

    // Generate token
    const token = jwt.sign({ id: user._id, role: user.role }, env.JWT_SECRET!, {
      expiresIn: env.JWT_EXPIRE as any,
    });

    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
      },
      restaurant: {
        id: restaurant._id,
        name: restaurant.name,
      },
      token,
    };
  }
}

export const vendorAuthService = new VendorAuthService();
