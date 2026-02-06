import mongoose from "mongoose";
import User from "../models/User";
import { UserRole } from "../types/auth";
import { env } from "../config/env";

const seedAdmin = async () => {
  try {
    await mongoose.connect(env.MONGODB_URI);

    const adminEmail = process.env.ADMIN_EMAIL || "admin@foodapp.com";
    const adminPassword = process.env.ADMIN_PASSWORD || "Admin123!@#";

    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log("Admin already exists");
      process.exit(0);
    }

    await User.create({
      name: "Super Admin",
      email: adminEmail,
      password: adminPassword,
      role: UserRole.ADMIN,
    });

    console.log(`✅ Admin created successfully`);
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);
    console.log("⚠️  CHANGE THIS PASSWORD IMMEDIATELY");

    process.exit(0);
  } catch (error) {
    console.error("Failed to seed admin:", error);
    process.exit(1);
  }
};

seedAdmin();
