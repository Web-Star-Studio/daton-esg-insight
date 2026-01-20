interface GeocodingResult {
  latitude: number;
  longitude: number;
}

/**
 * Geocode an address using OpenStreetMap Nominatim API
 * @param city - City name
 * @param state - State/Province name
 * @param country - Country name (default: Brasil)
 * @param address - Optional full address
 * @returns Coordinates or null if not found
 */
export async function geocodeAddress(
  city?: string,
  state?: string,
  country: string = "Brasil",
  address?: string
): Promise<GeocodingResult | null> {
  try {
    // Build query parts
    const parts: string[] = [];
    if (address) parts.push(address);
    if (city) parts.push(city);
    if (state) parts.push(state);
    parts.push(country);

    const query = encodeURIComponent(parts.join(", "));
    
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`,
      {
        headers: {
          "Accept-Language": "pt-BR",
          "User-Agent": "DatonESGApp/1.0",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to geocode address");
    }

    const data = await response.json();

    if (data.length > 0) {
      return {
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon),
      };
    }

    return null;
  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
}
