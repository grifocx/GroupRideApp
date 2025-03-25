import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';
import 'leaflet.heat';
import { type Ride } from '@db/schema';
import { Button } from '@/components/ui/button';
import { Expand, ZoomIn, ZoomOut, Locate, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useHasTouch, useIsMobile, useIsSmallMobile } from '@/hooks/use-mobile';

// Fix Leaflet icon issues
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Create larger touch-friendly icon for mobile
const TouchFriendlyIcon = L.Icon.extend({
  options: {
    iconSize: [30, 45],      // Larger size (default is 25x41)
    iconAnchor: [15, 45],    // Adjusted anchor point
    popupAnchor: [0, -45],   // Adjusted popup position
    shadowSize: [41, 41],    // Default shadow size
    shadowAnchor: [13, 41],  // Default shadow anchor
    className: 'leaflet-touch-friendly-icon',
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  }
});

const largeTouchIcon = new TouchFriendlyIcon();

interface MapComponentProps {
  rides: Ride[];
  onMarkerClick?: (ride: Ride) => void;
  height?: string | number;
  fullscreenEnabled?: boolean;
  className?: string;
}

// Washington DC coordinates
const DC_COORDS: [number, number] = [38.8977, -77.0365];

export function MapComponent({ 
  rides, 
  onMarkerClick, 
  height = '400px',
  fullscreenEnabled = true,
  className 
}: MapComponentProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markerClusterRef = useRef<any>(null);
  const heatLayerRef = useRef<any>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const hasTouch = useHasTouch();
  const isMobile = useIsMobile();
  const isSmallMobile = useIsSmallMobile();

  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    
    // Give the browser a moment to apply the CSS changes before refreshing the map size
    setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
    }, 100);
  };

  // Reset map view to include all markers
  const resetView = () => {
    if (!mapRef.current || !markerClusterRef.current) return;
    
    try {
      const bounds = markerClusterRef.current.getBounds();
      if (bounds.isValid()) {
        mapRef.current.fitBounds(bounds, { padding: [30, 30] });
      } else {
        mapRef.current.setView(DC_COORDS, 12);
      }
    } catch (error) {
      // Fallback to default view if bounds calculation fails
      mapRef.current.setView(DC_COORDS, 12);
    }
  };

  // Locate user position
  const locateUser = () => {
    if (!mapRef.current) return;
    
    mapRef.current.locate({ 
      setView: true, 
      maxZoom: 14,
      enableHighAccuracy: true
    });
  };

  // Zoom controls
  const zoomIn = () => mapRef.current?.zoomIn();
  const zoomOut = () => mapRef.current?.zoomOut();

  useEffect(() => {
    if (!mapRef.current) {
      // Initialize map centered on Washington, DC
      const map = L.map('map', {
        zoomControl: !isMobile, // Disable default zoom control on mobile
        touchZoom: true,        // Enable pinch to zoom
        bounceAtZoomLimits: true // Bounce back when reaching zoom limits
      }).setView(DC_COORDS, 12);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);

      // Initialize marker cluster group with mobile-friendly settings
      const markerCluster = (L as any).markerClusterGroup({
        maxClusterRadius: isMobile ? 40 : 80, // Smaller clusters on mobile
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: !isMobile, // Disable on mobile to avoid UI clutter
        zoomToBoundsOnClick: true,
        animate: true
      });
      map.addLayer(markerCluster);

      // Handle location found event
      map.on('locationfound', (e) => {
        L.marker(e.latlng)
          .addTo(map)
          .bindPopup('You are here')
          .openPopup();
      });

      // Handle location error
      map.on('locationerror', (e) => {
        console.error('Location error:', e);
      });

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
        // Add marker to cluster with touch-friendly handling
        const marker = L.marker([lat, lng], {
          icon: hasTouch ? largeTouchIcon : L.Icon.Default.prototype,
          // Increase clickable area radius on touch devices
          interactive: true,
          bubblingMouseEvents: false
        }).bindPopup(`
          <div class="p-1" style="min-width: ${isMobile ? '180px' : '220px'}">
            <strong class="text-lg block mb-1">${ride.title}</strong>
            <div class="text-sm mt-1">Distance: ${ride.distance} miles</div>
            <div class="text-sm">Difficulty: ${ride.difficulty}</div>
            <div class="text-sm">Date: ${new Date(ride.dateTime).toLocaleDateString()}</div>
            <button 
              class="w-full mt-2 bg-primary text-white text-sm rounded px-2 py-1"
              onclick="window.location.href='/rides/${ride.id}'"
            >
              View Details
            </button>
          </div>
        `, {
          closeButton: true,
          className: 'leaflet-touch-popup',
          // Make popup wider on mobile
          maxWidth: isMobile ? 200 : 300,
          // Auto-adjust height
          autoPanPadding: [20, 20]
        });

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
        radius: isMobile ? 15 : 25,
        blur: isMobile ? 10 : 15,
        maxZoom: 10
      }).addTo(mapRef.current!);
    }

    // Reset view to fit all markers
    if (rides.length > 0) {
      resetView();
    }
    
    // Refresh map size in case container dimensions changed
    setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
    }, 200);

    // Clean up on unmount
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [rides, onMarkerClick, hasTouch, isMobile]);

  // Ensure map reflows properly when toggling fullscreen
  useEffect(() => {
    if (mapRef.current) {
      setTimeout(() => {
        mapRef.current?.invalidateSize();
      }, 100);
    }
  }, [isFullscreen]);

  // Add CSS for touch-friendly controls via style tag
  useEffect(() => {
    // Add custom CSS for touch-friendly map controls
    const style = document.createElement('style');
    style.textContent = `
      .leaflet-touch-friendly-icon {
        /* Make tap area larger than the visible icon */
        cursor: pointer !important;
      }
      .leaflet-touch-popup .leaflet-popup-content-wrapper {
        /* Better touch styling for popups */
        border-radius: 12px;
        padding: 8px;
      }
      .leaflet-touch-popup .leaflet-popup-close-button {
        /* Larger close button for touch */
        font-size: 16px;
        width: 24px;
        height: 24px;
        padding: 4px;
      }
      /* Make map fullscreen when needed */
      .map-fullscreen {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        z-index: 9999 !important;
        border-radius: 0 !important;
      }
      /* Adjust controls when in fullscreen */
      .map-fullscreen .map-custom-controls {
        bottom: 20px !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div 
      ref={mapContainerRef}
      className={cn(
        "relative rounded-lg overflow-hidden",
        isFullscreen && "map-fullscreen",
        className
      )}
      style={{ height: isFullscreen ? '100vh' : height, zIndex: isFullscreen ? 50 : 1 }}
    >
      <div id="map" className="w-full h-full"></div>
      
      {/* Custom map controls for mobile */}
      <div className="map-custom-controls absolute right-2 bottom-2 flex flex-col gap-2 z-10">
        {isMobile && (
          <>
            <Button 
              variant="default" 
              size="icon" 
              className="h-8 w-8 bg-white/90 hover:bg-white text-black shadow-md"
              onClick={zoomIn}
              aria-label="Zoom in"
            >
              <ZoomIn size={16} />
            </Button>
            <Button 
              variant="default" 
              size="icon" 
              className="h-8 w-8 bg-white/90 hover:bg-white text-black shadow-md"
              onClick={zoomOut}
              aria-label="Zoom out"
            >
              <ZoomOut size={16} />
            </Button>
          </>
        )}
        
        <Button 
          variant="default" 
          size="icon" 
          className="h-8 w-8 bg-white/90 hover:bg-white text-black shadow-md"
          onClick={locateUser}
          aria-label="Find my location"
        >
          <Locate size={16} />
        </Button>
        
        <Button 
          variant="default" 
          size="icon" 
          className="h-8 w-8 bg-white/90 hover:bg-white text-black shadow-md"
          onClick={resetView}
          aria-label="Reset view"
        >
          <RefreshCw size={16} />
        </Button>
        
        {fullscreenEnabled && (
          <Button 
            variant="default" 
            size="icon" 
            className="h-8 w-8 bg-white/90 hover:bg-white text-black shadow-md"
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            <Expand size={16} />
          </Button>
        )}
      </div>
      
      {/* Exit fullscreen button shown at top when in fullscreen mode */}
      {isFullscreen && (
        <Button 
          variant="secondary" 
          className="absolute top-2 right-2 z-10"
          onClick={toggleFullscreen}
        >
          Exit Fullscreen
        </Button>
      )}
    </div>
  );
}