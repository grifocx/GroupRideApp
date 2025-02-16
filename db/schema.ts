import { pgTable, text, serial, integer, boolean, timestamp, real, varchar, bigint, unique, index, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations, type InferModel } from "drizzle-orm";
import { z } from "zod";

export const current_user_id = sql`current_user_id()`;

// Define types first to avoid circular dependencies
export type User = InferModel<typeof users>;
export type InsertUser = InferModel<typeof users, "insert">;
export type Ride = InferModel<typeof rides>;
export type InsertRide = InferModel<typeof rides, "insert">;
export type RideComment = InferModel<typeof rideComments>;
export type InsertRideComment = InferModel<typeof rideComments, "insert">;

// User table and schema definitions remain unchanged
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

// Constants for validation
export const RideStatus = {
  ACTIVE: 'active',
  ARCHIVED: 'archived',
} as const;

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

// Define rides table with explicit return type for the configuration
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
}, (table) => ({
  ownerIdx: index("idx_rides_owner_status").on(table.ownerId, table.status),
  dateTimeIdx: index("idx_rides_date_time").on(table.dateTime),
  positiveDistance: check("check_positive_distance", sql`distance > 0`),
  positiveMaxRiders: check("check_positive_max_riders", sql`max_riders > 0`),
  validPace: check("check_valid_pace", sql`pace > 0`),
  validElevation: check("check_valid_elevation", sql`elevation_gain >= 0`),
  validActualDistance: check("check_valid_actual_distance", sql`actual_distance > 0`),
}));

export const rideParticipants = pgTable("ride_participants", {
  id: serial("id").primaryKey(),
  rideId: integer("ride_id").notNull().references(() => rides.id),
  userId: integer("user_id").notNull().references(() => users.id),
}, (table) => {
  return {
    compositeIdx: index("idx_ride_participants_composite").on(table.rideId, table.userId),
  };
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
}, (table) => {
  return {
    userIdx: index("idx_user_activity_stats_user").on(table.userId),
    positiveDistance: check("check_positive_total_distance", sql`total_distance >= 0`),
    positiveElevation: check("check_positive_elevation", sql`total_elevation_gain >= 0`),
    positiveRideTime: check("check_positive_ride_time", sql`total_ride_time >= 0`),
    positiveRides: check("check_positive_total_rides", sql`total_rides >= 0`),
  };
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

// Rider preferences for matchmaking
export const riderPreferences = pgTable("rider_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  preferredRideTypes: text("preferred_ride_types").array().notNull(),
  preferredTerrains: text("preferred_terrains").array().notNull(),
  preferredDifficulties: text("preferred_difficulties").array().notNull(),
  minPace: real("min_pace"),
  maxPace: real("max_pace"),
  preferredDistance: integer("preferred_distance"),
  availableDays: text("available_days").array(),
  matchRadius: integer("match_radius").default(50), // in miles
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  userIdx: index("idx_rider_preferences_user").on(table.userId),
}));

// Rider buddies matches
export const riderMatches = pgTable("rider_matches", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  matchedUserId: integer("matched_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  matchScore: real("match_score").notNull(),
  lastCalculatedAt: timestamp("last_calculated_at").notNull().defaultNow(),
  isHidden: boolean("is_hidden").default(false),
}, (table) => ({
  uniqueMatch: unique().on(table.userId, table.matchedUserId),
  scoreIdx: index("idx_rider_matches_score").on(table.matchScore),
}));

// Add relations
export const riderPreferencesRelations = relations(riderPreferences, ({ one }) => ({
  user: one(users, {
    fields: [riderPreferences.userId],
    references: [users.id],
  }),
}));

export const riderMatchesRelations = relations(riderMatches, ({ one }) => ({
  user: one(users, {
    fields: [riderMatches.userId],
    references: [users.id],
  }),
  matchedUser: one(users, {
    fields: [riderMatches.matchedUserId],
    references: [users.id],
  }),
}));

// Add Zod schemas for validation
export const riderPreferencesSchema = z.object({
  preferredRideTypes: z.array(z.enum(['MTB', 'ROAD', 'GRAVEL'])),
  preferredTerrains: z.array(z.enum(['FLAT', 'HILLY', 'MOUNTAIN'])),
  preferredDifficulties: z.array(z.enum(['E', 'D', 'C', 'B', 'A', 'AA'])),
  minPace: z.number().min(1).optional(),
  maxPace: z.number().optional(),
  preferredDistance: z.number().min(1).optional(),
  availableDays: z.array(z.string()).optional(),
  matchRadius: z.number().min(1).max(200).default(50),
});

export const insertRiderPreferencesSchema = riderPreferencesSchema;
export const selectRiderPreferencesSchema = createSelectSchema(riderPreferences);

// Export types
export type RiderPreferences = typeof riderPreferences.$inferSelect;
export type InsertRiderPreferences = typeof riderPreferences.$inferInsert;
export type RiderMatch = typeof riderMatches.$inferSelect;
export type InsertRiderMatch = typeof riderMatches.$inferInsert;