import { TsunamiFaultPreset, CoastalDistrictImpact, EvacuationShelter } from '@/types/disaster';

export interface CoastalReferenceHub {
  districtName: string;
  province: string;
  lat: number;
  lng: number;
  safeShelterName: string;
  shelterElevationM: number;
}

/**
 * Pangkalan Data Referensi Kota & Kabupaten Pesisir Utama Indonesia
 * Digunakan untuk pemetaan dampak tsunami riil saat pengguna mengklik sembarang koordinat laut lepas.
 */
export const INDONESIA_COASTAL_REFERENCE_HUBS: CoastalReferenceHub[] = [
  // Sumatera Barat & Barat Daya
  { districtName: 'Kota Banda Aceh', province: 'Aceh', lat: 5.5600, lng: 95.3200, safeShelterName: 'Escape Building Lambung', shelterElevationM: 25 },
  { districtName: 'Kab. Aceh Barat (Meulaboh)', province: 'Aceh', lat: 4.1400, lng: 96.1300, safeShelterName: 'Gedung Evakuasi Tsunami Meulaboh', shelterElevationM: 22 },
  { districtName: 'Kota Sibolga', province: 'Sumatera Utara', lat: 1.7400, lng: 98.7800, safeShelterName: 'Perbukitan Tor Simarbarimbing', shelterElevationM: 95 },
  { districtName: 'Kep. Nias (Gunungsitoli)', province: 'Sumatera Utara', lat: 1.2800, lng: 97.6100, safeShelterName: 'Bukit Doa Gunungsitoli', shelterElevationM: 110 },
  { districtName: 'Kep. Mentawai (Tuapejat)', province: 'Sumatera Barat', lat: -2.0200, lng: 99.5900, safeShelterName: 'Bukit Telegat Siberut', shelterElevationM: 85 },
  { districtName: 'Kota Padang', province: 'Sumatera Barat', lat: -0.9500, lng: 100.3500, safeShelterName: 'Shelter Evakuasi Vertikal Gaung Padang', shelterElevationM: 30 },
  { districtName: 'Kota Pariaman', province: 'Sumatera Barat', lat: -0.6200, lng: 100.1200, safeShelterName: 'Shelter Tsunami Pasir Pariaman', shelterElevationM: 24 },
  { districtName: 'Kab. Pesisir Selatan (Painan)', province: 'Sumatera Barat', lat: -1.3500, lng: 100.5700, safeShelterName: 'Bukit Langkisau Painan', shelterElevationM: 120 },
  { districtName: 'Kab. Mukomuko', province: 'Bengkulu', lat: -2.5800, lng: 101.1200, safeShelterName: 'Perbukitan Selagan Raya', shelterElevationM: 70 },
  { districtName: 'Kota Bengkulu', province: 'Bengkulu', lat: -3.8000, lng: 102.2600, safeShelterName: 'Benteng Marlborough / Perbukitan Anggut', shelterElevationM: 35 },
  { districtName: 'Kab. Pesisir Barat (Krui)', province: 'Lampung', lat: -5.1900, lng: 103.9300, safeShelterName: 'Perbukitan Way Redak Krui', shelterElevationM: 85 },

  // Selat Sunda & Banten / Lampung
  { districtName: 'Kab. Tanggamus (Kota Agung)', province: 'Lampung', lat: -5.5000, lng: 104.6200, safeShelterName: 'Perbukitan Tanggamus', shelterElevationM: 90 },
  { districtName: 'Kab. Lampung Selatan (Kalianda)', province: 'Lampung', lat: -5.7300, lng: 105.5900, safeShelterName: 'Kaki Gunung Rajabasa', shelterElevationM: 110 },
  { districtName: 'Kab. Pandeglang (Labuan/Carita)', province: 'Banten', lat: -6.3000, lng: 105.8200, safeShelterName: 'Perbukitan Labuan', shelterElevationM: 75 },
  { districtName: 'Kota Cilegon (Anyer)', province: 'Banten', lat: -6.0500, lng: 105.9200, safeShelterName: 'Dataran Tinggi Cikuasa', shelterElevationM: 65 },

  // Pesisir Selatan Jawa
  { districtName: 'Kab. Sukabumi (Pelabuhan Ratu)', province: 'Jawa Barat', lat: -6.9900, lng: 106.5400, safeShelterName: 'Gedung Evakuasi Cisolok', shelterElevationM: 40 },
  { districtName: 'Kab. Pangandaran', province: 'Jawa Barat', lat: -7.6900, lng: 108.6500, safeShelterName: 'Gedung Shelter Tsunami Pasar Wisata', shelterElevationM: 28 },
  { districtName: 'Kab. Cilacap', province: 'Jawa Tengah', lat: -7.7300, lng: 109.0100, safeShelterName: 'Bukit Srandil Cilacap', shelterElevationM: 70 },
  { districtName: 'Kab. Kebumen', province: 'Jawa Tengah', lat: -7.7600, lng: 109.6500, safeShelterName: 'Perbukitan Karangbolong', shelterElevationM: 85 },
  { districtName: 'Kab. Purworejo', province: 'Jawa Tengah', lat: -7.8300, lng: 109.9800, safeShelterName: 'Gedung TES Jatimalang', shelterElevationM: 25 },
  { districtName: 'Kab. Kulon Progo (YIA)', province: 'DI Yogyakarta', lat: -7.9100, lng: 110.0500, safeShelterName: 'Shelter Glagah Kulon Progo', shelterElevationM: 25 },
  { districtName: 'Kab. Bantul (Parangtritis)', province: 'DI Yogyakarta', lat: -8.0200, lng: 110.3300, safeShelterName: 'Bukit Paralayang Watugupit', shelterElevationM: 85 },
  { districtName: 'Kab. Gunungkidul', province: 'DI Yogyakarta', lat: -8.1300, lng: 110.6000, safeShelterName: 'Kawasan Karst Baron', shelterElevationM: 60 },
  { districtName: 'Kab. Pacitan', province: 'Jawa Timur', lat: -8.2200, lng: 111.0900, safeShelterName: 'Bukit Pencit Pacitan', shelterElevationM: 95 },
  { districtName: 'Kab. Trenggalek (Prigi)', province: 'Jawa Timur', lat: -8.2800, lng: 111.7200, safeShelterName: 'Perbukitan Teluk Prigi', shelterElevationM: 70 },
  { districtName: 'Kab. Blitar (Tambakrejo)', province: 'Jawa Timur', lat: -8.3200, lng: 112.1400, safeShelterName: 'Perbukitan Karanganyar', shelterElevationM: 80 },
  { districtName: 'Kab. Malang (Sendang Biru)', province: 'Jawa Timur', lat: -8.4300, lng: 112.6800, safeShelterName: 'Perbukitan Sendang Biru', shelterElevationM: 90 },
  { districtName: 'Kab. Lumajang (Tempursari)', province: 'Jawa Timur', lat: -8.3000, lng: 112.9800, safeShelterName: 'Perbukitan Kaki Semeru Selatan', shelterElevationM: 120 },
  { districtName: 'Kab. Jember (Puger)', province: 'Jawa Timur', lat: -8.3700, lng: 113.4800, safeShelterName: 'Bukit Kucur Puger', shelterElevationM: 75 },
  { districtName: 'Kab. Banyuwangi (Plengkung/Grajanan)', province: 'Jawa Timur', lat: -8.6200, lng: 114.3500, safeShelterName: 'Perbukitan Taman Nasional Alas Purwo', shelterElevationM: 90 },

  // Bali & Nusa Tenggara
  { districtName: 'Kab. Badung (Kuta & Jimbaran)', province: 'Bali', lat: -8.7200, lng: 115.1700, safeShelterName: 'Bukit Jimbaran / GWK Cultural Park', shelterElevationM: 130 },
  { districtName: 'Kota Denpasar (Sanur)', province: 'Bali', lat: -8.6900, lng: 115.2600, safeShelterName: 'Gedung Evakuasi Tsunami Serangan', shelterElevationM: 25 },
  { districtName: 'Kab. Lombok Tengah (Kuta Mandalika)', province: 'Nusa Tenggara Barat', lat: -8.8900, lng: 116.2800, safeShelterName: 'Perbukitan Bukit Merese Mandalika', shelterElevationM: 95 },
  { districtName: 'Kab. Lombok Barat (Sekotong)', province: 'Nusa Tenggara Barat', lat: -8.7500, lng: 115.9800, safeShelterName: 'Perbukitan Sekotong', shelterElevationM: 80 },
  { districtName: 'Kab. Sumbawa Barat', province: 'Nusa Tenggara Barat', lat: -8.7800, lng: 116.8200, safeShelterName: 'Perbukitan Maluk', shelterElevationM: 85 },
  { districtName: 'Kab. Manggarai Barat (Labuan Bajo)', province: 'Nusa Tenggara Timur', lat: -8.4900, lng: 119.8800, safeShelterName: 'Bukit Cinta Labuan Bajo', shelterElevationM: 110 },
  { districtName: 'Kab. Sikka (Maumere)', province: 'Nusa Tenggara Timur', lat: -8.6100, lng: 122.2100, safeShelterName: 'Bukit Nilo Maumere', shelterElevationM: 150 },
  { districtName: 'Kab. Flores Timur (Larantuka)', province: 'Nusa Tenggara Timur', lat: -8.3400, lng: 122.9800, safeShelterName: 'Kaki Gunung Ile Mandiri', shelterElevationM: 160 },
  { districtName: 'Kota Kupang', province: 'Nusa Tenggara Timur', lat: -10.1700, lng: 123.6000, safeShelterName: 'Perbukitan Alak Kupang', shelterElevationM: 90 },

  // Sulawesi & Maluku
  { districtName: 'Kota Palu (Talise/Pantoloan)', province: 'Sulawesi Tengah', lat: -0.8800, lng: 119.8700, safeShelterName: 'Perbukitan Mamboro Palu Utara', shelterElevationM: 75 },
  { districtName: 'Kab. Donggala (Banawa)', province: 'Sulawesi Tengah', lat: -0.6700, lng: 119.7400, safeShelterName: 'Perbukitan Ganti Donggala', shelterElevationM: 80 },
  { districtName: 'Kota Manado', province: 'Sulawesi Utara', lat: 1.4800, lng: 124.8400, safeShelterName: 'Kawasan Wenang / Perbukitan Malalayang', shelterElevationM: 65 },
  { districtName: 'Kab. Kepulauan Sitaro (Tagulandang/Ruang)', province: 'Sulawesi Utara', lat: 2.3300, lng: 125.4200, safeShelterName: 'Dataran Tinggi Tagulandang', shelterElevationM: 140 },
  { districtName: 'Kota Ambon', province: 'Maluku', lat: -3.6900, lng: 128.1800, safeShelterName: 'Kawasan Karang Panjang Ambon', shelterElevationM: 95 },
  { districtName: 'Kota Ternate', province: 'Maluku Utara', lat: 0.7900, lng: 127.3800, safeShelterName: 'Lereng Gunung Gamalama', shelterElevationM: 120 },
  { districtName: 'Kota Jayapura', province: 'Papua', lat: -2.5300, lng: 140.7100, safeShelterName: 'Perbukitan Polimak Jayapura', shelterElevationM: 130 },
];

