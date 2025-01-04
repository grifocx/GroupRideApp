import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';
import 'leaflet.heat';
import { type Ride } from '@db/schema';

// Fix Leaflet icon issues
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface MapComponentProps {
  rides: Ride[];
  onMarkerClick?: (ride: Ride) => void;
}

export function MapComponent({ rides, onMarkerClick }: MapComponentProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markerClusterRef = useRef<any>(null);
  const heatLayerRef = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current) {
      // Initialize map centered on Washington, DC
      const map = L.map('map').setView([38.8977, -77.0365], 12);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);

      // Initialize marker cluster group
      const markerCluster = (L as any).markerClusterGroup();
      map.addLayer(markerCluster);

      mapRef.current = map;
      markerClusterRef.current = markerCluster;
    }

    // Clear existing markers and heat points
    if (markerClusterRef.current) {
      markerClusterRef.current.clearLayers();
    }
    if (heatLayerRef.current) {
      mapRef.current?.removeLayer(heatLayerRef.current);
    }

    // Add markers and collect heat points
    const heatPoints: [number, number, number][] = [];
    rides.forEach(ride => {
      const lat = parseFloat(ride.latitude);
      const lng = parseFloat(ride.longitude);

      if (!isNaN(lat) && !isNaN(lng)) {
        // Add marker to cluster
        const marker = L.marker([lat, lng])
          .bindPopup(`
            <strong>${ride.title}</strong><br/>
            Distance: ${ride.distance} miles<br/>
            Difficulty: ${ride.difficulty}<br/>
            Date: ${new Date(ride.dateTime).toLocaleDateString()}
          `);

        if (onMarkerClick) {
          marker.on('click', () => onMarkerClick(ride));
        }

        markerClusterRef.current?.addLayer(marker);

        // Add heat point
        heatPoints.push([lat, lng, 1]);
      }
    });

    // Update heat layer
    if (heatPoints.length > 0) {
      if (heatLayerRef.current) {
        mapRef.current?.removeLayer(heatLayerRef.current);
      }
      heatLayerRef.current = (L as any).heatLayer(heatPoints, {
        radius: 25,
        blur: 15,
        maxZoom: 10
      }).addTo(mapRef.current!);
    }

    // Clean up on unmount
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [rides, onMarkerClick]);

  return <div id="map" className="w-full h-[500px] rounded-lg" />;
}