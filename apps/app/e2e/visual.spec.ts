/**
 * Visual regression — golden screenshots for the two core views the portal
 * renders (dashboard + report).
 *
 * Determinism, three ways:
 *  - the demo store is reset in beforeAll (the file-backed store re-seeds
 *    from fixtures on the next read), so the pages render the exact fixture
 *    state regardless of what earlier specs did in the same run;
 *  - the webServer env pins DEMO_FIXED_NOW (fixture dates stop drifting) and
 *    TZ=UTC (toLocaleString renders identically on any host);
 *  - fonts are pinned by running inside the e2e image (Dockerfile.e2e) — the
 *    CI job AND the golden regeneration both use it, so the committed
 *    -linux goldens always match what CI compares against.
 *
 * Regenerate after intentional UI changes — inside the pinned image, never
 * on a host OS (run the visual-update workflow, which does exactly that):
 *   pnpm --filter @forge-pro/app exec playwright test e2e/visual --update-snapshots
 */
import { rmSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';

test.describe('visual regression (next start + demo store)', () => {
  // Goldens are deterministic only against the local build: DEMO_FIXED_NOW
  // and TZ pinning come from the local webServer env, and a deployed demo
  // renders with its own clock and timezone.
  test.skip(!!process.env.E2E_BASE_URL, 'goldens require the local demo build (DEMO_FIXED_NOW / TZ pinning)');

  test.beforeAll(() => {
    // The demo store sits next to the app root (see playwright.config);
    // honor an E2E_DEMO_DIR override if one was given.
    const demoDir = process.env.E2E_DEMO_DIR ?? join(process.cwd(), '.e2e-demo');
    rmSync(demoDir, { recursive: true, force: true });
  });

  const shot = { fullPage: true, maxDiffPixelRatio: 0.01 } as const;

  test('dashboard', async ({ page }) => {
    await page.goto('/vendor');
    await expect(page.getByRole('heading', { name: 'Vendor dashboard' })).toBeVisible();
    // Fresh store → the 7 demo-vendor fixture rows.
    await expect(page.locator('.vp-table tbody tr')).toHaveCount(7);
    await expect(page).toHaveScreenshot('dashboard.png', shot);
  });

  test('rejected report detail', async ({ page }) => {
    await page.goto('/vendor/submissions/sub_rejected');
    await expect(page.getByText('QA rejected', { exact: true })).toBeVisible();
    await expect(page.getByText('composite 57.3 (min 75)')).toBeVisible();
    await expect(page.locator('.vp-score')).toHaveCount(4);
    await expect(page).toHaveScreenshot('report-rejected-detail.png', shot);
  });

  test('passed report page', async ({ page }) => {
    await page.goto('/vendor/submissions/sub_passed/report/job_passed_1');
    await expect(page.getByRole('heading', { name: 'QA report' })).toBeVisible();
    await expect(page.getByText('QA passed', { exact: true })).toBeVisible();
    await expect(page).toHaveScreenshot('report-passed.png', shot);
  });
});
