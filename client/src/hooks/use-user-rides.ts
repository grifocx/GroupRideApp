import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Ride } from '@db/schema';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/hooks/use-user';

export function useUserRides() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useUser();

  const { data: rides, isLoading, error } = useQuery<Ride[]>({
    queryKey: ['/api/rides/user'],
    queryFn: async () => {
      // Fetch both owned and participating rides
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
      const processedOwnedRides = ownedRides.map((ride: Ride) => ({
        ...ride,
        canEdit: true // User owns these rides
      }));

      // Process participating rides - these should have canEdit: false
      const processedParticipatingRides = participatingRides.map((ride: Ride) => ({
        ...ride,
        canEdit: false // User is just a participant
      }));

      // Combine rides, keeping canEdit true only for owned rides
      const allRides = [...processedOwnedRides, ...processedParticipatingRides];
      const uniqueRides = Array.from(
        new Map(
          allRides.map(ride => [
            ride.id,
            allRides.find(r => r.id === ride.id && r.canEdit) || ride
          ])
        ).values()
      );

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