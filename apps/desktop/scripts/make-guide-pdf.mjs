/**
 * make-guide-pdf — render the desktop app's user guide (guide/guide.html)
 * to a PDF using the same Playwright Chromium the e2e suite uses (it is a
 * devDependency of @forge-pro/app, resolved here via createRequire).
 *
 * Usage: node apps/desktop/scripts/make-guide-pdf.mjs
 * Output: apps/desktop/Forge-Pro-Desktop-Guide.pdf
 */
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..', '..', '..');
const appPkgPath = join(repoRoot, 'apps', 'app', 'package.json');

// @playwright/test is a direct devDependency of the app and re-exports the
// chromium launch API (same installed browser the e2e suite uses).
const require = createRequire(appPkgPath);
const { chromium } = require('@playwright/test');

const htmlPath = join(here, '..', 'guide', 'guide.html');
const outPdf = join(here, '..', 'Forge-Pro-Desktop-Guide.pdf');

const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.goto(pathToFileURL(htmlPath).href);
  await page.pdf({
    path: outPdf,
    format: 'A4',
    printBackground: true,
    preferCSSPageSize: true,
    margin: { top: '12mm', bottom: '14mm', left: '10mm', right: '10mm' },
  });
  console.log(`make-guide-pdf: wrote ${outPdf}`);
} finally {
  await browser.close();
}
