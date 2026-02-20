import mongoose from "mongoose";
import Restaurant from "../models/Restaurant";
import { env } from "../config/env";

const fixProfileFlags = async () => {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log("Connected to MongoDB");

    // Update all restaurants to set isProfileComplete based on conditions
    const restaurants = await Restaurant.find();

    let updated = 0;
    for (const restaurant of restaurants) {
      const shouldBeComplete =
        restaurant.images.length > 0 &&
        !!restaurant.name &&
        !!restaurant.address &&
        !!restaurant.openingTime &&
        !!restaurant.closingTime;

      if (restaurant.isProfileComplete !== shouldBeComplete) {
        restaurant.isProfileComplete = shouldBeComplete;
        await restaurant.save();
        updated++;
        console.log(
          `✅ Updated ${restaurant.name}: isProfileComplete = ${shouldBeComplete}`,
        );
      }
    }

    console.log(`\n✅ Migration complete. Updated ${updated} restaurants.`);
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
};

fixProfileFlags();
