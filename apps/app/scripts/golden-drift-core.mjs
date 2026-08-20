#!/usr/bin/env node
/**
 * Golden drift core — the pure comparison logic behind the drift gate.
 *
 * Compares the pre-regeneration goldens (a backup taken BEFORE
 * `--update-snapshots`, which rewrites files IN PLACE with the same
 * `-linux.png` names) against the freshly regenerated ones, using pixelmatch
 * (the same algorithm Playwright's toHaveScreenshot uses internally).
 *
 * This module is deliberately side-effect free (no console, no process.exit)
 * so it can be unit-tested; the CLI wrapper (golden-drift-check.mjs) parses
 * args, prints the report, and maps failures to an exit code.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

/** List *.png in a dir, or null when the dir does not exist. */
function listPngs(dir) {
  try {
    return readdirSync(dir).filter((f) => f.endsWith('.png'));
  } catch {
    return null;
  }
}

/**
 * Platform self-check — assert every golden is a container-produced
 * `*-linux.png`. The e2e image generates exactly those filenames and CI
 * compares against them; a golden with any other platform suffix
 * (-win32/-darwin.png) comes from a host-OS run and can never match CI's
 * font-rendered comparison. Used as a fail-fast smoke assertion at the start
 * of regeneration (and as the drift gate's own platform guard).
 */
export function checkGoldenPlatform(snapDir) {
  const files = listPngs(snapDir);
  if (files === null) {
    return { ok: true, foreign: [], goldens: [], message: `No snapshots dir at ${snapDir} — nothing to check (bootstrap pass).` };
  }
  if (files.length === 0) {
    return { ok: true, foreign: [], goldens: [], message: 'No goldens yet — nothing to check (bootstrap pass).' };
  }
  const foreign = files.filter((f) => !f.endsWith('-linux.png'));
  if (foreign.length > 0) {
    return {
      ok: false,
      foreign,
      goldens: files,
      message: `Non-container golden(s) found: ${foreign.join(', ')} — expected *-linux.png. Regenerate inside the e2e image (Dockerfile.e2e); host-OS goldens fail CI's font comparison.`,
    };
  }
  return { ok: true, foreign, goldens: files, message: `All ${files.length} golden(s) are *-linux.png — platform OK.` };
}

function readPng(dir, name) {
  const buf = readFileSync(join(dir, name));
  return PNG.sync.read(buf);
}

/**
 * Compute the drift report. Never throws for missing dirs and never exits —
 * those surface as `skipped` results.
 *
 * @param {object} options
 * @param {string} options.snapDir      absolute snapshots dir (post-regeneration)
 * @param {string|null} [options.beforeDir] absolute backup dir of the committed
 *   goldens, taken BEFORE regeneration. When given, files are compared by
 *   exact name — the mode that actually matches Playwright's in-place
 *   updates. When omitted, falls back to suffix-pairing (old `-linux.png` vs
 *   a suffix-less twin), which never matches real Playwright output.
 * @param {number} [options.maxRatio]   fraction of differing pixels that fails
 *   the gate (default 0.05).
 */
export function computeGoldenDrift({ snapDir, beforeDir = null, maxRatio = 0.05 }) {
  const committed = listPngs(snapDir);
  if (committed === null) {
    return { rows: [], worst: 0, failures: 0, skipped: true, skipReason: `No snapshots dir at ${snapDir}`, maxRatio };
  }

  /** @type {{ base: string, oldDir: string, oldName: string, freshDir: string, freshName: string }[]} */
  let pairs;
  let skipped = false;
  let skipReason = null;

  if (beforeDir) {
    // The container generates exactly `*-linux.png` goldens and CI compares
    // against those filenames. A regeneration on a host OS produces a
    // platform-suffixed golden (-win32/-darwin.png) that CI never compares
    // — fail loudly instead of silently passing.
    const platform = checkGoldenPlatform(snapDir);
    if (!platform.ok) {
      return {
        rows: [],
        worst: 0,
        failures: 0,
        skipped: false,
        platformError: platform.message,
        maxRatio,
      };
    }
    const backups = listPngs(beforeDir);
    if (backups === null) {
      return { rows: [], worst: 0, failures: 0, skipped: true, skipReason: `No backup dir at ${beforeDir}`, maxRatio };
    }
    if (backups.length === 0) {
      return { rows: [], worst: 0, failures: 0, skipped: true, skipReason: 'No committed goldens yet (first bootstrap)', maxRatio };
    }
    pairs = backups.map((name) => ({ base: name, oldDir: beforeDir, oldName: name, freshDir: snapDir, freshName: name }));
  } else {
    pairs = committed
      .map((f) => ({
        base: f.replace(/-[a-z0-9]+\.png$/i, '.png'),
        oldDir: snapDir,
        oldName: f,
        freshDir: snapDir,
        freshName: f.replace(/-[a-z0-9]+\.png$/i, '.png'),
      }))
      .filter((p) => p.oldName !== p.freshName && committed.includes(p.freshName));
    if (pairs.length === 0) {
      skipped = true;
      skipReason =
        committed.length === 0
          ? 'No committed goldens yet (first bootstrap)'
          : 'No regenerated goldens found — pass --before <backup-dir> for a real comparison';
    }
  }

  if (skipped) {
    return { rows: [], worst: 0, failures: 0, skipped, skipReason, maxRatio };
  }

  const rows = [];
  let worst = 0;
  let failures = 0;
  for (const { base, oldDir, oldName, freshDir, freshName } of pairs) {
    if (!committed.includes(freshName)) {
      rows.push({ name: base, ratio: 1, note: 'missing after regeneration' });
      failures++;
      worst = 1;
      continue;
    }
    const a = readPng(oldDir, oldName);
    const b = readPng(freshDir, freshName);
    if (a.width !== b.width || a.height !== b.height) {
      rows.push({ name: base, ratio: 1, note: `size change ${a.width}x${a.height} → ${b.width}x${b.height}` });
      failures++;
      worst = 1;
      continue;
    }
    const diff = new PNG({ width: a.width, height: a.height });
    const n = pixelmatch(a.data, b.data, diff.data, a.width, a.height, { threshold: 0.1 });
    const ratio = n / (a.width * a.height);
    const over = ratio > maxRatio;
    rows.push({ name: base, ratio, note: over ? `DRIFT exceeds ${maxRatio}` : '' });
    worst = Math.max(worst, ratio);
    if (over) failures++;
  }

  return { rows, worst, failures, skipped: false, skipReason: null, maxRatio };
}
