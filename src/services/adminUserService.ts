import User from "../models/User";
import { UserRole } from "../types/auth";

export class AdminUserService {
  async getAllUsers(filters?: { role?: UserRole; search?: string }) {
    const query: any = {};

    // Filter by role if provided
    if (filters?.role) {
      query.role = filters.role;
    }

    // Search by name or email
    if (filters?.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: "i" } },
        { email: { $regex: filters.search, $options: "i" } },
      ];
    }

    const users = await User.find(query)
      .select("-password -resetOTP -resetOTPExpire")
      .sort({ createdAt: -1 })
      .lean();

    return users;
  }

  async getUserById(id: string) {
    const user = await User.findById(id)
      .select("-password -resetOTP -resetOTPExpire")
      .lean();

    return user;
  }

  async getUserStats() {
    const [totalUsers, customerCount, vendorCount, adminCount] =
      await Promise.all([
        User.countDocuments(),
        User.countDocuments({ role: UserRole.CUSTOMER }),
        User.countDocuments({ role: UserRole.VENDOR }),
        User.countDocuments({ role: UserRole.ADMIN }),
      ]);

    // Get recent signups (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentSignups = await User.countDocuments({
      createdAt: { $gte: sevenDaysAgo },
    });

    return {
      total: totalUsers,
      customers: customerCount,
      vendors: vendorCount,
      admins: adminCount,
      recentSignups,
    };
  }
}

export const adminUserService = new AdminUserService();
