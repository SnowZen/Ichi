import path from "path";
import { createServer } from "./index";
import * as express from "express";

const app = createServer();
const port = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === "production";

// In production, serve the built SPA files
const __dirname = import.meta.dirname;
const distPath = path.join(__dirname, "../spa");

// Security headers for production
if (isProduction) {
  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    next();
  });
}

// Serve static files with proper caching headers
app.use(
  express.static(distPath, {
    maxAge: isProduction ? "1y" : 0,
    etag: true,
    lastModified: true,
  }),
);

// Health check endpoint for Render
app.get("/health", (req, res) => {
  const uptime = process.uptime();
  const memUsage = process.memoryUsage();

  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(uptime / 60)}m ${Math.floor(uptime % 60)}s`,
    memory: {
      used: Math.round(memUsage.heapUsed / 1024 / 1024) + " MB",
      total: Math.round(memUsage.heapTotal / 1024 / 1024) + " MB",
    },
    env: process.env.NODE_ENV,
  });
});

// Handle React Router - serve index.html for all non-API routes
app.get("*", (req, res) => {
  // Don't serve index.html for API routes or health check
  if (req.path.startsWith("/api/") || req.path.startsWith("/health")) {
    return res.status(404).json({ error: "API endpoint not found" });
  }

  res.sendFile(path.join(distPath, "index.html"));
});

const server = app.listen(port, "0.0.0.0", () => {
  console.log(`🚀 Board Games Hub server running on port ${port}`);
  console.log(`📱 Frontend: http://localhost:${port}`);
  console.log(`🔧 API: http://localhost:${port}/api`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("🛑 Received SIGTERM, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("🛑 Received SIGINT, shutting down gracefully");
  process.exit(0);
});
