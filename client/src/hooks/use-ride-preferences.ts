import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { RiderPreferences } from "@db/schema";

export function useRidePreferences() {
  const queryClient = useQueryClient();

  const { data: preferences, isLoading } = useQuery<RiderPreferences>({
    queryKey: ['ride-preferences'],
    queryFn: async () => {
      const response = await fetch('/api/user/ride-preferences', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch ride preferences');
      }
      return response.json();
    }
  });

  const updatePreferences = useMutation({
    mutationFn: async (data: Partial<RiderPreferences>) => {
      const response = await fetch('/api/user/ride-preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to update ride preferences');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ride-preferences'] });
    }
  });

  return {
    preferences,
    isLoading,
    updatePreferences: updatePreferences.mutate,
    isUpdating: updatePreferences.isPending,
  };
}
