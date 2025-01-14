import express, { type Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { setupVite, serveStatic, log } from "./vite";
import { setupAuth } from "./auth";
import { registerRoutes } from "./routes";

// Create Express application
const app = express();

// Basic middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Set up authentication before routes
setupAuth(app);

// Request logging middleware
app.use((req, res, next) => {
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

      // Only log response body for non-200 status codes or if it contains an error
      if (res.statusCode !== 200 || (capturedJsonResponse && capturedJsonResponse.error)) {
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
  try {
    // Register routes and get HTTP server
    const server = registerRoutes(app);

    // Error handling middleware
    app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
      console.error("Unhandled error:", err);

      // Handle Zod validation errors
      if (err instanceof ZodError) {
        return res.status(400).json({
          error: "Validation error",
          details: err.issues.map(issue => issue.message)
        });
      }

      // Handle known errors with status codes
      if (err instanceof Error) {
        const status = (err as any).status || 500;
        const message = err.message || "Internal Server Error";

        // Log internal server errors
        if (status === 500) {
          console.error("Internal Server Error:", err);
        }

        return res.status(status).json({
          error: message,
          details: app.get("env") === "development" ? err.stack : undefined
        });
      }

      // Default error response
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