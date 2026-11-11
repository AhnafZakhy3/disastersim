import {
  EvacuationRouteResult,
  RouteOrigin,
  TurnByTurnStep,
  CapacityAllocationResult,
  HazardSeverityLevel,
} from './routingTypes';
import { fetchOSRMRoute, RouteCandidatePath } from './osrmAdapter';
import { getNearestCandidateDestinations } from '@/data/evacuationDestinations';
import { checkRouteHazardIntersection, HazardZonePolygon } from './hazardCheck';
import { findMatchingCachedRoute } from '@/data/cachedPilotRoutes';
import { calculateHaversineDistanceKm } from '@/lib/geoUtils';
import { EvacuationDestination } from '@/types/disaster';

export interface CalculateRouteOptions {
  origin: RouteOrigin;
  disasterType: 'tsunami' | 'volcano';
  regionId?: string;
  hazardZones?: HazardZonePolygon[];
  affectedPopulation?: number;
  allowDetour?: boolean;
}

/**
 * Calculates the optimal pedestrian evacuation route to the nearest verified TES.
 * Evaluates candidate destinations via real road-network distance/time from OSRM,
 * performs multi-tier hazard avoidance, road impedance adjustment, capacity allocation,
 * and multi-tier offline resilience fallback.
 */
export async function calculateOptimalEvacuationRoute(
  options: CalculateRouteOptions
): Promise<EvacuationRouteResult> {
  const {
    origin,
    disasterType,
    hazardZones = [],
    affectedPopulation,
    allowDetour = true,
  } = options;

  // 1. Fetch nearest verified candidate destinations
  const candidates = getNearestCandidateDestinations(
    origin.lat,
    origin.lng,
    disasterType,
    3
  );

  if (candidates.length === 0) {
    return {
      success: false,
      origin,
      destination: {
        id: 'no-dest',
        name: 'Tidak Ada Tujuan Terverifikasi',
        lat: origin.lat,
        lng: origin.lng,
        disasterTypes: [disasterType],
        destinationType: 'TES_BUILDING',
        regionId: 'none',
        districtName: '-',
        verificationStatus: 'unverified',
        sourceName: '-',
        sourceUrl: '-',
        verifiedAt: '-',
      },
      distanceMeters: 0,
      durationSeconds: 0,
      geometry: [],
      geoJsonCoordinates: [],
      hazardCheckStatus: 'unknown',
      hazardCheckNote: 'Belum ada data Tempat Evakuasi Sementara (TES) terverifikasi untuk wilayah skenario ini.',
      hazardSeverity: 'none',
      hazardDetails: [],
      provider: 'OSRM / OpenStreetMap',
      profile: 'foot',
      calculatedAt: new Date().toISOString(),
      error: 'Belum ada Tempat Evakuasi Sementara (TES) terverifikasi untuk wilayah dan jenis bencana ini.',
    };
  }

  // 2. Query routing service for each candidate destination
  const routePromises = candidates.map(async (candidate) => {
    const routeRes = await fetchOSRMRoute(
      { lat: origin.lat, lng: origin.lng },
      { lat: candidate.lat, lng: candidate.lng },
      'foot'
    );
    return { candidate, routeRes };
  });

  const evaluatedRoutes = await Promise.all(routePromises);

  // 3. Filter successful routes
  const validEvaluations = evaluatedRoutes.filter(
    (e) => e.routeRes.success && e.routeRes.geometry && e.routeRes.geometry.length >= 2
  );

  // === MULTI-TIER OFFLINE FALLBACK ===
  // Jika seluruh panggilan online gagal (offline / rate limited / timeout), coba periksa cache lokal
  if (validEvaluations.length === 0) {
    const primaryCandidate = candidates[0];
    const cached = findMatchingCachedRoute(
      origin.lat,
      origin.lng,
      primaryCandidate.lat,
      primaryCandidate.lng
    );

    if (cached) {
      const hazardCheck = checkRouteHazardIntersection(cached.geometry, hazardZones);
      return {
        success: true,
        origin,
        destination: primaryCandidate,
        distanceMeters: cached.distanceMeters,
        durationSeconds: cached.durationSeconds,
        geometry: cached.geometry,
        geoJsonCoordinates: cached.geoJsonCoordinates,
        hazardCheckStatus: hazardCheck.status,
        hazardCheckNote: `${hazardCheck.note} (Mode Navigasi Offline: Menggunakan rute jalan terverifikasi lokal).`,
        hazardSeverity: hazardCheck.highestSeverity,
        hazardDetails: hazardCheck.intersectingZoneNames,
        turnByTurnSteps: cached.steps,
        offlineMode: true,
        offlineNotice: 'Mode Offline Aktif: Jalur jalan dimuat dari pangkalan data rute terverifikasi lokal.',
        provider: 'Pangkalan Data Rute Offline Lokal (OpenStreetMap)',
        profile: 'foot',
        calculatedAt: new Date().toISOString(),
      };
    }

    // Synthesize realistic offline corridor if out of cache and offline
    const synthesizedPath = synthesizeOfflineCorridor(origin, primaryCandidate);
    const hazardCheck = checkRouteHazardIntersection(synthesizedPath.geometry, hazardZones);

    return {
      success: true,
      origin,
      destination: primaryCandidate,
      distanceMeters: synthesizedPath.distanceMeters,
      durationSeconds: synthesizedPath.durationSeconds,
      geometry: synthesizedPath.geometry,
      geoJsonCoordinates: synthesizedPath.geoJsonCoordinates,
      hazardCheckStatus: hazardCheck.status,
      hazardCheckNote: `${hazardCheck.note} (Mode Darurat Offline: Jalur koridor jalan darat).`,
      hazardSeverity: hazardCheck.highestSeverity,
      hazardDetails: hazardCheck.intersectingZoneNames,
      turnByTurnSteps: synthesizedPath.steps,
      offlineMode: true,
      offlineNotice: 'Koneksi internet tidak tersedia. Sistem menggunakan estimasi koridor jaringan jalan darat offline.',
      provider: 'Sintesis Koridor Jalan Darat (Mode Offline)',
      profile: 'foot',
      calculatedAt: new Date().toISOString(),
    };
  }

  // 4. Multi-Alternative Evaluation & Hazard Avoidance Selection
  // Cari jalur alternatif yang bebas bahaya (severity: none atau low)
  interface PathEvaluation {
    candidate: EvacuationDestination;
    path: RouteCandidatePath;
    hazardCheck: ReturnType<typeof checkRouteHazardIntersection>;
    isAlternative: boolean;
  }

  const allPossiblePaths: PathEvaluation[] = [];

  for (const evaluation of validEvaluations) {
    const candidate = evaluation.candidate;
    const paths = evaluation.routeRes.alternativePaths || [];

    for (let idx = 0; idx < paths.length; idx++) {
      const p = paths[idx];
      const check = checkRouteHazardIntersection(p.geometry, hazardZones);
      allPossiblePaths.push({
        candidate,
        path: p,
        hazardCheck: check,
        isAlternative: idx > 0,
      });
    }
  }

  // Sort paths: prioritize lowest hazard severity first, then shortest duration
  const severityScore: Record<HazardSeverityLevel, number> = {
    none: 0,
    low: 1,
    medium: 2,
    high: 3,
    critical: 4,
  };

  allPossiblePaths.sort((a, b) => {
    const scoreA = severityScore[a.hazardCheck.highestSeverity] ?? 99;
    const scoreB = severityScore[b.hazardCheck.highestSeverity] ?? 99;
    if (scoreA !== scoreB) {
      return scoreA - scoreB; // Pilih yang paling aman
    }
    return a.path.durationSeconds - b.path.durationSeconds; // Jika sama aman, pilih yang tercepat
  });

  let selectedEvaluation = allPossiblePaths[0];
  let isDetour = false;
  let detourReason: string | undefined;

  // Jika jalur terbaik yang ditemukan masih berstatus critical/high dan allowDetour aktif:
  // Coba minta rute via-point detour yang menjauhi poligon bahaya
  if (
    allowDetour &&
    (selectedEvaluation.hazardCheck.highestSeverity === 'critical' ||
      selectedEvaluation.hazardCheck.highestSeverity === 'high') &&
    hazardZones.length > 0
  ) {
    const detourResult = await tryComputeDetourRoute(origin, selectedEvaluation.candidate, hazardZones);
    if (detourResult) {
      const detourHazardCheck = checkRouteHazardIntersection(detourResult.geometry, hazardZones);
      if (severityScore[detourHazardCheck.highestSeverity] < severityScore[selectedEvaluation.hazardCheck.highestSeverity]) {
        selectedEvaluation = {
          candidate: selectedEvaluation.candidate,
          path: {
            distanceMeters: detourResult.distanceMeters,
            durationSeconds: detourResult.durationSeconds,
            geometry: detourResult.geometry,
            geoJsonCoordinates: detourResult.geoJsonCoordinates,
            turnByTurnSteps: detourResult.turnByTurnSteps || [],
          },
          hazardCheck: detourHazardCheck,
          isAlternative: true,
        };
        isDetour = true;
        detourReason = 'Rute jalan memutar (detour) diaktifkan otomatis untuk menjauhi zona bahaya primer.';
      }
    }
  }

  if (selectedEvaluation.isAlternative && !isDetour) {
    isDetour = true;
    detourReason = 'Jalur alternatif OSRM dipilih secara otomatis karena memiliki tingkat keterpaparan bahaya paling rendah.';
  }

  // 5. Road Impedance Multiplier
  // Dalam kondisi darurat bencana, kecepatan jalan kaki berkurang akibat puing dan kepadatan warga
  let impedanceMultiplier = 1.0;
  if (selectedEvaluation.hazardCheck.highestSeverity === 'critical') {
    impedanceMultiplier = 1.75;
  } else if (selectedEvaluation.hazardCheck.highestSeverity === 'high') {
    impedanceMultiplier = 1.5;
  } else if (isDetour) {
    impedanceMultiplier = 1.25;
  }

  const adjustedDurationSeconds = Math.round(selectedEvaluation.path.durationSeconds * impedanceMultiplier);

  // 6. Capacity Allocation & Secondary TES Spillover
  let capacityAllocation: CapacityAllocationResult | undefined;
  const chosenDest = selectedEvaluation.candidate;
  const targetPop = affectedPopulation || Math.round(chosenDest.capacity ? chosenDest.capacity * 1.2 : 3500);

  if (chosenDest.capacity && chosenDest.capacity > 0) {
    const primaryCap = chosenDest.capacity;
    const occupancyRate = Math.min(200, Math.round((targetPop / primaryCap) * 100));
    const isOver = targetPop > primaryCap;
    const spillover = isOver ? targetPop - primaryCap : 0;

    let secondaryTes: EvacuationDestination | undefined;
    let secondaryRouteGeo: [number, number][] | undefined;
    let secondaryDist: number | undefined;
    let secondaryDur: number | undefined;

    // Jika terjadi overload kapasitas, cari TES kedua terdekat
    if (isOver && candidates.length > 1) {
      const secondCandidate = candidates.find((c) => c.id !== chosenDest.id) || candidates[1];
      secondaryTes = secondCandidate;

      // Ambil geometri rute ke TES 2
      const secondRouteEval = validEvaluations.find((v) => v.candidate.id === secondCandidate.id);
      if (secondRouteEval?.routeRes.geometry) {
        secondaryRouteGeo = secondRouteEval.routeRes.geometry;
        secondaryDist = secondRouteEval.routeRes.distanceMeters;
        secondaryDur = secondRouteEval.routeRes.durationSeconds;
      }
    }

    capacityAllocation = {
      totalEvacuees: targetPop,
      primaryTesCapacity: primaryCap,
      primaryCapacity: primaryCap,
      primaryTesOccupancyRate: occupancyRate,
      occupancyPercentage: occupancyRate,
      allocatedCount: Math.min(targetPop, primaryCap),
      isOverCapacity: isOver,
      spilloverCount: spillover,
      secondaryAllocatedCount: spillover,
      secondaryTes,
      secondaryDestination: secondaryTes,
      secondaryRouteGeometry: secondaryRouteGeo,
      secondaryDistanceMeters: secondaryDist,
      secondaryDurationSeconds: secondaryDur,
    };
  }

  return {
    success: true,
    origin,
    destination: chosenDest,
    distanceMeters: selectedEvaluation.path.distanceMeters,
    durationSeconds: adjustedDurationSeconds,
    geometry: selectedEvaluation.path.geometry,
    geoJsonCoordinates: selectedEvaluation.path.geoJsonCoordinates,
    hazardCheckStatus: selectedEvaluation.hazardCheck.status,
    hazardCheckNote: selectedEvaluation.hazardCheck.note,
    hazardSeverity: selectedEvaluation.hazardCheck.highestSeverity,
    hazardDetails: selectedEvaluation.hazardCheck.intersectingZoneNames,
    isDetourRoute: isDetour,
    detourReason,
    impedanceMultiplier: impedanceMultiplier > 1.0 ? impedanceMultiplier : undefined,
    turnByTurnSteps: selectedEvaluation.path.turnByTurnSteps,
    capacityAllocation,
    provider: isDetour
      ? 'OSRM / OpenStreetMap (Hazard Avoidance Routing)'
      : 'OSRM / OpenStreetMap (Pedestrian Network)',
    profile: 'foot',
    calculatedAt: new Date().toISOString(),
  };
}

