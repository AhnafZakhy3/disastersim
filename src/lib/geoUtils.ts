/**
 * Geolocation & Trigonometric Utilities for Indonesia Disaster Simulator
 */
import { difference } from '@turf/difference';
import { polygon, featureCollection } from '@turf/helpers';
import type { Feature, Polygon, MultiPolygon } from 'geojson';

const EARTH_RADIUS_KM = 6371.0;

/**
 * Calculates great-circle distance between two coordinates in kilometers (Haversine formula).
 */
export function calculateHaversineDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

/**
 * Computes destination point given origin, distance in km, and bearing in degrees (0 = North).
 */
export function computeDestinationPoint(
  lat: number,
  lng: number,
  distanceKm: number,
  bearingDeg: number
): [number, number] {
  const radLat = toRadians(lat);
  const radLng = toRadians(lng);
  const radBearing = toRadians(bearingDeg);
  const angularDistance = distanceKm / EARTH_RADIUS_KM;

  const destLat = Math.asin(
    Math.sin(radLat) * Math.cos(angularDistance) +
      Math.cos(radLat) * Math.sin(angularDistance) * Math.cos(radBearing)
  );

  const destLng =
    radLng +
    Math.atan2(
      Math.sin(radBearing) * Math.sin(angularDistance) * Math.cos(radLat),
      Math.cos(angularDistance) - Math.sin(radLat) * Math.sin(destLat)
    );

  return [toDegrees(destLat), toDegrees(destLng)];
}

/**
 * Calculates compass bearing from point 1 to point 2 in degrees (0 - 360).
 */
export function calculateBearingDeg(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const φ1 = toRadians(lat1);
  const φ2 = toRadians(lat2);
  const Δλ = toRadians(lng2 - lng1);
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) -
    Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  const θ = Math.atan2(y, x);
  return (toDegrees(θ) + 360) % 360;
}

/**
 * Generates an array of [lat, lng] coordinates forming a circular polygon.
 */
export function createCirclePolygon(
  centerLat: number,
  centerLng: number,
  radiusKm: number,
  pointsCount = 64
): [number, number][] {
  const coords: [number, number][] = [];
  const step = 360 / pointsCount;

  for (let i = 0; i <= pointsCount; i++) {
    const bearing = i * step;
    coords.push(computeDestinationPoint(centerLat, centerLng, radiusKm, bearing));
  }

  return coords;
}

/**
 * Generates an array of [lat, lng] forming a pie/wedge sector (ash plume cone).
 * Origin is at the center, radiating outward between startBearing and endBearing.
 */
export function createWedgeSectorPolygon(
  centerLat: number,
  centerLng: number,
  radiusKm: number,
  centerBearingDeg: number,
  spreadAngleDeg = 45,
  pointsCount = 24
): [number, number][] {
  const coords: [number, number][] = [];
  coords.push([centerLat, centerLng]);

  const halfSpread = spreadAngleDeg / 2;
  const startBearing = (centerBearingDeg - halfSpread + 360) % 360;
  const step = spreadAngleDeg / pointsCount;

  for (let i = 0; i <= pointsCount; i++) {
    const currentBearing = (startBearing + i * step) % 360;
    coords.push(
      computeDestinationPoint(centerLat, centerLng, radiusKm, currentBearing)
    );
  }

  coords.push([centerLat, centerLng]);
  return coords;
}

/**
 * Convert degrees to compass direction text in Indonesian
 */
export function degreeToCompassIndonesian(deg: number): string {
  const normalized = ((deg % 360) + 360) % 360;
  const directions = [
    { label: 'Utara (N)', min: 337.5, max: 360 },
    { label: 'Utara (N)', min: 0, max: 22.5 },
    { label: 'Timur Laut (NE)', min: 22.5, max: 67.5 },
    { label: 'Timur (E)', min: 67.5, max: 112.5 },
    { label: 'Tenggara (SE)', min: 112.5, max: 157.5 },
    { label: 'Selatan (S)', min: 157.5, max: 202.5 },
    { label: 'Barat Daya (SW)', min: 202.5, max: 247.5 },
    { label: 'Barat (W)', min: 247.5, max: 292.5 },
    { label: 'Barat Laut (NW)', min: 292.5, max: 337.5 },
  ];

  for (const dir of directions) {
    if (normalized >= dir.min && normalized < dir.max) {
      return dir.label;
    }
  }
  return 'Utara (N)';
}

