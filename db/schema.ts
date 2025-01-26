import { pgTable, text, serial, integer, boolean, timestamp, real, varchar, bigint, unique } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations, type InferModel } from "drizzle-orm";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").unique().notNull(),
  password: text("password").notNull(),
  isAdmin: boolean("is_admin").notNull().default(false),
  avatarUrl: text("avatar_url"),
  email: text("email"),
  emailVerified: boolean("email_verified").default(false),
  verificationToken: text("verification_token"),
  twoFactorEnabled: boolean("two_factor_enabled").default(false),
  twoFactorSecret: text("two_factor_secret"),
  display_name: text("display_name"),
  zip_code: text("zip_code"),
  club: text("club"),
  home_bike_shop: text("home_bike_shop"),
  gender: text("gender"),
  birthdate: timestamp("birthdate"),
});

// Create user schemas first
const userSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  email: z.string().email().optional(),
  display_name: z.string().optional(),
  zip_code: z.string().optional(),
  club: z.string().optional(),
  home_bike_shop: z.string().optional(),
  gender: z.string().optional(),
  birthdate: z.date().optional(),
});

export const insertUserSchema = userSchema;
export const selectUserSchema = createSelectSchema(users);

// Add RideStatus enum
export const RideStatus = {
  ACTIVE: 'active',
  ARCHIVED: 'archived',
} as const;

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
  route_url: text("route_url"),
  description: text("description"),
  is_recurring: boolean("is_recurring").default(false),
  recurring_type: text("recurring_type", { enum: ['weekly', 'monthly'] }),
  recurring_day: integer("recurring_day"),
  recurring_time: text("recurring_time"),
  recurring_end_date: timestamp("recurring_end_date"),
  series_id: bigint("series_id", { mode: "number" }).references(() => rides.id, { onDelete: 'set null' }),
  status: text("status", { enum: ['active', 'archived'] }).notNull().default('active'),
  completed: boolean("completed").default(false),
  actualDistance: real("actual_distance"),
  actualDuration: integer("actual_duration"),
  elevationGain: integer("elevation_gain"),
  averageSpeed: real("average_speed"),
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
  comments: many(rideComments),
  series: one(rides, {
    fields: [rides.series_id],
    references: [rides.id],
  }),
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

// Constants for validation
export const DifficultyLevel = {
  BEGINNER: 'E',
  NOVICE: 'D',
  INTERMEDIATE: 'C',
  ADVANCED: 'B',
  EXPERT: 'A',
  EXTREME: 'AA'
} as const;

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

export const RecurringType = {
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
} as const;

const activitySchema = z.object({
  completed: z.boolean().optional(),
  actualDistance: z.number().optional(),
  actualDuration: z.number().optional(),
  elevationGain: z.number().optional(),
  averageSpeed: z.number().optional(),
});

const baseRideSchema = z.object({
  title: z.string().min(1, "Title is required"),
  dateTime: z.coerce.date(),
  distance: z.coerce.number().min(1, "Distance must be at least 1 mile"),
  difficulty: z.enum(['E', 'D', 'C', 'B', 'A', 'AA']),
  maxRiders: z.coerce.number().min(1),
  address: z.string().min(1, "Address is required"),
  rideType: z.enum(['MTB', 'ROAD', 'GRAVEL']),
  pace: z.coerce.number().min(1, "Pace must be at least 1 mph"),
  terrain: z.enum(['FLAT', 'HILLY', 'MOUNTAIN']),
  route_url: z.string().url().nullish(),
  description: z.string().nullish(),
  is_recurring: z.boolean().optional(),
  recurring_type: z.enum(['weekly', 'monthly']).optional(),
  recurring_day: z.number().min(0).max(31).optional(),
  recurring_time: z.string().optional(),
  recurring_end_date: z.coerce.date().optional(),
  ownerId: z.number(),
  status: z.enum(['active', 'archived']).default('active'),
});

// Merge base schema with activity schema first
const mergedRideSchema = baseRideSchema.merge(activitySchema);

// Then apply refinements
export const insertRideSchema = mergedRideSchema.refine((data) => {
  if (data.is_recurring) {
    return data.recurring_type &&
           data.recurring_day !== undefined &&
           data.recurring_time &&
           data.recurring_end_date;
  }
  return true;
}, {
  message: "When creating a recurring ride, recurring_type, recurring_day, recurring_time, and recurring_end_date are required"
});

export const selectRideSchema = createSelectSchema(rides);

// Type exports
export type User = InferModel<typeof users>;
export type InsertUser = InferModel<typeof users, "insert">;
export type Ride = InferModel<typeof rides>;
export type InsertRide = InferModel<typeof rides, "insert">;

export const rideComments = pgTable("ride_comments", {
  id: serial("id").primaryKey(),
  rideId: integer("ride_id").notNull().references(() => rides.id, { onDelete: 'cascade' }),
  userId: integer("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at"),
  isEdited: boolean("is_edited").notNull().default(false),
  isPinned: boolean("is_pinned").notNull().default(false),
});

export const rideCommentsRelations = relations(rideComments, ({ one }) => ({
  ride: one(rides, {
    fields: [rideComments.rideId],
    references: [rides.id],
  }),
  user: one(users, {
    fields: [rideComments.userId],
    references: [users.id],
  }),
}));

export const insertCommentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty"),
  rideId: z.number(),
  userId: z.number(),
});

export const updateCommentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty"),
});

export type RideComment = InferModel<typeof rideComments>;
export type InsertRideComment = InferModel<typeof rideComments, "insert">;

// Add new tables for activity tracking
export const userActivityStats = pgTable("user_activity_stats", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  totalDistance: real("total_distance").default(0),
  totalElevationGain: integer("total_elevation_gain").default(0),
  totalRideTime: integer("total_ride_time").default(0),
  totalRides: integer("total_rides").default(0),
  avgSpeed: real("avg_speed").default(0),
  favoriteRideType: text("favorite_ride_type"),
  lastCalculatedAt: timestamp("last_calculated_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const userMonthlyStats = pgTable("user_monthly_stats", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  year: integer("year").notNull(),
  month: integer("month").notNull(),
  distance: real("distance").default(0),
  elevationGain: integer("elevation_gain").default(0),
  rideTime: integer("ride_time").default(0),
  rideCount: integer("ride_count").default(0),
  avgSpeed: real("avg_speed").default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  userMonthIndex: unique().on(table.userId, table.year, table.month),
}));

// Add relations for activity tracking
export const userActivityStatsRelations = relations(userActivityStats, ({ one }) => ({
  user: one(users, {
    fields: [userActivityStats.userId],
    references: [users.id],
  }),
}));

export const userMonthlyStatsRelations = relations(userMonthlyStats, ({ one }) => ({
  user: one(users, {
    fields: [userMonthlyStats.userId],
    references: [users.id],
  }),
}));

// Create schemas for the new tables
export const insertUserActivityStatsSchema = createInsertSchema(userActivityStats);
export const selectUserActivityStatsSchema = createSelectSchema(userActivityStats);

export const insertUserMonthlyStatsSchema = createInsertSchema(userMonthlyStats);
export const selectUserMonthlyStatsSchema = createSelectSchema(userMonthlyStats);

// Export types for the new tables
export type UserActivityStats = typeof userActivityStats.$inferSelect;
export type InsertUserActivityStats = typeof userActivityStats.$inferInsert;

export type UserMonthlyStats = typeof userMonthlyStats.$inferSelect;
export type InsertUserMonthlyStats = typeof userMonthlyStats.$inferInsert;