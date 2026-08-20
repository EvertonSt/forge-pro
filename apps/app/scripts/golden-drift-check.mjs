#!/usr/bin/env node
/**
 * Golden drift check — the strict gate on golden regeneration (CLI).
 *
 * Compares the pre-regeneration goldens against the freshly regenerated ones
 * and fails the workflow BEFORE the commit if any golden drifts past
 * `--max-ratio` (fraction of pixels, default 0.05 = 5%). The comparison math
 * lives in ./golden-drift-core.mjs (unit-tested); this file only parses
 * args, prints the report, and maps failures to an exit code.
 *
 * IMPORTANT — Playwright writes snapshots WITH a platform suffix
 * (dashboard-linux.png) and `--update-snapshots` rewrites them IN PLACE, so
 * the old copy is gone after regeneration. The gate therefore needs a backup
 * of the committed goldens taken BEFORE regenerating, passed as
 * `--before <dir>`: files are then compared by exact name.
 *
 * Usage:
 *   node scripts/golden-drift-check.mjs [snapshots-dir] [--before <dir>] [--max-ratio 0.05]
 *
 *   snapshots-dir  default: e2e/visual.spec.ts-snapshots (repo-relative or
 *                  absolute).
 *   --before <dir> a backup of the pre-regeneration goldens (same filenames).
 *                  Always pass this in the regenerate flow — the suffix-
 *                  pairing fallback never matches real Playwright output.
 *   --max-ratio    fraction of differing pixels that fails the gate.
 *
 * A missing snapshots dir, or a backup with no files (first bootstrap), is a
 * no-op pass.
 */
import { resolve } from 'node:path';
import { checkGoldenPlatform, computeGoldenDrift } from './golden-drift-core.mjs';

function fail(msg) {
  console.error(`\u274c ${msg}`);
  process.exit(1);
}

const args = process.argv.slice(2);
let dir = 'e2e/visual.spec.ts-snapshots';
let beforeDir = null;
let maxRatio = 0.05;
let checkPlatformOnly = false;
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--max-ratio') {
    const v = Number(args[++i]);
    if (!Number.isFinite(v) || v <= 0 || v >= 1) {
      fail(`invalid --max-ratio: ${args[i]} (want 0 < ratio < 1)`);
    }
    maxRatio = v;
  } else if (args[i] === '--before') {
    beforeDir = args[++i] ?? fail('--before requires a directory');
  } else if (args[i] === '--check-platform') {
    checkPlatformOnly = true;
  } else if (!args[i].startsWith('--')) {
    dir = args[i];
  }
}

// Fail-fast smoke assertion: verify the goldens are container-produced
// *-linux.png BEFORE the expensive install/build/regenerate steps. Used at
// the top of docker:regenerate and the visual-update workflow.
if (checkPlatformOnly) {
  const platform = checkGoldenPlatform(resolve(process.cwd(), dir));
  console.log(platform.message);
  process.exit(platform.ok ? 0 : 1);
}

const result = computeGoldenDrift({
  snapDir: resolve(process.cwd(), dir),
  beforeDir: beforeDir === null ? null : resolve(process.cwd(), beforeDir),
  maxRatio,
});

// A wrong-platform run (e.g. regenerating on a host OS) is a hard failure,
// not a pass — those goldens can never match what CI compares.
if (result.platformError) {
  fail(result.platformError);
}

if (result.skipped) {
  console.log(`${result.skipReason} — nothing to compare (pass).`);
  process.exit(0);
}

console.log('\nGolden drift report (committed vs freshly regenerated):');
for (const r of result.rows) {
  console.log(`  ${r.name.padEnd(32)} ${(r.ratio * 100).toFixed(2).padStart(6)}%${r.note ? `  ${r.note}` : ''}`);
}
console.log(`\nMax drift: ${(result.worst * 100).toFixed(2)}%  Threshold: ${(result.maxRatio * 100).toFixed(1)}%`);

if (result.failures > 0) {
  fail(
    `${result.failures} golden(s) drifted past the ${(result.maxRatio * 100).toFixed(1)}% threshold. ` +
      'The visual-update workflow failed BEFORE committing — inspect the report. ' +
      'If the change is intentional (a deliberate UI update), review the diff, ' +
      'then re-run the workflow (or raise the threshold deliberately).',
  );
}
console.log('All goldens within threshold — drift check passed.');
