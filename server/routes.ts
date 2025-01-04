import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { db } from "@db";
import { rides, rideParticipants, users, insertRideSchema, type User } from "@db/schema";
import { and, eq, sql } from "drizzle-orm";
import * as z from 'zod';
import { geocodeAddress } from "./geocoding";
import { ensureAdmin } from "./middleware";
import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import express from 'express';

// Configure multer for handling file uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.mimetype)) {
      cb(new Error('Invalid file type. Only JPEG, PNG and GIF are allowed'));
      return;
    }
    cb(null, true);
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

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

  // Create new ride
  app.post("/api/rides", async (req, res) => {
    try {
      const user = ensureAuthenticated(req);

      // Validate the input data
      const result = insertRideSchema.safeParse({
        ...req.body,
        ownerId: user.id
      });

      if (!result.success) {
        return res.status(400).json({ 
          error: "Validation error", 
          details: result.error.issues.map(i => i.message)
        });
      }

      // Get coordinates for the address
      const coordinates = await geocodeAddress(result.data.address);
      if (!coordinates) {
        return res.status(400).json({ 
          error: "Invalid address",
          details: "Could not find coordinates for the provided address"
        });
      }

      // Create the ride
      const [newRide] = await db.insert(rides)
        .values({
          ...result.data,
          latitude: coordinates.lat,
          longitude: coordinates.lon,
          ownerId: user.id
        })
        .returning();

      // Return the created ride with owner information
      const rideWithOwner = await db.query.rides.findFirst({
        where: eq(rides.id, newRide.id),
        with: {
          owner: true,
          participants: {
            with: {
              user: true
            }
          }
        }
      });

      res.status(201).json(rideWithOwner);
    } catch (error) {
      console.error("Error creating ride:", error);
      if (error instanceof Error && error.message === "Not authenticated") {
        return res.status(401).json({ error: "Not authenticated" });
      }
      res.status(500).json({ 
        error: "Failed to create ride",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

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

  // Get single ride
  app.get("/api/rides/:id", async (req, res) => {
    try {
      const rideId = parseInt(req.params.id);
      if (isNaN(rideId)) {
        return res.status(400).json({ error: "Invalid ride ID" });
      }

      const ride = await db.query.rides.findFirst({
        where: eq(rides.id, rideId),
        with: {
          owner: true,
          participants: {
            with: {
              user: true
            }
          }
        }
      });

      if (!ride) {
        return res.status(404).json({ error: "Ride not found" });
      }

      res.json(ride);
    } catch (error) {
      console.error("Error fetching ride:", error);
      res.status(500).json({ 
        error: "Failed to fetch ride",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Update ride
  app.put("/api/rides/:id", async (req, res) => {
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
        return res.status(403).json({ error: "Not authorized to update this ride" });
      }

      // Validate update data
      const validatedData = insertRideSchema.partial().parse(req.body);

      // If address is being updated, geocode it
      let coordinates = null;
      if (validatedData.address) {
        coordinates = await geocodeAddress(validatedData.address);
        if (!coordinates) {
          return res.status(400).json({ 
            error: "Invalid address",
            details: "Could not find coordinates for the provided address"
          });
        }
      }

      // Update the ride
      const [updatedRide] = await db
        .update(rides)
        .set({
          ...validatedData,
          ...(coordinates && {
            latitude: coordinates.lat,
            longitude: coordinates.lon
          })
        })
        .where(eq(rides.id, rideId))
        .returning();

      res.json(updatedRide);
    } catch (error) {
      console.error("Error updating ride:", error);
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
        error: "Failed to update ride",
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

  // Admin Routes
  app.get("/api/admin/users", ensureAdmin, async (_req, res) => {
    try {
      const allUsers = await db
        .select({
          id: users.id,
          username: users.username,
          isAdmin: users.isAdmin,
        })
        .from(users);

      // Get rides count separately to avoid duplicates
      const userRides = await db
        .select({
          ownerId: rides.ownerId,
          count: sql<number>`count(*)::int`
        })
        .from(rides)
        .groupBy(rides.ownerId);

      const usersWithRideCount = allUsers.map(user => ({
        ...user,
        rides: userRides.find(r => r.ownerId === user.id)?.count || 0
      }));

      // Remove password hashes from response
      res.json(usersWithRideCount);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ 
        error: "Failed to fetch users",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.delete("/api/admin/users/:id", ensureAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      // First delete all ride participants
      await db.delete(rideParticipants)
        .where(eq(rideParticipants.userId, userId));

      // Then delete all rides created by the user
      await db.delete(rides)
        .where(eq(rides.ownerId, userId));

      // Finally delete the user
      await db.delete(users)
        .where(eq(users.id, userId));

      res.json({ message: "User and associated data deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ 
        error: "Failed to delete user",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.get("/api/admin/rides", ensureAdmin, async (_req, res) => {
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

  app.delete("/api/admin/rides/:id", ensureAdmin, async (req, res) => {
    try {
      const rideId = parseInt(req.params.id);
      if (isNaN(rideId)) {
        return res.status(400).json({ error: "Invalid ride ID" });
      }

      // First delete all ride participants
      await db.delete(rideParticipants)
        .where(eq(rideParticipants.rideId, rideId));

      // Then delete the ride
      await db.delete(rides)
        .where(eq(rides.id, rideId));

      res.json({ message: "Ride deleted successfully" });
    } catch (error) {
      console.error("Error deleting ride:", error);
      res.status(500).json({ 
        error: "Failed to delete ride",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Serve uploaded files
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // Update user profile
  app.put("/api/user/profile", async (req, res) => {
    try {
      const user = ensureAuthenticated(req);
      const { display_name, zip_code, club, home_bike_shop, gender, birthdate, email } = req.body;

      await db
        .update(users)
        .set({
          display_name,
          zip_code,
          club,
          home_bike_shop,
          gender,
          birthdate: birthdate ? new Date(birthdate) : null,
          email,
        })
        .where(eq(users.id, user.id));

      res.json({ message: "Profile updated successfully" });
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ 
        error: "Failed to update profile",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Upload avatar
  app.post("/api/user/avatar", upload.single('avatar'), async (req, res) => {
    try {
      const user = ensureAuthenticated(req);
      const file = req.file;

      if (!file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      // Process the image with sharp
      const processedImagePath = path.join(
        process.cwd(),
        'uploads',
        `processed-${file.filename}`
      );

      await sharp(file.path)
        .resize(200, 200)
        .jpeg({ quality: 90 })
        .toFile(processedImagePath);

      // Delete the original file
      fs.unlinkSync(file.path);

      // Update user's avatar URL in database
      const avatarUrl = `/uploads/processed-${file.filename}`;
      await db
        .update(users)
        .set({ avatarUrl })
        .where(eq(users.id, user.id));

      res.json({ avatarUrl });
    } catch (error) {
      console.error("Error uploading avatar:", error);
      res.status(500).json({ 
        error: "Failed to upload avatar",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}