import { RouteCoordinate, OSRMRouteResponse, TurnByTurnStep, OSRMStep } from './routingTypes';
import { validateRouteRequest, validateReturnedGeometry } from './routeValidation';

const DEFAULT_OSRM_URL = 'https://router.project-osrm.org';
const FALLBACK_OSRM_URL = 'https://routing.openstreetmap.de/routed-foot';

export interface RouteCandidatePath {
  distanceMeters: number;
  durationSeconds: number;
  geometry: [number, number][]; // [lat, lng] for Leaflet
  geoJsonCoordinates: [number, number][]; // [lng, lat] for GeoJSON
  turnByTurnSteps: TurnByTurnStep[];
}

export interface OSRMFetchResult {
  success: boolean;
  distanceMeters?: number;
  durationSeconds?: number;
  geometry?: [number, number][]; // [lat, lng] for Leaflet
  geoJsonCoordinates?: [number, number][]; // [lng, lat] for GeoJSON
  turnByTurnSteps?: TurnByTurnStep[];
  alternativePaths?: RouteCandidatePath[];
  provider: string;
  profile: string;
  isMirrorFallback?: boolean;
  error?: string;
}

export function buildOSRMRouteUrl(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number,
  profile: 'foot' = 'foot',
  baseUrlOverride?: string,
  viaPoints?: Array<{ lat: number; lng: number }>
): string {
  const baseUrl = baseUrlOverride || process.env.NEXT_PUBLIC_OSRM_ROUTING_URL || DEFAULT_OSRM_URL;
  let coordsStr = `${originLng.toFixed(6)},${originLat.toFixed(6)}`;
  if (viaPoints && viaPoints.length > 0) {
    coordsStr += ';' + viaPoints.map((p) => `${p.lng.toFixed(6)},${p.lat.toFixed(6)}`).join(';');
  }
  coordsStr += `;${destLng.toFixed(6)},${destLat.toFixed(6)}`;
  return `${baseUrl}/route/v1/${profile}/${coordsStr}?overview=full&geometries=geojson&steps=true&alternatives=3`;
}

/**
 * Maps OSRM step maneuver into clear, human-readable Indonesian walking instructions.
 */
function mapStepToInstruction(step: OSRMStep, index: number, isLast: boolean): TurnByTurnStep {
  const street = step.name || 'Jalan Lingkungan / Gang';
  const type = step.maneuver?.type || 'continue';
  const modifier = step.maneuver?.modifier || '';

  let instruction = '';
  if (index === 0) {
    instruction = `Mulai berjalan ke arah evakuasi di ${street}`;
  } else if (isLast) {
    instruction = `Tiba di Tempat Evakuasi Sementara (${street})`;
  } else if (type === 'turn') {
    if (modifier.includes('right')) {
      instruction = `Belok kanan ke ${street}`;
    } else if (modifier.includes('left')) {
      instruction = `Belok kiri ke ${street}`;
    } else {
      instruction = `Belok ke arah ${street}`;
    }
  } else if (type === 'new name') {
    instruction = `Lanjutkan menyusuri ${street}`;
  } else if (type === 'roundabout') {
    instruction = `Masuki bundaran menuju ${street}`;
  } else {
    instruction = `Terus ikuti ${street}`;
  }

  return {
    instruction,
    distanceMeters: Math.round(step.distance),
    durationSeconds: Math.round(step.duration),
    streetName: street,
    maneuverType: type,
    modifier,
  };
}

/**
 * Fetches pedestrian route geometry, distance, duration, steps, and alternatives from OSRM.
 * Implements defensive timeout, schema validation, and secondary mirror fallback.
 */
