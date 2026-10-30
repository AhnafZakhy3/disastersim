export type DisasterType = 'standby' | 'volcano' | 'tsunami';

export interface EvacuationShelter {
  id: string;
  name: string;
  lat: number;
  lng: number;
  capacity?: number;
  elevationM?: number;
  distanceKm?: number;
  district?: string;
}

export type MountainCategory = 'active_volcano' | 'dormant_volcano' | 'non_volcano';

export interface LaharValley {
  name: string;
  compassDirection: string;
  description: string;
}

export interface VolcanoPreset {
  id: string;
  name: string;
  province: string;
  islandGroup: 'Sumatera' | 'Jawa' | 'Bali-NusaTenggara' | 'Sulawesi' | 'Maluku-Papua' | 'Kalimantan' | 'Maluku' | 'Papua';
  category: MountainCategory;
  lat: number;
  lng: number;
  elevationM: number;
  baseKRB3RadiusKm: number; // radius dasar bahaya tinggi (awan panas)
  baseKRB2RadiusKm: number; // radius dasar bahaya sedang
  baseKRB1RadiusKm: number; // radius dasar waspada
  defaultVEI: number;
  type: string;
  historicalAnalogy: string;
  laharValleys: LaharValley[];
  shelters: EvacuationShelter[];
}

export type CityThreatStatus = 'safe' | 'advisory' | 'warning' | 'danger' | 'impacted';

export interface EvaluatedCity {
  id: string;
  cityName: string;
  type: 'Kota' | 'Kabupaten';
  province: string;
  islandGroup: 'Sumatera' | 'Jawa' | 'Bali-NusaTenggara' | 'Kalimantan' | 'Sulawesi' | 'Maluku' | 'Papua';
  lat: number;
  lng: number;
  population: number;
  isCoastal: boolean;
  status: CityThreatStatus;
  statusLabel: string;
  distanceKm: number;
  bearingDeg?: number;
  etaMinutes?: number;
  waveHeightM?: number;
  ashFallCategory?: 'none' | 'light' | 'moderate' | 'heavy' | 'pyroclastic';
}

export interface CoastalDistrictImpact {
  districtName: string;
  province: string;
  distanceKm: number;
  etaMinutes: number;
  estimatedWaveHeightM: number;
  warningLevel: 'AWAS' | 'SIAGA' | 'WASPADA';
  coordinates: [number, number]; // [lat, lng]
  statusAtCurrentTime?: 'MENUNGGU' | 'EVAKUASI' | 'TERDAMPAK';
  waveArrivalCountdownMinutes?: number;
}

export interface ImpactedCity {
  id: string;
  cityName: string;
  province: string;
  islandGroup: string;
  lat: number;
  lng: number;
  population: number;
  distanceKm: number;
  bearingDeg?: number;
  impactType:
    | 'KRB_III'
    | 'KRB_II'
    | 'KRB_I'
    | 'ABU_LEBAT'
    | 'ABU_SEDANG'
    | 'ABU_RINGAN'
    | 'TSUNAMI_AWAS'
    | 'TSUNAMI_SIAGA'
    | 'TSUNAMI_WASPADA';
  severityLevel: 'danger' | 'warning' | 'alert' | 'info';
  statusLabel: string;
  details: string;
  etaMinutes?: number;
  waveHeightM?: number;
}

export interface TsunamiFaultPreset {
  id: string;
  name: string;
  region: string;
  lat: number;
  lng: number;
  defaultMw: number;
  defaultDepthKm: number;
  avgOceanDepthM: number;
  nearestCoastDistanceKm: number;
  faultStrikeDeg: number; // Orientasi patahan (derajat)
  ruptureLengthKm: number;
  coastlinePolyline: [number, number][]; // Garis pantai riil yang terdampak
  description: string;
  coastalDistricts: CoastalDistrictImpact[];
  safePoints: EvacuationShelter[];
}

export interface VolcanoScenario {
  volcanoId: string;
  isCustom: boolean;
  customLocation?: {
    lat: number;
    lng: number;
    name?: string;
  };
  vei: number;
  windDirectionDeg: number; // 0-360 degrees
  windSpeedKmh: number;
  customColumnHeightKm?: number;
}

export interface TsunamiScenario {
  faultId: string;
  isCustom: boolean;
  customLocation?: {
    lat: number;
    lng: number;
    name?: string;
  };
  mw: number;
  depthKm: number;
  oceanDepthM?: number;
}

export interface AshIsopachTier {
  id: string;
  label: string;
  thicknessDesc: string;
  maxDistanceKm: number;
  polygon: [number, number][]; // [lat, lng]
  fillColor: string;
  borderColor: string;
}

export interface VolcanoSimulationResult {
  krb3RadiusKm: number;
  krb2RadiusKm: number;
  krb1RadiusKm: number;
  columnHeightKm: number;
  tephraVolumeKm3: number;
  ashPlumePolygon: [number, number][]; // [lat, lng] array
  ashPlumeLengthKm: number;
  ashIsopachTiers: AshIsopachTier[];
  etaPyroclasticMinutes: number;
  pyroclasticSpeedKmh: number;
  affectedPopulation: number;
  affectedFacilities: {
    health: number;
    schools: number;
    roads: number;
  };
  laharValleys: LaharValley[];
  recommendedShelters: EvacuationShelter[];
  bnpbInstructions: string[];
  alertLevel: 'LEVEL IV (AWAS)' | 'LEVEL III (SIAGA)' | 'LEVEL II (WASPADA)' | 'LEVEL I (NORMAL)';
  alertColor: string;
  impactedCities: ImpactedCity[];
  allEvaluatedCities: EvaluatedCity[];
}

export interface TsunamiIsochrone {
  timeMinutes: number;
  radiusKm: number;
  waveHeightM: number;
}

export interface TsunamiSimulationResult {
  initialWaveHeightM: number;
  deepWaterSpeedKmh: number;
  coastWaveHeightM: number;
  etaCoastMinutes: number;
  inundationDistanceM: number;
  bmkgStatus: 'AWAS' | 'SIAGA' | 'WASPADA' | 'NORMAL';
  bmkgColor: string;
  bmkgDescription: string;
  isochroneRings: TsunamiIsochrone[];
  districtImpacts: CoastalDistrictImpact[];
  impactedCities: ImpactedCity[];
  allEvaluatedCities: EvaluatedCity[];
  affectedPopulation: number;
  affectedFacilities: {
    ports: number;
    coastalRoadsKm: number;
    settlements: number;
  };
  recommendedShelters: EvacuationShelter[];
  bnpbInstructions: string[];
}
