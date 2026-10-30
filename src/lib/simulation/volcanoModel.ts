import {
  VolcanoScenario,
  VolcanoSimulationResult,
  EvacuationShelter,
  AshIsopachTier,
  ImpactedCity,
  EvaluatedCity,
} from '@/types/disaster';
import {
  calculateHaversineDistanceKm,
  calculateBearingDeg,
  createWedgeSectorPolygon,
} from '@/lib/geoUtils';
import { sanitizeNumeric } from '@/lib/sanitize';
import { INDONESIA_VOLCANOES } from '@/data/volcanoes';
import { INDONESIA_CITIES } from '@/data/indonesiaCities';

interface VEISpec {
  name: string;
  columnHeightKm: number;
  tephraVolumeKm3: number;
  radiusMultiplier: number;
  flowSpeedKmh: number;
  alertLevel: 'LEVEL IV (AWAS)' | 'LEVEL III (SIAGA)' | 'LEVEL II (WASPADA)' | 'LEVEL I (NORMAL)';
  alertColor: string;
}

const VEI_SPECS: Record<number, VEISpec> = {
  1: {
    name: 'Efusif / Lemah',
    columnHeightKm: 1.2,
    tephraVolumeKm3: 0.0001,
    radiusMultiplier: 0.45,
    flowSpeedKmh: 45,
    alertLevel: 'LEVEL I (NORMAL)',
    alertColor: '#10B981',
  },
  2: {
    name: 'Eksplosif Sedang (Strombolian)',
    columnHeightKm: 4.5,
    tephraVolumeKm3: 0.005,
    radiusMultiplier: 0.75,
    flowSpeedKmh: 55,
    alertLevel: 'LEVEL II (WASPADA)',
    alertColor: '#EAB308',
  },
  3: {
    name: 'Eksplosif Kuat (Vulkanian)',
    columnHeightKm: 9.5,
    tephraVolumeKm3: 0.035,
    radiusMultiplier: 1.1,
    flowSpeedKmh: 75,
    alertLevel: 'LEVEL III (SIAGA)',
    alertColor: '#F97316',
  },
  4: {
    name: 'Paroksismal (Sub-Plinian / Merapi 2010)',
    columnHeightKm: 17.5,
    tephraVolumeKm3: 0.25,
    radiusMultiplier: 1.85,
    flowSpeedKmh: 90,
    alertLevel: 'LEVEL IV (AWAS)',
    alertColor: '#EF4444',
  },
  5: {
    name: 'Sangat Dahsyat (Plinian / Agung 1963)',
    columnHeightKm: 26.0,
    tephraVolumeKm3: 1.5,
    radiusMultiplier: 2.7,
    flowSpeedKmh: 110,
    alertLevel: 'LEVEL IV (AWAS)',
    alertColor: '#DC2626',
  },
  6: {
    name: 'Kolosal (Krakatau 1883)',
    columnHeightKm: 36.0,
    tephraVolumeKm3: 18.0,
    radiusMultiplier: 4.0,
    flowSpeedKmh: 135,
    alertLevel: 'LEVEL IV (AWAS)',
    alertColor: '#991B1B',
  },
  7: {
    name: 'Super-Erupsi (Tambora 1815)',
    columnHeightKm: 46.0,
    tephraVolumeKm3: 140.0,
    radiusMultiplier: 5.5,
    flowSpeedKmh: 165,
    alertLevel: 'LEVEL IV (AWAS)',
    alertColor: '#7F1D1D',
  },
  8: {
    name: 'Mega-Kolosal / Supervulkan (Toba ~74.000 BP)',
    columnHeightKm: 55.0,
    tephraVolumeKm3: 2800.0,
    radiusMultiplier: 7.5,
    flowSpeedKmh: 195,
    alertLevel: 'LEVEL IV (AWAS)',
    alertColor: '#450A0A',
  },
};

/**
 * Calculates volcano hazard impact zones, ash plume isopachs, and tactical metrics.
 */
