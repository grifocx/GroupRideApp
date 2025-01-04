import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import * as turf from '@turf/turf';
import { decode } from 'polyline-encoded';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle, Route as RouteIcon } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface RoutePlannerProps {
  onRouteChange?: (route: {
    distance: number;
    elevationGain: number;
    difficulty: string;
    coordinates: [number, number][];
  }) => void;
}

interface ElevationPoint {
  distance: number;
  elevation: number;
}

export function RoutePlanner({ onRouteChange }: RoutePlannerProps) {
  const mapRef = useRef<L.Map | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const [waypoints, setWaypoints] = useState<[number, number][]>([]);
  const [elevationProfile, setElevationProfile] = useState<ElevationPoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!mapRef.current) {
      const map = L.map('route-map').setView([38.8977, -77.0365], 12);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);

      map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        setWaypoints(prev => [...prev, [lat, lng]]);
      });

      mapRef.current = map;
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add new markers
    waypoints.forEach((point) => {
      const marker = L.marker(point as L.LatLngExpression).addTo(mapRef.current!);
      markersRef.current.push(marker);
    });

    // Update route if we have at least 2 points
    if (waypoints.length >= 2) {
      fetchRoute();
    }
  }, [waypoints]);

  const fetchRoute = async () => {
    if (waypoints.length < 2) return;

    setIsLoading(true);
    setError(null);

    try {
      // Convert waypoints to string format required by OSRM
      const coordinates = waypoints
        .map(([lat, lng]) => `${lng},${lat}`)
        .join(';');

      // Fetch route from OSRM
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/cycling/${coordinates}?overview=full&geometries=polyline`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch route');
      }

      const data = await response.json();
      const route = decode(data.routes[0].geometry);

      // Update route on map
      if (routeLayerRef.current) {
        routeLayerRef.current.remove();
      }

      routeLayerRef.current = L.polyline(route, {
        color: 'blue',
        weight: 3
      }).addTo(mapRef.current!);

      // Fit map to show entire route
      mapRef.current?.fitBounds(routeLayerRef.current.getBounds());

      // Fetch elevation data
      await fetchElevationData(route);

      // Calculate route metrics
      const distance = data.routes[0].distance / 1000; // Convert to km
      const elevationGain = calculateElevationGain(elevationProfile);
      const difficulty = calculateDifficulty(distance, elevationGain);

      // Notify parent component
      onRouteChange?.({
        distance,
        elevationGain,
        difficulty,
        coordinates: route
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to plan route');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchElevationData = async (route: [number, number][]) => {
    try {
      // Sample points along the route for elevation data
      const numPoints = Math.min(100, route.length);
      const sampledPoints = route.filter((_, i) => i % Math.floor(route.length / numPoints) === 0);

      // Fetch elevation data for sampled points
      const response = await fetch('https://api.open-elevation.com/api/v1/lookup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          locations: sampledPoints.map(([lat, lng]) => ({
            latitude: lat,
            longitude: lng
          }))
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch elevation data');
      }

      const data = await response.json();
      
      // Create elevation profile
      const profile = data.results.map((point: any, index: number) => ({
        distance: index * (route.length / numPoints) / 1000, // Distance in km
        elevation: point.elevation
      }));

      setElevationProfile(profile);
    } catch (err) {
      console.error('Error fetching elevation data:', err);
    }
  };

  const calculateElevationGain = (profile: ElevationPoint[]) => {
    let gain = 0;
    for (let i = 1; i < profile.length; i++) {
      const elevation_diff = profile[i].elevation - profile[i - 1].elevation;
      if (elevation_diff > 0) {
        gain += elevation_diff;
      }
    }
    return gain;
  };

  const calculateDifficulty = (distance: number, elevationGain: number) => {
    // Simple difficulty calculation based on distance and elevation gain
    const score = (distance * 0.3) + (elevationGain * 0.7);
    
    if (score < 20) return 'E';
    if (score < 40) return 'D';
    if (score < 60) return 'C';
    if (score < 80) return 'B';
    if (score < 100) return 'A';
    return 'AA';
  };

  return (
    <div className="space-y-4">
      <div className="h-[400px] relative" id="route-map">
        {isLoading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-[1000]">
            <div className="text-white">Planning route...</div>
          </div>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {elevationProfile.length > 0 && (
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-2">Elevation Profile</h3>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={elevationProfile}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="distance"
                  label={{ value: 'Distance (km)', position: 'bottom' }}
                />
                <YAxis
                  label={{
                    value: 'Elevation (m)',
                    angle: -90,
                    position: 'insideLeft'
                  }}
                />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="elevation"
                  stroke="#8884d8"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={() => {
            setWaypoints([]);
            markersRef.current.forEach(marker => marker.remove());
            markersRef.current = [];
            if (routeLayerRef.current) {
              routeLayerRef.current.remove();
              routeLayerRef.current = null;
            }
            setElevationProfile([]);
          }}
        >
          Clear Route
        </Button>
      </div>
    </div>
  );
}
