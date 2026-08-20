/**
 * Admin UI e2e against the PRODUCTION build (next start) + the demo store
 * (docs/vendor-portal.md §4). Clicks the real admin actions in a browser:
 * approve/revoke vendor applications, unpublish a live submission (inline
 * confirm), and confirms the vendor dashboard surfaces the Unpublished tag
 * while the Live-listings stat drops.
 *
 * Order-independent from vendor-form.spec.ts: this spec only flips flags on
 * fixture rows — it never adds submissions — so both files pass regardless of
 * execution order against the shared (fresh) demo store.
 */
import { expect, test } from '@playwright/test';

test.describe('admin UI e2e (next start + demo store)', () => {
  test('approves and revokes vendor applications', async ({ page }) => {
    await page.goto('/admin/vendors');
    await expect(page.getByRole('heading', { name: 'Vendor applications' })).toBeVisible();

    // Maya is pending → Approve flips the row.
    const mayaRow = page.locator('.vp-table tbody tr', { hasText: 'Maya Chen' });
    await expect(mayaRow.getByText('Pending', { exact: true })).toBeVisible();
    await mayaRow.getByRole('button', { name: 'Approve' }).click();
    await expect(mayaRow.getByText('Approved', { exact: true })).toBeVisible();
    await expect(mayaRow.getByRole('button', { name: 'Revoke' })).toBeEnabled();

    // Diego is approved (fixture) → Revoke flips him back to pending.
    const diegoRow = page.locator('.vp-table tbody tr', { hasText: 'Diego Souza' });
    await expect(diegoRow.getByText('Approved', { exact: true })).toBeVisible();
    await diegoRow.getByRole('button', { name: 'Revoke' }).click();
    await expect(diegoRow.getByText('Pending', { exact: true })).toBeVisible();
    await expect(diegoRow.getByRole('button', { name: 'Approve' })).toBeEnabled();

    // The cycle closes: Maya (now approved) can be revoked back too.
    await mayaRow.getByRole('button', { name: 'Revoke' }).click();
    await expect(mayaRow.getByText('Pending', { exact: true })).toBeVisible();
    await expect(mayaRow.getByRole('button', { name: 'Approve' })).toBeEnabled();
  });

  test('unpublishes a live submission and surfaces it on the admin + vendor views', async ({
    page,
  }) => {
    // Admin submissions view — Aurora is the only live demo-vendor fixture.
    await page.goto('/admin/submissions');
    await expect(page.getByRole('heading', { name: 'All submissions' })).toBeVisible();

    const auroraRow = page.locator('.vp-table tbody tr', { hasText: 'Aurora Landing Page' });
    await expect(auroraRow.getByText('Published', { exact: true })).toBeVisible();
    await auroraRow.getByRole('button', { name: 'Unpublish' }).click();

    // Inline confirm, then the row re-renders: history kept (chip stays
    // Published), Unpublished tag added, and the action button is gone.
    await auroraRow.getByRole('button', { name: 'Confirm' }).click();
    await expect(auroraRow.getByText('Published', { exact: true })).toBeVisible();
    await expect(auroraRow.getByText('Unpublished', { exact: true })).toBeVisible();
    await expect(auroraRow.getByRole('button', { name: 'Unpublish' })).toHaveCount(0);

    // Vendor dashboard — the row carries the tag and Live listings drops to 0.
    await page.goto('/vendor');
    const dashRow = page.locator('.vp-table tbody tr', { hasText: 'Aurora Landing Page' });
    await expect(dashRow.getByText('Unpublished', { exact: true })).toBeVisible();
    const liveStat = page.locator('.vp-stat', { hasText: 'Live listings' }).locator('.vp-stat-value');
    await expect(liveStat).toHaveText('0');
  });
});
