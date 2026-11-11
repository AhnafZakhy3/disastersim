import { HazardCheckStatus, HazardSeverityLevel } from './routingTypes';
import { isPointInPolygon } from '@/lib/geoUtils';

export interface HazardZonePolygon {
  name: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  type?: 'KRB3' | 'KRB2' | 'KRB1' | 'ASH_HEAVY' | 'ASH_MEDIUM' | 'ASH_LIGHT' | 'TSUNAMI_INUNDATION' | 'TSUNAMI_WAVE';
  polygon: [number, number][]; // [lat, lng] array
}

export interface HazardCheckResult {
  status: HazardCheckStatus;
  highestSeverity: HazardSeverityLevel;
  note: string;
  intersectingZoneNames: string[];
  intersectingDetails: Array<{
    name: string;
    severity: HazardSeverityLevel;
  }>;
}

/**
 * Checks whether line segment A (p1->p2) intersects line segment B (q1->q2).
 */
function doSegmentsIntersect(
  p1Lat: number,
  p1Lng: number,
  p2Lat: number,
  p2Lng: number,
  q1Lat: number,
  q1Lng: number,
  q2Lat: number,
  q2Lng: number
): boolean {
  const dLatP = p2Lat - p1Lat;
  const dLngP = p2Lng - p1Lng;
  const dLatQ = q2Lat - q1Lat;
  const dLngQ = q2Lng - q1Lng;

  const denom = dLatP * dLngQ - dLngP * dLatQ;
  if (Math.abs(denom) < 1e-12) return false;

  const t = ((q1Lat - p1Lat) * dLngQ - (q1Lng - p1Lng) * dLatQ) / denom;
  const u = ((q1Lat - p1Lat) * dLngP - (q1Lng - p1Lng) * dLatP) / denom;

  return t >= 0 && t <= 1 && u >= 0 && u <= 1;
}

/**
 * Performs a spatial intersection check between the pedestrian route polyline
 * and active simulated hazard zones (e.g. KRB III / Inundasi Pesisir).
 */
export function checkRouteHazardIntersection(
  routeLeafletCoords: [number, number][], // [lat, lng] array
  hazardZones: HazardZonePolygon[]
): HazardCheckResult {
  if (!routeLeafletCoords || routeLeafletCoords.length < 2) {
    return {
      status: 'unknown',
      highestSeverity: 'critical',
      note: 'Geometri rute tidak valid untuk dilakukan pemeriksaan zona bahaya.',
      intersectingZoneNames: [],
      intersectingDetails: [],
    };
  }

  if (!hazardZones || hazardZones.length === 0) {
    return {
      status: 'no_intersection_detected',
      highestSeverity: 'none',
      note: 'Tidak ditemukan persinggungan dengan zona bahaya model yang sedang ditampilkan.',
      intersectingZoneNames: [],
      intersectingDetails: [],
    };
  }

  try {
    const hitMap = new Map<string, HazardSeverityLevel>();

    for (const zone of hazardZones) {
      if (!zone.polygon || zone.polygon.length < 3) continue;

      let zoneHit = false;

      // 1. Point-in-polygon check for route vertices
      for (const [rLat, rLng] of routeLeafletCoords) {
        if (!Number.isFinite(rLat) || !Number.isFinite(rLng)) {
          return {
            status: 'unknown',
            highestSeverity: 'critical',
            note: 'Koordinat rute mengandung nilai non-finite.',
            intersectingZoneNames: [],
            intersectingDetails: [],
          };
        }

        if (isPointInPolygon(rLat, rLng, zone.polygon)) {
          zoneHit = true;
          hitMap.set(zone.name, zone.severity);
          break;
        }
      }

      // 2. Edge-to-edge segment intersection check if no vertex is strictly inside
      if (!zoneHit) {
        for (let i = 0; i < routeLeafletCoords.length - 1; i++) {
          const [p1Lat, p1Lng] = routeLeafletCoords[i];
          const [p2Lat, p2Lng] = routeLeafletCoords[i + 1];

          for (let j = 0; j < zone.polygon.length; j++) {
            const [q1Lat, q1Lng] = zone.polygon[j];
            const [q2Lat, q2Lng] = zone.polygon[(j + 1) % zone.polygon.length];

            if (doSegmentsIntersect(p1Lat, p1Lng, p2Lat, p2Lng, q1Lat, q1Lng, q2Lat, q2Lng)) {
              zoneHit = true;
              hitMap.set(zone.name, zone.severity);
              break;
            }
          }
          if (zoneHit) break;
        }
      }
    }

    const hitArray = Array.from(hitMap.keys());
    const intersectingDetails = Array.from(hitMap.entries()).map(([name, severity]) => ({
      name,
      severity,
    }));

    if (hitArray.length > 0) {
      // Determine highest severity: critical > high > medium > low
      let highestSeverity: HazardSeverityLevel = 'low';
      const severities = Array.from(hitMap.values());
      if (severities.includes('critical')) {
        highestSeverity = 'critical';
      } else if (severities.includes('high')) {
        highestSeverity = 'high';
      } else if (severities.includes('medium')) {
        highestSeverity = 'medium';
      }

      const severityLabel =
        highestSeverity === 'critical'
          ? 'BAHAYA EKSTREM (KRB III / Inundasi Primer)'
          : highestSeverity === 'high'
          ? 'PERINGATAN TINGGI (KRB II / Abu Lebat > 5 cm)'
          : highestSeverity === 'medium'
          ? 'PERHATIAN SEDANG (KRB I / Abu 1-5 cm)'
          : 'WASPADA RINGAN';

      return {
        status: 'intersects',
        highestSeverity,
        note: `PERINGATAN [${severityLabel}]: Jalur rute jalan berpotongan dengan zona bahaya simulasi (${hitArray.join(', ')}). Diperlukan pertimbangan jalan memutar (detour).`,
        intersectingZoneNames: hitArray,
        intersectingDetails,
      };
    }

    return {
      status: 'no_intersection_detected',
      highestSeverity: 'none',
      note: 'Tidak terdeteksi persinggungan dengan batas zona bahaya model yang ditampilkan. (Bukan jaminan keselamatan kondisi riil).',
      intersectingZoneNames: [],
      intersectingDetails: [],
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      status: 'unknown',
      highestSeverity: 'critical',
      note: `Kalkulasi spasial zona bahaya gagal diproses (${msg}). Status bahaya tidak dapat dipastikan.`,
      intersectingZoneNames: [],
      intersectingDetails: [],
    };
  }
}
