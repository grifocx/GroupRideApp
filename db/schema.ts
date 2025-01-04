import { pgTable, text, serial, integer, boolean, timestamp, real, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").unique().notNull(),
  password: text("password").notNull(),
  isAdmin: boolean("is_admin").notNull().default(false),
  avatarUrl: text("avatar_url"),
  email: text("email"),
  displayName: text("display_name"),
  zipCode: text("zip_code"),
  club: text("club"),
  homeBikeShop: text("home_bike_shop"),
  gender: text("gender"),
  birthdate: timestamp("birthdate"),
});

export const rides = pgTable("rides", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  dateTime: timestamp("date_time").notNull(),
  distance: integer("distance").notNull(),
  difficulty: varchar("difficulty", { length: 2 }).notNull(),
  maxRiders: integer("max_riders").notNull(),
  ownerId: integer("owner_id").notNull().references(() => users.id),
  address: text("address").notNull(),
  latitude: text("latitude").notNull(),
  longitude: text("longitude").notNull(),
  rideType: text("ride_type").notNull(),
  pace: real("pace").notNull(),
  terrain: text("terrain").notNull(),
  description: text("description"),
});

export const rideParticipants = pgTable("ride_participants", {
  id: serial("id").primaryKey(),
  rideId: integer("ride_id").notNull().references(() => rides.id),
  userId: integer("user_id").notNull().references(() => users.id),
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

export const insertUserSchema = createInsertSchema(users, {
  email: z.string().email().optional(),
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
export const selectUserSchema = createSelectSchema(users);

// Define the difficulty levels as a const enum
export const DifficultyLevel = {
  BEGINNER: 'E',
  NOVICE: 'D',
  INTERMEDIATE: 'C',
  ADVANCED: 'B',
  EXPERT: 'A',
  EXTREME: 'AA'
} as const;

export const insertRideSchema = createInsertSchema(rides, {
  rideType: z.enum(['MTB', 'ROAD', 'GRAVEL']),
  terrain: z.enum(['FLAT', 'HILLY', 'MOUNTAIN']),
  distance: z.coerce.number().min(1, "Distance must be at least 1 mile"),
  pace: z.coerce.number().min(1, "Pace must be at least 1 mph"),
  difficulty: z.enum(['E', 'D', 'C', 'B', 'A', 'AA']),
  maxRiders: z.coerce.number().min(1),
  dateTime: z.string().transform((str) => new Date(str)),
  ownerId: z.number().optional(),
  address: z.string().min(1, "Address is required"),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
});

export const selectRideSchema = createSelectSchema(rides);

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

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Ride = typeof rides.$inferSelect;
export type InsertRide = typeof rides.$inferInsert;