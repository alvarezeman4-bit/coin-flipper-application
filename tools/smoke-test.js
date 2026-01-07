const fetch = require('node-fetch');

const BASE = process.env.TARGET_URL || 'http://127.0.0.1:8080';
const endpoints = [
  '/',
  '/index.html',
  '/assets/images/heads.png',
  '/assets/images/tails.png',
  '/assets/sounds/flip.mp3'
];

(async () => {
  let ok = true;
  for (const ep of endpoints) {
    const url = BASE + ep;
    try {
      const res = await fetch(url, { method: 'HEAD' });
      if (!res.ok) {
        console.error(`FAIL: ${url} returned ${res.status}`);
        ok = false;
      } else {
        console.log(`OK: ${url} (${res.status})`);
      }
    } catch (e) {
      console.error(`ERROR: ${url} -> ${e.message}`);
      ok = false;
    }
  }
  if (!ok) process.exitCode = 2;
})();
