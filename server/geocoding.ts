import NodeGeocoder from 'node-geocoder';

// Initialize the geocoder with OpenStreetMap (no API key required)
const geocoder = NodeGeocoder({
  provider: 'openstreetmap',
  formatter: null
});

export async function geocodeAddress(address: string): Promise<{ lat: string, lon: string } | null> {
  try {
    const results = await geocoder.geocode(address);
    
    if (results.length === 0) {
      console.error(`No results found for address: ${address}`);
      return null;
    }

    const { latitude, longitude } = results[0];
    
    if (!latitude || !longitude) {
      console.error(`Invalid coordinates for address: ${address}`);
      return null;
    }

    return {
      lat: latitude.toString(),
      lon: longitude.toString()
    };
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}
