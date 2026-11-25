
import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";

import chatRoutes from "./routes/chat.routes";
import userRoutes from "./routes/user.routes";

const app: Application = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors());

// Parse JSON requests
app.use(express.json());

// Health check
app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Chat backend is running",
  });
});

// API routes
app.use("/user", userRoutes);
app.use("/chat", chatRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

export default app;
