/**
 * Evacuation Routing Automated Verification Suite
 * Verifies verified destinations provenance, coordinate validation,
 * OSRM parameter formatting, spatial hazard check, fail-safe error handling,
 * nationwide 230+ TES coverage, dual-layer wind shear ash propagation,
 * shelter hazard exposure, multi-tier hazard severity, capacity allocation,
 * offline pre-computed cache, and Supercluster k-d tree grouping.
 */
import {
  VERIFIED_EVACUATION_DESTINATIONS,
  getNearestCandidateDestinations,
  getVerifiedEvacuationDestinations,
} from '../src/data/evacuationDestinations';
import {
  validateCoordinate,
  validateRouteRequest,
} from '../src/lib/routing/routeValidation';
import {
  checkRouteHazardIntersection,
  HazardZonePolygon,
} from '../src/lib/routing/hazardCheck';
import { buildOSRMRouteUrl } from '../src/lib/routing/osrmAdapter';
import { generateEvacuationRouteGeoJSON } from '../src/lib/routing/geojsonExport';
import {
  simulateVolcanoEruption,
  checkShelterHazardExposure,
} from '../src/lib/simulation/volcanoModel';
import { findMatchingCachedRoute } from '../src/data/cachedPilotRoutes';
import { INDONESIA_CITIES } from '../src/data/indonesiaCities';
import Supercluster from 'supercluster';

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
console.log(' EVACUATION ROUTING AUTOMATED VERIFICATION SUITE');
console.log('================================================================\n');

// 1. Verified Destination Dataset & Provenance
console.log('--- 1. Verified TES Destination Integrity & Provenance ---');
assert(
  VERIFIED_EVACUATION_DESTINATIONS.length >= 230,
  `At least 230 verified TES locations nationwide (Actual: ${VERIFIED_EVACUATION_DESTINATIONS.length})`
);

let unverifiedCount = 0;
let missingSourceCount = 0;
let invalidCoordsCount = 0;

for (const dest of VERIFIED_EVACUATION_DESTINATIONS) {
  if (dest.verificationStatus !== 'verified') {
    unverifiedCount++;
  }
  if (!dest.sourceName || !dest.sourceUrl || !dest.verifiedAt) {
    missingSourceCount++;
  }
  const coordValid = validateCoordinate(dest.lat, dest.lng);
  if (!coordValid.valid) {
    invalidCoordsCount++;
  }
}

assert(unverifiedCount === 0, 'All nationwide destinations have verified status');
assert(missingSourceCount === 0, 'All destinations have complete source attribution and audit date');
assert(invalidCoordsCount === 0, 'All destination coordinates are valid and within Indonesian bounds');

// 2. Candidate Destination Spatial Querying
console.log('\n--- 2. Candidate Destination Spatial Querying ---');
const merapiCandidates = getNearestCandidateDestinations(-7.595, 110.428, 'volcano', 3);
assert(merapiCandidates.length >= 3, 'Merapi query returns at least 3 verified candidate destinations');
assert(
  merapiCandidates.every((d) => d.disasterTypes.includes('volcano')),
  'Merapi candidates match volcano disaster type'
);

const padangCandidates = getNearestCandidateDestinations(-0.938, 100.354, 'tsunami', 3);
assert(padangCandidates.length >= 3, 'Padang query returns at least 3 verified candidate destinations');
assert(
  padangCandidates.every((d) => d.disasterTypes.includes('tsunami')),
  'Padang candidates match tsunami disaster type'
);

// 3. Coordinate & Input Validation
console.log('\n--- 3. Coordinate & Input Validation (Defensive Checks) ---');
assert(!validateCoordinate(NaN, 110.0).valid, 'Rejects NaN latitude');
assert(!validateCoordinate(-7.0, Infinity).valid, 'Rejects Infinity longitude');
assert(!validateCoordinate(45.0, 110.0).valid, 'Rejects coordinate outside Indonesian territory');
assert(validateCoordinate(-7.7956, 110.3695).valid, 'Accepts valid Yogyakarta coordinate');

const invalidInputCheck = validateRouteRequest(
  { lat: NaN, lng: 110.0 },
  { lat: -7.8, lng: 110.4 }
);
assert(!invalidInputCheck.valid, 'validateRouteRequest rejects malformed origin coordinates');

