import type { Ride } from "@db/schema";

export interface RideWithRelations extends Ride {
  owner: { username: string };
  participants: Array<{ user: { username: string } }>;
}
