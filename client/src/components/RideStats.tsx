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

    // Calculate total distance and other metrics
    const totalDistance = allRides.reduce((sum, ride) => sum + ride.distance, 0);
    const avgPace = allRides.reduce((sum, ride) => sum + ride.pace, 0) / (allRides.length || 1);

    // Calculate favorite ride type
    const rideTypes = allRides.reduce((acc, ride) => {
      acc[ride.rideType] = (acc[ride.rideType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const favoriteRideType = Object.entries(rideTypes)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    // Calculate preferred terrain
    const terrainTypes = allRides.reduce((acc, ride) => {
      acc[ride.terrain] = (acc[ride.terrain] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const preferredTerrain = Object.entries(terrainTypes)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    // Calculate difficulty distribution
    const difficultyLevels = allRides.reduce((acc, ride) => {
      acc[ride.difficulty] = (acc[ride.difficulty] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const mostCommonDifficulty = Object.entries(difficultyLevels)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    // Calculate participation rate
    const participationRate = (joinedCount / (allRides.length || 1)) * 100;

    // Calculate rides per month
    const dates = allRides.map(ride => new Date(ride.dateTime));
    const earliestRide = dates.length ? new Date(Math.min(...dates.map(d => d.getTime()))) : new Date();
    const months = (new Date().getTime() - earliestRide.getTime()) / (30 * 24 * 60 * 60 * 1000) || 1;
    const ridesPerMonth = allRides.length / months;

    return {
      createdCount,
      joinedCount,
      totalRides: allRides.length,
      avgPace: avgPace.toFixed(1),
      totalDistance,
      favoriteRideType,
      preferredTerrain,
      mostCommonDifficulty,
      participationRate: participationRate.toFixed(1),
      ridesPerMonth: ridesPerMonth.toFixed(1)
    };
  }, [rides, participatingRides]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Rides</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRides}</div>
            <p className="text-xs text-muted-foreground">
              {stats.createdCount} created · {stats.joinedCount} joined
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Distance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDistance} mi</div>
            <p className="text-xs text-muted-foreground">
              ~{stats.ridesPerMonth} rides/month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Riding Style</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.favoriteRideType}</div>
            <p className="text-xs text-muted-foreground">
              {stats.avgPace} mph avg pace
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Preferred Terrain</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.preferredTerrain}</div>
            <p className="text-xs text-muted-foreground">
              Level {stats.mostCommonDifficulty} rides
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Participation Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Participation Rate:</span>
              <span>{stats.participationRate}%</span>
            </div>
            <div className="flex justify-between">
              <span>Average Pace:</span>
              <span>{stats.avgPace} mph</span>
            </div>
            <div className="flex justify-between">
              <span>Most Common Difficulty:</span>
              <span>Level {stats.mostCommonDifficulty}</span>
            </div>
            <div className="flex justify-between">
              <span>Activity Level:</span>
              <span>{stats.ridesPerMonth} rides/month</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}