// 4. OSRM Parameter Formatting
console.log('\n--- 4. OSRM Pedestrian Parameter Formatting ---');
const originCoord = { lat: -7.595, lng: 110.428 };
const destCoord = { lat: -7.638, lng: 110.421 };
const osrmUrl = buildOSRMRouteUrl(originCoord.lat, originCoord.lng, destCoord.lat, destCoord.lng);

assert(
  osrmUrl.includes('/route/v1/foot/'),
  'OSRM URL enforces pedestrian walking profile (/route/v1/foot/)'
);
const expectedCoordPart = `${originCoord.lng.toFixed(6)},${originCoord.lat.toFixed(6)};${destCoord.lng.toFixed(6)},${destCoord.lat.toFixed(6)}`;
assert(
  osrmUrl.includes(expectedCoordPart),
  `OSRM URL uses correct longitude-first order (${expectedCoordPart})`
);
assert(osrmUrl.includes('overview=full&geometries=geojson'), 'Requests full GeoJSON geometry from OSRM');

// 5. Spatial Hazard Check
console.log('\n--- 5. Spatial Hazard Intersection Check ---');
const sampleHazardZone: HazardZonePolygon = {
  name: 'KRB III Sample Zone',
  severity: 'critical',
  polygon: [
    [-7.58, 110.38],
    [-7.58, 110.42],
    [-7.62, 110.42],
    [-7.62, 110.38],
  ],
};

const intersectingRouteCoords: [number, number][] = [
  [-7.55, 110.40],
  [-7.65, 110.40],
];
const intersectResult = checkRouteHazardIntersection(intersectingRouteCoords, [sampleHazardZone]);
assert(
  intersectResult.status === 'intersects',
  'Correctly detects route intersecting hazard polygon'
);
assert(
  intersectResult.intersectingZoneNames.includes('KRB III Sample Zone'),
  'Identifies specific intersecting hazard zone name'
);
assert(
  intersectResult.highestSeverity === 'critical',
  'Correctly maps critical severity from intersecting KRB III zone'
);

const safeRouteCoords: [number, number][] = [
  [-7.80, 110.35],
  [-7.82, 110.36],
];
const safeResult = checkRouteHazardIntersection(safeRouteCoords, [sampleHazardZone]);
assert(
  safeResult.status === 'no_intersection_detected',
  'Returns no_intersection_detected when route does not cross hazard zone'
);
assert(
  safeResult.highestSeverity === 'none',
  'Returns none severity when route is completely clear'
);

const corruptRouteCoords: [number, number][] = [[NaN, NaN], [-7.55, 110.40]];
const corruptResult = checkRouteHazardIntersection(corruptRouteCoords, [sampleHazardZone]);
assert(
  corruptResult.status === 'unknown',
  'Fail-safe: Corrupt/NaN coordinates return status unknown, NOT no-intersection'
);

// 6. Dual-layer Wind Shear & Stratospheric Ash Plume
console.log('\n--- 6. Dual-Layer Atmospheric Wind Shear Model ---');
const volcanoWithShear = simulateVolcanoEruption({
  volcanoId: 'merapi',
  isCustom: false,
  vei: 4,
  windDirectionDeg: 225, // Surface Troposphere: SW
  windSpeedKmh: 40,
  enableWindShear: true,
  upperWindDirectionDeg: 90, // Stratosphere: East
  upperWindSpeedKmh: 75,
});

assert(
  Boolean(volcanoWithShear.upperAshPlumePolygon && volcanoWithShear.upperAshPlumePolygon.length > 2),
  'Generates separate upper atmospheric plume polygon when wind shear is enabled'
);
assert(
  (volcanoWithShear.upperAshPlumeLengthKm || 0) > 0,
  `Calculates stratospheric ash plume travel distance (Actual: ${volcanoWithShear.upperAshPlumeLengthKm} km)`
);

// 7. Shelter Hazard Exposure Verification
console.log('\n--- 7. Shelter Hazard Exposure Inspection ---');
// Test shelter directly inside KRB III
const merapiSummitLat = -7.5407;
const merapiSummitLng = 110.4457;
const insideKRB3Shelter = checkShelterHazardExposure(
  merapiSummitLat - 0.02,
  merapiSummitLng,
  volcanoWithShear,
  merapiSummitLat,
  merapiSummitLng
);
assert(!insideKRB3Shelter.isSafe, 'Shelter inside KRB III is identified as unsafe');
assert(insideKRB3Shelter.severity === 'critical', 'Shelter inside KRB III has critical severity');

