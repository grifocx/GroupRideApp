import { type Express, type Request } from "express";
import { createServer, type Server } from "http";
import express from 'express';
import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

import { db } from "@db";
import { rides, rideParticipants, users, rideComments, insertRideSchema, type User, RecurringType } from "@db/schema";
import { and, eq, sql, inArray } from "drizzle-orm";
import * as z from 'zod';
import { geocodeAddress } from "./geocoding";
import { ensureAdmin } from "./middleware";
import { addDays, addWeeks, addMonths, isBefore, startOfDay } from "date-fns";
import { addDays as addDays2, isAfter } from "date-fns";

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

// Add RideStatus enum
enum RideStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived'
}

// Add archive check function
async function checkAndArchiveRides() {
  try {
    console.log("Running scheduled ride archival check...");

    // Get yesterday's date for comparison
    const archiveDate = addDays2(new Date(), -1);

    // Update all active rides that ended more than 24 hours ago
    const [updatedRides] = await db
      .update(rides)
      .set({ status: RideStatus.ARCHIVED })
      .where(
        and(
          eq(rides.status, RideStatus.ACTIVE),
          sql`${rides.dateTime} < ${archiveDate.toISOString()}`
        )
      )
      .returning();

    if (updatedRides) {
      console.log(`Archived ${updatedRides.length} rides`);
    }
  } catch (error) {
    console.error("Error in ride archival check:", error);
  }
}

async function createRecurringRides(initialRide: {
  title: string;
  dateTime: Date;
  distance: number;
  difficulty: string;
  maxRiders: number;
  ownerId: number;
  address: string;
  latitude: string;
  longitude: string;
  rideType: string;
  pace: number;
  terrain: string;
  route_url?: string | null;
  description?: string | null;
}, recurringOptions: {
  recurring_type: keyof typeof RecurringType;
  recurring_day: number;
  recurring_end_date: Date;
  recurring_time: string;
}) {
  // Create the first ride
  const [firstRide] = await db.insert(rides).values({
    ...initialRide,
    is_recurring: true,
    recurring_type: recurringOptions.recurring_type.toLowerCase(),
    recurring_day: recurringOptions.recurring_day,
    recurring_time: recurringOptions.recurring_time,
    recurring_end_date: recurringOptions.recurring_end_date,
  }).returning();

  // Update the first ride with its own ID as series_id
  await db
    .update(rides)
    .set({ series_id: firstRide.id })
    .where(eq(rides.id, firstRide.id));

  // Calculate and create subsequent rides
  let currentDate = new Date(initialRide.dateTime);
  const endDate = new Date(recurringOptions.recurring_end_date);

  while (isBefore(currentDate, endDate)) {
    currentDate = recurringOptions.recurring_type.toLowerCase() === 'weekly'
      ? addWeeks(currentDate, 1)
      : addMonths(currentDate, 1);

    if (!isBefore(startOfDay(currentDate), startOfDay(endDate))) {
      break;
    }

    // Create subsequent ride without including the first ride's ID
    await db.insert(rides).values({
      title: initialRide.title,
      dateTime: currentDate,
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
      recurring_type: recurringOptions.recurring_type.toLowerCase(),
      recurring_day: recurringOptions.recurring_day,
      recurring_time: recurringOptions.recurring_time,
      recurring_end_date: recurringOptions.recurring_end_date,
      series_id: firstRide.id
    });
  }

  return firstRide;
}

