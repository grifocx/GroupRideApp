import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Ride } from '@db/schema';
import { useToast } from '@/hooks/use-toast';

export function useUserRides() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: rides, isLoading, error } = useQuery<Ride[]>({
    queryKey: ['/api/rides/user'],
    queryFn: async () => {
      const response = await fetch('/api/rides/user', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
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
