import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import Anthropic from '@anthropic-ai/sdk';

/**
 * Anthropic client wrapper — ported from the Argus project
 * (`src/shared/ai-client.ts`, github.com/EvertonSt/argus).
 *
 * Responsibilities that must NOT leak into calling modules:
 *   - retry with exponential backoff on transient (429 / 5xx / network) errors
 *   - immediate, clear failure on auth errors (no silent hang, no retry storm)
 *   - a hard per-run cap on the number of calls, so cost is predictable
 *   - mock mode, where every "call" is served from a fixture file instead
 *
 * Calling modules just ask for text and get text back. The QA gate uses this
 * for the report narrative (M5) — never for pass/fail decisions.
 */

export interface CompletionRequest {
  /** Which pipeline stage is asking — used to pick the mock fixture. */
  purpose: string;
  system: string;
  user: string;
  maxTokens?: number;
  model?: string;
  /** Fixture file (relative to the mock root) served in mock mode. */
  mockFixture?: string;
}

export interface AiClient {
  readonly mode: 'live' | 'mock';
  /** Number of calls made so far this run. */
  readonly callCount: number;
  complete(req: CompletionRequest): Promise<string>;
}

export interface AiClientOptions {
  apiKey?: string;
  model?: string;
  /** Hard per-run cap on live calls (default 25). */
  maxCalls?: number;
  /** Mock mode: serve completions from fixture files, zero API calls. */
  mock?: boolean;
  /** Root dir for mock fixtures (required in mock mode; default ./fixtures/ai). */
  mockRoot?: string;
}

const TRANSIENT_STATUSES = new Set([408, 409, 425, 429, 500, 502, 503, 504]);
const MAX_ATTEMPTS = 4;
const BASE_DELAY_MS = 600;
const DEFAULT_MAX_CALLS = 25;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isTransient(err: unknown): boolean {
  const status = (err as { status?: number })?.status;
  if (typeof status === 'number') return TRANSIENT_STATUSES.has(status);
  const code = (err as { code?: string })?.code ?? '';
  return ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'EAI_AGAIN', 'ECONNREFUSED'].includes(code);
}

function isAuthError(err: unknown): boolean {
  const status = (err as { status?: number })?.status;
  return status === 401 || status === 403;
}

class LiveAiClient implements AiClient {
  readonly mode = 'live' as const;
  private calls = 0;
  private readonly model: string;
  private readonly maxCalls: number;
  private readonly client: Anthropic;

  constructor(client: Anthropic, model: string, maxCalls: number) {
    this.client = client;
    this.model = model;
    this.maxCalls = maxCalls;
  }

  get callCount(): number {
    return this.calls;
  }

  async complete(req: CompletionRequest): Promise<string> {
    if (this.calls >= this.maxCalls) {
      throw new Error(`AI call cap reached (${this.maxCalls}) — raise maxCalls or reduce AI stages.`);
    }

    let lastError: unknown;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
      try {
        const response = await this.client.messages.create({
          model: req.model ?? this.model,
          max_tokens: req.maxTokens ?? 1024,
          system: req.system,
          messages: [{ role: 'user', content: req.user }],
        });
        this.calls += 1;
        return response.content
          .filter((block): block is Anthropic.TextBlock => block.type === 'text')
          .map((block) => block.text)
          .join('\n');
      } catch (err) {
        lastError = err;
        if (isAuthError(err)) {
          throw new Error(`Anthropic auth error (${(err as { status?: number }).status}) — check ANTHROPIC_API_KEY.`);
        }
        if (!isTransient(err) || attempt === MAX_ATTEMPTS) break;
        await sleep(BASE_DELAY_MS * 2 ** (attempt - 1));
      }
    }
    throw lastError instanceof Error ? lastError : new Error(String(lastError));
  }
}

class MockAiClient implements AiClient {
  readonly mode = 'mock' as const;
  private calls = 0;
  private readonly root: string;

  constructor(mockRoot: string) {
    this.root = mockRoot;
  }

  get callCount(): number {
    return this.calls;
  }

  async complete(req: CompletionRequest): Promise<string> {
    if (!req.mockFixture) {
      throw new Error(`Mock AI call without a fixture (purpose: ${req.purpose}).`);
    }
    this.calls += 1;
    return readFileSync(join(this.root, req.purpose, req.mockFixture), 'utf8');
  }
}

export function createAiClient(options: AiClientOptions = {}): AiClient {
  if (options.mock) {
    const root = options.mockRoot ?? join(process.cwd(), 'fixtures', 'ai');
    return new MockAiClient(root);
  }
  const apiKey = options.apiKey ?? process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is required in live mode — or pass mock: true.');
  }
  const client = new Anthropic({ apiKey });
  return new LiveAiClient(client, options.model ?? process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-5', options.maxCalls ?? DEFAULT_MAX_CALLS);
}
