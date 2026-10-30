/**
 * Security & Sanitization Automated Test Suite
 * Verifies XSS prevention, path traversal defense, and mathematical/numerical resilience.
 */
import { escapeHtml, sanitizeFilename, sanitizeNumeric } from '../src/lib/sanitize';
import { simulateVolcanoEruption } from '../src/lib/simulation/volcanoModel';
import { simulateTsunamiImpact } from '../src/lib/simulation/tsunamiModel';

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
console.log(' SECURITY & SANITIZATION AUTOMATED VERIFICATION SUITE');
console.log('================================================================\n');

// 1. DOM XSS & HTML Special Character Escaping Tests
console.log('--- 1. DOM XSS Protection Tests ---');
const xssPayload1 = '<script>alert("XSS")</script>';
assert(
  escapeHtml(xssPayload1) === '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;',
  'Neutralizes <script> tags'
);

const xssPayload2 = '"><img src=x onerror=alert(1)>';
assert(
  !escapeHtml(xssPayload2).includes('<') &&
  !escapeHtml(xssPayload2).includes('>') &&
  !escapeHtml(xssPayload2).includes('"'),
  'Neutralizes tag breakout and img onerror attributes'
);

const xssPayload3 = "John's & Jane's <Test>";
assert(
  escapeHtml(xssPayload3) === 'John&#39;s &amp; Jane&#39;s &lt;Test&gt;',
  'Safely handles quotes, ampersands, and single quotes'
);

assert(escapeHtml(null) === '', 'Handles null safely');
assert(escapeHtml(undefined) === '', 'Handles undefined safely');
assert(escapeHtml(12345) === '12345', 'Handles numbers safely');

// 2. Filename Sanitization & Path Traversal Tests
console.log('\n--- 2. File Download Path Traversal Tests ---');
const pathTraversal1 = '../../../../etc/passwd';
assert(
  sanitizeFilename(pathTraversal1) === '.._.._.._.._etc_passwd',
  'Strips directory separators and path traversal sequences'
);

const forbiddenWinChars = 'file:name*with?bad<chars>|quote".pdf';
assert(
  !/[/:*?"<>|]/.test(sanitizeFilename(forbiddenWinChars)),
  'Strips all Windows reserved filename characters'
);

assert(
  sanitizeFilename('', 'fallback') === 'fallback',
  'Falls back to safe default on empty string'
);

// 3. Numerical Clamping & NaN Resilience Tests
console.log('\n--- 3. Numerical & Mathematical Resilience Tests ---');
assert(sanitizeNumeric(NaN, 1, 10, 5) === 5, 'Safely falls back on NaN');
assert(sanitizeNumeric(Infinity, 1, 10, 5) === 10, 'Safely clamps Infinity to max');
assert(sanitizeNumeric(-Infinity, 1, 10, 5) === 1, 'Safely clamps -Infinity to min');
assert(sanitizeNumeric(null, 1, 10, 5) === 5, 'Safely falls back on null');
assert(sanitizeNumeric(undefined, 1, 10, 5) === 5, 'Safely falls back on undefined');
assert(sanitizeNumeric(7, 1, 10, 5) === 7, 'Preserves valid in-range values');

// 4. Model Resiliency against Malicious / Poisoned Scenario Payloads
console.log('\n--- 4. Volcano Model Poisoning Defense ---');
try {
  const volcanoRes = simulateVolcanoEruption({
    volcanoId: 'merapi',
    isCustom: true,
    customLocation: {
      lat: NaN,
      lng: NaN,
      name: '<script>alert(1)</script>',
    },
    vei: NaN as any,
    windDirectionDeg: NaN as any,
    windSpeedKmh: NaN as any,
    customColumnHeightKm: NaN as any,
  });

  assert(
    !Number.isNaN(volcanoRes.krb3RadiusKm) && volcanoRes.krb3RadiusKm > 0,
    'Volcano model computes valid KRB3 despite NaN parameters'
  );
  assert(
    !Number.isNaN(volcanoRes.ashPlumeLengthKm) && volcanoRes.ashPlumeLengthKm > 0,
    'Volcano model computes valid plume length despite NaN parameters'
  );
  assert(
    Array.isArray(volcanoRes.allEvaluatedCities) && volcanoRes.allEvaluatedCities.length === 514,
    'Volcano model evaluates all 514 cities without throwing errors'
  );
} catch (err) {
  assert(false, 'Volcano model threw an unexpected error with poisoned inputs', String(err));
}

console.log('\n--- 5. Tsunami Model Poisoning Defense ---');
try {
  const tsunamiRes = simulateTsunamiImpact(
    {
      faultId: 'sunda-south-java',
      isCustom: true,
      customLocation: {
        lat: NaN,
        lng: NaN,
        name: '"><svg onload=alert(1)>',
      },
      mw: NaN as any,
      depthKm: NaN as any,
      oceanDepthM: NaN as any,
    },
    NaN as any
  );

  assert(
    !Number.isNaN(tsunamiRes.deepWaterSpeedKmh) && tsunamiRes.deepWaterSpeedKmh > 0,
    'Tsunami model computes valid wave velocity despite NaN parameters'
  );
  assert(
    !Number.isNaN(tsunamiRes.coastWaveHeightM) && tsunamiRes.coastWaveHeightM > 0,
    'Tsunami model computes valid coastal wave height despite NaN parameters'
  );
  assert(
    Array.isArray(tsunamiRes.allEvaluatedCities) && tsunamiRes.allEvaluatedCities.length === 514,
    'Tsunami model evaluates all 514 cities without throwing errors'
  );
} catch (err) {
  assert(false, 'Tsunami model threw an unexpected error with poisoned inputs', String(err));
}

console.log('\n================================================================');
console.log(` RESULTS: ${passCount} PASSED, ${failCount} FAILED`);
console.log('================================================================');

if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
