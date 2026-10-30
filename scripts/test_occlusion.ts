import { simulateTsunamiImpact } from '../src/lib/simulation/tsunamiModel';
import { INDONESIA_TSUNAMI_FAULTS } from '../src/data/tsunamiFaults';

const javaFault = INDONESIA_TSUNAMI_FAULTS[0]; // Sunda Megathrust Selatan Jawa
const resJava = simulateTsunamiImpact({
  faultId: javaFault.id,
  isCustom: false,
  mw: 8.7,
  depthKm: 20
}, 45);

console.log('=== UJI TSUNAMI SELATAN JAWA (Mw 8.7) ===');
const checkCitiesJava = [
  'Kota Semarang',
  'Kota Surabaya',
  'Kota Cirebon',
  'Kota Pekalongan',
  'Kota Banjarmasin',
  'Kab. Tanah Laut',
  'Kab. Pacitan',
  'Kab. Bantul',
  'Kab. Cilacap',
  'Kab. Gunungkidul'
];

for (const name of checkCitiesJava) {
  const c = resJava.allEvaluatedCities.find(x => x.cityName.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(x.cityName.toLowerCase()));
  if (c) {
    console.log(`  * ${c.cityName} (${c.province}) -> Status: ${c.status.toUpperCase()} | Label: ${c.statusLabel} (${c.distanceKm} km)`);
  } else {
    console.log(`  * NOT FOUND: ${name}`);
  }
}

const mentawaiFault = INDONESIA_TSUNAMI_FAULTS.find(f => f.id.includes('mentawai'))!;
const resMentawai = simulateTsunamiImpact({
  faultId: mentawaiFault.id,
  isCustom: false,
  mw: 8.9,
  depthKm: 18
}, 45);

console.log('\n=== UJI TSUNAMI MENTAWAI / PADANG (Mw 8.9) ===');
const checkCitiesMentawai = [
  'Kota Padang',
  'Mentawai',
  'Kota Pariaman',
  'Kab. Pesisir Selatan',
  'Kota Pekanbaru',
  'Kota Medan',
  'Kota Palembang',
  'Kota Jambi'
];

for (const name of checkCitiesMentawai) {
  const c = resMentawai.allEvaluatedCities.find(x => x.cityName.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(x.cityName.toLowerCase()));
  if (c) {
    console.log(`  * ${c.cityName} (${c.province}) -> Status: ${c.status.toUpperCase()} | Label: ${c.statusLabel} (${c.distanceKm} km)`);
  } else {
    console.log(`  * NOT FOUND: ${name}`);
  }
}