// ===================================================================
// POLIGON PERIMETER DARATAN PULAU-PULAU UTAMA INDONESIA
// ===================================================================

export const SUMATRA_POLYGON: [number, number][] = [
  [5.60, 95.30], [5.25, 96.00], [5.18, 97.15], [4.45, 98.00],
  [3.80, 98.70], [3.00, 99.80], [2.10, 100.30], [1.50, 102.10],
  [0.60, 103.20], [-0.80, 104.20], [-2.30, 105.00], [-3.20, 106.00],
  [-4.80, 105.90], [-5.80, 105.80], [-5.90, 105.20], [-5.50, 104.60],
  [-5.15, 103.90], [-4.40, 102.80], [-3.80, 102.20], [-2.55, 101.10],
  [-1.35, 100.55], [-0.95, 100.35], [-0.60, 100.10], [0.20, 99.80],
  [1.70, 98.75], [2.40, 97.80], [3.20, 97.15], [4.15, 96.10],
  [4.65, 95.55], [5.60, 95.30]
];

export const JAVA_MADURA_POLYGON: [number, number][] = [
  [-6.00, 105.95], [-5.90, 106.85], [-6.20, 107.50], [-6.30, 108.30],
  [-6.80, 108.80], [-6.85, 109.65], [-6.95, 110.45], [-6.60, 110.70],
  [-6.85, 111.60], [-6.90, 112.50], [-7.00, 113.80], [-7.05, 114.10],
  [-7.25, 113.80], [-7.20, 112.75], [-7.70, 113.40], [-7.70, 114.20],
  [-8.20, 114.40], [-8.65, 114.35], [-8.45, 113.50], [-8.30, 112.70],
  [-8.35, 112.15], [-8.28, 111.70], [-8.22, 111.08], [-8.15, 110.60],
  [-8.02, 110.33], [-7.91, 110.05], [-7.83, 109.98], [-7.76, 109.65],
  [-7.73, 109.01], [-7.70, 108.65], [-7.30, 107.45], [-6.99, 106.54],
  [-6.85, 105.25], [-6.65, 105.55], [-6.30, 105.82], [-6.05, 105.92],
  [-6.00, 105.95]
];

export const BALI_POLYGON: [number, number][] = [
  [-8.10, 114.45], [-8.12, 115.10], [-8.30, 115.70], [-8.50, 115.60],
  [-8.60, 115.30], [-8.70, 115.26], [-8.85, 115.18], [-8.70, 115.15],
  [-8.50, 115.10], [-8.35, 114.50], [-8.10, 114.45]
];

export const LOMBOK_POLYGON: [number, number][] = [
  [-8.25, 116.10], [-8.28, 116.50], [-8.50, 116.70], [-8.85, 116.60],
  [-8.92, 116.30], [-8.75, 115.98], [-8.55, 116.05], [-8.25, 116.10]
];

export const SUMBAWA_POLYGON: [number, number][] = [
  [-8.15, 117.00], [-8.35, 117.70], [-8.25, 118.50], [-8.45, 119.10],
  [-8.80, 119.00], [-8.95, 118.50], [-9.10, 117.40], [-8.90, 116.75],
  [-8.50, 116.85], [-8.15, 117.00]
];

export const FLORES_POLYGON: [number, number][] = [
  [-8.45, 119.85], [-8.35, 120.45], [-8.40, 121.10], [-8.50, 122.20],
  [-8.30, 123.00], [-8.50, 123.00], [-8.75, 122.30], [-8.85, 121.65],
  [-8.80, 120.95], [-8.70, 120.40], [-8.65, 119.85], [-8.45, 119.85]
];

export const TIMOR_WEST_POLYGON: [number, number][] = [
  [-9.10, 124.90], [-9.35, 125.10], [-9.85, 124.70], [-10.25, 124.00],
  [-10.40, 123.50], [-10.15, 123.55], [-9.85, 124.00], [-9.10, 124.40],
  [-9.10, 124.90]
];

export const KALIMANTAN_POLYGON: [number, number][] = [
  [4.25, 117.65], [3.30, 117.65], [2.15, 117.50], [0.15, 117.50],
  [-1.25, 116.85], [-3.45, 116.20], [-3.75, 115.80], [-3.30, 114.55],
  [-2.60, 113.50], [-2.70, 111.60], [-1.80, 109.95], [-0.05, 109.30],
  [1.40, 109.20], [2.05, 109.60], [4.10, 115.50], [4.25, 117.65]
];

