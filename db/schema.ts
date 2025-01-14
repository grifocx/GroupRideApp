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
  isRecurring: boolean("is_recurring").default(false),
  recurringType: text("recurring_type"),
  recurringDay: integer("recurring_day"),
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
  MONTHLY: 'monthly'
} as const;

// Base schemas
const baseRideSchema = {
  title: z.string().min(1, "Title is required"),
  dateTime: z.coerce.date(),
  distance: z.coerce.number().min(1, "Distance must be at least 1 mile"),
  difficulty: z.enum(['E', 'D', 'C', 'B', 'A', 'AA']),
  maxRiders: z.coerce.number().min(1),
  address: z.string().min(1, "Address is required"),
  latitude: z.string(),
  longitude: z.string(),
  rideType: z.enum(['MTB', 'ROAD', 'GRAVEL']),
  pace: z.coerce.number().min(1, "Pace must be at least 1 mph"),
  terrain: z.enum(['FLAT', 'HILLY', 'MOUNTAIN']),
  route_url: z.string().url().nullish(),
  description: z.string().nullish(),
  isRecurring: z.boolean().default(false),
  recurringType: z.enum(['weekly', 'monthly']).nullish(),
  recurringDay: z.number().min(0).max(31).nullish(),
};

// Create insert schema with validation
export const insertRideSchema = z.object(baseRideSchema).superRefine((data, ctx) => {
  if (data.isRecurring) {
    if (!data.recurringType) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Recurring type is required for recurring rides",
        path: ['recurringType']
      });
    }
    if (!data.recurringDay) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Recurring day is required for recurring rides",
        path: ['recurringDay']
      });
    }
    if (data.recurringType === 'weekly' && data.recurringDay !== undefined && (data.recurringDay < 0 || data.recurringDay > 6)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Weekly recurring day must be between 0-6 (Sun-Sat)",
        path: ['recurringDay']
      });
    }
    if (data.recurringType === 'monthly' && data.recurringDay !== undefined && (data.recurringDay < 1 || data.recurringDay > 31)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Monthly recurring day must be between 1-31",
        path: ['recurringDay']
      });
    }
  }
});

export const selectRideSchema = createSelectSchema(rides);

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Ride = typeof rides.$inferSelect;
export type InsertRide = typeof rides.$inferInsert;