/**
 * Computes a bypass detour route by calculating a safe intermediate waypoint outside the hazard polygon.
 */
async function tryComputeDetourRoute(
  origin: RouteOrigin,
  destination: EvacuationDestination,
  hazardZones: HazardZonePolygon[]
) {
  try {
    const midLat = (origin.lat + destination.lat) / 2;
    const midLng = (origin.lng + destination.lng) / 2;

    // Offset waypoint perpendicular to the direct vector
    const dLat = destination.lat - origin.lat;
    const dLng = destination.lng - origin.lng;
    const perpLat = -dLng * 0.45;
    const perpLng = dLat * 0.45;

    const detourLat = midLat + perpLat;
    const detourLng = midLng + perpLng;

    const detourRes = await fetchOSRMRoute(
      { lat: origin.lat, lng: origin.lng },
      { lat: destination.lat, lng: destination.lng },
      'foot',
      6000,
      [{ lat: detourLat, lng: detourLng }]
    );

    if (detourRes.success && detourRes.geometry && detourRes.geometry.length >= 2) {
      return {
        distanceMeters: detourRes.distanceMeters ?? 0,
        durationSeconds: detourRes.durationSeconds ?? 0,
        geometry: detourRes.geometry,
        geoJsonCoordinates: detourRes.geoJsonCoordinates ?? [],
        turnByTurnSteps: detourRes.turnByTurnSteps ?? [],
      };
    }
  } catch {
    // Graceful fallback
  }

  return null;
}

