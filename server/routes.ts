import { type Express, type Request } from "express";
import { createServer, type Server } from "http";
import express from 'express';
import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

import { db } from "@db";
import { rides, rideParticipants, users, insertRideSchema, type User } from "@db/schema";
import { and, eq, sql } from "drizzle-orm";
import * as z from 'zod';
import { geocodeAddress } from "./geocoding";
import { ensureAdmin } from "./middleware";
import { addDays, addWeeks, addMonths, isBefore, startOfDay } from "date-fns";

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (_req: Request, _file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (_req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
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
    const error = new Error("Not authenticated") as Error & { status?: number };
    error.status = 401;
    throw error;
  }
  return req.user as User;
};

async function createRecurringRides(initialRide: any, recurringOptions: {
  recurring_type: 'WEEKLY' | 'MONTHLY';
  recurring_day: number;
  recurring_end_date: Date;
  recurring_time: string;
}) {
  const seriesId = Date.now();
  const rides = [];

  // Create the first ride with all required fields
  const firstRide = {
    title: initialRide.title,
    dateTime: initialRide.dateTime,
    distance: initialRide.distance,
    difficulty: initialRide.difficulty,
    maxRiders: initialRide.maxRiders,
    ownerId: initialRide.ownerId,
    address: initialRide.address,
    latitude: initialRide.latitude,
    longitude: initialRide.longitude,
    rideType: initialRide.rideType,
    pace: initialRide.pace,
    terrain: initialRide.terrain,
    route_url: initialRide.route_url,
    description: initialRide.description,
    is_recurring: true,
    recurring_type: recurringOptions.recurring_type,
    recurring_day: recurringOptions.recurring_day,
    recurring_time: recurringOptions.recurring_time,
    recurring_end_date: recurringOptions.recurring_end_date,
    series_id: seriesId
  };
  rides.push(firstRide);

  // Calculate subsequent ride dates
  let currentDate = new Date(initialRide.dateTime);
  const endDate = new Date(recurringOptions.recurring_end_date);

  while (isBefore(currentDate, endDate)) {
    currentDate = recurringOptions.recurring_type === 'WEEKLY'
      ? addWeeks(currentDate, 1)
      : addMonths(currentDate, 1);

    if (!isBefore(startOfDay(currentDate), startOfDay(endDate))) {
      break;
    }

    // Create subsequent rides with all required fields
    const nextRide = {
      ...firstRide,
      dateTime: currentDate
    };
    rides.push(nextRide);
  }

  return rides;
}

