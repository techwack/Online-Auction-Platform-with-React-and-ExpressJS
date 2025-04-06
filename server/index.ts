import express, { type Request, type Response, type NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import cors from "cors";
import type { Server } from "http";
import 'dotenv/config'; // Add this at the top

// Set environment variables if they're not already set
if (!process.env.SESSION_SECRET) {
  process.env.SESSION_SECRET = "bidhub-auction-platform-secret-" + Date.now().toString();
  log("SESSION_SECRET not found, using generated value");
}

const app = express();
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server: Server = await registerRoutes(app);

  // Error handling middleware
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    log(`Error ${status}: ${message}`, "error");
  });

  // Development vs Production setup
  if (app.get("env") === "development") {
    await setupVite(app, server);
    log("Vite development server configured");
  } else {
    serveStatic(app);
    log("Production static files serving configured");
  }
  const PORT = process.env.PORT || 3000; // 👈 Here's where it goes
  app.listen(PORT, () => {
    log(`Server running on port ${PORT}`);
  });
  // Start server
})();