export function registerRoutes(app: Express): Server {
  // Add scheduled job setup
  const ARCHIVE_CHECK_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  // Run initial check
  checkAndArchiveRides();

  // Schedule subsequent checks
  setInterval(checkAndArchiveRides, ARCHIVE_CHECK_INTERVAL);

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

        const recurringRides = await createRecurringRides(
          {
            title: rideData.title,
            dateTime: rideData.dateTime,
            distance: rideData.distance,
            difficulty: rideData.difficulty,
            maxRiders: rideData.maxRiders,
            ownerId: rideData.ownerId,
            address: rideData.address,
            latitude: rideData.latitude,
            longitude: rideData.longitude,
            rideType: rideData.rideType,
            pace: rideData.pace,
            terrain: rideData.terrain,
            route_url: rideData.route_url,
            description: rideData.description
          },
          {
            recurring_type: rideData.recurring_type,
            recurring_day: rideData.recurring_day,
            recurring_end_date: rideData.recurring_end_date,
            recurring_time: rideData.recurring_time
          }
        );
        const firstRideWithDetails = recurringRides;
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
  app.get("/api/rides", async (req, res) => {
    try {
      console.log("Fetching rides...");
      const status = req.query.status as string || 'active';

      const allRides = await db.query.rides.findMany({
        where: and(
          status === 'active'
            ? sql`${rides.dateTime} >= NOW()`
            : sql`${rides.dateTime} < NOW()`,
          eq(rides.status, status)
        ),
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
        orderBy: [
          sql`ABS(EXTRACT(EPOCH FROM (${rides.dateTime} - NOW())))`
        ],
      });

      console.log(`Found ${allRides.length} rides`);

      const formattedRides = allRides.map(ride => ({
        ...ride,
        owner: ride.owner,
        participants: ride.participants,
      }));

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
          },
          comments: {
            with: {
              user: true
            },
            orderBy: (comments, { desc }) => [
              desc(comments.isPinned),
              desc(comments.createdAt)
            ]
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
        .from(users)
        .orderBy(users.id);  // Add ordering by ID

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

  // New route to get all rides for admin
  app.get("/api/admin/rides", ensureAdmin, async (_req, res) => {
    try {
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

      res.json(allRides);
    } catch (error) {
      console.error("Error fetching rides for admin:", error);
      res.status(500).json({
        error: "Failed to fetch rides",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // New route to delete ride as admin
  app.delete("/api/admin/rides/:id", ensureAdmin, async (req, res) => {
    try {
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


      await db.delete(rideParticipants)
        .where(eq(rideParticipants.rideId, rideId));

      await db.delete(rides)
        .where(eq(rides.id, rideId));

      res.json({ message: "Successfully deleted ride" });
    } catch (error) {
      console.error("Error deleting ride as admin:", error);
      res.status(500).json({
        error: "Failed to delete ride",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Admin delete user endpoint
  app.delete("/api/admin/users/:id", ensureAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      // First, delete all user's comments
      await db.delete(rideComments)
        .where(eq(rideComments.userId, userId));

      // Delete user's ride participations
      await db.delete(rideParticipants)
        .where(eq(rideParticipants.userId, userId));

      // Delete rides owned by the user
      await db.delete(rides)
        .where(eq(rides.ownerId, userId));

      // Finally, delete the user
      const [deletedUser] = await db.delete(users)
        .where(eq(users.id, userId))
        .returning();

      if (!deletedUser) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({
        error: "Failed to delete user",
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

  // Comment endpoints
  app.post("/api/rides/:id/comments", async (req, res) => {
    try {
      const user = ensureAuthenticated(req);
      const rideId = parseInt(req.params.id);
      const { content } = req.body;

      if (!content) {
        return res.status(400).json({ error: "Comment content is required" });
      }

      const [comment] = await db.insert(rideComments)
        .values({
          rideId,
          userId: user.id,
          content,
        })
        .returning();

      res.status(201).json(comment);
    } catch (error) {
      console.error("Error creating comment:", error);
      res.status(500).json({
        error: "Failed to create comment",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.post("/api/rides/:rideId/comments/:commentId/pin", async (req, res) => {
    try {
      const user = ensureAuthenticated(req);
      const rideId = parseInt(req.params.rideId);
      const commentId = parseInt(req.params.commentId);

      const ride = await db.query.rides.findFirst({
        where: eq(rides.id, rideId),
      });

      if (!ride || ride.ownerId !== user.id) {
        return res.status(403).json({ error: "Not authorized to pin comments" });
      }

      const [updatedComment] = await db
        .update(rideComments)
        .set({ isPinned: true })
        .where(and(
          eq(rideComments.id, commentId),
          eq(rideComments.rideId, rideId)
        ))
        .returning();

      res.json(updatedComment);
    } catch (error) {
      console.error("Error pinning comment:", error);
      res.status(500).json({
        error: "Failed to pin comment",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get user's owned rides
  app.get("/api/rides/user/owned", async (req, res) => {
    try {
      const user = ensureAuthenticated(req);

      const userRides = await db.query.rides.findMany({
        where: eq(rides.ownerId, user.id),
        with: {
          owner: true,
          participants: {
            with: {
              user: true
            }
          }
        },
        orderBy: (rides, { asc }) => [asc(rides.dateTime)]
      });

      res.json(userRides);
    } catch (error) {
      console.error("Error fetching user owned rides:", error);
      if (error instanceof Error && error.message === "Not authenticated") {
        return res.status(401).json({ error: "Not authenticated" });
      }
      res.status(500).json({
        error: "Failed to fetch owned rides",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get rides where user is a participant
  app.get("/api/rides/user/participating", async (req, res) => {
    try {
      const user = ensureAuthenticated(req);

      // First get all ride IDs where the user is a participant
      const participatingRideIds = await db
        .select({ rideId: rideParticipants.rideId })
        .from(rideParticipants)
        .where(eq(rideParticipants.userId, user.id));

      // Then get the full ride details for these IDs
      const participatingRides = await db.query.rides.findMany({
        where: inArray(rides.id, participatingRideIds.map(r => r.rideId)),
        with: {
          owner: true,
          participants: {
            with: {
              user: true
            }
          }
        },
        orderBy: (rides, { asc }) => [asc(rides.dateTime)]
      });

      res.json(participatingRides);
    } catch (error) {
      console.error("Error fetching participating rides:", error);
      if (error instanceof Error && error.message === "Not authenticated") {
        return res.status(401).json({ error: "Not authenticated" });
      }
      res.status(500).json({
        error: "Failed to fetch participating rides",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Create and return HTTP server
  const httpServer = createServer(app);
  return httpServer;
}