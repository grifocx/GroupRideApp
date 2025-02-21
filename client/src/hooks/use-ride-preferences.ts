import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { RiderPreferences } from "@db/schema";

interface PreferencesError {
  message: string;
  code: string;
}

// Add proper typing for the API response
interface PreferencesResponse {
  data: RiderPreferences;
  error?: PreferencesError;
}

export function useRidePreferences() {
  const queryClient = useQueryClient();

  const { data: preferences, isLoading, error } = useQuery<PreferencesResponse>({
    queryKey: ['ride-preferences'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/user/ride-preferences', {
          credentials: 'include'
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch ride preferences');
        }

        return response.json();
      } catch (error) {
        console.error('Preferences fetch error:', error);
        throw error;
      }
    },
    retry: 2, // Add retry logic for failed requests
    staleTime: 5 * 60 * 1000, // Cache data for 5 minutes
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
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update preferences');
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['ride-preferences'], data);
      queryClient.invalidateQueries({ queryKey: ['ride-matches'] }); // Invalidate related queries
    }
  });

  return {
    preferences: preferences?.data,
    isLoading,
    error,
    updatePreferences: updatePreferences.mutate,
    isUpdating: updatePreferences.isPending,
    updateError: updatePreferences.error,
  };
}