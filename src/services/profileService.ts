import User, { IUser } from "../models/User";
import { cloudinaryService } from "./cloudinaryService";
import { UpdateProfileInput } from "../types/profile";
import { NotFoundError } from "../types/errors";

export class ProfileService {
  private sanitizeUser(user: IUser) {
    return {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profileImage: user.profileImage,
      phone: user.phone,
    };
  }

  async getProfile(userId: string): Promise<any> {
    const user = await User.findById(userId);

    if (!user) {
      throw new NotFoundError("User not found");
    }

    return this.sanitizeUser(user);
  }

  async updateProfile(userId: string, data: UpdateProfileInput): Promise<any> {
    const user = await User.findById(userId);

    if (!user) {
      throw new NotFoundError("User not found");
    }

    if (data.name) user.name = data.name;
    if (data.phone !== undefined) user.phone = data.phone;

    await user.save();

    return this.sanitizeUser(user);
  }

  async updateProfileImage(userId: string, imageBuffer: Buffer): Promise<any> {
    const user = await User.findById(userId);

    if (!user) {
      throw new NotFoundError("User not found");
    }

    const oldImage = user.profileImage;

    // Upload new image
    const imageUrl = await cloudinaryService.uploadImage(
      imageBuffer,
      "profile-images",
    );
    user.profileImage = imageUrl;
    await user.save();

    // Delete old image (non-blocking)
    if (oldImage) {
      cloudinaryService
        .deleteImage(oldImage)
        .catch((err) =>
          console.error("Failed to delete old profile image:", err),
        );
    }
    return this.sanitizeUser(user);
  }

  async deleteProfileImage(userId: string): Promise<any> {
    const user = await User.findById(userId);

    if (!user) {
      throw new NotFoundError("User not found");
    }

    const oldImage = user.profileImage;

    user.profileImage = undefined;
    await user.save();

    // Delete from Cloudinary (non-blocking)
    if (oldImage) {
      cloudinaryService
        .deleteImage(oldImage)
        .catch((err) => console.error("Failed to delete profile image:", err));
    }

    return this.sanitizeUser(user);
  }
}

export const profileService = new ProfileService();
