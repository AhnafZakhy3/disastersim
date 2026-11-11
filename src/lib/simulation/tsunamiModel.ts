import {
  TsunamiScenario,
  TsunamiSimulationResult,
  TsunamiIsochrone,
  CoastalDistrictImpact,
  EvacuationShelter,
  ImpactedCity,
  EvaluatedCity,
} from '@/types/disaster';
import {
  INDONESIA_TSUNAMI_FAULTS,
  INDONESIA_COASTAL_REFERENCE_HUBS,
} from '@/data/tsunamiFaults';
import {
  calculateHaversineDistanceKm,
  calculateBearingDeg,
  isLineOccludedByLand,
} from '@/lib/geoUtils';
import { sanitizeNumeric } from '@/lib/sanitize';
import { INDONESIA_CITIES } from '@/data/indonesiaCities';

const G_ACCELERATION = 9.81; // m/s^2

/**
 * Calculates tsunami wave propagation, arrival time, coastal amplification, and BMKG alert status.
 */
export function simulateTsunamiImpact(
  scenario: TsunamiScenario,
  currentTimeMinutes: number = 0
): TsunamiSimulationResult {
  const selectedFault = INDONESIA_TSUNAMI_FAULTS.find(
    (f) => f.id === scenario.faultId
  ) || INDONESIA_TSUNAMI_FAULTS[0];

  const safeTimeMinutes = sanitizeNumeric(currentTimeMinutes, 0, 360, 0);

  const mwClamped = sanitizeNumeric(scenario.mw, 6.0, 9.5, selectedFault?.defaultMw ?? 8.0);
  const depthClamped = sanitizeNumeric(scenario.depthKm, 5, 100, selectedFault?.defaultDepthKm ?? 20);

  const rawOceanDepth = scenario.oceanDepthM ?? selectedFault?.avgOceanDepthM ?? 3800;
  const oceanDepthM = sanitizeNumeric(rawOceanDepth, 50, 11000, 3800);

  // Deep water wave propagation velocity: c = sqrt(g * d) (m/s) -> km/h
  const waveSpeedMps = Math.sqrt(G_ACCELERATION * oceanDepthM);
  const deepWaterSpeedKmh = Math.max(50, parseFloat(((waveSpeedMps * 3600) / 1000).toFixed(0)));

  // Initial wave height at epicenter (Papazachos empirical formulation)
  // log10(H0) = 0.55 * Mw - 0.005 * Depth - 3.85
  const logH0 = 0.55 * mwClamped - 0.005 * depthClamped - 3.85;
  const initialWaveHeightM = parseFloat(
    Math.max(0.2, Math.pow(10, logH0)).toFixed(2)
  );

  // Determine true distance to nearest coastline
  let coastDistanceKm = sanitizeNumeric(selectedFault.nearestCoastDistanceKm, 5, 1500, 80);
  let customRecommendedShelters: EvacuationShelter[] = [];
  let districtImpacts: CoastalDistrictImpact[] = [];

  if (scenario.isCustom && scenario.customLocation) {
    const rawEpicenterLat = scenario.customLocation.lat;
    const rawEpicenterLng = scenario.customLocation.lng;
    const epicenterLat = sanitizeNumeric(rawEpicenterLat, -12.0, 8.0, -9.0);
    const epicenterLng = sanitizeNumeric(rawEpicenterLng, 94.0, 142.0, 110.0);

    // Find authentic Indonesian coastal regencies with direct ocean path (NOT occluded by land)
    const allHubsWithOcclusion = INDONESIA_COASTAL_REFERENCE_HUBS.map((hub) => {
      const dist = calculateHaversineDistanceKm(epicenterLat, epicenterLng, hub.lat, hub.lng);
      const occlusion = isLineOccludedByLand(epicenterLat, epicenterLng, hub.lat, hub.lng);
      return { ...hub, distKm: dist, isOccluded: occlusion.isOccluded };
    });

    const unoccludedHubs = allHubsWithOcclusion
      .filter((h) => !h.isOccluded)
      .sort((a, b) => a.distKm - b.distKm);

    // Pick top 5 closest unoccluded coastal regencies (or fallback if in very enclosed bay)
    const closestHubs = (
      unoccludedHubs.length > 0
        ? unoccludedHubs
        : allHubsWithOcclusion.sort((a, b) => a.distKm - b.distKm)
    ).slice(0, 5);
    coastDistanceKm = Math.max(10, Math.round(closestHubs[0]?.distKm ?? 80));

    // Calculate dynamic impacts for each real coastal regency
    districtImpacts = closestHubs.map((hub, idx) => {
      const eta = Math.max(3, Math.round((hub.distKm / deepWaterSpeedKmh) * 60));
      // Shallow water amplification factor
      const shallowDepth = 15;
      const amp = Math.pow(oceanDepthM / shallowDepth, 0.25);
      const waveDecay = Math.sqrt(35 / Math.max(35, hub.distKm));
      const estHeight = parseFloat((initialWaveHeightM * amp * 0.72 * waveDecay * (idx === 0 ? 1.0 : 0.85)).toFixed(1));

      let warningLevel: 'AWAS' | 'SIAGA' | 'WASPADA' = 'WASPADA';
      if (estHeight >= 3.0) warningLevel = 'AWAS';
      else if (estHeight >= 0.5) warningLevel = 'SIAGA';

      const countdown = Math.max(0, eta - safeTimeMinutes);
      let statusAtCurrentTime: 'MENUNGGU' | 'EVAKUASI' | 'TERDAMPAK' = 'MENUNGGU';
      if (safeTimeMinutes >= eta) {
        statusAtCurrentTime = 'TERDAMPAK';
      } else if (countdown <= 15) {
        statusAtCurrentTime = 'EVAKUASI';
      }

      return {
        districtName: hub.districtName,
        province: hub.province,
        distanceKm: Math.round(hub.distKm),
        etaMinutes: eta,
        estimatedWaveHeightM: Math.max(0.3, estHeight),
        warningLevel,
        coordinates: [hub.lat, hub.lng] as [number, number],
        statusAtCurrentTime,
        waveArrivalCountdownMinutes: countdown,
      };
    });

    // Skenario kustom tidak menghasilkan shelter sintetis offset.
    // Hanya shelter yang diverifikasi pada pangkalan data resmi yang dapat digunakan.
    customRecommendedShelters = [];
  } else {
    // Preset fault: Scale wave height based on scenario Mw compared to preset default
    districtImpacts = selectedFault.coastalDistricts.map((d) => {
      const mwDelta = mwClamped - selectedFault.defaultMw;
      const scaleMultiplier = Math.pow(10, 0.45 * mwDelta);
      const scaledHeight = parseFloat((d.estimatedWaveHeightM * scaleMultiplier).toFixed(1));
      const scaledEta = Math.max(3, Math.round((d.distanceKm / deepWaterSpeedKmh) * 60));

      let warningLevel: 'AWAS' | 'SIAGA' | 'WASPADA' = 'WASPADA';
      if (scaledHeight >= 3.0) warningLevel = 'AWAS';
      else if (scaledHeight >= 0.5) warningLevel = 'SIAGA';

      const countdown = Math.max(0, scaledEta - safeTimeMinutes);
      let statusAtCurrentTime: 'MENUNGGU' | 'EVAKUASI' | 'TERDAMPAK' = 'MENUNGGU';
      if (safeTimeMinutes >= scaledEta) {
        statusAtCurrentTime = 'TERDAMPAK';
      } else if (countdown <= 15) {
        statusAtCurrentTime = 'EVAKUASI';
      }

      return {
        ...d,
        etaMinutes: scaledEta,
        estimatedWaveHeightM: scaledHeight,
        warningLevel,
        statusAtCurrentTime,
        waveArrivalCountdownMinutes: countdown,
      };
    });
  }

  // ETA to nearest coastline in minutes: (Distance / Speed) * 60
  const etaCoastMinutes = parseFloat(
    ((coastDistanceKm / deepWaterSpeedKmh) * 60).toFixed(1)
  );

  // Green's Law coastal amplification: H_coast = H0 * (d_ocean / d_coast)^0.25
  const shallowCoastDepthM = 15; // standard average shallow bathymetry shelf
  const amplificationFactor = Math.pow(
    oceanDepthM / shallowCoastDepthM,
    0.25
  );
  const coastWaveHeightM = parseFloat(
    (initialWaveHeightM * amplificationFactor * 0.72).toFixed(1)
  );

  // Inland inundation distance (empirical penetration based on run-up height)
  // Linundation = H^1.35 * 110 meters
  const inundationDistanceM = Math.round(
    Math.pow(coastWaveHeightM, 1.35) * 110
  );

  // Simulated Hazard Warning Level (Internal model classification)
  let simulatedWarningLevel: 'AWAS' | 'SIAGA' | 'WASPADA' | 'NORMAL' = 'NORMAL';
  let warningColor = '#10B981';
  let warningDescription = 'Tidak ada ancaman tsunami terdeteksi.';

  if (coastWaveHeightM >= 3.0) {
    simulatedWarningLevel = 'AWAS';
    warningColor = '#EF4444';
    warningDescription =
      'Kategori bahaya simulasi AWAS: Disarankan evakuasi menyeluruh ke dataran tinggi (>20 mdpl) atau gedung TES terdekat.';
  } else if (coastWaveHeightM >= 0.5) {
    simulatedWarningLevel = 'SIAGA';
    warningColor = '#F97316';
    warningDescription =
      'Kategori bahaya simulasi SIAGA: Disarankan menjauhi pesisir pantai dan tepian sungai.';
  } else if (coastWaveHeightM > 0.1) {
    simulatedWarningLevel = 'WASPADA';
    warningColor = '#EAB308';
    warningDescription =
      'Kategori bahaya simulasi WASPADA: Pembatasan aktivitas di pantai dan kawasan muara.';
  }

  // Generate Isochrone Time Rings (T+5, T+10, T+20, T+30, T+45, T+60 minutes)
  const timeSteps = [5, 10, 20, 30, 45, 60];
  const isochroneRings: TsunamiIsochrone[] = timeSteps.map((timeM) => {
    const radiusKm = parseFloat(
      ((deepWaterSpeedKmh * (timeM / 60))).toFixed(1)
    );
    const currentWaveHeight = Math.max(
      0.15,
      parseFloat(
        (initialWaveHeightM * Math.sqrt(20 / Math.max(20, radiusKm))).toFixed(2)
      )
    );
    return {
      timeMinutes: timeM,
      radiusKm,
      waveHeightM: currentWaveHeight,
    };
  });

  // Estimated population in coastal danger zone
  const affectedLengthKm = Math.min(300, coastDistanceKm * 1.8);
  const affectedPopulation = Math.round(
    affectedLengthKm * (inundationDistanceM / 1000) * 1250
  );

  // Coastal infrastructure impact
  const ports = Math.max(1, Math.round(affectedLengthKm / 45));
  const coastalRoadsKm = Math.round(affectedLengthKm * 0.7);
  const settlements = Math.max(2, Math.round(affectedLengthKm / 20));

  // Panduan Prosedur Evakuasi Edukatif
  const bnpbInstructions: string[] = [
    `Perkiraan waktu tiba (Golden Time) gelombang tsunami pertama di pantai adalah ${etaCoastMinutes} MENIT. Segera tinggalkan pantai!`,
    `Tinggi potensi gelombang mencapai ${coastWaveHeightM} METER dengan status bahaya simulasi: ${simulatedWarningLevel}.`,
    `Evakuasi vertikal segera ke dataran tinggi (>20 mdpl) atau gedung Tempat Evakuasi Sementara (TES) terverifikasi.`,
    `Gelombang tsunami pertama bukan merupakan gelombang terbesar. Waspadai rangkaian gelombang susulan.`,
  ];

  // Comprehensive impacted cities & 514 cities evaluation across Indonesia
  const epicenterLat = scenario.isCustom && scenario.customLocation ? scenario.customLocation.lat : selectedFault.lat;
  const epicenterLng = scenario.isCustom && scenario.customLocation ? scenario.customLocation.lng : selectedFault.lng;

  const impactedCities: ImpactedCity[] = [];
  const allEvaluatedCities: EvaluatedCity[] = [];
  const maxTsunamiDistanceKm = Math.min(380, deepWaterSpeedKmh * (Math.max(30, safeTimeMinutes) / 60) + 60);

  for (const city of INDONESIA_CITIES) {
    const dist = calculateHaversineDistanceKm(epicenterLat, epicenterLng, city.lat, city.lng);
    const bearing = calculateBearingDeg(epicenterLat, epicenterLng, city.lat, city.lng);

    // Evaluasi Oklusi Geodesik Ray-Casting & Kompatibilitas Cekungan Badan Air
    const occlusion = isLineOccludedByLand(
      epicenterLat,
      epicenterLng,
      city.lat,
      city.lng,
      city.coastalFacing,
      city.islandGroup
    );
    const isOccluded = occlusion.isOccluded;

    if (!city.isCoastal) {
      allEvaluatedCities.push({
        id: city.id,
        cityName: city.name,
        type: city.type,
        province: city.province,
        islandGroup: city.islandGroup,
        lat: city.lat,
        lng: city.lng,
        population: city.population,
        isCoastal: false,
        status: 'safe',
        statusLabel: 'Aman (Bukan Daerah Pesisir)',
        distanceKm: parseFloat(dist.toFixed(1)),
        bearingDeg: parseFloat(bearing.toFixed(1)),
      });
      continue;
    }

    if (isOccluded || dist > 600) {
      allEvaluatedCities.push({
        id: city.id,
        cityName: city.name,
        type: city.type,
        province: city.province,
        islandGroup: city.islandGroup,
        lat: city.lat,
        lng: city.lng,
        population: city.population,
        isCoastal: true,
        status: 'safe',
        statusLabel: isOccluded
          ? `Aman (${occlusion.reason})`
          : 'Aman (Di Luar Jangkauan Gelombang)',
        distanceKm: parseFloat(dist.toFixed(1)),
        bearingDeg: parseFloat(bearing.toFixed(1)),
      });
      continue;
    }

    const eta = Math.max(3, Math.round((dist / deepWaterSpeedKmh) * 60));
    const waveDecay = Math.sqrt(40 / Math.max(40, dist));
    const estWaveHeight = parseFloat((coastWaveHeightM * waveDecay).toFixed(1));
    const isHit = safeTimeMinutes >= eta;

    let impactType: ImpactedCity['impactType'] = 'TSUNAMI_WASPADA';
    let severityLevel: ImpactedCity['severityLevel'] = 'alert';
    let statusLabel = 'SIMULASI: WASPADA (< 0.5m)';
    let cityThreat: EvaluatedCity['status'] = isHit ? 'impacted' : 'advisory';

    if (estWaveHeight >= 3.0) {
      impactType = 'TSUNAMI_AWAS';
      severityLevel = 'danger';
      statusLabel = 'SIMULASI: AWAS (> 3.0m)';
      cityThreat = isHit ? 'impacted' : 'danger';
    } else if (estWaveHeight >= 0.5) {
      impactType = 'TSUNAMI_SIAGA';
      severityLevel = 'warning';
      statusLabel = 'SIMULASI: SIAGA (0.5 - 3m)';
      cityThreat = isHit ? 'impacted' : 'warning';
    }

    const remainingTime = Math.max(0, eta - safeTimeMinutes);
    const details = isHit
      ? `Gelombang tsunami telah menerjang pesisir (~${estWaveHeight}m)! Wajib evakuasi vertikal ke >20 mdpl.`
      : `ETA tiba: ${eta} menit (sisa ${remainingTime}m). Estimasi tinggi gelombang pantai: ~${estWaveHeight}m.`;

    if (dist <= maxTsunamiDistanceKm) {
      impactedCities.push({
        id: `tsunami-impact-${city.id}`,
        cityName: city.name,
        province: city.province,
        islandGroup: city.islandGroup,
        lat: city.lat,
        lng: city.lng,
        population: city.population,
        distanceKm: parseFloat(dist.toFixed(1)),
        impactType,
        severityLevel,
        statusLabel,
        details,
        etaMinutes: eta,
        waveHeightM: estWaveHeight,
      });
    }

    allEvaluatedCities.push({
      id: city.id,
      cityName: city.name,
      type: city.type,
      province: city.province,
      islandGroup: city.islandGroup,
      lat: city.lat,
      lng: city.lng,
      population: city.population,
      isCoastal: true,
      status: cityThreat,
      statusLabel: isHit ? `TERDAMPAK (~${estWaveHeight}m)` : statusLabel.replace('BMKG: ', ''),
      distanceKm: parseFloat(dist.toFixed(1)),
      bearingDeg: parseFloat(bearing.toFixed(1)),
      etaMinutes: eta,
      waveHeightM: estWaveHeight,
    });
  }

  // Sort impactedCities by severity
  const severityRank: Record<string, number> = {
    danger: 0,
    warning: 1,
    alert: 2,
    info: 3,
  };
  impactedCities.sort((a, b) => {
    const rankA = severityRank[a.severityLevel] ?? 99;
    const rankB = severityRank[b.severityLevel] ?? 99;
    if (rankA !== rankB) return rankA - rankB;
    return (a.etaMinutes ?? 999) - (b.etaMinutes ?? 999);
  });

  // Sort allEvaluatedCities: impacted/threatened first, then by distance
  const threatRank: Record<string, number> = {
    impacted: 0,
    danger: 1,
    warning: 2,
    advisory: 3,
    safe: 4,
  };
  allEvaluatedCities.sort((a, b) => {
    const rankA = threatRank[a.status] ?? 99;
    const rankB = threatRank[b.status] ?? 99;
    if (rankA !== rankB) return rankA - rankB;
    return a.distanceKm - b.distanceKm;
  });

  return {
    initialWaveHeightM,
    deepWaterSpeedKmh,
    coastWaveHeightM,
    etaCoastMinutes,
    inundationDistanceM,
    simulatedWarningLevel,
    warningColor,
    warningDescription,
    bmkgStatus: simulatedWarningLevel,
    bmkgColor: warningColor,
    bmkgDescription: warningDescription,
    isochroneRings,
    districtImpacts,
    impactedCities,
    allEvaluatedCities,
    affectedPopulation,
    affectedFacilities: {
      ports,
      coastalRoadsKm,
      settlements,
    },
    recommendedShelters: scenario.isCustom ? customRecommendedShelters : (selectedFault?.safePoints ?? []),
    bnpbInstructions,
  };
}
