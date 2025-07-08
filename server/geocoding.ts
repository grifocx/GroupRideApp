import NodeGeocoder from 'node-geocoder';

// Initialize multiple geocoding providers as fallbacks
const primaryGeocoder = NodeGeocoder({
  provider: 'openstreetmap',
  formatter: null,
  httpAdapter: 'https',
  extra: {
    headers: {
      'User-Agent': 'GroupRideApp/1.0 (cycling app for Washington DC)',
      'Referer': 'https://grouprideapp.com'
    }
  }
});

// Fallback to a simple coordinate lookup for common DC locations
const dcLocationFallbacks: Record<string, { lat: string, lon: string }> = {
  'washington dc': { lat: '38.9072', lon: '-77.0369' },
  'washington, dc': { lat: '38.9072', lon: '-77.0369' },
  'dupont circle': { lat: '38.9096', lon: '-77.0434' },
  'dupont circle, washington dc': { lat: '38.9096', lon: '-77.0434' },
  'dupont circle, washington, dc': { lat: '38.9096', lon: '-77.0434' },
  'capitol hill': { lat: '38.8892', lon: '-77.0019' },
  'capitol hill, washington dc': { lat: '38.8892', lon: '-77.0019' },
  'capitol hill, washington, dc': { lat: '38.8892', lon: '-77.0019' },
  'georgetown': { lat: '38.9076', lon: '-77.0723' },
  'georgetown, washington dc': { lat: '38.9076', lon: '-77.0723' },
  'georgetown, washington, dc': { lat: '38.9076', lon: '-77.0723' },
  'white house': { lat: '38.8977', lon: '-77.0365' },
  '1600 pennsylvania avenue': { lat: '38.8977', lon: '-77.0365' },
  '1600 pennsylvania avenue nw': { lat: '38.8977', lon: '-77.0365' },
  'lincoln memorial': { lat: '38.8893', lon: '-77.0502' },
  'washington monument': { lat: '38.8895', lon: '-77.0353' },
  'national mall': { lat: '38.8893', lon: '-77.0361' },
  'adams morgan': { lat: '38.9204', lon: '-77.0431' },
  'adams morgan, washington dc': { lat: '38.9204', lon: '-77.0431' },
  'u street': { lat: '38.9169', lon: '-77.0286' },
  'u street corridor': { lat: '38.9169', lon: '-77.0286' },
  'chinatown': { lat: '38.8987', lon: '-77.0219' },
  'chinatown, washington dc': { lat: '38.8987', lon: '-77.0219' },
  'foggy bottom': { lat: '38.9006', lon: '-77.0479' },
  'foggy bottom, washington dc': { lat: '38.9006', lon: '-77.0479' },
};

async function tryGeocodingWithDelay(address: string, delayMs: number = 1000): Promise<{ lat: string, lon: string } | null> {
  // Add a delay to respect rate limits
  await new Promise(resolve => setTimeout(resolve, delayMs));
  
  try {
    const results = await primaryGeocoder.geocode(address);
    
    if (results.length === 0) {
      console.warn(`No results found for address: ${address}`);
      return null;
    }

    const { latitude, longitude } = results[0];
    
    if (!latitude || !longitude) {
      console.warn(`Invalid coordinates for address: ${address}`);
      return null;
    }

    return {
      lat: latitude.toString(),
      lon: longitude.toString()
    };
  } catch (error) {
    console.error('Primary geocoding error:', error);
    return null;
  }
}

export async function geocodeAddress(address: string): Promise<{ lat: string, lon: string } | null> {
  if (!address || address.trim() === '') {
    console.error('Empty address provided');
    return null;
  }

  // Normalize the address for fallback lookup
  const normalizedAddress = address.toLowerCase().trim();
  
  // First try the fallback lookup for common DC locations
  if (dcLocationFallbacks[normalizedAddress]) {
    console.log(`Using fallback coordinates for: ${address}`);
    return dcLocationFallbacks[normalizedAddress];
  }

  // Try primary geocoding service with delay
  const result = await tryGeocodingWithDelay(address);
  if (result) {
    return result;
  }

  // If primary fails, try to find a partial match in fallbacks
  for (const [key, coords] of Object.entries(dcLocationFallbacks)) {
    if (normalizedAddress.includes(key) || key.includes(normalizedAddress)) {
      console.log(`Using partial fallback match for: ${address} -> ${key}`);
      return coords;
    }
  }

  // If all fails, return DC center coordinates as last resort
  console.warn(`Could not geocode address: ${address}, using DC center coordinates`);
  return { lat: '38.9072', lon: '-77.0369' };
}