export function simulateVolcanoEruption(
  scenario: VolcanoScenario
): VolcanoSimulationResult {
  const selectedVolcano = INDONESIA_VOLCANOES.find(
    (v) => v.id === scenario.volcanoId
  );

  // Non-volcanic peak handling
  if (selectedVolcano?.category === 'non_volcano' && !scenario.isCustom) {
    return {
      krb3RadiusKm: 0,
      krb2RadiusKm: 0,
      krb1RadiusKm: 0,
      columnHeightKm: 0,
      tephraVolumeKm3: 0,
      ashPlumePolygon: [],
      ashPlumeLengthKm: 0,
      ashIsopachTiers: [],
      etaPyroclasticMinutes: 0,
      pyroclasticSpeedKmh: 0,
      affectedPopulation: 0,
      affectedFacilities: { health: 0, schools: 0, roads: 0 },
      laharValleys: [],
      recommendedShelters: [],
      impactedCities: [],
      allEvaluatedCities: INDONESIA_CITIES.map((c) => ({
        id: c.id,
        cityName: c.name,
        type: c.type,
        province: c.province,
        islandGroup: c.islandGroup,
        lat: c.lat,
        lng: c.lng,
        population: c.population,
        isCoastal: c.isCoastal,
        distanceKm: Math.round(
          calculateHaversineDistanceKm(
            selectedVolcano.lat,
            selectedVolcano.lng,
            c.lat,
            c.lng
          )
        ),
        status: 'safe' as const,
        statusLabel: 'Aman (Non-Vulkanik)',
        ashFallCategory: 'none' as const,
      })),
      bnpbInstructions: [
        `${selectedVolcano.name} merupakan formasi pegunungan tektonik non-vulkanik.`,
        `Tidak memiliki kantong magma aktif dan 100% aman dari bahaya letusan awan panas, bom vulkanik, maupun hujan abu.`,
        `Aktivitas pendakian dan permukiman di sekitarnya tidak memerlukan evakuasi vulkanologi.`,
      ],
      alertLevel: 'LEVEL I (NORMAL)',
      alertColor: '#10B981',
    };
  }

  const rawLat = scenario.isCustom && scenario.customLocation
    ? scenario.customLocation.lat
    : selectedVolcano?.lat ?? -7.5407;

  const rawLng = scenario.isCustom && scenario.customLocation
    ? scenario.customLocation.lng
    : selectedVolcano?.lng ?? 110.4457;

  // Defensive sanitization of geographic coordinates
  const lat = sanitizeNumeric(rawLat, -12.0, 8.0, -7.5407);
  const lng = sanitizeNumeric(rawLng, 94.0, 142.0, 110.4457);

  const baseKRB3 = sanitizeNumeric(selectedVolcano?.baseKRB3RadiusKm, 0.5, 30.0, 5.0);

  const veiClamped = Math.round(sanitizeNumeric(scenario.vei, 1, 8, selectedVolcano?.defaultVEI || 3));
  const spec = VEI_SPECS[veiClamped] || VEI_SPECS[3];

  // Calculated radii
  const krb3RadiusKm = parseFloat((baseKRB3 * spec.radiusMultiplier).toFixed(1));
  const krb2RadiusKm = parseFloat((krb3RadiusKm * 1.7).toFixed(1));
  const krb1RadiusKm = parseFloat((krb3RadiusKm * 2.6).toFixed(1));

  // Column height
  const columnHeightKm = sanitizeNumeric(
    scenario.customColumnHeightKm ?? spec.columnHeightKm,
    0.5,
    60.0,
    spec.columnHeightKm
  );

  // Ash Plume calculation based on column height and wind speed
  const windSpeed = sanitizeNumeric(scenario.windSpeedKmh, 5, 250, 35);
  const rawWindDeg = sanitizeNumeric(scenario.windDirectionDeg, 0, 360, 225);
  const windDirectionDeg = ((rawWindDeg % 360) + 360) % 360;

  const basePlumeLengthKm = parseFloat(
    (columnHeightKm * 1.3 + windSpeed * 0.9).toFixed(1)
  );

  // Dynamic spread angle (higher wind makes narrower plume)
  const spreadAngleDeg = Math.max(30, Math.min(65, 75 - windSpeed * 0.4));

  // Master ash plume polygon
  const ashPlumePolygon = createWedgeSectorPolygon(
    lat,
    lng,
    basePlumeLengthKm,
    windDirectionDeg,
    spreadAngleDeg
  );

  // Tiered Isopach Ash Contours (USGS / PVMBG VONA standard)
  const ashIsopachTiers: AshIsopachTier[] = [
    {
      id: 'isopach-heavy',
      label: 'Zona Hujan Abu Lebat (> 5 cm)',
      thicknessDesc: 'Ketebalan abu > 5 cm: Risiko atap runtuh, jarak pandang < 5 meter, kelumpuhan jalan total.',
      maxDistanceKm: parseFloat((basePlumeLengthKm * 0.55).toFixed(1)),
      polygon: createWedgeSectorPolygon(lat, lng, basePlumeLengthKm * 0.55, windDirectionDeg, spreadAngleDeg * 0.85),
      fillColor: '#991B1B',
      borderColor: '#EF4444',
    },
    {
      id: 'isopach-medium',
      label: 'Zona Hujan Abu Sedang (1 - 5 cm)',
      thicknessDesc: 'Ketebalan abu 1-5 cm: Iritasi mata dan ISPA pernapasan parah, gangguan mesin transportasi.',
      maxDistanceKm: basePlumeLengthKm,
      polygon: ashPlumePolygon,
      fillColor: '#7C2D12',
      borderColor: '#F97316',
    },
    {
      id: 'isopach-light',
      label: 'Zona Sebaran Abu Ringan (< 1 cm)',
      thicknessDesc: 'Ketebalan abu < 1 cm: Lapisan debu halus, bahaya bagi penerbangan (VONA) dan kualitas udara.',
      maxDistanceKm: parseFloat((basePlumeLengthKm * 1.6).toFixed(1)),
      polygon: createWedgeSectorPolygon(lat, lng, basePlumeLengthKm * 1.6, windDirectionDeg, spreadAngleDeg * 1.25),
      fillColor: '#334155',
      borderColor: '#64748B',
    },
  ];

  // ETA pyroclastic density current to boundary of KRB III
  const pyroclasticSpeedKmh = spec.flowSpeedKmh;
  const etaPyroclasticMinutes = parseFloat(
    ((krb3RadiusKm / pyroclasticSpeedKmh) * 60).toFixed(1)
  );

  // Affected population estimation
  const isJava = Math.abs(lat - -7.5) < 3.0 && Math.abs(lng - 110.0) < 5.0;
  const popDensityPerKm2 = isJava ? 850 : 220;
  const areaKm2 = Math.PI * Math.pow(krb2RadiusKm, 2);
  const affectedPopulation = Math.round((areaKm2 * popDensityPerKm2) / 100) * 100;

  // Facility counts estimation
  const healthFacilities = Math.max(1, Math.round(krb3RadiusKm * 0.9));
  const schools = Math.max(3, Math.round(krb3RadiusKm * 3.2));
  const mainRoads = Math.max(1, Math.round(krb3RadiusKm * 0.4));

  // Shelters filter: recommend shelters outside KRB I
  let recommendedShelters: EvacuationShelter[] = [];
  if (selectedVolcano?.shelters) {
    recommendedShelters = selectedVolcano.shelters.filter((s) => {
      const dist = calculateHaversineDistanceKm(lat, lng, s.lat, s.lng);
      return dist > krb1RadiusKm;
    });

    if (recommendedShelters.length === 0) {
      recommendedShelters = selectedVolcano.shelters;
    }
  }

  // Lahar valleys
  const laharValleys = selectedVolcano?.laharValleys ?? [
    { name: 'Lembah Sungai Radial', compassDirection: 'Sektor Turunan Lereng', description: 'Daerah aliran banjir lahar dingin sekunder saat curah hujan tinggi' },
  ];

  // Official BNPB / PVMBG safety directives
  const bnpbInstructions: string[] = [
    `Kosongkan secara total seluruh permukiman di zona KRB III (radius ${krb3RadiusKm} km) dari kawah aktif.`,
    `Wajib gunakan masker pelindung partikulat (N95 / respirator) untuk mitigasi hujan abu vulkanik lebat hingga jarak ${basePlumeLengthKm} km ke arah sektor angin.`,
    `Masyarakat di sepanjang bantaran lembah sungai (${laharValleys.map(v => v.name).join(', ')}) dilarang beraktivitas dan wajib mewaspadai ancaman banjir lahar dingin di musim penghujan.`,
    `Segera arahkan pengungsi menuju Tempat Evakuasi Sementara (TES) di luar batas KRB I (jarak aman > ${krb1RadiusKm} km).`,
  ];

  // Impacted Cities & Comprehensive 514 Cities Evaluation across Indonesia
  const impactedCities: ImpactedCity[] = [];
  const allEvaluatedCities: EvaluatedCity[] = [];
  const maxSearchRadiusKm = Math.max(160, basePlumeLengthKm * 1.65);

  for (const city of INDONESIA_CITIES) {
    const dist = calculateHaversineDistanceKm(lat, lng, city.lat, city.lng);
    const bearing = calculateBearingDeg(lat, lng, city.lat, city.lng);
    let angleDiff = Math.abs(bearing - windDirectionDeg);
    if (angleDiff > 180) angleDiff = 360 - angleDiff;
    const inPlumeSector = angleDiff <= (spreadAngleDeg / 2) * 1.25;

    let impactType: ImpactedCity['impactType'] | null = null;
    let severityLevel: ImpactedCity['severityLevel'] = 'info';
    let statusLabel = '';
    let details = '';

    let cityThreat: EvaluatedCity['status'] = 'safe';
    let cityThreatLabel = 'Aman (Di Luar Jangkauan Letusan)';
    let ashCategory: EvaluatedCity['ashFallCategory'] = 'none';

    if (dist <= krb3RadiusKm) {
      impactType = 'KRB_III';
      severityLevel = 'danger';
      statusLabel = 'KRB III (Zona Bahaya Mutlak)';
      details = `Jarak ${dist.toFixed(1)} km dari kawah aktif. Ancaman langsung awan panas guguran, lontaran batu pijar, dan gas beracun.`;
      cityThreat = 'danger';
      cityThreatLabel = 'KRB III (Bahaya Mutlak)';
      ashCategory = 'pyroclastic';
    } else if (dist <= krb2RadiusKm) {
      impactType = 'KRB_II';
      severityLevel = 'danger';
      statusLabel = 'KRB II (Zona Bahaya Sedang)';
      details = `Jarak ${dist.toFixed(1)} km. Ancaman aliran lava pijar, lontaran batu sedang, dan hujan abu lebat.`;
      cityThreat = 'danger';
      cityThreatLabel = 'KRB II (Bahaya Sedang)';
      ashCategory = 'heavy';
    } else if (dist <= krb1RadiusKm) {
      impactType = 'KRB_I';
      severityLevel = 'warning';
      statusLabel = 'KRB I (Zona Bahaya Lahar Dingin)';
      details = `Jarak ${dist.toFixed(1)} km. Ancaman aliran lahar dingin di lembah sungai serta hujan abu lebat.`;
      cityThreat = 'warning';
      cityThreatLabel = 'KRB I (Waspada Lahar)';
      ashCategory = 'moderate';
    } else if (inPlumeSector && dist <= basePlumeLengthKm * 0.55) {
      impactType = 'ABU_LEBAT';
      severityLevel = 'warning';
      statusLabel = 'Hujan Abu Lebat (> 5 cm)';
      details = `Sektor angin searah. Ketebalan abu > 5 cm berpotensi meruntuhkan atap dan mematikan jarak pandang.`;
      cityThreat = 'warning';
      cityThreatLabel = 'Hujan Abu Lebat (> 5 cm)';
      ashCategory = 'heavy';
    } else if (inPlumeSector && dist <= basePlumeLengthKm) {
      impactType = 'ABU_SEDANG';
      severityLevel = 'alert';
      statusLabel = 'Hujan Abu Sedang (1 - 5 cm)';
      details = `Sektor angin searah. Debu vulkanik mengganggu pernapasan (ISPA) dan mesin kendaraan.`;
      cityThreat = 'advisory';
      cityThreatLabel = 'Hujan Abu Sedang (1-5 cm)';
      ashCategory = 'moderate';
    } else if (inPlumeSector && dist <= basePlumeLengthKm * 1.6) {
      impactType = 'ABU_RINGAN';
      severityLevel = 'info';
      statusLabel = 'Sebaran Abu Ringan (< 1 cm)';
      details = `Sektor angin searah. Hujan abu tipis melayang di udara, bahaya bagi lalu lintas udara.`;
      cityThreat = 'advisory';
      cityThreatLabel = 'Sebaran Abu Ringan (< 1 cm)';
      ashCategory = 'light';
    }

    if (impactType && dist <= maxSearchRadiusKm) {
      impactedCities.push({
        id: `impact-${city.id}`,
        cityName: city.name,
        province: city.province,
        islandGroup: city.islandGroup,
        lat: city.lat,
        lng: city.lng,
        population: city.population,
        distanceKm: parseFloat(dist.toFixed(1)),
        bearingDeg: parseFloat(bearing.toFixed(1)),
        impactType,
        severityLevel,
        statusLabel,
        details,
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
      isCoastal: city.isCoastal,
      status: cityThreat,
      statusLabel: cityThreatLabel,
      distanceKm: parseFloat(dist.toFixed(1)),
      bearingDeg: parseFloat(bearing.toFixed(1)),
      ashFallCategory: ashCategory,
    });
  }

  // Sort impactedCities: danger first, then warning, then alert, then info, then by distance
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
    return a.distanceKm - b.distanceKm;
  });

  // Sort allEvaluatedCities: threatened cities first, then ascending distance
  const threatRank: Record<string, number> = {
    danger: 0,
    warning: 1,
    advisory: 2,
    safe: 3,
  };
  allEvaluatedCities.sort((a, b) => {
    const rankA = threatRank[a.status] ?? 99;
    const rankB = threatRank[b.status] ?? 99;
    if (rankA !== rankB) return rankA - rankB;
    return a.distanceKm - b.distanceKm;
  });

  return {
    krb3RadiusKm,
    krb2RadiusKm,
    krb1RadiusKm,
    columnHeightKm,
    tephraVolumeKm3: spec.tephraVolumeKm3,
    ashPlumePolygon,
    ashPlumeLengthKm: basePlumeLengthKm,
    ashIsopachTiers,
    etaPyroclasticMinutes,
    pyroclasticSpeedKmh,
    affectedPopulation,
    affectedFacilities: {
      health: healthFacilities,
      schools,
      roads: mainRoads,
    },
    laharValleys,
    recommendedShelters,
    impactedCities,
    allEvaluatedCities,
    bnpbInstructions,
    alertLevel: spec.alertLevel,
    alertColor: spec.alertColor,
  };
}
