import axios from 'axios';

/**
 * Fetches a route polyline from OSRM.
 * @param coordinates An array of coordinates in [lat, lng] format.
 * @returns An array of coordinates in [lat, lng] format representing the route polyline.
 */
export async function getRoutePolyline(coordinates: [number, number][]): Promise<[number, number][] | null> {
  if (coordinates.length < 2) return null;

  // OSRM expects coordinates in lng,lat format
  const coordsString = coordinates.map(c => `${c[1]},${c[0]}`).join(';');
  const url = `http://router.project-osrm.org/route/v1/driving/${coordsString}?overview=full&geometries=geojson`;

  try {
    const response = await axios.get(url);
    if (response.data.code === 'Ok' && response.data.routes.length > 0) {
      // OSRM returns GeoJSON coordinates in [lng, lat] format
      const routeGeometry = response.data.routes[0].geometry.coordinates;
      // Convert back to [lat, lng] for Leaflet
      return routeGeometry.map((coord: [number, number]) => [coord[1], coord[0]]);
    }
    return null;
  } catch (error) {
    console.error('Error fetching route from OSRM:', error);
    return null;
  }
}
