const puppeteer = require('puppeteer');
const axeCore = require('axe-core');

(async () => {
  const url = process.env.TARGET_URL || 'http://127.0.0.1:8080';
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  try {
    await page.goto(url, { waitUntil: 'networkidle2' });
    // Inject axe
    await page.evaluate(axeCore.source);
    const results = await page.evaluate(async () => await axe.run());
    const fs = require('fs');
    fs.writeFileSync('axe-results.json', JSON.stringify(results, null, 2));
    console.log(JSON.stringify(results, null, 2));
    const violations = results.violations || [];
    if (violations.length === 0) {
      console.log('\nNo accessibility violations found.');
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
    console.error('Error running axe:', e);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