export const INDONESIA_TSUNAMI_FAULTS: TsunamiFaultPreset[] = [
  {
    id: 'sunda-south-java',
    name: 'Sunda Megathrust — Segmen Selatan Jawa',
    region: 'Samudera Hindia (Selatan DI Yogyakarta & Cilacap)',
    lat: -9.2500,
    lng: 110.5000,
    defaultMw: 8.7,
    defaultDepthKm: 20,
    avgOceanDepthM: 4000,
    nearestCoastDistanceKm: 130,
    faultStrikeDeg: 285, // Strike orientasi Barat-Barat Laut
    ruptureLengthKm: 380,
    description: 'Zona subduksi lempeng Indo-Australia menunjam ke bawah lempeng Eurasia dengan potensi slip gempa >8.5 Mw dan tsunami masif di pesisir selatan Jawa.',
    coastlinePolyline: [
      [-6.9500, 106.3500], // Pelabuhan Ratu / Cisolok
      [-7.3000, 107.4500], // Garut Selatan (Santolo)
      [-7.6900, 108.6500], // Pangandaran
      [-7.7300, 109.0100], // Cilacap
      [-7.7600, 109.6500], // Kebumen (Ayah/Petanahan)
      [-7.8300, 109.9800], // Purworejo (Jatimalang)
      [-7.9100, 110.0500], // Kulon Progo (Glagah/YIA)
      [-8.0200, 110.3300], // Bantul (Parangtritis)
      [-8.1300, 110.6000], // Gunungkidul (Baron/Krakal)
      [-8.2200, 111.0900], // Pacitan (Teluk Pacitan)
      [-8.2800, 111.7200], // Trenggalek (Prigi)
      [-8.3200, 112.1400], // Blitar (Tambakrejo)
      [-8.4300, 112.6800], // Malang Selatan (Sendang Biru)
      [-8.3000, 112.9800], // Lumajang (Tempursari)
      [-8.3700, 113.4800], // Jember (Puger)
      [-8.6200, 114.3500], // Banyuwangi (Plengkung / Grajagan)
    ],
    coastalDistricts: [
      { districtName: 'Kab. Cilacap', province: 'Jawa Tengah', distanceKm: 165, etaMinutes: 24, estimatedWaveHeightM: 14.5, warningLevel: 'AWAS', coordinates: [-7.7300, 109.0100] },
      { districtName: 'Kab. Kebumen', province: 'Jawa Tengah', distanceKm: 150, etaMinutes: 22, estimatedWaveHeightM: 12.8, warningLevel: 'AWAS', coordinates: [-7.7600, 109.6500] },
      { districtName: 'Kab. Purworejo', province: 'Jawa Tengah', distanceKm: 145, etaMinutes: 21, estimatedWaveHeightM: 11.2, warningLevel: 'AWAS', coordinates: [-7.8300, 109.9800] },
      { districtName: 'Kab. Kulon Progo (YIA)', province: 'DI Yogyakarta', distanceKm: 135, etaMinutes: 19, estimatedWaveHeightM: 13.0, warningLevel: 'AWAS', coordinates: [-7.9100, 110.0500] },
      { districtName: 'Kab. Bantul (Parangtritis)', province: 'DI Yogyakarta', distanceKm: 130, etaMinutes: 18, estimatedWaveHeightM: 12.4, warningLevel: 'AWAS', coordinates: [-8.0200, 110.3300] },
      { districtName: 'Kab. Gunungkidul', province: 'DI Yogyakarta', distanceKm: 132, etaMinutes: 19, estimatedWaveHeightM: 10.5, warningLevel: 'AWAS', coordinates: [-8.1300, 110.6000] },
      { districtName: 'Kab. Pacitan', province: 'Jawa Timur', distanceKm: 155, etaMinutes: 23, estimatedWaveHeightM: 15.2, warningLevel: 'AWAS', coordinates: [-8.2200, 111.0900] },
    ],
    safePoints: [
      { id: 'tes-tsu-java-1', name: 'Bukit Paralayang Watugupit Parangtritis', lat: -8.0280, lng: 110.3450, elevationM: 85, distanceKm: 135, district: 'Bantul, DIY' },
      { id: 'tes-tsu-java-2', name: 'Shelter Evakuasi Vertikal Glagah Kulon Progo', lat: -7.9050, lng: 110.0750, elevationM: 25, distanceKm: 145, district: 'Kulon Progo, DIY' },
      { id: 'tes-tsu-java-3', name: 'Bukit Srandil Cilacap', lat: -7.6950, lng: 109.1850, elevationM: 70, distanceKm: 170, district: 'Cilacap, Jawa Tengah' },
    ],
  },
  {
    id: 'sunda-mentawai',
    name: 'Sunda Megathrust — Segmen Mentawai / Padang',
    region: 'Pesisir Barat Sumatera (Kepulauan Mentawai & Padang)',
    lat: -2.1500,
    lng: 99.2000,
    defaultMw: 8.9,
    defaultDepthKm: 18,
    avgOceanDepthM: 4500,
    nearestCoastDistanceKm: 150,
    faultStrikeDeg: 320,
    ruptureLengthKm: 420,
    description: 'Zona seismic gap Mentawai yang diprediksi para ahli menyimpan akumulasi energi besar dengan potensi gelombang tsunami hingga 10+ meter membentur Padang & Bengkulu.',
    coastlinePolyline: [
      [-0.1500, 99.8000], // Pasaman Barat (Sasak)
      [-0.6200, 100.1200], // Kota Pariaman
      [-0.9500, 100.3500], // Kota Padang (Teluk Bayur)
      [-1.3500, 100.5700], // Painan (Pesisir Selatan)
      [-2.0500, 100.8500], // Air Haji
      [-2.5800, 101.1200], // Mukomuko, Bengkulu
      [-3.8000, 102.2600], // Kota Bengkulu
    ],
    coastalDistricts: [
      { districtName: 'Kep. Mentawai (Tuapejat)', province: 'Sumatera Barat', distanceKm: 75, etaMinutes: 12, estimatedWaveHeightM: 16.5, warningLevel: 'AWAS', coordinates: [-2.0200, 99.5900] },
      { districtName: 'Kota Padang', province: 'Sumatera Barat', distanceKm: 175, etaMinutes: 26, estimatedWaveHeightM: 11.8, warningLevel: 'AWAS', coordinates: [-0.9500, 100.3500] },
      { districtName: 'Kota Pariaman', province: 'Sumatera Barat', distanceKm: 185, etaMinutes: 28, estimatedWaveHeightM: 9.5, warningLevel: 'AWAS', coordinates: [-0.6200, 100.1200] },
      { districtName: 'Kab. Pesisir Selatan', province: 'Sumatera Barat', distanceKm: 160, etaMinutes: 24, estimatedWaveHeightM: 12.0, warningLevel: 'AWAS', coordinates: [-1.3500, 100.5700] },
      { districtName: 'Kab. Mukomuko', province: 'Bengkulu', distanceKm: 190, etaMinutes: 29, estimatedWaveHeightM: 8.2, warningLevel: 'AWAS', coordinates: [-2.5800, 101.1200] },
    ],
    safePoints: [
      { id: 'tes-tsu-padang-1', name: 'Shelter Evakuasi Vertikal Pasar Gaung', lat: -0.9900, lng: 100.3800, elevationM: 30, distanceKm: 175, district: 'Padang Selatan, Sumbar' },
      { id: 'tes-tsu-padang-2', name: 'Kawasan Perbukitan Indarung Padang', lat: -0.9500, lng: 100.4600, elevationM: 140, distanceKm: 185, district: 'Padang, Sumbar' },
      { id: 'tes-tsu-padang-3', name: 'Shelter SMPN 25 Padang', lat: -0.9200, lng: 100.3600, elevationM: 28, distanceKm: 180, district: 'Padang, Sumbar' },
    ],
  },
  {
    id: 'sunda-strait',
    name: 'Zona Transisi Megathrust — Selat Sunda',
    region: 'Selat Sunda (Banten & Lampung Selatan)',
    lat: -6.6000,
    lng: 104.8000,
    defaultMw: 7.8,
    defaultDepthKm: 15,
    avgOceanDepthM: 1800,
    nearestCoastDistanceKm: 65,
    faultStrikeDeg: 45,
    ruptureLengthKm: 120,
    description: 'Zona tektonik dan vulkanik kompleks di mulut Selat Sunda, rentan terhadap kombinasi tsunami patahan tektonik dan runtuhan kawah Anak Krakatau.',
    coastlinePolyline: [
      [-5.5000, 104.6200], // Kota Agung (Teluk Semangka)
      [-5.7300, 105.5900], // Kalianda (Lampung Selatan)
      [-5.8700, 105.7500], // Bakauheni
      [-6.0500, 105.9200], // Anyer / Merak
      [-6.3000, 105.8200], // Carita / Labuan
      [-6.6500, 105.5500], // Tanjung Lesung
      [-6.8500, 105.2500], // Ujung Kulon
    ],
    coastalDistricts: [
      { districtName: 'Kab. Pandeglang (Carita/Labuan)', province: 'Banten', distanceKm: 70, etaMinutes: 14, estimatedWaveHeightM: 6.8, warningLevel: 'AWAS', coordinates: [-6.3000, 105.8200] },
      { districtName: 'Kab. Lampung Selatan (Kalianda)', province: 'Lampung', distanceKm: 85, etaMinutes: 17, estimatedWaveHeightM: 5.5, warningLevel: 'AWAS', coordinates: [-5.7300, 105.5900] },
      { districtName: 'Kota Cilegon (Anyer)', province: 'Banten', distanceKm: 95, etaMinutes: 20, estimatedWaveHeightM: 4.8, warningLevel: 'AWAS', coordinates: [-6.0500, 105.9200] },
      { districtName: 'Kab. Tanggamus (Kota Agung)', province: 'Lampung', distanceKm: 80, etaMinutes: 16, estimatedWaveHeightM: 4.2, warningLevel: 'SIAGA', coordinates: [-5.5000, 104.6200] },
    ],
    safePoints: [
      { id: 'tes-tsu-sunda-1', name: 'Perbukitan Labuan Pandeglang', lat: -6.3800, lng: 105.8600, elevationM: 80, distanceKm: 85, district: 'Pandeglang, Banten' },
      { id: 'tes-tsu-sunda-2', name: 'Pusat Evakuasi Rajabasa Lampung', lat: -5.7400, lng: 105.6200, elevationM: 95, distanceKm: 90, district: 'Lampung Selatan' },
    ],
  },
  {
    id: 'palu-koro',
    name: 'Sesar Palu-Koro (Teluk Palu)',
    region: 'Sulawesi Tengah (Donggala & Teluk Palu)',
    lat: -0.8000,
    lng: 119.8200,
    defaultMw: 7.5,
    defaultDepthKm: 10,
    avgOceanDepthM: 700,
    nearestCoastDistanceKm: 12,
    faultStrikeDeg: 345,
    ruptureLengthKm: 150,
    description: 'Sesar geser mendatar (strike-slip) dengan topografi teluk sempit curam yang pada 2018 memicu longsoran bawah laut dan tsunami lokal kilat (<5 menit tiba di darat).',
    coastlinePolyline: [
      [-0.6700, 119.7400], // Donggala / Banawa
      [-0.7500, 119.7900], // Loli
      [-0.8200, 119.8300], // Palu Barat / Tipo
      [-0.8800, 119.8700], // Talise / Palu Timur
      [-0.8350, 119.8850], // Mamboro
      [-0.7200, 119.8600], // Pantoloan
      [-0.6000, 119.8300], // Kayumalue
    ],
    coastalDistricts: [
      { districtName: 'Kota Palu (Talise/Pantoloan)', province: 'Sulawesi Tengah', distanceKm: 10, etaMinutes: 4, estimatedWaveHeightM: 8.5, warningLevel: 'AWAS', coordinates: [-0.8800, 119.8700] },
      { districtName: 'Kab. Donggala (Banawa)', province: 'Sulawesi Tengah', distanceKm: 18, etaMinutes: 6, estimatedWaveHeightM: 5.2, warningLevel: 'AWAS', coordinates: [-0.6700, 119.7400] },
      { districtName: 'Kab. Parigi Moutong', province: 'Sulawesi Tengah', distanceKm: 65, etaMinutes: 28, estimatedWaveHeightM: 2.1, warningLevel: 'SIAGA', coordinates: [-0.8300, 120.1900] },
    ],
    safePoints: [
      { id: 'tes-tsu-palu-1', name: 'Perbukitan Mamboro Palu Utara', lat: -0.8350, lng: 119.8850, elevationM: 75, distanceKm: 8, district: 'Kota Palu, Sulteng' },
      { id: 'tes-tsu-palu-2', name: 'Dataran Tinggi Kawatuna Palu Timur', lat: -0.9200, lng: 119.9200, elevationM: 110, distanceKm: 14, district: 'Kota Palu, Sulteng' },
    ],
  },
  {
    id: 'flores-thrust',
    name: 'Flores Back-arc Thrust',
    region: 'Laut Flores (Utara Pulau Flores, NTT)',
    lat: -8.0500,
    lng: 122.3500,
    defaultMw: 7.8,
    defaultDepthKm: 15,
    avgOceanDepthM: 3000,
    nearestCoastDistanceKm: 40,
    faultStrikeDeg: 95,
    ruptureLengthKm: 260,
    description: 'Patahan naik busur belakang (back-arc thrust) di utara Flores yang pada tahun 1992 menimbulkan gempa 7.8 Mw dan tsunami dahsyat setinggi 26 meter di Teluk Maumere.',
    coastlinePolyline: [
      [-8.4900, 119.8800], // Labuan Bajo
      [-8.3800, 120.4500], // Pesisir Reo / Manggarai
      [-8.4200, 121.0500], // Pesisir Riung / Ngada
      [-8.5300, 121.6500], // Pesisir Utara Ende
      [-8.6100, 122.2100], // Maumere (Teluk Maumere)
      [-8.5200, 122.6500], // Pesisir Hewa
      [-8.3400, 122.9800], // Larantuka (Flores Timur)
    ],
    coastalDistricts: [
      { districtName: 'Kab. Sikka (Maumere)', province: 'Nusa Tenggara Timur', distanceKm: 45, etaMinutes: 9, estimatedWaveHeightM: 11.0, warningLevel: 'AWAS', coordinates: [-8.6100, 122.2100] },
      { districtName: 'Kab. Flores Timur (Larantuka)', province: 'Nusa Tenggara Timur', distanceKm: 70, etaMinutes: 14, estimatedWaveHeightM: 7.4, warningLevel: 'AWAS', coordinates: [-8.3400, 122.9800] },
      { districtName: 'Kab. Ende (Pesisir Utara)', province: 'Nusa Tenggara Timur', distanceKm: 75, etaMinutes: 15, estimatedWaveHeightM: 5.6, warningLevel: 'AWAS', coordinates: [-8.5300, 121.6500] },
    ],
    safePoints: [
      { id: 'tes-tsu-flores-1', name: 'Bukit Nilo Maumere', lat: -8.6500, lng: 122.2100, elevationM: 150, distanceKm: 55, district: 'Sikka, NTT' },
      { id: 'tes-tsu-flores-2', name: 'Dataran Tinggi Kewapante', lat: -8.6400, lng: 122.3000, elevationM: 80, distanceKm: 50, district: 'Sikka, NTT' },
    ],
  },
  {
    id: 'bali-lombok',
    name: 'Sunda Megathrust — Segmen Bali & Lombok',
    region: 'Samudera Hindia (Selatan Bali & Lombok)',
    lat: -9.5000,
    lng: 116.0000,
    defaultMw: 8.5,
    defaultDepthKm: 25,
    avgOceanDepthM: 4200,
    nearestCoastDistanceKm: 110,
    faultStrikeDeg: 280,
    ruptureLengthKm: 320,
    description: 'Zona penunjaman lempeng di selatan Bali dan Kepulauan Nusa Tenggara Barat dengan potensi gelombang tsunami mengancam Kuta, Sanur, dan pesisir selatan Lombok.',
    coastlinePolyline: [
      [-8.5400, 115.1200], // Tabanan
      [-8.7200, 115.1700], // Kuta / Badung
      [-8.8100, 115.1660], // Bukit Peninsula / Uluwatu
      [-8.6900, 115.2600], // Sanur / Denpasar
      [-8.7500, 115.9800], // Sekotong (Lombok Barat)
      [-8.8900, 116.2800], // Kuta Mandalika (Lombok Tengah)
      [-8.9200, 116.6000], // Teluk Awang / Ekas
    ],
    coastalDistricts: [
      { districtName: 'Kab. Badung (Kuta & Jimbaran)', province: 'Bali', distanceKm: 115, etaMinutes: 17, estimatedWaveHeightM: 8.5, warningLevel: 'AWAS', coordinates: [-8.7200, 115.1700] },
      { districtName: 'Kota Denpasar (Sanur)', province: 'Bali', distanceKm: 120, etaMinutes: 18, estimatedWaveHeightM: 7.8, warningLevel: 'AWAS', coordinates: [-8.6900, 115.2600] },
      { districtName: 'Kab. Lombok Tengah (Kuta Mandalika)', province: 'Nusa Tenggara Barat', distanceKm: 95, etaMinutes: 14, estimatedWaveHeightM: 10.2, warningLevel: 'AWAS', coordinates: [-8.8900, 116.2800] },
      { districtName: 'Kab. Lombok Barat (Sekotong)', province: 'Nusa Tenggara Barat', distanceKm: 105, etaMinutes: 15, estimatedWaveHeightM: 8.9, warningLevel: 'AWAS', coordinates: [-8.7500, 115.9800] },
      { districtName: 'Kab. Tabanan', province: 'Bali', distanceKm: 130, etaMinutes: 19, estimatedWaveHeightM: 6.5, warningLevel: 'AWAS', coordinates: [-8.5400, 115.1200] },
    ],
    safePoints: [
      { id: 'tes-tsu-bali-1', name: 'Bukit Jimbaran / GWK Cultural Park', lat: -8.8100, lng: 115.1660, elevationM: 130, distanceKm: 125, district: 'Badung, Bali' },
      { id: 'tes-tsu-lombok-1', name: 'Perbukitan Kuta Mandalika Lombok', lat: -8.8800, lng: 116.2800, elevationM: 90, distanceKm: 115, district: 'Lombok Tengah, NTB' },
    ],
  },
];
