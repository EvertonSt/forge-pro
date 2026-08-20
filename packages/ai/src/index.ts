import Anthropic from '@anthropic-ai/sdk';

/**
 * @forge-pro/ai — Anthropic (Claude) access layer.
 *
 * Env-gated like the other service packages. The AI Concierge (Session 5) will
 * stream conversations through the Next.js app — the API key must never reach
 * the browser; it exists only in server env.
 *
 * For batch/agentic callers (the QA gate's report narrative) use
 * createAiClient from './client.js' — retry/backoff, auth fail-fast, a hard
 * per-run call cap, and a mock mode that needs no API key.
 */

export { createAiClient, type AiClient, type AiClientOptions, type CompletionRequest } from './client.js';

export const DEFAULT_MODEL = process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-5';

export function getAiEnv(): { apiKey?: string } {
  return {
    apiKey: process.env.ANTHROPIC_API_KEY,
  };
}

let cached: Anthropic | null = null;

/** Create an Anthropic client from env. Returns null when ANTHROPIC_API_KEY is unset. */
export function getAnthropic(env: { apiKey?: string } = getAiEnv()): Anthropic | null {
  if (!env.apiKey) {
    return null;
  }
  if (!cached) {
    cached = new Anthropic({ apiKey: env.apiKey });
  }
  return cached;
}
