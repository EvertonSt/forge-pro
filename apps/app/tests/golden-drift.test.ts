/**
 * Golden drift gate tests (apps/app/scripts/golden-drift-*.mjs).
 *
 * The gate compares the pre-regeneration goldens (backed up BEFORE
 * `--update-snapshots`, which rewrites the same `-linux.png` filenames in
 * place) against the freshly regenerated ones. These tests pin:
 *   - the --before exact-name pairing (the mode that matches real Playwright
 *     output) and the legacy suffix-pairing fallback;
 *   - threshold semantics (under passes, over fails, size/missing = 100%);
 *   - the bootstrap / missing-dir no-op passes;
 *   - the CLI's exit-code contract, by spawning the real script.
 */
import { execFileSync } from 'node:child_process';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import { PNG } from 'pngjs';

import { checkGoldenPlatform, computeGoldenDrift } from '../scripts/golden-drift-core.mjs';

// apps/app — resolved from this file, not __dirname (vitest runs ESM).
const APP_ROOT = fileURLToPath(new URL('..', import.meta.url));
const CLI = join(APP_ROOT, 'scripts', 'golden-drift-check.mjs');

// ---------------------------------------------------------------------------
// Fixture helpers — tiny deterministic PNGs
// ---------------------------------------------------------------------------

/** A width×height PNG filled with red. */
function redPng(width: number, height: number): PNG {
  const png = new PNG({ width, height });
  for (let i = 0; i < png.data.length; i += 4) {
    png.data[i] = 255; // r
    png.data[i + 1] = 0; // g
    png.data[i + 2] = 0; // b
    png.data[i + 3] = 255; // a
  }
  return png;
}

/** redPng with the top `rows` rows re-colored blue — `rows / height` drift. */
function withBlueRows(png: PNG, rows: number): PNG {
  const next = new PNG({ width: png.width, height: png.height });
  png.data.copy(next.data);
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < png.width; x++) {
      const i = (y * png.width + x) * 4;
      next.data[i] = 0; // r
      next.data[i + 1] = 0; // g
      next.data[i + 2] = 255; // b
      next.data[i + 3] = 255; // a
    }
  }
  return next;
}

async function writePng(dir: string, name: string, png: PNG): Promise<string> {
  await mkdir(dir, { recursive: true });
  const path = join(dir, name);
  await writeFile(path, PNG.sync.write(png));
  return path;
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

const tempDirs: string[] = [];
afterEach(async () => {
  while (tempDirs.length) {
    const dir = tempDirs.pop()!;
    await rm(dir, { recursive: true, force: true });
  }
});

async function makeTempDir(prefix: string): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), prefix));
  tempDirs.push(dir);
  return dir;
}

describe('golden drift gate (--before exact-name pairing)', () => {
  it('reports per-golden ratios and fails when any drift exceeds the threshold', async () => {
    const snap = await makeTempDir('drift-snap-');
    const before = await makeTempDir('drift-before-');

    // Committed goldens (backed up), 100x100 red.
    await writePng(before, 'dashboard-linux.png', redPng(100, 100));
    await writePng(before, 'report-passed-linux.png', redPng(100, 100));
    // Regenerated in place: dashboard 30% blue, report unchanged (0%).
    await writePng(snap, 'dashboard-linux.png', withBlueRows(redPng(100, 100), 30));
    await writePng(snap, 'report-passed-linux.png', redPng(100, 100));

    const result = computeGoldenDrift({ snapDir: snap, beforeDir: before, maxRatio: 0.05 });

    expect(result.skipped).toBe(false);
    expect(result.rows).toHaveLength(2);
    expect(result.rows.find((r) => r.name === 'dashboard-linux.png')?.ratio).toBeCloseTo(0.3, 2);
    expect(result.rows.find((r) => r.name === 'dashboard-linux.png')?.note).toContain('DRIFT');
    expect(result.rows.find((r) => r.name === 'report-passed-linux.png')?.ratio).toBeCloseTo(0, 2);
    expect(result.worst).toBeCloseTo(0.3, 2);
    expect(result.failures).toBe(1);
  });

  it('passes when every golden is within the threshold', async () => {
    const snap = await makeTempDir('drift-snap-');
    const before = await makeTempDir('drift-before-');

    // 1% drift on a 100x100 image — well under 5%.
    await writePng(before, 'dashboard-linux.png', redPng(100, 100));
    await writePng(snap, 'dashboard-linux.png', withBlueRows(redPng(100, 100), 1));

    const result = computeGoldenDrift({ snapDir: snap, beforeDir: before, maxRatio: 0.05 });
    expect(result.failures).toBe(0);
    expect(result.rows[0]?.ratio).toBeCloseTo(0.01, 2);
  });

  it('treats a golden missing after regeneration as a blocking 100% drift', async () => {
    const snap = await makeTempDir('drift-snap-');
    const before = await makeTempDir('drift-before-');

    // Backed up, but the regenerated run never produced a fresh twin.
    await writePng(before, 'vanished-linux.png', redPng(100, 100));

    const result = computeGoldenDrift({ snapDir: snap, beforeDir: before, maxRatio: 0.05 });
    expect(result.failures).toBe(1);
    expect(result.rows[0]?.ratio).toBe(1);
    expect(result.rows[0]?.note).toContain('missing after regeneration');
  });

  it('rejects goldens generated on a non-container platform (host-OS run)', async () => {
    const snap = await makeTempDir('drift-platform-');
    const before = await makeTempDir('drift-platform-before-');
    // A host-OS regeneration produced -win32 goldens; the backup glob only
    // ever matches -linux.png, so without the guard this would silently pass.
    await writePng(snap, 'dashboard-win32.png', redPng(100, 100));
    await writePng(before, 'dashboard-linux.png', redPng(100, 100));

    const result = computeGoldenDrift({ snapDir: snap, beforeDir: before, maxRatio: 0.05 });
    expect(result.platformError).toContain('Non-container golden');
    expect(result.platformError).toContain('-linux.png');
  });

  it('treats a size change as a blocking 100% drift', async () => {
    const snap = await makeTempDir('drift-snap-');
    const before = await makeTempDir('drift-before-');

    await writePng(before, 'layout-linux.png', redPng(100, 100));
    await writePng(snap, 'layout-linux.png', redPng(120, 100)); // width changed

    const result = computeGoldenDrift({ snapDir: snap, beforeDir: before, maxRatio: 0.05 });
    expect(result.failures).toBe(1);
    expect(result.rows[0]?.ratio).toBe(1);
    expect(result.rows[0]?.note).toContain('size change');
  });
});

