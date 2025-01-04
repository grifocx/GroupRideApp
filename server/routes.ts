import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { db } from "@db";
import { rides, rideParticipants, insertRideSchema } from "@db/schema";
import { eq } from "drizzle-orm";
import * as z from 'zod';

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  // Get all rides
  app.get("/api/rides", async (_req, res) => {
    try {
      const allRides = await db.query.rides.findMany({
        with: {
          owner: true,
          participants: {
            with: {
              user: true
            }
          }
        }
      });
      res.json(allRides);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch rides" });
    }
  });

  // Create new ride
  app.post("/api/rides", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    const userId = (req.user as any).id;
    if (!userId) {
      return res.status(401).send("User ID not found");
    }

    try {
      const validatedData = insertRideSchema.parse({
        ...req.body,
        ownerId: userId
      });

      const [ride] = await db
        .insert(rides)
        .values(validatedData)
        .returning();

      res.json(ride);
    } catch (error) {
      console.error("Error creating ride:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.issues });
      }
      res.status(500).json({ error: "Failed to create ride" });
    }
  });

  // Join ride
  app.post("/api/rides/:id/join", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    const rideId = parseInt(req.params.id);
    if (isNaN(rideId)) {
      return res.status(400).json({ error: "Invalid ride ID" });
    }

    try {
      const [existingParticipant] = await db
        .select()
        .from(rideParticipants)
        .where(eq(rideParticipants.rideId, rideId))
        .where(eq(rideParticipants.userId, req.user.id));

      if (existingParticipant) {
        return res.status(400).json({ error: "Already joined this ride" });
      }

      await db.insert(rideParticipants).values({
        rideId,
        userId: req.user.id,
      });

      res.json({ message: "Successfully joined ride" });
    } catch (error) {
      res.status(500).json({ error: "Failed to join ride" });
    }
  });

  // Leave ride
  app.post("/api/rides/:id/leave", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    const rideId = parseInt(req.params.id);
    if (isNaN(rideId)) {
      return res.status(400).json({ error: "Invalid ride ID" });
    }

    try {
      await db
        .delete(rideParticipants)
        .where(eq(rideParticipants.rideId, rideId))
        .where(eq(rideParticipants.userId, req.user.id));

      res.json({ message: "Successfully left ride" });
    } catch (error) {
      res.status(500).json({ error: "Failed to leave ride" });
    }
  });

  // Delete ride
  app.delete("/api/rides/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    const rideId = parseInt(req.params.id);
    if (isNaN(rideId)) {
      return res.status(400).json({ error: "Invalid ride ID" });
    }

    try {
      await db.delete(rides).where(eq(rides.id, rideId));
      res.json({ message: "Successfully deleted ride" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete ride" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}