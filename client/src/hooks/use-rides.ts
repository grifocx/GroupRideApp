import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Ride } from "@db/schema";
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/hooks/use-user';

type RideWithRelations = Ride & {
  owner: { username: string };
  participants: Array<{ user: { username: string } }>;
  is_recurring?: boolean;
  canEdit?: boolean;
};

export function useRides() {
  const { user } = useUser();
  const { data: rides, isLoading, error } = useQuery<RideWithRelations[]>({
    queryKey: ["/api/rides"],
    select: (data) => {
      if (!user) return data.map(ride => ({ ...ride, canEdit: false }));
      return data.map(ride => ({
        ...ride,
        canEdit: user.id === ride.ownerId
      }));
    },
    enabled: true // This ensures the query runs even if user is not yet loaded
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
  const { user } = useUser();

  const { data: rides, isLoading, error } = useQuery<RideWithRelations[]>({
    queryKey: ['/api/rides/user'],
    queryFn: async () => {
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

      // Process owned rides - only these should have canEdit: true
      const processedOwnedRides = ownedRides.map(ride => ({
        ...ride,
        canEdit: true // User owns these rides
      }));

      // Process participating rides - these should have canEdit: false
      const processedParticipatingRides = participatingRides.map(ride => ({
        ...ride,
        canEdit: false // User is just a participant
      }));

      return [...processedOwnedRides, ...processedParticipatingRides];
    },
    enabled: !!user
  });

  const deleteMutation = useMutation({
    mutationFn: async (rideId: number) => {
      const ride = rides?.find(r => r.id === rideId);
      if (!ride?.canEdit) {
        throw new Error('You do not have permission to delete this ride');
      }

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
      const ride = rides?.find(r => r.id === id);
      if (!ride?.canEdit) {
        throw new Error('You do not have permission to edit this ride');
      }

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
    deleteRide: (rideId: number) => {
      const ride = rides?.find(r => r.id === rideId);
      if (!ride?.canEdit) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'You do not have permission to delete this ride'
        });
        return;
      }
      deleteMutation.mutate(rideId);
    },
    updateRide: updateMutation.mutate
  };
}