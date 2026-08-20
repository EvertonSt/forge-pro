import { rmSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Playwright globalSetup — runs before the webServer starts. The e2e demo
 * store must be empty so the dashboard fixtures are deterministic (the store
 * file seeds fresh from demo-data on first load). No-op for remote targets
 * (E2E_BASE_URL): nothing local is booted, and a deployed demo's store is
 * not ours to wipe.
 */
export default function globalSetup(): void {
  if (process.env.E2E_BASE_URL) return;
  // Loaded via CJS like the config — __dirname is the e2e directory.
  const demoDir = process.env.E2E_DEMO_DIR ?? join(__dirname, '..', '.e2e-demo');
  rmSync(demoDir, { recursive: true, force: true });
}