// Test shelter far away from Merapi (> 35 km) and not in ash path
const farSafeShelter = checkShelterHazardExposure(
  -7.85,
  110.50,
  volcanoWithShear,
  merapiSummitLat,
  merapiSummitLng
);
assert(farSafeShelter.isSafe, 'Shelter outside hazard zones is verified safe');

// 8. Offline Route Pre-computed Cache
console.log('\n--- 8. Offline Resilience & Route Fixtures ---');
const cachedMerapiRoute = findMatchingCachedRoute(-7.595, 110.428, -7.638, 110.421);
assert(
  Boolean(cachedMerapiRoute && cachedMerapiRoute.geometry.length >= 5),
  'Successfully retrieves pre-computed offline route fixture for Merapi pilot'
);
assert(
  Boolean(cachedMerapiRoute && cachedMerapiRoute.steps && cachedMerapiRoute.steps.length > 0),
  'Offline route fixture includes pre-computed turn-by-turn guidance'
);

const cachedPadangRoute = findMatchingCachedRoute(-0.938, 100.354, -0.950, 100.350);
assert(
  Boolean(cachedPadangRoute && cachedPadangRoute.geometry.length >= 5),
  'Successfully retrieves pre-computed offline route fixture for Padang pilot'
);

// 9. Supercluster k-d Tree Clustering for 514 Cities
console.log('\n--- 9. Supercluster Mobile Performance Engine ---');
const cluster = new Supercluster({
  radius: 65,
  maxZoom: 16,
  minPoints: 2,
});

const cityFeatures: GeoJSON.Feature<GeoJSON.Point, any>[] = INDONESIA_CITIES.map((c) => ({
  type: 'Feature',
  geometry: {
    type: 'Point',
    coordinates: [c.lng, c.lat],
  },
  properties: c,
}));

cluster.load(cityFeatures);
// National view bbox [95.0, -11.0, 141.0, 6.0] at zoom level 5
const nationalClusters = cluster.getClusters([95.0, -11.0, 141.0, 6.0], 5);
assert(
  nationalClusters.length < 514 && nationalClusters.length > 0,
  `Clusters 514 cities into dense viewport elements at zoom 5 (Visible items: ${nationalClusters.length})`
);
assert(
  nationalClusters.some((item) => item.properties.cluster === true),
  'Successfully forms cluster groups with point_count badges'
);

// 10. GeoJSON Export for GIS (QGIS / ArcGIS)
console.log('\n--- 10. GeoJSON GIS Export Generation ---');
const sampleRouteResult = {
  success: true,
  origin: { name: 'Pantai Purus', lat: -0.938, lng: 100.354, type: 'coast' as const },
  destination: VERIFIED_EVACUATION_DESTINATIONS[0],
  distanceMeters: 4200,
  durationSeconds: 3000,
  geometry: [[-0.938, 100.354], [-0.945, 100.360]] as [number, number][],
  geoJsonCoordinates: [[100.354, -0.938], [100.360, -0.945]] as [number, number][],
  hazardCheckStatus: 'no_intersection_detected' as const,
  hazardSeverity: 'none' as const,
  hazardCheckNote: 'Rute bebas dari irisan zona bahaya simulasi.',
  hazardDetails: [],
  calculatedAt: new Date().toISOString(),
  provider: 'OSRM / OpenStreetMap',
  profile: 'foot',
};

const exportedGeoJSON = generateEvacuationRouteGeoJSON(sampleRouteResult, [sampleHazardZone]);
assert(exportedGeoJSON.type === 'FeatureCollection', 'Exports valid GeoJSON FeatureCollection');
assert(
  exportedGeoJSON.features.some((f) => f.geometry.type === 'LineString' && f.properties?.category === 'evacuation_route_primary'),
  'Includes primary evacuation route LineString'
);
assert(
  exportedGeoJSON.features.some((f) => f.geometry.type === 'Point' && f.properties?.category === 'destination_tes'),
  'Includes destination TES Point feature'
);
assert(
  exportedGeoJSON.features.some((f) => f.geometry.type === 'Polygon' && f.properties?.category === 'simulated_hazard_zone'),
  'Includes simulated hazard zone Polygon feature'
);

console.log('\n================================================================');
console.log(` RESULTS: ${passCount} PASSED, ${failCount} FAILED`);
console.log('================================================================');

if (failCount > 0) {
  process.exit(1);
}
