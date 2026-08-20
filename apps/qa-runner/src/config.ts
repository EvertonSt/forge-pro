import { readFileSync } from 'node:fs';
import { ThresholdConfigSchema, type ThresholdConfig } from '@forge-pro/shared-types';

/**
 * The ThresholdConfig *schema and defaults* live in @forge-pro/shared-types
 * (src/qa.ts) so the runner and the app share one validated contract. This
 * file only handles loading — from an optional JSON file, else the defaults.
 */
export { ThresholdConfigSchema } from '@forge-pro/shared-types';
export type { ThresholdConfig } from '@forge-pro/shared-types';

/** Load the config — from an optional JSON file, else the defaults. */
export function loadThresholdConfig(path?: string): ThresholdConfig {
  if (path) {
    const raw = readFileSync(path, 'utf8');
    return ThresholdConfigSchema.parse(JSON.parse(raw));
  }
  return ThresholdConfigSchema.parse({});
}
