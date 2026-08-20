/** Type declarations for golden-drift-core.mjs (consumed by the TS tests). */

export interface DriftRow {
  name: string;
  /** Fraction of differing pixels (0–1); 1 means "blocking" (size change / missing). */
  ratio: number;
  note: string;
}

export interface DriftResult {
  rows: DriftRow[];
  worst: number;
  failures: number;
  /** True when there was nothing to compare (missing dirs / empty backup). */
  skipped: boolean;
  skipReason: string | null;
  /** Set when the snapshots dir holds non-container (host-OS) goldens. */
  platformError?: string | null;
  maxRatio: number;
}

export interface GoldenDriftOptions {
  /** Absolute path to the snapshots dir (post-regeneration). */
  snapDir: string;
  /** Absolute path to the backup of the committed goldens (pre-regeneration). */
  beforeDir?: string | null;
  /** Fraction of differing pixels that fails the gate (default 0.05). */
  maxRatio?: number;
}

export interface PlatformCheckResult {
  ok: boolean;
  /** Foreign (non-*-linux.png) goldens found, if any. */
  foreign: string[];
  goldens: string[];
  message: string;
}

export function checkGoldenPlatform(snapDir: string): PlatformCheckResult;

export function computeGoldenDrift(options: GoldenDriftOptions): DriftResult;
