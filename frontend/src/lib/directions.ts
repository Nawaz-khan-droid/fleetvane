/**
 * Utility to fetch real driving road geometry from OSRM (Open Source Routing Machine).
 * Returns an array of [lat, lng] coordinates that follow actual street networks.
 * Falls back to straight-line connection if OSRM is unreachable.
 */
export async function fetchRoadRoute(
  origin: [number, number],
  destination: [number, number]
): Promise<[number, number][]> {
  const [origLat, origLng] = origin;
  const [destLat, destLng] = destination;

  try {
    // OSRM expects longitude,latitude order
    const baseUrl = process.env.NEXT_PUBLIC_OSRM_BASE_URL || 'https://router.project-osrm.org';
    const url = `${baseUrl.replace(/\/$/, '')}/route/v1/driving/${origLng},${origLat};${destLng},${destLat}?overview=full&geometries=geojson`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data.code === 'Ok' && data.routes?.[0]?.geometry?.coordinates) {
        // GeoJSON returns [lng, lat] -> convert to [lat, lng]
        const coords: [number, number][] = data.routes[0].geometry.coordinates.map(
          ([lng, lat]: [number, number]) => [lat, lng]
        );
        if (coords.length > 0) {
          return coords;
        }
      }
    }
  } catch (err) {
    console.warn('OSRM directions fetch fallback to straight line:', err);
  }

  // Graceful fallback to direct line
  return [origin, destination];
}
