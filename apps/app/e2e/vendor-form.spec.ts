/**
 * Full-page e2e against the PRODUCTION build (next start) + the demo store.
 *
 * Walks the entire vendor QA cycle in a real browser:
 *   dashboard → 3-step form (catalog → ownership proof against a real local
 *   preview page → zip+version) → submit → queued detail → simulate the
 *   runner → rejected report renders.
 *
 * The app server (webServer) runs with an isolated DEMO_STORE_DIR and
 * ALLOW_DEMO_MODE=1; this spec starts its own local HTTP server on a
 * separate port to serve the verification meta tag.
 */
import { createServer, type Server } from 'node:http';
import { deflateRawSync } from 'node:zlib';
import { expect, test } from '@playwright/test';

/** The local preview server the vendor must prove ownership of. */
const TOKEN_PAGE_PORT = Number.isFinite(Number(process.env.E2E_TOKEN_PORT))
  ? Number(process.env.E2E_TOKEN_PORT)
  : 4191;
let liveToken = '';

/** Build a real (minimal, valid) zip — CRC32 computed, deflate entry. */
function buildZip(): Buffer {
  const name = Buffer.from('orion/index.html', 'utf8');
  const content = Buffer.from('<html><body>Orion preview</body></html>', 'utf8');
  const data = deflateRawSync(content);
  const crc = crc32(content);

  const localHeader = Buffer.alloc(30);
  localHeader.writeUInt32LE(0x04034b50, 0);
  localHeader.writeUInt16LE(20, 4);
  localHeader.writeUInt16LE(0x0800, 6);
  localHeader.writeUInt16LE(8, 8); // deflate
  localHeader.writeUInt32LE(crc, 14);
  localHeader.writeUInt32LE(data.length, 18);
  localHeader.writeUInt32LE(name.length, 22);

  const central = Buffer.alloc(46);
  central.writeUInt32LE(0x02014b50, 0);
  central.writeUInt16LE(20, 4);
  central.writeUInt16LE(20, 6);
  central.writeUInt16LE(0x0800, 8);
  central.writeUInt16LE(8, 10);
  central.writeUInt32LE(crc, 16);
  central.writeUInt32LE(data.length, 20);
  central.writeUInt32LE(name.length, 24);
  central.writeUInt32LE(0, 42); // local header offset

  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(1, 8);
  eocd.writeUInt16LE(1, 10);
  eocd.writeUInt32LE(46 + name.length, 12);
  eocd.writeUInt32LE(30 + name.length + data.length, 16);

  return Buffer.concat([localHeader, name, data, central, eocd]);
}

