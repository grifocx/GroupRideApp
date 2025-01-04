import { pgTable, text, serial, integer, boolean, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").unique().notNull(),
  password: text("password").notNull(),
});

export const rides = pgTable("rides", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  dateTime: timestamp("date_time").notNull(),
  distance: integer("distance").notNull(), // in miles
  difficulty: integer("difficulty").notNull(), // 1-5
  maxRiders: integer("max_riders").notNull(),
  ownerId: integer("owner_id").notNull().references(() => users.id),
  latitude: text("latitude").notNull(),
  longitude: text("longitude").notNull(),
  // New fields
  rideType: text("ride_type").notNull(), // 'MTB', 'ROAD', 'GRAVEL'
  pace: real("pace").notNull(), // Average speed in mph
  terrain: text("terrain").notNull(), // 'FLAT', 'HILLY', 'MOUNTAIN'
  routeUrl: text("route_url"), // Optional route map URL
  description: text("description"), // Optional ride description
});

export const rideParticipants = pgTable("ride_participants", {
  id: serial("id").primaryKey(),
  rideId: integer("ride_id")
    .notNull()
    .references(() => rides.id),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
});

export const rideRelations = relations(rides, ({ one, many }) => ({
  owner: one(users, {
    fields: [rides.ownerId],
    references: [users.id],
  }),
  participants: many(rideParticipants),
}));

export const rideParticipantsRelations = relations(rideParticipants, ({ one }) => ({
  ride: one(rides, {
    fields: [rideParticipants.rideId],
    references: [rides.id],
  }),
  user: one(users, {
    fields: [rideParticipants.userId],
    references: [users.id],
  }),
}));

// Validation schemas
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);

export const insertRideSchema = createInsertSchema(rides, {
  rideType: z.enum(['MTB', 'ROAD', 'GRAVEL']),
  terrain: z.enum(['FLAT', 'HILLY', 'MOUNTAIN']),
  distance: z.coerce.number().min(1, "Distance must be at least 1 mile"),
  pace: z.coerce.number().min(1, "Pace must be at least 1 mph"),
  difficulty: z.coerce.number().min(1).max(5),
  maxRiders: z.coerce.number().min(1),
  dateTime: z.string().transform((str) => new Date(str)),
  ownerId: z.number().optional(),
});
export const selectRideSchema = createSelectSchema(rides);

// Enums for ride properties
export const RideType = {
  MTB: 'MTB',
  ROAD: 'ROAD',
  GRAVEL: 'GRAVEL',
} as const;

export const TerrainType = {
  FLAT: 'FLAT',
  HILLY: 'HILLY',
  MOUNTAIN: 'MOUNTAIN',
} as const;

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Ride = typeof rides.$inferSelect;
export type InsertRide = typeof rides.$inferInsert;