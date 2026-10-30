import { simulateVolcanoEruption } from './volcanoModel';
import { simulateTsunamiImpact } from './tsunamiModel';
import { INDONESIA_VOLCANOES } from '@/data/volcanoes';
import { INDONESIA_TSUNAMI_FAULTS } from '@/data/tsunamiFaults';
import { VolcanoScenario, TsunamiScenario } from '@/types/disaster';

export interface ScenarioTestResult {
  scenarioId: string;
  name: string;
  category: 'volcano' | 'tsunami' | 'custom_ocean' | 'custom_land';
  parametersDesc: string;
  passed: boolean;
  executionTimeMs: number;
  citiesEvaluatedCount: number;
  threatenedCitiesCount: number;
  summaryMetric: string;
  error?: string;
}

export interface BatchAuditReport {
  totalScenarios: number;
  passedCount: number;
  failedCount: number;
  passRatePercent: number;
  avgExecutionTimeMs: number;
  totalExecutionTimeMs: number;
  totalCitiesEvaluated: number;
  results: ScenarioTestResult[];
}

/**
 * Generates and executes 100 realistic, diverse geological hazard scenarios across Indonesia.
 */
export function run100ScenariosAudit(): BatchAuditReport {
  const results: ScenarioTestResult[] = [];
  const startTimeTotal = performance.now();

  let testIndex = 1;

  // =========================================================================
  // 1. 40 SKENARIO LETUSAN GUNUNG BERAPI (VEI 1 - 8, Arah Angin 0 - 360)
  // =========================================================================
  const testVolcanoes = INDONESIA_VOLCANOES.filter(v => v.category !== 'non_volcano').slice(0, 40);
  const windAngles = [0, 45, 90, 135, 180, 225, 270, 315];
  const windSpeeds = [15, 25, 35, 50, 70];

  testVolcanoes.forEach((volcano, idx) => {
    const vei = ((idx % 8) + 1); // Cycle through VEI 1 to 8
    const windDeg = windAngles[idx % windAngles.length];
    const windSpeed = windSpeeds[idx % windSpeeds.length];

    const scenario: VolcanoScenario = {
      volcanoId: volcano.id,
      isCustom: false,
      vei,
      windDirectionDeg: windDeg,
      windSpeedKmh: windSpeed,
    };

    const t0 = performance.now();
    let passed = true;
    let errorMsg: string | undefined;
    let res: ReturnType<typeof simulateVolcanoEruption> | null = null;

    try {
      res = simulateVolcanoEruption(scenario);

      // Strict validation assertions
      if (!res || !res.allEvaluatedCities || res.allEvaluatedCities.length !== 514) {
        passed = false;
        errorMsg = `Expected 514 evaluated cities, got ${res?.allEvaluatedCities?.length}`;
      } else if (isNaN(res.krb3RadiusKm) || isNaN(res.columnHeightKm) || res.krb3RadiusKm <= 0) {
        passed = false;
        errorMsg = `Invalid mathematical output: krb3=${res.krb3RadiusKm}, column=${res.columnHeightKm}`;
      }
    } catch (e: any) {
      passed = false;
      errorMsg = e.message || String(e);
    }
    const t1 = performance.now();

    const executionTimeMs = parseFloat((t1 - t0).toFixed(2));
    const threatened = res?.allEvaluatedCities.filter(c => c.status !== 'safe').length ?? 0;

    results.push({
      scenarioId: `TC-${String(testIndex).padStart(3, '0')}`,
      name: `Erupsi ${volcano.name} (${volcano.province})`,
      category: 'volcano',
      parametersDesc: `VEI ${vei} • Angin ${windDeg}° (${windSpeed} km/j) • Kolom ~${res?.columnHeightKm.toFixed(1)} km`,
      passed,
      executionTimeMs,
      citiesEvaluatedCount: res?.allEvaluatedCities.length ?? 0,
      threatenedCitiesCount: threatened,
      summaryMetric: `KRB III: ${res?.krb3RadiusKm.toFixed(1)} km, Abu: ${res?.ashPlumeLengthKm.toFixed(1)} km`,
      error: errorMsg,
    });
    testIndex++;
  });

  // =========================================================================
  // 2. 40 SKENARIO TSUNAMI MEGATHRUST & SESAR AKTIF (Mw 6.5 - 9.2, Waktu T+0 s.d T+60m)
  // =========================================================================
  const testFaults = INDONESIA_TSUNAMI_FAULTS;
  const testMw = [7.0, 7.5, 7.8, 8.2, 8.5, 8.7, 8.9, 9.2];
  const testDepths = [10, 15, 20, 25, 30, 40];
  const testTimes = [0, 5, 10, 15, 20, 25, 30, 45, 60];

  for (let i = 0; i < 40; i++) {
    const fault = testFaults[i % testFaults.length];
    const mw = testMw[i % testMw.length];
    const depth = testDepths[i % testDepths.length];
    const timeM = testTimes[i % testTimes.length];

    const scenario: TsunamiScenario = {
      faultId: fault.id,
      isCustom: false,
      mw,
      depthKm: depth,
    };

    const t0 = performance.now();
    let passed = true;
    let errorMsg: string | undefined;
    let res: ReturnType<typeof simulateTsunamiImpact> | null = null;

    try {
      res = simulateTsunamiImpact(scenario, timeM);

      // Assertions
      if (!res || !res.allEvaluatedCities || res.allEvaluatedCities.length !== 514) {
        passed = false;
        errorMsg = `Expected 514 evaluated cities, got ${res?.allEvaluatedCities?.length}`;
      } else if (isNaN(res.deepWaterSpeedKmh) || isNaN(res.coastWaveHeightM) || res.deepWaterSpeedKmh <= 0) {
        passed = false;
        errorMsg = `Invalid tsunami physics: speed=${res.deepWaterSpeedKmh}, wave=${res.coastWaveHeightM}`;
      }
    } catch (e: any) {
      passed = false;
      errorMsg = e.message || String(e);
    }
    const t1 = performance.now();

    const executionTimeMs = parseFloat((t1 - t0).toFixed(2));
    const threatened = res?.allEvaluatedCities.filter(c => c.status !== 'safe').length ?? 0;

    results.push({
      scenarioId: `TC-${String(testIndex).padStart(3, '0')}`,
      name: `Tsunami ${fault.name}`,
      category: 'tsunami',
      parametersDesc: `Mw ${mw} • Hiposenter ${depth} km • T+${timeM}m • Status ${res?.bmkgStatus}`,
      passed,
      executionTimeMs,
      citiesEvaluatedCount: res?.allEvaluatedCities.length ?? 0,
      threatenedCitiesCount: threatened,
      summaryMetric: `Kecepatan: ${res?.deepWaterSpeedKmh} km/j, Tinggi Pantai: ~${res?.coastWaveHeightM}m`,
      error: errorMsg,
    });
    testIndex++;
  }

  // =========================================================================
  // 3. 20 SKENARIO KOORDINAT KUSTOM (LEPAS PANTAI & DARATAN SE-INDONESIA)
  // =========================================================================
  const customCoordinates: Array<{ name: string; lat: number; lng: number; isOcean: boolean; mwOrVei: number }> = [
    // Ocean coords (Tsunami)
    { name: 'Laut Natuna Utara', lat: 4.25, lng: 108.50, isOcean: true, mwOrVei: 7.7 },
    { name: 'Selat Makassar Tengah', lat: -1.50, lng: 118.40, isOcean: true, mwOrVei: 8.1 },
    { name: 'Teluk Tomini Sulawesi', lat: -0.45, lng: 121.60, isOcean: true, mwOrVei: 7.9 },
    { name: 'Teluk Bone Sulawesi', lat: -3.85, lng: 120.90, isOcean: true, mwOrVei: 7.8 },
    { name: 'Laut Sawu Nusa Tenggara', lat: -9.50, lng: 122.50, isOcean: true, mwOrVei: 8.2 },
    { name: 'Laut Banda Selatan', lat: -5.80, lng: 129.50, isOcean: true, mwOrVei: 8.6 },
    { name: 'Laut Halmahera', lat: 0.80, lng: 129.20, isOcean: true, mwOrVei: 7.9 },
    { name: 'Laut Arafura Barat', lat: -7.50, lng: 135.20, isOcean: true, mwOrVei: 8.4 },
    { name: 'Samudra Pasifik Utara Biak', lat: -0.20, lng: 136.50, isOcean: true, mwOrVei: 8.5 },
    { name: 'Samudra Hindia Barat Bengkulu', lat: -4.50, lng: 101.20, isOcean: true, mwOrVei: 8.8 },
    { name: 'Laut Jawa Utara Semarang', lat: -6.20, lng: 110.50, isOcean: true, mwOrVei: 7.4 },
    { name: 'Selat Sunda Krakatau Zone', lat: -6.10, lng: 105.42, isOcean: true, mwOrVei: 7.9 },
    // Land coords (Volcano)
    { name: 'Daratan Kalimantan Tengah (Palangka)', lat: -2.20, lng: 113.90, isOcean: false, mwOrVei: 3 },
    { name: 'Pedalaman Papua Pegunungan (Jayawijaya)', lat: -4.10, lng: 139.00, isOcean: false, mwOrVei: 4 },
    { name: 'Daratan Pegunungan Muller Kalimantan', lat: -0.50, lng: 113.50, isOcean: false, mwOrVei: 3 },
    { name: 'Daratan Riau Pedalaman (Kampar)', lat: 0.30, lng: 101.00, isOcean: false, mwOrVei: 2 },
    { name: 'Daratan Sumatera Selatan (Lahat)', lat: -3.80, lng: 103.50, isOcean: false, mwOrVei: 4 },
    { name: 'Daratan Sulawesi Barat (Mamasa)', lat: -2.95, lng: 119.35, isOcean: false, mwOrVei: 3 },
    { name: 'Daratan Nusa Tenggara Timur (Sabu)', lat: -10.50, lng: 121.80, isOcean: false, mwOrVei: 2 },
    { name: 'Daratan Pulau Seram (Binaiya)', lat: -3.15, lng: 129.40, isOcean: false, mwOrVei: 3 },
  ];

  customCoordinates.forEach((coord) => {
    const t0 = performance.now();
    let passed = true;
    let errorMsg: string | undefined;
    let summary = '';
    let threatened = 0;
    let evaluatedCount = 0;

    try {
      if (coord.isOcean) {
        const scenario: TsunamiScenario = {
          faultId: 'custom-ocean',
          isCustom: true,
          customLocation: { lat: coord.lat, lng: coord.lng, name: coord.name },
          mw: coord.mwOrVei,
          depthKm: 20,
        };
        const res = simulateTsunamiImpact(scenario, 25);
        evaluatedCount = res.allEvaluatedCities.length;
        threatened = res.allEvaluatedCities.filter(c => c.status !== 'safe').length;
        summary = `Tsunami: Kecepatan ${res.deepWaterSpeedKmh} km/j, Status ${res.bmkgStatus}`;
        if (evaluatedCount !== 514 || isNaN(res.coastWaveHeightM)) {
          passed = false;
          errorMsg = `Invalid tsunami output for ${coord.name}`;
        }
      } else {
        const scenario: VolcanoScenario = {
          volcanoId: 'custom-land',
          isCustom: true,
          customLocation: { lat: coord.lat, lng: coord.lng, name: coord.name },
          vei: coord.mwOrVei,
          windDirectionDeg: 225,
          windSpeedKmh: 35,
        };
        const res = simulateVolcanoEruption(scenario);
        evaluatedCount = res.allEvaluatedCities.length;
        threatened = res.allEvaluatedCities.filter(c => c.status !== 'safe').length;
        summary = `Vulkanik: KRB III ${res.krb3RadiusKm.toFixed(1)} km, Abu ${res.ashPlumeLengthKm.toFixed(1)} km`;
        if (evaluatedCount !== 514 || isNaN(res.krb3RadiusKm)) {
          passed = false;
          errorMsg = `Invalid volcano output for ${coord.name}`;
        }
      }
    } catch (e: any) {
      passed = false;
      errorMsg = e.message || String(e);
    }
    const t1 = performance.now();

    results.push({
      scenarioId: `TC-${String(testIndex).padStart(3, '0')}`,
      name: `Kustom: ${coord.name}`,
      category: coord.isOcean ? 'custom_ocean' : 'custom_land',
      parametersDesc: `${coord.lat}°, ${coord.lng}° • ${coord.isOcean ? `Mw ${coord.mwOrVei}` : `VEI ${coord.mwOrVei}`}`,
      passed,
      executionTimeMs: parseFloat((t1 - t0).toFixed(2)),
      citiesEvaluatedCount: evaluatedCount,
      threatenedCitiesCount: threatened,
      summaryMetric: summary,
      error: errorMsg,
    });
    testIndex++;
  });

  const endTimeTotal = performance.now();
  const totalExecutionTimeMs = parseFloat((endTimeTotal - startTimeTotal).toFixed(2));
  const passedCount = results.filter(r => r.passed).length;
  const failedCount = results.length - passedCount;
  const avgExecutionTimeMs = parseFloat((totalExecutionTimeMs / results.length).toFixed(3));

  return {
    totalScenarios: results.length,
    passedCount,
    failedCount,
    passRatePercent: parseFloat(((passedCount / results.length) * 100).toFixed(1)),
    avgExecutionTimeMs,
    totalExecutionTimeMs,
    totalCitiesEvaluated: results.reduce((acc, r) => acc + r.citiesEvaluatedCount, 0),
    results,
  };
}
