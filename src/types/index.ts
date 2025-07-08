// Database types - will be generated from Supabase later
export interface User {
  id: number;
  username: string;
  email?: string;
  display_name?: string;
  avatar_url?: string;
  is_admin: boolean;
}

export interface Ride {
  id: number;
  title: string;
  dateTime: string;
  distance: number;
  difficulty: 'E' | 'D' | 'C' | 'B' | 'A' | 'AA';
  maxRiders: number;
  address: string;
  latitude: string;
  longitude: string;
  rideType: 'MTB' | 'ROAD' | 'GRAVEL';
  pace: number;
  terrain: 'FLAT' | 'HILLY' | 'MOUNTAIN';
  route_url?: string;
  description?: string;
  status: 'active' | 'archived';
  ownerId: number;
  owner: { username: string };
  participants: Array<{ user: { username: string } }>;
  canEdit?: boolean;
}