import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { defineConfig } from '@playwright/test';

/**
 * Full-page e2e against the PRODUCTION build (`next start`) with the demo
 * store — no Supabase. The server runs with an isolated DEMO_STORE_DIR
 * (.e2e-demo, cleaned by global-setup) and ALLOW_DEMO_MODE=1 so the auth
 * stub's demo identity works under NODE_ENV=production.
 *
 * Env overrides:
 *   E2E_PORT       — local webServer + baseURL port (default 4190)
 *   E2E_DEMO_DIR   — demo store dir for the local server (default .e2e-demo)
 *   E2E_TOKEN_PORT — port the vendor-form spec's local preview server binds
 *                    (default 4191)
 *   E2E_BASE_URL   — when set, targets a DEPLOYED demo instance instead of
 *                    starting a local server: no webServer, baseURL points at
 *                    the URL. The vendor-form spec (loopback ownership proof)
 *                    and visual goldens (DEMO_FIXED_NOW/TZ pinning) are
 *                    local-only and skip themselves in this mode.
 *
 * Run with `pnpm e2e` (builds first) from the app directory, or
 * `pnpm --filter @forge-pro/app e2e` from the repo root.
 */
// Playwright loads this file via CJS (the app package is CommonJS), so
// __dirname is the app root.
const APP_ROOT = __dirname;
const PORT = Number.isFinite(Number(process.env.E2E_PORT)) ? Number(process.env.E2E_PORT) : 4190;
const DEMO_DIR = process.env.E2E_DEMO_DIR ?? join(APP_ROOT, '.e2e-demo');
/** Deployed target, e.g. https://demo.forge.pro — trailing slash stripped. */
const REMOTE_BASE = process.env.E2E_BASE_URL?.trim().replace(/\/+$/, '') || undefined;

export default defineConfig({
  testDir: './e2e',
  timeout: 90_000,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  globalSetup: './e2e/global-setup.ts',
  use: {
    baseURL: REMOTE_BASE ?? `http://127.0.0.1:${PORT}`,
    headless: true,
  },
  webServer: REMOTE_BASE
    ? undefined
    : {
        command: `pnpm exec next start -p ${PORT}`,
        url: `http://127.0.0.1:${PORT}/vendor`,
        reuseExistingServer: false,
        timeout: 90_000,
        env: {
          // The store is created fresh by globalSetup; the server inherits env.
          DEMO_STORE_DIR: DEMO_DIR,
          ALLOW_DEMO_MODE: '1',
          // Golden-screenshot determinism: fixture dates stop being relative to
          // the run, and toLocaleString renders in UTC on any host.
          DEMO_FIXED_NOW: '1786320000000',
          TZ: 'UTC',
        },
      },
});

// Keep the dir on disk (the server must be able to mkdir it) but make sure
// global-setup has wiped it before the run starts. Not needed for a remote
// target — nothing local is booted.
if (!REMOTE_BASE) {
  mkdirSync(DEMO_DIR, { recursive: true });
}