export async function fetchOSRMRoute(
  origin: RouteCoordinate,
  destination: RouteCoordinate,
  profile: 'foot' = 'foot',
  timeoutMs: number = 8000,
  viaPoints?: Array<{ lat: number; lng: number }>
): Promise<OSRMFetchResult> {
  const validation = validateRouteRequest(origin, destination);
  if (!validation.valid) {
    return {
      success: false,
      provider: 'OSRM / OpenStreetMap',
      profile,
      error: validation.errorMessage || 'Parameter koordinat tidak valid.',
    };
  }

  const primaryUrl = buildOSRMRouteUrl(origin.lat, origin.lng, destination.lat, destination.lng, profile, undefined, viaPoints);

  // Attempt 1: Primary OSRM Endpoint
  let primaryResult = await tryExecuteOSRMQuery(primaryUrl, timeoutMs, profile);
  if (primaryResult.success) {
    return primaryResult;
  }

  // Attempt 2: Secondary Mirror Fallback (jika attempt 1 gagal / timeout / rate limited)
  try {
    const mirrorUrl = buildOSRMRouteUrl(
      origin.lat,
      origin.lng,
      destination.lat,
      destination.lng,
      profile,
      FALLBACK_OSRM_URL,
      viaPoints
    );
    const mirrorResult = await tryExecuteOSRMQuery(mirrorUrl, timeoutMs, profile);
    if (mirrorResult.success) {
      mirrorResult.isMirrorFallback = true;
      mirrorResult.provider = 'OSRM OpenStreetMap Mirror (routed-foot)';
      return mirrorResult;
    }
  } catch {
    // Continue to return primary result error
  }

  return primaryResult;
}

async function tryExecuteOSRMQuery(
  url: string,
  timeoutMs: number,
  profile: string
): Promise<OSRMFetchResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      if (res.status === 429) {
        return {
          success: false,
          provider: 'OSRM / OpenStreetMap',
          profile,
          error: 'Batas kuota layanan demo OSRM tercapai (Rate Limited). Silakan coba beberapa detik lagi.',
        };
      }
      return {
        success: false,
        provider: 'OSRM / OpenStreetMap',
        profile,
        error: `Layanan routing mengembalikan status HTTP ${res.status}: ${res.statusText}`,
      };
    }

    const data: OSRMRouteResponse = await res.json();

    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      if (data.code === 'NoRoute') {
        return {
          success: false,
          provider: 'OSRM / OpenStreetMap',
          profile,
          error: 'Tidak ditemukan jalur jalan pejalan kaki yang menghubungkan kedua titik (No Route Available).',
        };
      }
      return {
        success: false,
        provider: 'OSRM / OpenStreetMap',
        profile,
        error: data.message || `Layanan OSRM tidak dapat memproses rute (Kode: ${data.code}).`,
      };
    }

    // Process all candidate routes
    const candidatePaths: RouteCandidatePath[] = [];

    for (const r of data.routes) {
      const coords = r.geometry?.coordinates;
      if (!validateReturnedGeometry(coords)) continue;

      const leafletGeo: [number, number][] = coords.map(([lng, lat]) => [lat, lng]);
      const stepsRaw = r.legs?.[0]?.steps || [];
      const steps: TurnByTurnStep[] = stepsRaw.map((step, idx) =>
        mapStepToInstruction(step, idx, idx === stepsRaw.length - 1)
      );

      candidatePaths.push({
        distanceMeters: Math.round(r.distance),
        durationSeconds: Math.round(r.duration),
        geometry: leafletGeo,
        geoJsonCoordinates: coords,
        turnByTurnSteps: steps,
      });
    }

    if (candidatePaths.length === 0) {
      return {
        success: false,
        provider: 'OSRM / OpenStreetMap',
        profile,
        error: 'Geometri jalur yang diterima dari layanan routing tidak valid atau kosong.',
      };
    }

    const primaryPath = candidatePaths[0];

    return {
      success: true,
      distanceMeters: primaryPath.distanceMeters,
      durationSeconds: primaryPath.durationSeconds,
      geometry: primaryPath.geometry,
      geoJsonCoordinates: primaryPath.geoJsonCoordinates,
      turnByTurnSteps: primaryPath.turnByTurnSteps,
      alternativePaths: candidatePaths,
      provider: 'OSRM / OpenStreetMap (Pedestrian Network)',
      profile,
    };
  } catch (err: unknown) {
    clearTimeout(timeoutId);

    if (err instanceof DOMException && err.name === 'AbortError') {
      return {
        success: false,
        provider: 'OSRM / OpenStreetMap',
        profile,
        error: `Waktu permintaan rute habis (Timeout > ${timeoutMs / 1000} detik). Periksa koneksi internet Anda.`,
      };
    }

    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      provider: 'OSRM / OpenStreetMap',
      profile,
      error: `Gagal menghubungi routing service (${message}). Pastikan jaringan internet aktif.`,
    };
  }
}
