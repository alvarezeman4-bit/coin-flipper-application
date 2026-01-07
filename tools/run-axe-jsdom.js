const { JSDOM } = require('jsdom');
const fetch = require('node-fetch');
const axeCore = require('axe-core');

(async () => {
  const url = process.env.TARGET_URL || 'http://127.0.0.1:8080';
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
    const html = await res.text();
    const dom = new JSDOM(html, { runScripts: 'dangerously', resources: 'usable', url });

    // Wait for scripts to load (very small timeout)
    await new Promise(resolve => setTimeout(resolve, 500));

    const { window } = dom;
    // Inject axe
    const script = '(' + axeCore.source + ')()';
    // Evaluate axe in JSDOM's window
    dom.window.eval(axeCore.source);
    const results = await dom.window.axe.run();

    const fs = require('fs');
    fs.writeFileSync('axe-results-jsdom.json', JSON.stringify(results, null, 2));
    console.log(JSON.stringify(results, null, 2));
    const violations = results.violations || [];
    if (violations.length === 0) {
      console.log('\nNo accessibility violations found (jsdom run).');
    } else {
      console.log(`\nFound ${violations.length} accessibility violation(s):`);
      violations.forEach(v => {
        console.log(`\n- ${v.id}: ${v.help} (${v.nodes.length} node(s))`);
        v.nodes.slice(0,5).forEach(n => {
          console.log(`  - Target: ${n.target.join(', ')} | HTML: ${n.html.replace(/\n/g,'').slice(0,120)}`);
        });
      });
      process.exitCode = 2;
    }
  } catch (e) {
    console.error('Error running axe (jsdom):', e);
    process.exitCode = 1;
  }
})();