// 4 Semenanjung Sulawesi (Menyisakan Teluk Tomini, Teluk Bone, dan Teluk Tolo sebagai Lautan)
export const SULAWESI_SOUTH_POLYGON: [number, number][] = [
  [-5.60, 119.40], [-5.60, 120.45], [-4.50, 120.40], [-3.00, 120.20],
  [-2.40, 119.80], [-2.70, 118.85], [-3.60, 118.95], [-4.05, 119.60],
  [-5.15, 119.40], [-5.60, 119.40]
];

export const SULAWESI_SOUTHEAST_POLYGON: [number, number][] = [
  [-5.55, 122.65], [-5.20, 123.60], [-4.00, 122.60], [-3.15, 122.45],
  [-3.00, 121.70], [-4.10, 121.55], [-5.55, 122.65]
];

export const SULAWESI_EAST_POLYGON: [number, number][] = [
  [-0.90, 122.75], [-0.80, 123.50], [-1.45, 123.60], [-2.00, 121.50],
  [-1.30, 120.75], [-0.80, 121.60], [-0.90, 122.75]
];

export const SULAWESI_NORTH_POLYGON: [number, number][] = [
  [-0.90, 119.85], [1.10, 120.80], [0.60, 122.95], [1.35, 124.80],
  [1.50, 125.20], [1.25, 124.95], [0.50, 123.10], [0.65, 120.80],
  [-0.60, 119.80], [-0.90, 119.85]
];

export const MALUKU_HALMAHERA_POLYGON: [number, number][] = [
  [2.10, 127.80], [1.70, 128.05], [0.60, 127.45], [-0.70, 127.50],
  [0.80, 128.40], [2.10, 127.80]
];

export const SERAM_AMBON_POLYGON: [number, number][] = [
  [-3.00, 128.00], [-3.00, 130.80], [-3.80, 130.80], [-3.75, 128.15],
  [-3.00, 128.00]
];

export const BURU_POLYGON: [number, number][] = [
  [-3.00, 126.30], [-3.15, 127.20], [-3.90, 127.10], [-3.80, 126.10],
  [-3.00, 126.30]
];

export const PAPUA_POLYGON: [number, number][] = [
  [-0.85, 131.25], [-0.85, 134.10], [-1.80, 136.20], [-2.50, 140.75],
  [-9.10, 141.05], [-8.50, 138.50], [-4.55, 136.85], [-3.65, 133.75],
  [-2.90, 132.30], [-2.00, 131.50], [-0.85, 131.25]
];

export const ALL_INDONESIA_ISLAND_POLYGONS: [number, number][][] = [
  SUMATRA_POLYGON,
  JAVA_MADURA_POLYGON,
  BALI_POLYGON,
  LOMBOK_POLYGON,
  SUMBAWA_POLYGON,
  FLORES_POLYGON,
  TIMOR_WEST_POLYGON,
  KALIMANTAN_POLYGON,
  SULAWESI_SOUTH_POLYGON,
  SULAWESI_SOUTHEAST_POLYGON,
  SULAWESI_EAST_POLYGON,
  SULAWESI_NORTH_POLYGON,
  MALUKU_HALMAHERA_POLYGON,
  SERAM_AMBON_POLYGON,
  BURU_POLYGON,
  PAPUA_POLYGON,
];

/**
 * Algoritma deterministik Ray-Casting untuk menentukan apakah titik (lat, lng) berada di dalam poligon.
 */
