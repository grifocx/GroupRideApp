
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RideWithRelations } from '@/types';

interface RideStatsProps {
  rides: RideWithRelations[];
  participatingRides: RideWithRelations[];
}

export function RideStats({ rides, participatingRides }: RideStatsProps) {
  const stats = useMemo(() => {
    const createdCount = rides.length;
    const joinedCount = participatingRides.length;
    
    const allRides = [...rides, ...participatingRides];
    const avgPace = allRides.reduce((sum, ride) => sum + ride.pace, 0) / (allRides.length || 1);
    
    const terrainCounts = allRides.reduce((acc, ride) => {
      acc[ride.terrain] = (acc[ride.terrain] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const preferredTerrain = Object.entries(terrainCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A';

    return {
      createdCount,
      joinedCount,
      avgPace: avgPace.toFixed(1),
      preferredTerrain
    };
  }, [rides, participatingRides]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Created Rides</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.createdCount}</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Joined Rides</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.joinedCount}</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Average Pace</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.avgPace} mph</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Preferred Terrain</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.preferredTerrain}</div>
        </CardContent>
      </Card>
    </div>
  );
}
