import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Ride } from "@db/schema";
import { useToast } from '@/hooks/use-toast';

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

export function useUserRides() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: rides, isLoading, error } = useQuery<RideWithRelations[]>({
    queryKey: ['/api/rides/user'],
    queryFn: async () => {
      // Modified to fetch both owned and participating rides
      const [ownedResponse, participatingResponse] = await Promise.all([
        fetch('/api/rides/user/owned', {
          credentials: 'include'
        }),
        fetch('/api/rides/user/participating', {
          credentials: 'include'
        })
      ]);

      if (!ownedResponse.ok) {
        throw new Error(await ownedResponse.text());
      }

      if (!participatingResponse.ok) {
        throw new Error(await participatingResponse.text());
      }

      const [ownedRides, participatingRides] = await Promise.all([
        ownedResponse.json(),
        participatingResponse.json()
      ]);

      // Combine and deduplicate rides
      const allRides = [...ownedRides, ...participatingRides];
      const uniqueRides = Array.from(new Map(allRides.map(ride => [ride.id, ride])).values());

      return uniqueRides;
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (rideId: number) => {
      const response = await fetch(`/api/rides/${rideId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/rides/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/rides'] });
      toast({
        title: 'Success',
        description: 'Ride deleted successfully'
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete ride'
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Ride> }) => {
      const response = await fetch(`/api/rides/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/rides/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/rides'] });
      toast({
        title: 'Success',
        description: 'Ride updated successfully'
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update ride'
      });
    }
  });

  return {
    rides,
    isLoading,
    error,
    deleteRide: deleteMutation.mutate,
    updateRide: updateMutation.mutate
  };
}