function crc32(buf: Buffer): number {
  let crc = 0xffffffff;
  for (const byte of buf) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

test.describe('vendor portal e2e (next start + demo store)', () => {
  // The ownership-proof step fetches the token page from the app's server;
  // against a deployed instance (E2E_BASE_URL) a local loopback page is not
  // reachable by that server, so the full form is local-build-only.
  test.skip(!!process.env.E2E_BASE_URL, 'the ownership-proof step needs the local loopback preview server');

  let tokenServer: Server;

  test.beforeAll(async () => {
    tokenServer = createServer((req, res) => {
      res.setHeader('content-type', 'text/html');
      if (req.url?.startsWith('/with-token') && liveToken) {
        res.end(
          `<!doctype html><html><head><meta name="forge-pro:verify" content="${liveToken}"></head><body>preview</body></html>`,
        );
      } else {
        res.end('<!doctype html><html><head><title>no token</title></head><body>preview</body></html>');
      }
    });
    await new Promise<void>((resolve) => tokenServer.listen(TOKEN_PAGE_PORT, '127.0.0.1', resolve));
  });

  test.afterAll(async () => {
    await new Promise<void>((resolve, reject) =>
      tokenServer.close((error) => (error ? reject(error) : resolve())),
    );
  });

  test('walks the full demo QA cycle: dashboard → form → verify → submit → simulate → report', async ({
    page,
  }) => {
    // 1. Dashboard — the 7 demo-vendor fixture rows render (fresh store).
    await page.goto('/vendor');
    await expect(page.getByRole('heading', { name: 'Vendor dashboard' })).toBeVisible();
    await expect(page.locator('.vp-table tbody tr')).toHaveCount(7);

    // 2. Step 1 — catalog details.
    await page.getByRole('main').getByRole('link', { name: 'New submission' }).click();
    await expect(page.getByRole('button', { name: '1 Catalog details', exact: true })).toBeVisible();
    await page.getByPlaceholder('Aurora Landing Page').fill('Orion SaaS Starter');
    await page
      .getByPlaceholder('What does this template/component do?')
      .fill(
        'A conversion-focused SaaS landing template with hero, pricing grid, FAQ accordion and testimonials. Fully responsive, semantic markup, zero-dependency animations.',
      );
    await page.getByPlaceholder('Astro, Next.js, React…').fill('Astro');
    await page.getByPlaceholder('landing-page, dashboard, forms…').fill('landing-page');
    const stack = page.getByPlaceholder('Tailwind, TypeScript…');
    await stack.fill('Tailwind');
    await stack.press('Enter');
    await stack.fill('TypeScript');
    await stack.press('Enter');
    await page.getByRole('button', { name: 'Continue — preview & ownership' }).click();

    // 3. Step 2 — read the generated token, then prove ownership against the
    // real local preview page.
    await expect(page.getByRole('button', { name: '2 Preview & ownership', exact: true })).toBeVisible();
    const tokenField = page.locator('.vp-field').filter({ hasText: 'Verification token' });
    const tokenText = (await tokenField.locator('.vp-mono').first().textContent()) ?? '';
    const token = tokenText.match(/[0-9a-f]{16}/)?.[0] ?? '';
    expect(token).toHaveLength(16);
    liveToken = token;
    await page
      .getByPlaceholder('https://your-deployed-preview.example.com')
      .fill(`http://127.0.0.1:${TOKEN_PAGE_PORT}/with-token`);
    await page.getByRole('button', { name: 'Verify ownership' }).click();
    await expect(page.locator('.vp-banner--success')).toContainText('Ownership proven');
    await page.getByRole('button', { name: 'Continue — artifact & version' }).click();

    // 4. Step 3 — zip (real PK-zip, client checks pass) + submit.
    await expect(page.getByRole('button', { name: '3 Artifact & version', exact: true })).toBeVisible();
    await page
      .locator('input[type=file]')
      .setInputFiles({ name: 'orion.zip', mimeType: 'application/zip', buffer: buildZip() });
    await expect(page.getByText('orion.zip')).toBeVisible();
    await page.getByRole('button', { name: 'Submit for QA' }).click();

    // 5. Detail page — queued with the runner-simulator card.
    await page.waitForURL(/\/vendor\/submissions\/[^/]+$/);
    await expect(page.getByText('QA run in progress')).toBeVisible();
    await expect(page.getByText('Demo: simulate the runner')).toBeVisible();
    await expect(page.getByText('Queued', { exact: true })).toBeVisible();

    // 6. Simulate a rejected run — the report renders from the completion.
    await page.getByRole('button', { name: 'Simulate reject' }).click();
    await expect(page.getByText('QA rejected', { exact: true })).toBeVisible();
    await expect(page.getByText('composite 57.3 (min 75)')).toBeVisible();
    await expect(page.locator('.vp-score')).toHaveCount(4);
    await expect(page.getByText('overflow@320')).toBeVisible();
    await expect(page.getByText('scrollWidth 496px exceeds viewport width 320px')).toBeVisible();
    await expect(page.getByText('Horizontal overflow at 320px')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Fix & resubmit' })).toBeVisible();

    // 7. Back on the dashboard — the new row shows QA rejected with the score.
    await page.goto('/vendor');
    const row = page.locator('.vp-table tbody tr', { hasText: 'Orion SaaS Starter' });
    await expect(row).toHaveCount(1);
    await expect(row).toContainText('QA rejected');
    await expect(row).toContainText('57');
  });
});
