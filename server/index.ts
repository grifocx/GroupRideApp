import express, { type Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { setupVite, serveStatic, log } from "./vite";
import { setupAuth } from "./auth";
import { registerRoutes } from "./routes";

const app = express();

// Basic middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Set up authentication before routes
setupAuth(app);

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (req.path.startsWith("/api")) {
      log(`${req.method} ${req.path} ${res.statusCode} in ${duration}ms`);
    }
  });
  next();
});

(async () => {
  try {
    // Register routes and get HTTP server
    const server = registerRoutes(app);

    // Error handling middleware
    app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
      console.error("Unhandled error:", err);

      if (err instanceof ZodError) {
        return res.status(400).json({
          error: "Validation error",
          details: err.issues.map(issue => issue.message)
        });
      }

      if (err instanceof Error) {
        const status = (err as any).status || 500;
        const message = err.message || "Internal Server Error";

        if (status === 500) {
          console.error("Internal Server Error:", err);
        }

        return res.status(status).json({
          error: message,
          details: app.get("env") === "development" ? err.stack : undefined
        });
      }

      res.status(500).json({
        error: "Internal Server Error",
        message: app.get("env") === "development" ? String(err) : undefined
      });
    });

    // Setup Vite or static file serving based on environment
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    const PORT = parseInt(process.env.PORT || "5000", 10);
    server.listen(PORT, "0.0.0.0", () => {
      log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
})();