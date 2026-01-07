const fs = require('fs');

const REPORT = './lighthouse-report.json';
const MIN_ACCESSIBILITY = Number(process.env.MIN_ACC || 90);
const MIN_PERFORMANCE = Number(process.env.MIN_PERF || 50);

if (!fs.existsSync(REPORT)) {
  console.error('Lighthouse report not found at', REPORT);
  process.exitCode = 1;
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(REPORT, 'utf8'));
const scores = data.categories || {};
const acc = Math.round((scores.accessibility && scores.accessibility.score || 0) * 100);
const perf = Math.round((scores.performance && scores.performance.score || 0) * 100);

console.log(`Lighthouse scores — Accessibility: ${acc}, Performance: ${perf}`);

let ok = true;
if (acc < MIN_ACCESSIBILITY) {
  console.error(`Accessibility score ${acc} is below threshold ${MIN_ACCESSIBILITY}`);
  ok = false;
}
if (perf < MIN_PERFORMANCE) {
  console.error(`Performance score ${perf} is below threshold ${MIN_PERFORMANCE}`);
  ok = false;
}
if (!ok) process.exitCode = 2;
if (!ok) process.exit(2);
console.log('Lighthouse thresholds OK');
process.exit(0);