describe('golden drift gate (threshold semantics)', () => {
  it('fails exactly when ratio exceeds maxRatio (strict >)', async () => {
    const snap = await makeTempDir('drift-snap-');
    const before = await makeTempDir('drift-before-');
    await writePng(before, 'a-linux.png', redPng(100, 100));
    await writePng(snap, 'a-linux.png', withBlueRows(redPng(100, 100), 10)); // 10%

    // 10% drift vs 10% threshold → equal, not greater → pass.
    expect(computeGoldenDrift({ snapDir: snap, beforeDir: before, maxRatio: 0.1 }).failures).toBe(0);
    // 10% drift vs 5% threshold → over → fail.
    expect(computeGoldenDrift({ snapDir: snap, beforeDir: before, maxRatio: 0.05 }).failures).toBe(1);
  });

  it('rejects a maxRatio outside (0, 1) via the CLI', () => {
    const snap = resolve(APP_ROOT, 'e2e', 'visual.spec.ts-snapshots');
    expect(() =>
      execFileSync(process.execPath, [CLI, snap, '--max-ratio', '1.5'], { encoding: 'utf8' }),
    ).toThrow();
    expect(() =>
      execFileSync(process.execPath, [CLI, snap, '--max-ratio', '0'], { encoding: 'utf8' }),
    ).toThrow();
  });
});

describe('golden drift gate (bootstrap / missing dirs are no-op passes)', () => {
  it('passes when the backup is empty (first bootstrap)', () => {
    const snap = join(APP_ROOT, 'e2e', 'visual.spec.ts-snapshots');
    const emptyBefore = resolve(APP_ROOT, 'tests', 'fixtures', 'no-such-dir');

    const result = computeGoldenDrift({ snapDir: snap, beforeDir: emptyBefore, maxRatio: 0.05 });
    expect(result.skipped).toBe(true);
    expect(result.failures).toBe(0);
  });

  it('passes when the snapshots dir does not exist', () => {
    const result = computeGoldenDrift({
      snapDir: resolve(APP_ROOT, 'tests', 'fixtures', 'no-such-snapshots'),
      beforeDir: resolve(APP_ROOT, 'tests', 'fixtures', 'no-such-backup'),
      maxRatio: 0.05,
    });
    expect(result.skipped).toBe(true);
    expect(result.failures).toBe(0);
  });
});

describe('golden drift gate (legacy suffix-pairing fallback)', () => {
  it('pairs a suffixed golden with its suffix-less twin when no --before is given', async () => {
    const snap = await makeTempDir('drift-legacy-');
    // Legacy fixture: old golden keeps the -linux suffix, "regenerated" twin
    // is written without it (the shape the fallback was written for).
    await writePng(snap, 'shot-linux.png', redPng(100, 100));
    await writePng(snap, 'shot.png', withBlueRows(redPng(100, 100), 25));

    const result = computeGoldenDrift({ snapDir: snap, maxRatio: 0.05 });
    expect(result.skipped).toBe(false);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]?.name).toBe('shot.png');
    expect(result.rows[0]?.ratio).toBeCloseTo(0.25, 2);
    expect(result.failures).toBe(1);
  });

  it('skips with a hint when the fallback finds nothing to pair', async () => {
    const snap = await makeTempDir('drift-legacy-empty-');
    await writePng(snap, 'only-linux.png', redPng(100, 100));

    const result = computeGoldenDrift({ snapDir: snap, maxRatio: 0.05 });
    expect(result.skipped).toBe(true);
    expect(result.skipReason).toContain('--before');
  });
});

