#!/usr/bin/env node
import { fileURLToPath } from 'node:url';
import { runFixture, runJob } from './run.js';

const HELP = `forge-qa — automated QA gate for Forge Pro submissions.

Usage:
  forge-qa run --job <id> [--config <path>] [--out <dir>]
  forge-qa run --url <url> [--config <path>] [--out <dir>]
  forge-qa --help

Modes:
  --job    Claim and run a queued qa_job from Supabase (needs SUPABASE_URL +
           SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY), then POST the
           report to the app's /api/qa/complete (needs APP_BASE_URL +
           APP_INTERNAL_SECRET; without them the job completes locally as a
           dev fallback). Exits 0 if the job was already claimed (idempotent
           retry).
  --url    Fixture mode: run against a URL with no database. Writes
           report.json to <out>/report.json (default: ./reports/fixture).

Exit codes: 0 = passed / already claimed · 1 = rejected · 2 = runner error
           (or completion callback failed)
`;

type Args =
  | { mode: 'help' }
  | { mode: 'url'; url: string; config?: string; out: string }
  | { mode: 'job'; jobId: string; config?: string; out: string };

function parseArgs(argv: string[]): Args | { error: string } {
  if (argv.length === 0 || argv.includes('--help') || argv.includes('-h')) {
    return { mode: 'help' };
  }

  const positional = argv.filter((a) => !a.startsWith('--'));
  const get = (name: string): string | undefined => {
    const i = argv.indexOf(name);
    return i >= 0 ? argv[i + 1] : undefined;
  };

  const out = get('--out') ?? './reports/fixture';
  const config = get('--config');

  if (positional[0] === 'run') {
    const jobId = get('--job');
    const url = get('--url');
    if (jobId) return { mode: 'job', jobId, config, out };
    if (url) return { mode: 'url', url, config, out };
    return { error: "run requires --job <id> or --url <url>" };
  }
  return { error: `unknown command '${positional[0] ?? ''}'` };
}

const isMain = process.argv[1] !== undefined && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const parsed = parseArgs(process.argv.slice(2));
  if ('error' in parsed) {
    console.error(`forge-qa: ${parsed.error}\n\n${HELP}`);
    process.exit(2);
  }
  if (parsed.mode === 'help') {
    console.log(HELP);
    process.exit(0);
  }

  try {
    const code =
      parsed.mode === 'job'
        ? await runJob(parsed.jobId, { configPath: parsed.config, outDir: parsed.out })
        : await runFixture(parsed.url, { configPath: parsed.config, outDir: parsed.out });
    process.exit(code);
  } catch (error) {
    console.error('forge-qa: fatal', error instanceof Error ? error.message : error);
    process.exit(2);
  }
}
