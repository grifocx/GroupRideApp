import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { db } from "@db";
import { rides, rideParticipants, insertRideSchema, type User } from "@db/schema";
import { and, eq } from "drizzle-orm";
import * as z from 'zod';
import { geocodeAddress } from "./geocoding";

// Helper to ensure authenticated user
const ensureAuthenticated = (req: Express.Request): User => {
  if (!req.isAuthenticated()) {
    const error = new Error("Not authenticated");
    error.status = 401;
    throw error;
  }
  return req.user as User;
};

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
      console.error("Error fetching rides:", error);
      res.status(500).json({ 
        error: "Failed to fetch rides",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Create new ride
  app.post("/api/rides", async (req, res) => {
    try {
      const user = ensureAuthenticated(req);

      // Convert numeric string fields to numbers and ensure difficulty is a valid string
      const body = {
        ...req.body,
        difficulty: String(req.body.difficulty).toUpperCase(), // Ensure difficulty is a string and uppercase
        distance: Number(req.body.distance),
        maxRiders: Number(req.body.maxRiders),
        pace: Number(req.body.pace),
        ownerId: user.id
      };

      console.log("Attempting to validate ride data:", body);
      const validatedData = insertRideSchema.parse(body);

      // Geocode the address
      const coordinates = await geocodeAddress(validatedData.address);
      if (!coordinates) {
        return res.status(400).json({ 
          error: "Invalid address",
          details: "Could not find coordinates for the provided address"
        });
      }

      // Create the ride with geocoded coordinates
      const [newRide] = await db
        .insert(rides)
        .values({
          ...validatedData,
          latitude: coordinates.lat,
          longitude: coordinates.lon
        })
        .returning();

      res.json(newRide);
    } catch (error) {
      console.error("Error creating ride:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Validation error", 
          details: error.issues.map(i => i.message)
        });
      }
      if (error instanceof Error && error.message === "Not authenticated") {
        return res.status(401).json({ error: "Not authenticated" });
      }
      res.status(500).json({ 
        error: "Failed to create ride",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Join ride
  app.post("/api/rides/:id/join", async (req, res) => {
    try {
      const user = ensureAuthenticated(req);

      const rideId = parseInt(req.params.id);
      if (isNaN(rideId)) {
        return res.status(400).json({ error: "Invalid ride ID" });
      }

      // Check if ride exists first
      const ride = await db.query.rides.findFirst({
        where: eq(rides.id, rideId),
        with: {
          participants: true
        }
      });

      if (!ride) {
        return res.status(404).json({ error: "Ride not found" });
      }

      // Check if ride is full
      if (ride.participants.length >= ride.maxRiders) {
        return res.status(400).json({ error: "Ride is full" });
      }

      const existingParticipant = await db
        .select()
        .from(rideParticipants)
        .where(
          and(
            eq(rideParticipants.rideId, rideId),
            eq(rideParticipants.userId, user.id)
          )
        )
        .limit(1);

      if (existingParticipant.length > 0) {
        return res.status(400).json({ error: "Already joined this ride" });
      }

      await db.insert(rideParticipants)
        .values({
          rideId,
          userId: user.id,
        });

      res.json({ message: "Successfully joined ride" });
    } catch (error) {
      console.error("Error joining ride:", error);
      if (error instanceof Error && error.message === "Not authenticated") {
        return res.status(401).json({ error: "Not authenticated" });
      }
      res.status(500).json({ 
        error: "Failed to join ride",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Leave ride
  app.post("/api/rides/:id/leave", async (req, res) => {
    try {
      const user = ensureAuthenticated(req);

      const rideId = parseInt(req.params.id);
      if (isNaN(rideId)) {
        return res.status(400).json({ error: "Invalid ride ID" });
      }

      // Check if user is actually in the ride
      const participant = await db
        .select()
        .from(rideParticipants)
        .where(
          and(
            eq(rideParticipants.rideId, rideId),
            eq(rideParticipants.userId, user.id)
          )
        )
        .limit(1);

      if (participant.length === 0) {
        return res.status(400).json({ error: "Not joined in this ride" });
      }

      await db.delete(rideParticipants)
        .where(
          and(
            eq(rideParticipants.rideId, rideId),
            eq(rideParticipants.userId, user.id)
          )
        );

      res.json({ message: "Successfully left ride" });
    } catch (error) {
      console.error("Error leaving ride:", error);
      if (error instanceof Error && error.message === "Not authenticated") {
        return res.status(401).json({ error: "Not authenticated" });
      }
      res.status(500).json({ 
        error: "Failed to leave ride",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Delete ride
  app.delete("/api/rides/:id", async (req, res) => {
    try {
      const user = ensureAuthenticated(req);

      const rideId = parseInt(req.params.id);
      if (isNaN(rideId)) {
        return res.status(400).json({ error: "Invalid ride ID" });
      }

      // Verify ride ownership
      const ride = await db.query.rides.findFirst({
        where: eq(rides.id, rideId),
      });

      if (!ride) {
        return res.status(404).json({ error: "Ride not found" });
      }

      if (ride.ownerId !== user.id) {
        return res.status(403).json({ error: "Not authorized to delete this ride" });
      }

      // First delete all ride participants
      await db.delete(rideParticipants)
        .where(eq(rideParticipants.rideId, rideId));

      // Then delete the ride
      await db.delete(rides)
        .where(eq(rides.id, rideId));

      res.json({ message: "Successfully deleted ride" });
    } catch (error) {
      console.error("Error deleting ride:", error);
      if (error instanceof Error && error.message === "Not authenticated") {
        return res.status(401).json({ error: "Not authenticated" });
      }
      res.status(500).json({ 
        error: "Failed to delete ride",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}