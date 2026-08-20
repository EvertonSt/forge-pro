/**
 * capture-guide-shots — boot the staged portal (the exact runtime the desktop
 * app ships) and screenshot its key views for the PDF guide.
 *
 * Outputs PNGs into apps/desktop/guide/img/, driven by Playwright Chromium
 * (the same browser the e2e suite uses). Dates are pinned with DEMO_FIXED_NOW
 * so the shots are deterministic.
 *
 * Usage: node apps/desktop/scripts/capture-guide-shots.mjs
 */
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { mkdirSync } from 'node:fs';
import http from 'node:http';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..', '..', '..');
const appPkgPath = join(repoRoot, 'apps', 'app', 'package.json');
const runtimeApp = join(here, '..', 'runtime', 'app');
const imgDir = join(here, '..', 'guide', 'img');

const require = createRequire(appPkgPath);
const { chromium } = require('@playwright/test');

const PORT = 4399;
const BASE = `http://127.0.0.1:${PORT}`;

function waitForPortal(timeoutMs = 60_000) {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve, reject) => {
    const probe = () => {
      const req = http.get(`${BASE}/api/health`, (res) => {
        res.resume();
        if (res.statusCode === 200) return resolve();
        if (Date.now() > deadline) return reject(new Error('portal did not become ready'));
        setTimeout(probe, 400);
      });
      req.on('error', () => {
        if (Date.now() > deadline) return reject(new Error('portal did not become ready'));
        setTimeout(probe, 400);
      });
      req.setTimeout(2_000, () => req.destroy());
    };
    probe();
  });
}

mkdirSync(imgDir, { recursive: true });

const server = spawn('node', [join(runtimeApp, 'server.js')], {
  cwd: runtimeApp,
  env: {
    ...process.env,
    NODE_ENV: 'production',
    HOSTNAME: '127.0.0.1',
    PORT: String(PORT),
    ALLOW_DEMO_MODE: '1',
    DEMO_STORE_DIR: join(here, '..', 'guide', '.shot-store'),
    DEMO_FIXED_NOW: '1786320000000',
    TZ: 'UTC',
  },
  stdio: 'ignore',
});

try {
  await waitForPortal();
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 820 }, deviceScaleFactor: 2 });

    const shots = [
      { name: 'dashboard', url: '/vendor', fullPage: true },
      { name: 'new-form', url: '/vendor/new', fullPage: false },
      { name: 'submission', url: '/vendor/submissions/sub_running', fullPage: false },
      { name: 'report', url: '/vendor/submissions/sub_rejected/report/job_rejected_2', fullPage: true },
      { name: 'admin-vendors', url: '/admin/vendors', fullPage: true },
      { name: 'admin-submissions', url: '/admin/submissions', fullPage: true },
    ];

    for (const shot of shots) {
      await page.goto(`${BASE}${shot.url}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(600);
      await page.screenshot({
        path: join(imgDir, `${shot.name}.png`),
        fullPage: shot.fullPage,
      });
      console.log(`capture-guide-shots: ${shot.name}.png`);
    }
  } finally {
    await browser.close();
  }
} finally {
  server.kill();
  console.log('capture-guide-shots: done');
}
