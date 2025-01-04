import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { InsertUser, User } from "@db/schema";

const USER_QUERY_KEY = '/api/user';

async function fetchUser(): Promise<User | null> {
  try {
    const response = await fetch(USER_QUERY_KEY, {
      credentials: 'include'
    });

    if (!response.ok) {
      if (response.status === 401) {
        console.log("User not authenticated"); // Debug log
        return null;
      }
      throw new Error(await response.text());
    }

    const user = await response.json();
    console.log("Fetched user:", user); // Debug log
    return user;
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}

export function useUser() {
  const queryClient = useQueryClient();

  const { data: user, error, isLoading } = useQuery({
    queryKey: [USER_QUERY_KEY],
    queryFn: fetchUser,
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: async (userData: InsertUser) => {
      console.log("Attempting login..."); // Debug log
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const data = await response.json();
      console.log("Login successful:", data); // Debug log
      return data;
    },
    onSuccess: () => {
      console.log("Invalidating user query after login"); // Debug log
      queryClient.invalidateQueries({ queryKey: [USER_QUERY_KEY] });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [USER_QUERY_KEY] });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (userData: InsertUser) => {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [USER_QUERY_KEY] });
    },
  });

  return {
    user,
    isLoading,
    error,
    login: loginMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    register: registerMutation.mutateAsync,
  };
}