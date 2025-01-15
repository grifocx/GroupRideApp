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
  log(`Incoming request: ${req.method} ${req.path}`);
  res.on("finish", () => {
    const duration = Date.now() - start;
    log(`${req.method} ${req.path} ${res.statusCode} in ${duration}ms`);
  });
  next();
});

(async () => {
  try {
    log("Starting server initialization...");
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
      log("Setting up Vite for development...");
      await setupVite(app, server);
    } else {
      log("Setting up static file serving for production...");
      serveStatic(app);
    }

    // Try different ports if default port is in use
    const tryPorts = [5000, 5001, 5002, 5003];
    let port: number | null = null;

    for (const tryPort of tryPorts) {
      try {
        await new Promise((resolve, reject) => {
          log(`Attempting to start server on port ${tryPort}...`);
          server.listen(tryPort, "0.0.0.0")
            .once('listening', () => {
              port = tryPort;
              resolve(true);
            })
            .once('error', (err) => {
              if (err.code === 'EADDRINUSE') {
                log(`Port ${tryPort} is in use, trying next port...`);
                resolve(false);
              } else {
                reject(err);
              }
            });
        });

        if (port !== null) {
          break;
        }
      } catch (err) {
        console.error(`Error trying port ${tryPort}:`, err);
      }
    }

    if (port === null) {
      throw new Error("Could not find an available port");
    }

    log(`Server successfully started and running on port ${port}`);
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
})();