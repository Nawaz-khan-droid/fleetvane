/**
 * Utility to fetch real driving road geometry from:
 * 1. Google Maps Routes API v2 with TRAFFIC_ON_POLYLINE (speedReadingIntervals)
 * 2. OSRM (Open Source Routing Machine) as high-speed open fallback.
 */

export interface SpeedReadingInterval {
  startPolylinePointIndex?: number;
  endPolylinePointIndex: number;
  speed: 'NORMAL' | 'SLOW' | 'TRAFFIC_JAM' | string;
}

export interface RouteWithTrafficResult {
  coordinates: [number, number][];
  trafficIntervals: SpeedReadingInterval[];
  duration?: string;
  distanceMeters?: number;
}

/**
 * Native polyline decoder algorithm to convert Google Encoded Polyline into [lat, lng][] array.
 */
export function decodePolyline(encoded: string): [number, number][] {
  const points: [number, number][] = [];
  let index = 0, len = encoded.length;
  let lat = 0, lng = 0;

  while (index < len) {
    let b, shift = 0, result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push([lat / 1e5, lng / 1e5]);
  }
  return points;
}

/**
 * Standard OSRM road route fetcher (Open Source Routing Machine)
 */
export async function fetchRoadRoute(
  origin: [number, number],
  destination: [number, number]
): Promise<[number, number][]> {
  const [origLat, origLng] = origin;
  const [destLat, destLng] = destination;

  try {
    const baseUrl = process.env.NEXT_PUBLIC_OSRM_BASE_URL || 'https://router.project-osrm.org';
    const url = `${baseUrl.replace(/\/$/, '')}/route/v1/driving/${origLng},${origLat};${destLng},${destLat}?overview=full&geometries=geojson`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data.code === 'Ok' && data.routes?.[0]?.geometry?.coordinates) {
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

  return [origin, destination];
}

/**
 * Google Maps Routes API v2: Computes routes with live speedReadingIntervals for route-specific traffic coloring
 */
export async function fetchRouteWithTraffic(
  origin: [number, number],
  destination: [number, number]
): Promise<RouteWithTrafficResult> {
  const [origLat, origLng] = origin;
  const [destLat, destLng] = destination;
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (apiKey && !apiKey.startsWith('your_')) {
    try {
      const url = 'https://routes.googleapis.com/directions/v2:computeRoutes';
      const body = {
        origin: { location: { latLng: { latitude: origLat, longitude: origLng } } },
        destination: { location: { latLng: { latitude: destLat, longitude: destLng } } },
        travelMode: 'DRIVE',
        routingPreference: 'TRAFFIC_AWARE_OPTIMAL',
        extraComputations: ['TRAFFIC_ON_POLYLINE'],
        polylineQuality: 'HIGH_QUALITY',
      };
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'routes.polyline.encodedPolyline,routes.travelAdvisory.speedReadingIntervals,routes.duration,routes.distanceMeters',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const route = data.routes?.[0];
        if (route?.polyline?.encodedPolyline) {
          const coords = decodePolyline(route.polyline.encodedPolyline);
          const trafficIntervals: SpeedReadingInterval[] = route.travelAdvisory?.speedReadingIntervals || [];
          return {
            coordinates: coords,
            trafficIntervals,
            duration: route.duration,
            distanceMeters: route.distanceMeters,
          };
        }
      }
    } catch (e) {
      console.warn('Google Routes API computeRoutes error, falling back to OSRM:', e);
    }
  }

  // Graceful fallback to OSRM road geometry
  const roadCoords = await fetchRoadRoute(origin, destination);
  return {
    coordinates: roadCoords,
    trafficIntervals: [],
  };
}
