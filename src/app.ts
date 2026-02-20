import express, { Application, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import authRoutes from "./routes/authRoutes";
import categoryRoutes from "./routes/categoryRoutes";
import restaurantRoutes from "./routes/restaurantRoutes";
import foodItemRoutes from "./routes/foodItemRoutes";
import searchRoutes from "./routes/searchRoutes";
import profileRoutes from "./routes/profileRoutes";
import favoriteRoutes from "./routes/favoriteRoutes";
import addressRoutes from "./routes/addressRoutes";
import paymentMethodRoutes from "./routes/paymentMethodRoutes";
import orderRoutes from "./routes/orderRoutes";
import vendorAuthRoutes from "./routes/vendorAuthRoutes";
import adminUserRoutes from "./routes/adminUserRoutes";
import dashboardSearchRoutes from "./routes/dashboardSearchRoutes";
import adminOrderRoutes from "./routes/adminOrderRoutes";
import vendorOrderRoutes from "./routes/vendorOrderRoutes";
import vendorAnalyticsRoutes from "./routes/vendorAnalyticsRoutes";
import adminAnalyticsRoutes from "./routes/adminAnalyticsRoutes";

import { errorHandler } from "./middleware/errorHandler";
import passport from "./config/passport";

const app: Application = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use(passport.initialize());

app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/auth/vendor", vendorAuthRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/restaurants", restaurantRoutes);
app.use("/api/food-items", foodItemRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/addresses", addressRoutes);
app.use("/api/payment-methods", paymentMethodRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin/users", adminUserRoutes);
app.use("/api/dashboard/search", dashboardSearchRoutes);
app.use("/api/vendor/orders", vendorOrderRoutes);
app.use("/api/admin/orders", adminOrderRoutes);
app.use("/api/admin/users", adminUserRoutes);
app.use("/api/vendor/analytics", vendorAnalyticsRoutes);
app.use("/api/admin/analytics", adminAnalyticsRoutes);

// 404
app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// Global Error Handler
app.use(errorHandler);

export default app;
