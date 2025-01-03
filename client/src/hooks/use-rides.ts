import { useQuery } from "@tanstack/react-query";
import type { Ride } from "@db/schema";

type RideWithRelations = Ride & {
  owner: { username: string };
  participants: Array<{ user: { username: string } }>;
};

export function useRides() {
  const { data: rides, isLoading, error } = useQuery<RideWithRelations[]>({
    queryKey: ["/api/rides"],
  });

  return {
    rides,
    isLoading,
    error,
  };
}
