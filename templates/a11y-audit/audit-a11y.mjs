/**
 * Accessibility audit script — Playwright + axe-core
 *
 * Starts a Vite dev server, visits every page in both themes
 * (light + dark) at mobile and desktop widths, runs axe-core,
 * and outputs a JSON report.
 *
 * Usage:  npm run audit:a11y
 *    or:  node scripts/audit-a11y.mjs
 *
 * Prerequisites:
 *   npm install -D playwright @axe-core/playwright
 *   npx playwright install chromium
 */

import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { writeFileSync } from 'fs';
import { createServer } from 'vite';

// ─── CONFIGURATION ───────────────────────────────────────────
// Customize these for your project

const PORT = 5174;
const BASE = `http://localhost:${PORT}`;
const OUTPUT = process.env.CI ? 'axe-audit.json' : 'axe-audit.json';

// localStorage key for theme (set to null if not using theme toggle)
const THEME_KEY = 'app-theme';

const VIEWPORTS = {
  desktop: { width: 1280, height: 800 },
  mobile: { width: 375, height: 812 },
};

// Routes to audit (add your app's routes here)
const ROUTES = [
  { path: '/', name: 'Home' },
  { path: '/about', name: 'About' },
  // Add more routes as needed
];

// ─── AUDIT LOGIC ─────────────────────────────────────────────

/** Run axe-core on the current page and return a clean result object. */
async function runAxe(page) {
  const results = await new AxeBuilder({ page }).analyze();
  return {
    violations: results.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      description: v.description,
      help: v.help,
      helpUrl: v.helpUrl,
      nodeCount: v.nodes.length,
      nodes: v.nodes.slice(0, 5).map((n) => ({
        target: n.target.join(' '),
        html: n.html.substring(0, 200),
        failureSummary: n.failureSummary,
      })),
    })),
    violationCount: results.violations.length,
    passCount: results.passes.length,
    incompleteCount: results.incomplete.length,
  };
}

function logResult(name, theme, viewport, result) {
  const icon = result.violationCount === 0 ? '\u2713' : '\u2717';
  console.log(
    `  ${icon} ${name} [${theme}, ${viewport}]: ` +
      `${result.violationCount} violations, ${result.passCount} passes`
  );
}

async function main() {
  // Start Vite dev server
  console.log('Starting Vite dev server...');
  const server = await createServer({
    server: { port: PORT, strictPort: true },
    logLevel: 'error',
  });
  await server.listen();
  console.log(`Dev server running at ${BASE}\n`);

  const browser = await chromium.launch();
  const allResults = [];

  const themes = THEME_KEY ? ['light', 'dark'] : ['default'];

  for (const theme of themes) {
    for (const [vpName, vpSize] of Object.entries(VIEWPORTS)) {
      console.log(`--- ${theme.toUpperCase()} / ${vpName.toUpperCase()} ---`);

      const context = await browser.newContext({ viewport: vpSize });
      const page = await context.newPage();

      // Pre-set theme in localStorage before any navigation
      if (THEME_KEY) {
        await page.addInitScript(
          ([key, value]) => localStorage.setItem(key, value),
          [THEME_KEY, theme]
        );
      }

      for (const route of ROUTES) {
        await page.goto(`${BASE}${route.path}`, { waitUntil: 'networkidle' });
        const result = await runAxe(page);
        allResults.push({
          page: route.name,
          path: route.path,
          theme,
          viewport: vpName,
          ...result,
        });
        logResult(route.name, theme, vpName, result);
      }

      await context.close();
    }
  }

  await browser.close();
  await server.close();

  // Write report
  writeFileSync(OUTPUT, JSON.stringify(allResults, null, 2));
  console.log(`\nResults written to ${OUTPUT}`);

  // Summary
  const totalViolations = allResults.reduce(
    (sum, r) => sum + r.violationCount,
    0
  );
  const uniqueIds = new Set(
    allResults.flatMap((r) => r.violations.map((v) => v.id))
  );
  console.log(
    `\nSummary: ${allResults.length} audits, ` +
      `${totalViolations} total violations (${uniqueIds.size} unique rules)`
  );

  if (uniqueIds.size > 0) {
    console.log('\nUnique violations across all pages:');
    for (const id of uniqueIds) {
      const affected = allResults.filter((r) =>
        r.violations.some((v) => v.id === id)
      );
      const first = affected[0].violations.find((v) => v.id === id);
      console.log(`  - ${id} (${first.impact}): ${first.help}`);
      console.log(
        `    Affected: ${affected.map((r) => `${r.page} [${r.theme}/${r.viewport}]`).join(', ')}`
      );
    }
  }

  // Exit with error if any violations found (for CI)
  return totalViolations > 0 ? 1 : 0;
}

main()
  .then((exitCode) => process.exit(exitCode))
  .catch((e) => {
    console.error('Audit failed:', e);
    process.exit(1);
  });
