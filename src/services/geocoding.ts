export interface GeocodingResult {
  place_id: number | string;
  display_name: string;
  name: string;
  lat: number;
  lng: number;
  type?: string;
  address_detail?: string;
}

// In-memory cache to avoid duplicate network calls
const reverseCache = new Map<string, string>();

/**
 * Clean & format Indonesian address from Nominatim address object
 */
function formatCleanAddress(data: any): string {
  if (!data) return '';
  const addr = data.address || {};

  const parts: string[] = [];

  // Street / Road / Place name
  if (data.name && data.name !== addr.suburb && data.name !== addr.city) {
    parts.push(data.name);
  } else if (addr.road) {
    parts.push(addr.road);
  }

  // Neighbourhood / Suburb / Village
  if (addr.neighbourhood && !parts.includes(addr.neighbourhood)) {
    parts.push(addr.neighbourhood);
  }
  if (addr.suburb && !parts.includes(addr.suburb)) {
    parts.push(addr.suburb);
  } else if (addr.village && !parts.includes(addr.village)) {
    parts.push(addr.village);
  }

  // District (Kecamatan)
  if (addr.district && !parts.includes(addr.district)) {
    parts.push(`Kec. ${addr.district}`);
  } else if (addr.city_district && !parts.includes(addr.city_district)) {
    parts.push(`Kec. ${addr.city_district}`);
  }

  // City (Kota / Kabupaten)
  if (addr.city && !parts.includes(addr.city)) {
    parts.push(addr.city);
  } else if (addr.county && !parts.includes(addr.county)) {
    parts.push(addr.county);
  }

  if (parts.length > 0) {
    return parts.join(', ');
  }

  return data.display_name || '';
}

/**
 * Reverse Geocode: Ambil nama alamat lengkap dari koordinat Latitude & Longitude
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const cacheKey = `${lat.toFixed(5)},${lng.toFixed(5)}`;
  if (reverseCache.has(cacheKey)) {
    return reverseCache.get(cacheKey)!;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`;
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    });

    clearTimeout(timeout);

    if (!res.ok) {
      return '';
    }

    const data = await res.json();
    const cleanAddress = formatCleanAddress(data);
    reverseCache.set(cacheKey, cleanAddress);
    return cleanAddress;
  } catch (err) {
    console.warn('[Geocoding] reverseGeocode fallback error:', err);
    return '';
  }
}

/**
 * Search Places: Cari alamat / tempat mirip Google Maps menggunakan OpenStreetMap Nominatim
 */
export async function searchPlaces(query: string): Promise<GeocodingResult[]> {
  const trimmed = query.trim();
  if (!trimmed || trimmed.length < 2) {
    return [];
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    // Prioritize search within Bandung / Indonesia
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      trimmed
    )}&format=json&countrycodes=id&addressdetails=1&limit=5`;

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    });

    clearTimeout(timeout);

    if (!res.ok) {
      return [];
    }

    const items = await res.json();
    if (!Array.isArray(items)) return [];

    return items.map((item: any) => ({
      place_id: item.place_id,
      display_name: item.display_name,
      name: item.name || item.display_name.split(',')[0],
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      type: item.type || item.class,
      address_detail: formatCleanAddress(item),
    }));
  } catch (err) {
    console.warn('[Geocoding] searchPlaces error:', err);
    return [];
  }
}