export function registerRoutes(app: Express): Server {
  // Create ride
  app.post("/api/rides", async (req, res) => {
    try {
      const user = ensureAuthenticated(req);

      const result = insertRideSchema.safeParse({
        ...req.body,
        ownerId: user.id
      });

      if (!result.success) {
        return res.status(400).json({
          error: "Validation error",
          details: result.error.errors
        });
      }

      // Geocode the address
      const coordinates = await geocodeAddress(result.data.address);
      if (!coordinates) {
        return res.status(400).json({
          error: "Invalid address",
          details: "Could not find coordinates for the provided address"
        });
      }

      // Add geocoded coordinates to the validated data
      const rideData = {
        ...result.data,
        latitude: coordinates.lat,
        longitude: coordinates.lon,
      };

      // Handle recurring rides
      if (rideData.is_recurring && rideData.recurring_type &&
          rideData.recurring_day !== undefined &&
          rideData.recurring_time &&
          rideData.recurring_end_date) {

        const rides = await createRecurringRides(
          rideData,
          {
            recurring_type: rideData.recurring_type,
            recurring_day: rideData.recurring_day,
            recurring_end_date: rideData.recurring_end_date,
            recurring_time: rideData.recurring_time
          }
        );

        const createdRides = await db.insert(rides).values(rides).returning();

        const firstRideWithDetails = await db.query.rides.findFirst({
          where: eq(rides.id, createdRides[0].id),
          with: {
            owner: true,
            participants: {
              with: {
                user: true
              }
            }
          }
        });

        return res.status(201).json(firstRideWithDetails);
      } else {
        // Handle single ride creation
        const [newRide] = await db.insert(rides).values(rideData).returning();

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

        return res.status(201).json(rideWithOwner);
      }
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
      console.log("Fetching rides...");
      const allRides = await db.query.rides.findMany({
        with: {
          owner: {
            columns: {
              id: true,
              username: true
            }
          },
          participants: {
            with: {
              user: {
                columns: {
                  username: true
                }
              }
            }
          }
        },
        orderBy: (rides, { desc }) => [desc(rides.dateTime)]
      });

      console.log(`Found ${allRides.length} rides`);

      const formattedRides = allRides.map(ride => {
        // Base ride information that's always included
        const baseRide = {
          id: ride.id,
          title: ride.title,
          dateTime: ride.dateTime,
          distance: ride.distance,
          difficulty: ride.difficulty,
          maxRiders: ride.maxRiders,
          address: ride.address,
          rideType: ride.rideType,
          pace: ride.pace,
          terrain: ride.terrain,
          owner: ride.owner,
          participants: ride.participants,
          latitude: ride.latitude,
          longitude: ride.longitude,
        };

        // Optional fields
        if (ride.route_url) {
          baseRide.route_url = ride.route_url;
        }
        if (ride.description) {
          baseRide.description = ride.description;
        }

        // Only include recurring fields if this is a recurring ride
        if (ride.is_recurring) {
          const recurringFields = {
            is_recurring: true,
            recurring_type: ride.recurring_type,
            recurring_day: ride.recurring_day,
            ...(ride.recurring_time && { recurring_time: ride.recurring_time }),
            ...(ride.recurring_end_date && { recurring_end_date: ride.recurring_end_date }),
            ...(ride.series_id && { series_id: ride.series_id })
          };

          return { ...baseRide, ...recurringFields };
        }

        return baseRide;
      });

      res.json(formattedRides);
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

      const ride = await db.query.rides.findFirst({
        where: eq(rides.id, rideId),
      });

      if (!ride) {
        return res.status(404).json({ error: "Ride not found" });
      }

      if (ride.ownerId !== user.id) {
        return res.status(403).json({ error: "Not authorized to update this ride" });
      }

      const partialRideSchema = insertRideSchema.partial();
      const validatedData = partialRideSchema.parse(req.body);

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

      const [updatedRide] = await db
        .update(rides)
        .set({
          ...validatedData,
          ...(coordinates && {
            latitude: coordinates.lat.toString(),
            longitude: coordinates.lon.toString()
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

      const ride = await db.query.rides.findFirst({
        where: eq(rides.id, rideId),
        with: {
          participants: true
        }
      });

      if (!ride) {
        return res.status(404).json({ error: "Ride not found" });
      }

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

      const ride = await db.query.rides.findFirst({
        where: eq(rides.id, rideId),
      });

      if (!ride) {
        return res.status(404).json({ error: "Ride not found" });
      }

      if (ride.ownerId !== user.id) {
        return res.status(403).json({ error: "Not authorized to delete this ride" });
      }

      await db.delete(rideParticipants)
        .where(eq(rideParticipants.rideId, rideId));

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

  // Admin routes
  app.get("/api/admin/users", ensureAdmin, async (_req, res) => {
    try {
      const allUsers = await db
        .select({
          id: users.id,
          username: users.username,
          isAdmin: users.isAdmin,
        })
        .from(users);

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

      res.json(usersWithRideCount);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({
        error: "Failed to fetch users",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Profile routes
  app.put("/api/user/profile", async (req, res) => {
    try {
      const user = ensureAuthenticated(req);
      const { display_name, zip_code, club, home_bike_shop, gender, birthdate, email } = req.body;

      const [updatedUser] = await db
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
        .where(eq(users.id, user.id))
        .returning();

      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({
        error: "Failed to update profile",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // File upload routes
  app.post("/api/user/avatar", upload.single('avatar'), async (req, res) => {
    try {
      const user = ensureAuthenticated(req);
      const file = req.file;

      if (!file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const processedImagePath = path.join(
        process.cwd(),
        'uploads',
        `processed-${file.filename}`
      );

      await sharp(file.path)
        .resize(200, 200)
        .jpeg({ quality: 90 })
        .toFile(processedImagePath);

      fs.unlinkSync(file.path);

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

  // Serve uploads directory
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // Create and return HTTP server
  const httpServer = createServer(app);
  return httpServer;
}