/**
 * Synthesizes a realistic road corridor path in-memory when network is unavailable and no cache exists.
 */
function synthesizeOfflineCorridor(origin: RouteOrigin, destination: EvacuationDestination) {
  const stepsCount = 6;
  const geometry: [number, number][] = [];
  const geoJsonCoordinates: [number, number][] = [];

  for (let i = 0; i <= stepsCount; i++) {
    const t = i / stepsCount;
    // Introduce gentle curve representing terrestrial road alignment
    const curveOffset = Math.sin(t * Math.PI) * 0.0035;
    const lat = parseFloat((origin.lat + (destination.lat - origin.lat) * t + curveOffset).toFixed(5));
    const lng = parseFloat((origin.lng + (destination.lng - origin.lng) * t + curveOffset).toFixed(5));
    geometry.push([lat, lng]);
    geoJsonCoordinates.push([lng, lat]);
  }

  const directDistKm = calculateHaversineDistanceKm(origin.lat, origin.lng, destination.lat, destination.lng);
  const roadDistMeters = Math.round(directDistKm * 1350); // Factor 1.35x for actual road winding
  const durationSec = Math.round((roadDistMeters / 1000 / 4.5) * 3600); // ~4.5 km/h pedestrian speed

  const steps: TurnByTurnStep[] = [
    {
      instruction: `Mulai evakuasi mandiri dari ${origin.name} menyusuri koridor jalan utama`,
      distanceMeters: Math.round(roadDistMeters * 0.3),
      durationSeconds: Math.round(durationSec * 0.3),
      streetName: 'Koridor Jalan Utama',
      maneuverType: 'depart',
    },
    {
      instruction: `Lanjutkan bergerak ke arah ${destination.name}`,
      distanceMeters: Math.round(roadDistMeters * 0.5),
      durationSeconds: Math.round(durationSec * 0.5),
      streetName: 'Jalan Penghubung Evakuasi',
      maneuverType: 'continue',
    },
    {
      instruction: `Tiba di ${destination.name}`,
      distanceMeters: Math.round(roadDistMeters * 0.2),
      durationSeconds: Math.round(durationSec * 0.2),
      streetName: destination.name,
      maneuverType: 'arrive',
    },
  ];

  return {
    geometry,
    geoJsonCoordinates,
    distanceMeters: roadDistMeters,
    durationSeconds: durationSec,
    steps,
  };
}
