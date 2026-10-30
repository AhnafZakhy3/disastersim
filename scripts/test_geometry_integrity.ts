/**
 * Spasial Geometry & National Data Integrity Automated Verification Suite
 * Verifies Haversine accuracy, circular angle distance wrap, and 514 cities dataset integrity.
 */
import { INDONESIA_CITIES } from '../src/data/indonesiaCities';
import { calculateHaversineDistanceKm, calculateBearingDeg } from '../src/lib/geoUtils';

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    passCount++;
    console.log(`  [PASS] ${testName}`);
  } else {
    failCount++;
    console.error(`  [FAIL] ${testName} - ${detail || ''}`);
  }
}

console.log('================================================================');
console.log(' SPATIAL GEOMETRY & DATA INTEGRITY VERIFICATION SUITE');
console.log('================================================================\n');

// 1. Data Integrity: 514 Cities & Regencies Dataset
console.log('--- 1. 514 Cities & Regencies Dataset Integrity ---');
assert(INDONESIA_CITIES.length === 514, `Total cities is exactly 514 (Actual: ${INDONESIA_CITIES.length})`);

const ids = new Set<string>();
let duplicateIds = 0;
let invalidCoords = 0;
let invalidPopulations = 0;

for (const city of INDONESIA_CITIES) {
  if (ids.has(city.id)) {
    duplicateIds++;
  }
  ids.add(city.id);

  // Indonesia bounding box: ~Lat -11.5 to 6.5, Lng 95.0 to 141.5
  if (city.lat < -11.5 || city.lat > 6.5 || city.lng < 95.0 || city.lng > 141.5 || isNaN(city.lat) || isNaN(city.lng)) {
    invalidCoords++;
  }

  if (city.population <= 0 || isNaN(city.population)) {
    invalidPopulations++;
  }
}

assert(duplicateIds === 0, 'No duplicate city IDs found', `Found ${duplicateIds} duplicates`);
assert(invalidCoords === 0, 'All coordinates are within Indonesian territory bounding box', `Found ${invalidCoords} out of bounds`);
assert(invalidPopulations === 0, 'All cities have valid positive BPS population figures', `Found ${invalidPopulations} invalid populations`);

// 2. Spatial Geometry: Haversine & Bearing
console.log('\n--- 2. Haversine Distance & Bearing Accuracy ---');
// Merapi (-7.5407, 110.4457) to Yogyakarta (-7.8014, 110.3644) is ~30 km SSW (~195-205 deg)
const distMerapiYogya = calculateHaversineDistanceKm(-7.5407, 110.4457, -7.8014, 110.3644);
assert(distMerapiYogya > 28 && distMerapiYogya < 32, `Merapi to Yogya distance is ~30 km (Calculated: ${distMerapiYogya.toFixed(2)} km)`);

const bearingMerapiYogya = calculateBearingDeg(-7.5407, 110.4457, -7.8014, 110.3644);
assert(bearingMerapiYogya > 190 && bearingMerapiYogya < 210, `Bearing Merapi to Yogya is SSW ~198° (Calculated: ${bearingMerapiYogya.toFixed(2)}°)`);

// Distance to self is 0
assert(calculateHaversineDistanceKm(0, 100, 0, 100) === 0, 'Zero distance for identical coordinates');

// 3. Circular Angular Shortest Distance Calculation
console.log('\n--- 3. Circular Angular Difference (Shortest Arc on Circle) ---');
function circularAngleDiff(angle1: number, angle2: number): number {
  let diff = Math.abs(angle1 - angle2);
  if (diff > 180) diff = 360 - diff;
  return diff;
}

assert(circularAngleDiff(10, 350) === 20, '10° and 350° angular difference is 20° (wrap-around 360°)');
assert(circularAngleDiff(350, 10) === 20, '350° and 10° angular difference is 20° (symmetric)');
assert(circularAngleDiff(0, 180) === 180, '0° and 180° angular difference is 180°');
assert(circularAngleDiff(90, 270) === 180, '90° and 270° angular difference is 180°');
assert(circularAngleDiff(45, 90) === 45, '45° and 90° angular difference is 45°');

console.log(`\n================================================================`);
console.log(` RESULTS: ${passCount} PASSED, ${failCount} FAILED`);
console.log(`================================================================`);

if (failCount > 0) {
  process.exit(1);
}
