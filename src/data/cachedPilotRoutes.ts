import { EvacuationRouteResult, TurnByTurnStep } from '@/lib/routing/routingTypes';
import { calculateHaversineDistanceKm } from '@/lib/geoUtils';
import { EvacuationDestination } from '@/types/disaster';

export interface CachedRouteFixture {
  id: string;
  name: string;
  originLat: number;
  originLng: number;
  destLat: number;
  destLng: number;
  distanceMeters: number;
  durationSeconds: number;
  geometry: [number, number][]; // [lat, lng] array
  geoJsonCoordinates: [number, number][]; // [lng, lat] array
  steps: TurnByTurnStep[];
}

/**
 * Pangkalan Data Geometri Rute Offline Terverifikasi (Pre-computed Fixtures)
 * Menjamin ketersediaan rute jalan kaki 100% saat simulasi offline / gangguan koneksi server publik OSRM.
 */
export const CACHED_PILOT_ROUTES: CachedRouteFixture[] = [
  // 1. Skenario Merapi (Kaliurang -> Barak Pengungsian Sleman / Glagaharjo)
  {
    id: 'route-merapi-kaliurang',
    name: 'Rute Evakuasi Merapi Sektor Selatan (Kaliurang ke Barak Pengungsian Glagaharjo)',
    originLat: -7.5950,
    originLng: 110.4280,
    destLat: -7.6380,
    destLng: 110.4210,
    distanceMeters: 5420,
    durationSeconds: 3900, // ~65 menit jalan kaki
    geometry: [
      [-7.5950, 110.4280],
      [-7.6010, 110.4275],
      [-7.6080, 110.4260],
      [-7.6150, 110.4240],
      [-7.6230, 110.4225],
      [-7.6310, 110.4218],
      [-7.6380, 110.4210],
    ],
    geoJsonCoordinates: [
      [110.4280, -7.5950],
      [110.4275, -7.6010],
      [110.4260, -7.6080],
      [110.4240, -7.6150],
      [110.4225, -7.6230],
      [110.4218, -7.6310],
      [110.4210, -7.6380],
    ],
    steps: [
      {
        instruction: 'Mulai berjalan ke arah selatan di Jalan Kaliurang',
        distanceMeters: 1200,
        durationSeconds: 860,
        streetName: 'Jl. Kaliurang',
        maneuverType: 'depart',
      },
      {
        instruction: 'Terus ikuti Jl. Boyong ke arah selatan',
        distanceMeters: 2100,
        durationSeconds: 1510,
        streetName: 'Jl. Boyong',
        maneuverType: 'continue',
      },
      {
        instruction: 'Belok kanan ke arah Barak Pengungsian Glagaharjo',
        distanceMeters: 2120,
        durationSeconds: 1530,
        streetName: 'Jl. Glagaharjo',
        maneuverType: 'turn',
        modifier: 'right',
      },
      {
        instruction: 'Tiba di Kompleks Barak Pengungsian Glagaharjo (Zona Aman)',
        distanceMeters: 0,
        durationSeconds: 0,
        streetName: 'Barak Glagaharjo',
        maneuverType: 'arrive',
      },
    ],
  },

  // 2. Skenario Tsunami DIY (Pantai Parangtritis -> Bukit Watugupit)
  {
    id: 'route-tsunami-parangtritis',
    name: 'Rute Evakuasi Tsunami Parangtritis ke Dataran Tinggi Watugupit',
    originLat: -8.0200,
    originLng: 110.3300,
    destLat: -8.0280,
    destLng: 110.3450,
    distanceMeters: 1950,
    durationSeconds: 1400, // ~23 menit jalan kaki
    geometry: [
      [-8.0200, 110.3300],
      [-8.0215, 110.3340],
      [-8.0230, 110.3385],
      [-8.0250, 110.3415],
      [-8.0280, 110.3450],
    ],
    geoJsonCoordinates: [
      [110.3300, -8.0200],
      [110.3340, -8.0215],
      [110.3385, -8.0230],
      [110.3415, -8.0250],
      [110.3450, -8.0280],
    ],
    steps: [
      {
        instruction: 'Evakuasi segera menjauhi bibir pantai ke arah timur di Jalan Parangtritis',
        distanceMeters: 650,
        durationSeconds: 470,
        streetName: 'Jl. Pantai Parangtritis',
        maneuverType: 'depart',
      },
      {
        instruction: 'Mulai menanjak menuju perbukitan timur di Jl. Watugupit',
        distanceMeters: 800,
        durationSeconds: 580,
        streetName: 'Jl. Watugupit',
        maneuverType: 'turn',
        modifier: 'slight right',
      },
      {
        instruction: 'Tiba di Dataran Tinggi Bukit Watugupit (Elevasi 85 mdpl)',
        distanceMeters: 500,
        durationSeconds: 350,
        streetName: 'Area Evakuasi Bukit Watugupit',
        maneuverType: 'arrive',
      },
    ],
  },

  // 3. Skenario Tsunami Padang (Pantai Purus -> Gedung Shelter TES Gaung)
  {
    id: 'route-tsunami-padang',
    name: 'Rute Evakuasi Vertikal Tsunami Padang (Pantai Purus ke TES Gaung)',
    originLat: -0.9380,
    originLng: 100.3540,
    destLat: -0.9500,
    destLng: 100.3500,
    distanceMeters: 1650,
    durationSeconds: 1190, // ~20 menit jalan kaki
    geometry: [
      [-0.9380, 100.3540],
      [-0.9410, 100.3535],
      [-0.9450, 100.3520],
      [-0.9480, 100.3510],
      [-0.9500, 100.3500],
    ],
    geoJsonCoordinates: [
      [100.3540, -0.9380],
      [100.3535, -0.9410],
      [100.3520, -0.9450],
      [100.3510, -0.9480],
      [100.3500, -0.9500],
    ],
    steps: [
      {
        instruction: 'Tinggalkan kawasan pantai, bergerak ke arah tenggara di Jalan Samudra',
        distanceMeters: 450,
        durationSeconds: 320,
        streetName: 'Jl. Samudra',
        maneuverType: 'depart',
      },
      {
        instruction: 'Belok kiri ke arah Jl. Veteran / Gaung',
        distanceMeters: 850,
        durationSeconds: 610,
        streetName: 'Jl. Gaung Teluk Bayur',
        maneuverType: 'turn',
        modifier: 'left',
      },
      {
        instruction: 'Tiba di Gedung Shelter Evakuasi Vertikal Gaung Padang',
        distanceMeters: 350,
        durationSeconds: 260,
        streetName: 'TES Gaung',
        maneuverType: 'arrive',
      },
    ],
  },

  // 4. Skenario Tsunami Palu (Lere -> Perbukitan Duyu)
  {
    id: 'route-tsunami-palu',
    name: 'Rute Evakuasi Dataran Tinggi Palu (Kelurahan Lere ke Perbukitan Duyu)',
    originLat: -0.8870,
    originLng: 119.8520,
    destLat: -0.9050,
    destLng: 119.8350,
    distanceMeters: 2850,
    durationSeconds: 2050, // ~34 menit jalan kaki
    geometry: [
      [-0.8870, 119.8520],
      [-0.8920, 119.8470],
      [-0.8970, 119.8420],
      [-0.9010, 119.8380],
      [-0.9050, 119.8350],
    ],
    geoJsonCoordinates: [
      [119.8520, -0.8870],
      [119.8470, -0.8920],
      [119.8420, -0.8970],
      [119.8380, -0.9010],
      [119.8350, -0.9050],
    ],
    steps: [
      {
        instruction: 'Evakuasi darurat menjauhi Teluk Palu ke arah barat daya di Jl. Diponegoro',
        distanceMeters: 850,
        durationSeconds: 610,
        streetName: 'Jl. Diponegoro',
        maneuverType: 'depart',
      },
      {
        instruction: 'Lanjutkan bergerak naik ke arah Perbukitan Duyu di Jl. Gajah Mada Barat',
        distanceMeters: 1400,
        durationSeconds: 1010,
        streetName: 'Jl. Menuju Duyu',
        maneuverType: 'continue',
      },
      {
        instruction: 'Tiba di Kawasan Evakuasi Perbukitan Duyu Palu Barat (Elevasi 110 mdpl)',
        distanceMeters: 600,
        durationSeconds: 430,
        streetName: 'Dataran Tinggi Duyu',
        maneuverType: 'arrive',
      },
    ],
  },
];

/**
 * Mencari rute pra-kalkulasi lokal yang paling sesuai berdasarkan koordinat asal & tujuan.
 */
export function findMatchingCachedRoute(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number
): CachedRouteFixture | null {
  for (const fixture of CACHED_PILOT_ROUTES) {
    const originDist = calculateHaversineDistanceKm(originLat, originLng, fixture.originLat, fixture.originLng);
    const destDist = calculateHaversineDistanceKm(destLat, destLng, fixture.destLat, fixture.destLng);

    // Cocok jika berada dalam radius 4 km dari koridor preset
    if (originDist <= 4.0 && destDist <= 4.0) {
      return fixture;
    }
  }

  return null;
}