export function isPointInPolygon(
  lat: number,
  lng: number,
  poly: [number, number][]
): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    const intersect =
      yi > lng !== yj > lng &&
      lat < ((xj - xi) * (lng - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Mengevaluasi apakah suatu koordinat geografis merupakan Laut/Samudera atau Daratan.
 * Return true jika Laut/Samudera, return false jika Daratan.
 */
export function isOceanCoordinate(lat: number, lng: number): boolean {
  // Samudera Hindia di selatan Jawa atau barat Sumatera
  if (lat < -9.1) return true;
  if (lng < 95.0) return true;

  // Teluk Palu (antara -0.7 s.d -0.9, lng 119.8 s.d 119.88)
  if (lat >= -0.90 && lat <= -0.65 && lng >= 119.78 && lng <= 119.89) {
    return true;
  }

  // Periksa apakah titik jatuh di dalam salah satu poligon daratan pulau Indonesia
  for (const islandPoly of ALL_INDONESIA_ISLAND_POLYGONS) {
    if (isPointInPolygon(lat, lng, islandPoly)) {
      return false; // Daratan
    }
  }

  // Jika tidak berada di dalam poligon daratan manapun, pasti Laut/Perairan
  return true;
}

/**
 * Memotong poligon gelombang tsunami (muka gelombang) terhadap pulau-pulau daratan Indonesia
 * menggunakan @turf/difference, sehingga gelombang tidak menembus daratan/pulau ke sisi seberang.
 * 
 * Parameter opsional epicenterLat dan epicenterLng digunakan untuk menyaring MultiPolygon
 * sehingga HANYA mempertahankan poligon perairan yang terhubung langsung dengan episentrum,
 * dan membuang 100% ghost polygon di seberang pulau (seperti di Laut Jawa atau seberang Sumatera).
 */
export function clipWavefrontWithLand(
  waveLatLngs: [number, number][],
  epicenterLat?: number,
  epicenterLng?: number
): [number, number][][] {
  try {
    // GeoJSON mengharuskan koordinat berupa [longitude, latitude] dan poligon tertutup
    const waveRing: [number, number][] = waveLatLngs.map(([lat, lng]) => [lng, lat]);
    if (
      waveRing[0][0] !== waveRing[waveRing.length - 1][0] ||
      waveRing[0][1] !== waveRing[waveRing.length - 1][1]
    ) {
      waveRing.push([waveRing[0][0], waveRing[0][1]]);
    }

    let currentWaveFeature: Feature<Polygon | MultiPolygon> = polygon([waveRing]);

    // Potong terhadap setiap pulau Indonesia yang berpotongan
    for (const island of ALL_INDONESIA_ISLAND_POLYGONS) {
      const islandRing: [number, number][] = island.map(([lat, lng]) => [lng, lat]);
      if (
        islandRing[0][0] !== islandRing[islandRing.length - 1][0] ||
        islandRing[0][1] !== islandRing[islandRing.length - 1][1]
      ) {
        islandRing.push([islandRing[0][0], islandRing[0][1]]);
      }

      const islandPoly = polygon([islandRing]);
      const diffResult = difference(featureCollection([currentWaveFeature, islandPoly]));
      if (diffResult) {
        currentWaveFeature = diffResult;
      }
    }

    // Ekstrak hasil koordinat GeoJSON [lng, lat] kembali ke [lat, lng] Leaflet
    const rawPolygons: [number, number][][] = [];
    const geom = currentWaveFeature.geometry;
    if (geom.type === 'Polygon') {
      const coords = geom.coordinates[0];
      rawPolygons.push(coords.map((pos) => [pos[1], pos[0]] as [number, number]));
    } else if (geom.type === 'MultiPolygon') {
      for (const polyCoords of geom.coordinates) {
        rawPolygons.push(polyCoords[0].map((pos) => [pos[1], pos[0]] as [number, number]));
      }
    }

    // KRITIKAL: Jika hasil potongan berupa MultiPolygon (terbelah oleh daratan pulau),
    // HANYA pertahankan poligon yang memuat titik episentrum gempa!
    // Buang semua poligon terputus di balik pulau (misal di Laut Jawa atau seberang daratan).
    if (epicenterLat !== undefined && epicenterLng !== undefined && rawPolygons.length > 1) {
      const containing = rawPolygons.filter((poly) =>
        isPointInPolygon(epicenterLat, epicenterLng, poly)
      );
      if (containing.length > 0) {
        return containing;
      }

      // Fallback jika episentrum berada tepat di bibir batas: pilih poligon yang paling dekat dengan episentrum
      let bestPoly = rawPolygons[0];
      let minDist = Infinity;
      for (const poly of rawPolygons) {
        for (const [pLat, pLng] of poly) {
          const d = (pLat - epicenterLat) ** 2 + (pLng - epicenterLng) ** 2;
          if (d < minDist) {
            minDist = d;
            bestPoly = poly;
          }
        }
      }
      return [bestPoly];
    }

    return rawPolygons.length > 0 ? rawPolygons : [waveLatLngs];
  } catch {
    // Fallback jika terjadi singularitas geometri
    return [waveLatLngs];
  }
}

/**
 * Menghitung parameter perpotongan t in [0, 1] antara segmen garis P1->P2 dan Q1->Q2.
 * Return null jika sejajar atau tidak berpotongan.
 */
function getSegmentIntersectionT(
  p1Lat: number,
  p1Lng: number,
  p2Lat: number,
  p2Lng: number,
  q1Lat: number,
  q1Lng: number,
  q2Lat: number,
  q2Lng: number
): number | null {
  const dLatP = p2Lat - p1Lat;
  const dLngP = p2Lng - p1Lng;
  const dLatQ = q2Lat - q1Lat;
  const dLngQ = q2Lng - q1Lng;

  const denom = dLatP * dLngQ - dLngP * dLatQ;
  if (Math.abs(denom) < 1e-9) return null;

  const t = ((q1Lat - p1Lat) * dLngQ - (q1Lng - p1Lng) * dLatQ) / denom;
  const u = ((q1Lat - p1Lat) * dLngP - (q1Lng - p1Lng) * dLatP) / denom;

  if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
    return t;
  }
  return null;
}

export interface LandOcclusionResult {
  isOccluded: boolean;
  reason: string;
  blockingIsland?: string;
}

/**
 * Universal Geodesic Ray-Tracing Land Occlusion Engine.
 * Menentukan apakah garis rambat gelombang tsunami dari episentrum laut ke suatu kota / distrik
 * secara fisik terhalang dan terputus oleh massa daratan pulau.
 */
export function isLineOccludedByLand(
  epicenterLat: number,
  epicenterLng: number,
  targetLat: number,
  targetLng: number,
  targetCoastalFacing?: string,
  targetIslandGroup?: string
): LandOcclusionResult {
  const totalDistKm = calculateHaversineDistanceKm(epicenterLat, epicenterLng, targetLat, targetLng);

  // 1. Aturan Fisika Kompatibilitas Cekungan Badan Air (Water Body Incompatibility)
  // A. Episentrum di Samudera Hindia (Selatan Jawa atau Barat Sumatera)
  const isIndianOcean =
    epicenterLat < -8.4 ||
    (epicenterLng < 100.2 && epicenterLat < 6.0 && epicenterLat > -7.0);

  if (isIndianOcean) {
    // Jika kota menghadap Laut Jawa, Selat Malaka, atau Selat Karimata, daratan Jawa/Sumatera 100% menghalangi
    if (targetCoastalFacing) {
      const shelteredWaterBodies = [
        'Laut Jawa',
        'Selat Malaka',
        'Selat Karimata',
        'Selat Madura',
        'Laut Natuna',
        'Selat Bangka',
        'Selat Gaspar',
      ];
      if (shelteredWaterBodies.includes(targetCoastalFacing)) {
        return {
          isOccluded: true,
          reason: 'Terlindung oleh daratan Pulau Jawa / Sumatera',
          blockingIsland: targetIslandGroup === 'Jawa' ? 'Pulau Jawa' : 'Pulau Sumatera',
        };
      }
    }

    // Pulau Kalimantan selalu terlindung dari gelombang Samudera Hindia Selatan Jawa oleh Pulau Jawa
    if (targetIslandGroup === 'Kalimantan') {
      return {
        isOccluded: true,
        reason: 'Terlindung oleh Pulau Jawa di Samudera Hindia',
        blockingIsland: 'Pulau Jawa',
      };
    }
  }

  // B. Episentrum di Laut Jawa
  const isJavaSea =
    epicenterLat >= -7.0 &&
    epicenterLat <= -3.5 &&
    epicenterLng >= 106.0 &&
    epicenterLng <= 115.5;

  if (isJavaSea) {
    if (
      targetCoastalFacing === 'Samudera Hindia' ||
      targetCoastalFacing === 'Samudera Pasifik'
    ) {
      return {
        isOccluded: true,
        reason: 'Terlindung oleh daratan Pulau Jawa',
        blockingIsland: 'Pulau Jawa',
      };
    }
  }

  // C. Episentrum di Laut Flores / Laut Banda (Utara Nusa Tenggara)
  const isFloresBandaNorth =
    epicenterLat >= -8.5 &&
    epicenterLat <= -6.0 &&
    epicenterLng >= 118.0 &&
    epicenterLng <= 126.0;

  if (isFloresBandaNorth) {
    if (
      targetCoastalFacing === 'Samudera Hindia' ||
      targetCoastalFacing === 'Laut Timor' ||
      targetCoastalFacing === 'Laut Sawu'
    ) {
      return {
        isOccluded: true,
        reason: 'Terlindung oleh gugusan pulau Nusa Tenggara',
        blockingIsland: 'Kepulauan Nusa Tenggara',
      };
    }
  }

  // 2. Uji Potong Geometris Ray-Casting Menyeluruh Terhadap Semua Poligon Pulau Indonesia
  const islandNames = [
    'Pulau Sumatera',
    'Pulau Jawa',
    'Pulau Bali',
    'Pulau Lombok',
    'Pulau Sumbawa',
    'Pulau Flores',
    'Pulau Timor',
    'Pulau Kalimantan',
    'Sulawesi Selatan',
    'Sulawesi Tenggara',
    'Sulawesi Timur',
    'Sulawesi Utara',
    'Kepulauan Halmahera',
    'Pulau Seram & Ambon',
    'Pulau Buru',
    'Pulau Papua',
  ];

  for (let idx = 0; idx < ALL_INDONESIA_ISLAND_POLYGONS.length; idx++) {
    const island = ALL_INDONESIA_ISLAND_POLYGONS[idx];
    const islandName = islandNames[idx] || 'Daratan Pulau';

    const tIntersections: number[] = [];

    for (let j = 0; j < island.length - 1; j++) {
      const [v1Lat, v1Lng] = island[j];
      const [v2Lat, v2Lng] = island[j + 1];

      const t = getSegmentIntersectionT(
        epicenterLat,
        epicenterLng,
        targetLat,
        targetLng,
        v1Lat,
        v1Lng,
        v2Lat,
        v2Lng
      );

      if (t !== null && t > 0.005 && t < 0.995) {
        tIntersections.push(t);
      }
    }

    if (tIntersections.length === 0) continue;

    tIntersections.sort((a, b) => a - b);

    // Jika sinar memasuki pulau dan keluar kembali ke perairan di seberang (lastExit < 0.96)
    // itu berarti sinar telah melintasi daratan pulau secara penuh! Target pasti berada di seberang pulau!
    if (tIntersections.length >= 2) {
      const firstEntry = tIntersections[0];
      const lastExit = tIntersections[tIntersections.length - 1];

      if (lastExit < 0.96) {
        return {
          isOccluded: true,
          reason: `Sinar gelombang terhalang oleh ${islandName}`,
          blockingIsland: islandName,
        };
      }

      // Jika sinar masuk dan merambat jauh di pedalaman daratan (> 28 km)
      const landDistanceKm = (lastExit - firstEntry) * totalDistKm;
      if (landDistanceKm > 28) {
        return {
          isOccluded: true,
          reason: `Terlindung oleh pedalaman ${islandName} (${landDistanceKm.toFixed(0)} km daratan)`,
          blockingIsland: islandName,
        };
      }
    } else if (tIntersections.length === 1) {
      // Masuk ke pulau dan titik target berada di dalam daratan
      const entryT = tIntersections[0];
      const inlandDistanceKm = (1 - entryT) * totalDistKm;
      if (inlandDistanceKm > 28) {
        return {
          isOccluded: true,
          reason: `Terlindung di balik pegunungan pantai ${islandName}`,
          blockingIsland: islandName,
        };
      }
    }
  }

  return {
    isOccluded: false,
    reason: 'Garis pandang gelombang laut terbuka langsung',
  };
}

/**
 * Menghasilkan koridor inundasi daratan yang menempel presisi di garis pantai otentik
 * dan meresap tegak lurus ke arah daratan.
 */
export function createPerpendicularInundationCorridor(
  coastline: [number, number][],
  oceanLat: number,
  oceanLng: number,
  inundationDistanceM: number
): [number, number][] {
  if (coastline.length < 2) return coastline;

  // Konversi jarak inundasi meter ke derajat lat/lng (~111 km per derajat)
  const offsetDeg = Math.min(0.06, Math.max(0.015, (inundationDistanceM / 111000) * 1.5));

  const inlandPoints: [number, number][] = [];

  for (let i = 0; i < coastline.length; i++) {
    const [lat, lng] = coastline[i];
    // Tentukan vektor normal dari episentrum laut ke garis pantai (arah dorongan air ke darat)
    const dLat = lat - oceanLat;
    const dLng = lng - oceanLng;
    const len = Math.sqrt(dLat * dLat + dLng * dLng) || 1;

    // Geser titik pantai ke arah daratan (menjauhi lautan)
    const inlandLat = lat + (dLat / len) * offsetDeg;
    const inlandLng = lng + (dLng / len) * offsetDeg;
    inlandPoints.push([inlandLat, inlandLng]);
  }

  // Gabungkan garis pantai maju dan garis pedalaman mundur untuk membentuk poligon tertutup
  return [...coastline, ...inlandPoints.reverse()];
}

function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

function toDegrees(rad: number): number {
  return (rad * 180) / Math.PI;
}
