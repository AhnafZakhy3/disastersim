import { run100ScenariosAudit } from '../src/lib/simulation/scenarioRunner';

console.log('================================================================');
console.log(' NUSANTARA DISASTER SIMULATOR - 100 SCENARIOS VERIFICATION SUITE');
console.log('================================================================\n');

const report = run100ScenariosAudit();

console.log(`> Total Skenario Diuji       : ${report.totalScenarios}`);
console.log(`> Lolos (Pass)               : ${report.passedCount}`);
console.log(`> Gagal (Fail)               : ${report.failedCount}`);
console.log(`> Tingkat Kelulusan          : ${report.passRatePercent.toFixed(1)}%`);
console.log(`> Rata-rata Latensi          : ${report.avgExecutionTimeMs.toFixed(3)} ms / skenario`);
console.log(`> Total Waktu Eksekusi       : ${report.totalExecutionTimeMs.toFixed(2)} ms`);
console.log(`> Total Kalkulasi Spasial    : ${report.totalCitiesEvaluated.toLocaleString()} evaluasi kota\n`);

console.log('Sampel Hasil Uji Skenario:');
report.results.slice(0, 10).forEach((res) => {
  console.log(`  [${res.passed ? 'PASS' : 'FAIL'}] ${res.scenarioId}: ${res.name}`);
  console.log(`         Params: ${res.parametersDesc}`);
  console.log(`         Hasil : ${res.summaryMetric} | ${res.threatenedCitiesCount}/${res.citiesEvaluatedCount} Kota Terancam | ${res.executionTimeMs.toFixed(2)} ms`);
});

console.log('\nSampel Skenario Tsunami:');
report.results.filter(r => r.category === 'tsunami').slice(0, 5).forEach((res) => {
  console.log(`  [${res.passed ? 'PASS' : 'FAIL'}] ${res.scenarioId}: ${res.name}`);
  console.log(`         Params: ${res.parametersDesc}`);
  console.log(`         Hasil : ${res.summaryMetric} | ${res.threatenedCitiesCount}/${res.citiesEvaluatedCount} Kota Terancam | ${res.executionTimeMs.toFixed(2)} ms`);
});

console.log('\nSampel Skenario Kustom:');
report.results.filter(r => r.category.startsWith('custom')).slice(0, 5).forEach((res) => {
  console.log(`  [${res.passed ? 'PASS' : 'FAIL'}] ${res.scenarioId}: ${res.name}`);
  console.log(`         Params: ${res.parametersDesc}`);
  console.log(`         Hasil : ${res.summaryMetric} | ${res.threatenedCitiesCount}/${res.citiesEvaluatedCount} Kota Terancam | ${res.executionTimeMs.toFixed(2)} ms`);
});

if (report.passedCount === 100 && report.failedCount === 0) {
  console.log('\n================================================================');
  console.log(' SUCCESS: ALL 100 SCENARIOS PASSED WITH 0 ERRORS AND 0 NaNs!');
  console.log('================================================================');
  process.exit(0);
} else {
  console.error('\nFAILURE: Some scenarios failed verification.');
  process.exit(1);
}