describe('golden drift gate (platform self-check)', () => {
  it('passes when every golden is *-linux.png', async () => {
    const snap = await makeTempDir('platform-ok-');
    await writePng(snap, 'dashboard-linux.png', redPng(100, 100));
    await writePng(snap, 'report-passed-linux.png', redPng(100, 100));

    const result = checkGoldenPlatform(snap);
    expect(result.ok).toBe(true);
    expect(result.foreign).toEqual([]);
    expect(result.message).toContain('platform OK');
  });

  it('fails when any golden carries a host-OS platform suffix', async () => {
    const snap = await makeTempDir('platform-foreign-');
    await writePng(snap, 'dashboard-win32.png', redPng(100, 100));
    await writePng(snap, 'report-passed-linux.png', redPng(100, 100));

    const result = checkGoldenPlatform(snap);
    expect(result.ok).toBe(false);
    expect(result.foreign).toEqual(['dashboard-win32.png']);
    expect(result.message).toContain('Non-container golden(s)');
  });

  it('passes on bootstrap — empty dir and missing dir', async () => {
    const empty = await makeTempDir('platform-empty-');
    expect(checkGoldenPlatform(empty).ok).toBe(true);

    expect(checkGoldenPlatform(resolve(APP_ROOT, 'tests', 'fixtures', 'no-such-dir')).ok).toBe(true);
  });

  it('CLI --check-platform exits 1 on a foreign golden, 0 on linux/empty', async () => {
    const snap = await makeTempDir('platform-cli-');
    await writePng(snap, 'dashboard-linux.png', redPng(100, 100));

    const ok = execFileSync(process.execPath, [CLI, snap, '--check-platform'], { encoding: 'utf8' });
    expect(ok).toContain('platform OK');

    await writePng(snap, 'leaked-win32.png', redPng(100, 100));
    const run = () =>
      execFileSync(process.execPath, [CLI, snap, '--check-platform'], { encoding: 'utf8' });
    expect(run).toThrow();
    let stdout = '';
    try {
      run();
    } catch (error) {
      stdout = (error as { stdout?: string }).stdout ?? '';
    }
    // The verdict prints to stdout; the non-zero exit marks the step failed.
    expect(stdout).toContain('Non-container golden(s)');
  });
});

describe('golden drift gate (CLI exit-code contract)', () => {
  it('exits 1 on drift past the threshold', async () => {
    const snap = await makeTempDir('drift-cli-snap-');
    const before = await makeTempDir('drift-cli-before-');
    await writePng(before, 'dashboard-linux.png', redPng(100, 100));
    await writePng(snap, 'dashboard-linux.png', withBlueRows(redPng(100, 100), 30));

    const run = () =>
      execFileSync(process.execPath, [CLI, snap, '--before', before, '--max-ratio', '0.05'], {
        encoding: 'utf8',
      });
    expect(run).toThrow();
    let stdout = '';
    let stderr = '';
    try {
      run();
    } catch (error) {
      stdout = (error as { stdout?: string }).stdout ?? '';
      stderr = (error as { stderr?: string }).stderr ?? '';
    }
    // The drift report table goes to stdout; the failure verdict to stderr.
    expect(stdout).toContain('DRIFT exceeds');
    expect(stderr).toContain('failed BEFORE committing');
  });

  it('exits 0 on drift within the threshold', async () => {
    const snap = await makeTempDir('drift-cli-snap-');
    const before = await makeTempDir('drift-cli-before-');
    await writePng(before, 'dashboard-linux.png', redPng(100, 100));
    await writePng(snap, 'dashboard-linux.png', redPng(100, 100));

    const out = execFileSync(process.execPath, [CLI, snap, '--before', before, '--max-ratio', '0.05'], {
      encoding: 'utf8',
    });
    expect(out).toContain('drift check passed');
  });

  it('exits 0 on bootstrap (empty backup)', async () => {
    const snap = await makeTempDir('drift-cli-snap-');
    const before = await makeTempDir('drift-cli-before-empty-');

    const out = execFileSync(process.execPath, [CLI, snap, '--before', before, '--max-ratio', '0.05'], {
      encoding: 'utf8',
    });
    expect(out).toContain('nothing to compare (pass)');
  });

  it('exits 1 on a non-container (host-OS) golden', async () => {
    const snap = await makeTempDir('drift-cli-platform-');
    const before = await makeTempDir('drift-cli-platform-before-');
    await writePng(snap, 'dashboard-win32.png', redPng(100, 100));
    await writePng(before, 'dashboard-linux.png', redPng(100, 100));

    const run = () =>
      execFileSync(process.execPath, [CLI, snap, '--before', before, '--max-ratio', '0.05'], {
        encoding: 'utf8',
      });
    expect(run).toThrow();
    let stderr = '';
    try {
      run();
    } catch (error) {
      stderr = (error as { stderr?: string }).stderr ?? '';
    }
    expect(stderr).toContain('Non-container golden');
  });
});
