import express, { Application, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import authRoutes from "./routes/authRoutes";
import { errorHandler } from "./middleware/errorHandler";

const app: Application = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// Routes
app.use("/api/auth", authRoutes);

// 404
app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// Global Error Handler
app.use(errorHandler);

export default app;
