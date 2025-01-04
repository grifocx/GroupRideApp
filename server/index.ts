import express, { type Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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
    if (err instanceof Error && 'status' in err) {
      const status = (err as any).status || 500;
      return res.status(status).json({
        error: err.message || "Internal Server Error"
      });
    }

    // Default error response
    res.status(500).json({
      error: "Internal Server Error",
      message: app.get("env") === "development" ? (err as Error).message : undefined
    });
  });

  // Setup Vite or static file serving
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const PORT = 5000;
  server.listen(PORT, "0.0.0.0", () => {
    log(`Server running on port ${PORT}`);
  });
})();