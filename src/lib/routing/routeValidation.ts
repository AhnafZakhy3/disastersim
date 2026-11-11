import { RouteCoordinate } from './routingTypes';
import { calculateHaversineDistanceKm } from '@/lib/geoUtils';

export interface RouteValidationResult {
  valid: boolean;
  errorMessage?: string;
}

/**
 * Validates whether a single coordinate is finite and within Indonesian territory.
 */
export function validateCoordinate(
  lat: number,
  lng: number
): RouteValidationResult {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return {
      valid: false,
      errorMessage: 'Nilai koordinat non-finite atau bukan angka valid.',
    };
  }

  // Indonesia territorial bounding box: Lat -12.0 to 8.0, Lng 94.0 to 142.0
  if (lat < -12.0 || lat > 8.0 || lng < 94.0 || lng > 142.0) {
    return {
      valid: false,
      errorMessage: 'Koordinat berada di luar batas cakupan wilayah kepulauan Indonesia.',
    };
  }

  return { valid: true };
}

/**
 * Validates origin and destination coordinates before dispatching external routing requests.
 */
export function validateRouteRequest(
  origin: RouteCoordinate,
  destination: RouteCoordinate
): RouteValidationResult {
  if (
    !Number.isFinite(origin.lat) ||
    !Number.isFinite(origin.lng) ||
    !Number.isFinite(destination.lat) ||
    !Number.isFinite(destination.lng)
  ) {
    return {
      valid: false,
      errorMessage: 'Koordinat titik awal atau tujuan tidak valid (nilai non-finite).',
    };
  }

  // Indonesia territorial bounding box: Lat -12.0 to 8.0, Lng 94.0 to 142.0
  if (
    origin.lat < -12.0 || origin.lat > 8.0 ||
    origin.lng < 94.0 || origin.lng > 142.0
  ) {
    return {
      valid: false,
      errorMessage: 'Titik awal berada di luar batas cakupan wilayah kepulauan Indonesia.',
    };
  }

  if (
    destination.lat < -12.0 || destination.lat > 8.0 ||
    destination.lng < 94.0 || destination.lng > 142.0
  ) {
    return {
      valid: false,
      errorMessage: 'Titik tujuan evakuasi berada di luar batas cakupan wilayah kepulauan Indonesia.',
    };
  }

  const straightDistKm = calculateHaversineDistanceKm(
    origin.lat,
    origin.lng,
    destination.lat,
    destination.lng
  );

  // For pedestrian emergency evacuation, straight-line distance beyond 50 km is impractical
  if (straightDistKm > 50) {
    return {
      valid: false,
      errorMessage: `Jarak garis lurus (${straightDistKm.toFixed(1)} km) terlalu jauh untuk simulasi evakuasi pejalan kaki (maksimal 50 km).`,
    };
  }

  return { valid: true };
}

/**
 * Validates the raw coordinate array returned by the routing engine.
 */
export function validateReturnedGeometry(
  coords: [number, number][] | undefined | null
): boolean {
  if (!coords || !Array.isArray(coords) || coords.length < 2) {
    return false;
  }

  for (const point of coords) {
    if (!Array.isArray(point) || point.length < 2) return false;
    if (!Number.isFinite(point[0]) || !Number.isFinite(point[1])) return false;
  }

  return true;
}
