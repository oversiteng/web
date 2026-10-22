/**
 * Geocoding Service for Oversite WebApp
 * Supports forward geocoding (Address -> Coordinates), reverse geocoding (Coordinates -> Address),
 * and distance verification between user device GPS and property address.
 */

export interface GeocodeResult {
  latitude: number;
  longitude: number;
  displayName: string;
  addressComponents?: Record<string, string>;
}

// In-memory cache to reduce repeated network calls and respect Nominatim rate limits
const geocodeCache = new Map<string, GeocodeResult>();
const reverseCache = new Map<string, GeocodeResult>();

/**
 * Forward Geocode: Converts an address string into GPS coordinates
 * Defaults to Nigeria context if no country is specified.
 */
export async function geocodeAddress(addressQuery: string): Promise<GeocodeResult | null> {
  const query = addressQuery?.trim();
  if (!query || query.length < 3) return null;

  const cacheKey = query.toLowerCase();
  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey)!;
  }

  try {
    // Append Nigeria if no country mentioned to prioritize Nigerian real estate locations
    const normalizedQuery =
      query.toLowerCase().includes("nigeria") || query.toLowerCase().includes("lagos") || query.toLowerCase().includes("abuja")
        ? query
        : `${query}, Nigeria`;

    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(
      normalizedQuery
    )}`;

    const res = await fetch(url, {
      headers: {
        "User-Agent": "Oversite-WebApp-Geocoding/1.0 (contact@oversite.ng)",
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      console.warn(`Geocoding HTTP error ${res.status} for query: ${query}`);
      return null;
    }

    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) {
      return null;
    }

    const first = data[0];
    const lat = parseFloat(first.lat);
    const lng = parseFloat(first.lon);

    if (isNaN(lat) || isNaN(lng)) return null;

    const result: GeocodeResult = {
      latitude: Number(lat.toFixed(6)),
      longitude: Number(lng.toFixed(6)),
      displayName: first.display_name,
    };

    geocodeCache.set(cacheKey, result);
    return result;
  } catch (err) {
    console.error("Geocoding lookup failed:", err);
    return null;
  }
}

/**
 * Reverse Geocode: Converts GPS coordinates into a street / district address
 */
export async function reverseGeocode(lat: number, lng: number): Promise<GeocodeResult | null> {
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat === 0 || lng === 0) {
    return null;
  }

  const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;
  if (reverseCache.has(cacheKey)) {
    return reverseCache.get(cacheKey)!;
  }

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;

    const res = await fetch(url, {
      headers: {
        "User-Agent": "Oversite-WebApp-Geocoding/1.0 (contact@oversite.ng)",
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      console.warn(`Reverse geocoding HTTP error ${res.status}`);
      return null;
    }

    const data = await res.json();
    if (!data || !data.display_name) return null;

    const result: GeocodeResult = {
      latitude: Number(lat.toFixed(6)),
      longitude: Number(lng.toFixed(6)),
      displayName: data.display_name,
      addressComponents: data.address || undefined,
    };

    reverseCache.set(cacheKey, result);
    return result;
  } catch (err) {
    console.error("Reverse geocoding failed:", err);
    return null;
  }
}

/**
 * Haversine Formula: Computes distance in kilometers between two GPS coordinates
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}
