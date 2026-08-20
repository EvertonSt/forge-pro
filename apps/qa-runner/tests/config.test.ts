/**
 * ThresholdConfig loading (src/config.ts) — the schema + defaults live in
 * @forge-pro/shared-types; this covers the loading seam: defaults when no
 * file is given, override+default merging from a JSON file, and the failure
 * modes (invalid config, missing file).
 */
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ZodError } from 'zod';
import { loadThresholdConfig } from '../src/config.js';

let dir: string;

beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), 'forge-config-test-'));
});

afterAll(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe('loadThresholdConfig', () => {
  it('returns the shared defaults when no config file is given', () => {
    const config = loadThresholdConfig();
    expect(config.schemaVersion).toBe(1);
    expect(config.lighthouse.weights).toEqual({
      performance: 0.3,
      seo: 0.2,
      accessibility: 0.35,
      bestPractices: 0.15,
    });
    expect(config.lighthouse.minScores).toEqual({ performance: 55, seo: 85, accessibility: 85, bestPractices: 80 });
    expect(config.lighthouse.minComposite).toBe(75);
    expect(config.responsive.breakpoints).toEqual([320, 768, 1280, 1920]);
    expect(config.responsive.maxConsoleErrors).toBe(0);
    expect(config.links.maxDepth).toBe(3);
    expect(config.visual.diffTolerancePct).toBe(0.1);
    expect(config.retry.maxAttempts).toBe(2);
  });

  it('loads a custom JSON config, merging overrides with defaults', async () => {
    const file = join(dir, 'thresholds.json');
    await writeFile(
      file,
      JSON.stringify({
        lighthouse: { minComposite: 80, minScores: { performance: 60, seo: 80, accessibility: 80, bestPractices: 75 } },
        retry: { maxAttempts: 4 },
      }),
    );
    const config = loadThresholdConfig(file);
    expect(config.lighthouse.minComposite).toBe(80);
    expect(config.lighthouse.minScores.performance).toBe(60);
    // Untouched keys keep the shared defaults.
    expect(config.lighthouse.weights.accessibility).toBe(0.35);
    expect(config.responsive.breakpoints).toEqual([320, 768, 1280, 1920]);
    expect(config.retry.maxAttempts).toBe(4);
    expect(config.retry.backoffSeconds).toBe(30);
  });

  it('rejects an invalid config with a ZodError', async () => {
    const file = join(dir, 'invalid.json');
    await writeFile(file, JSON.stringify({ lighthouse: { minComposite: 'high' } }));
    expect(() => loadThresholdConfig(file)).toThrow(ZodError);
  });

  it('throws when the config file is missing', () => {
    expect(() => loadThresholdConfig(join(dir, 'does-not-exist.json'))).toThrow();
  });
});
