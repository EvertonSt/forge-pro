/**
 * e2e-timing — render a per-spec wall-clock breakdown from Playwright's JSON
 * reporter output (results.json). Wired into the CI e2e job's step summary so
 * every run shows where the time actually goes; runnable locally too.
 *
 * Usage: node scripts/e2e-timing.mjs <results.json>
 *
 * The input is produced by running Playwright with
 *   PLAYWRIGHT_JSON_OUTPUT_NAME=<file> playwright test --reporter=json,list
 * (the env var makes the json reporter write to the file; list still prints
 * to stdout). Missing/unparseable input — e.g. an infra failure before the
 * run completed — prints a one-line note and exits 0; the timing breakdown
 * must never fail the job.
 */
import { appendFileSync, readFileSync } from 'node:fs';

const file = process.argv[2];
const summaryPath = process.env.GITHUB_STEP_SUMMARY;

/** Recursively collect specs from the JSON reporter's suite tree. */
function collectSpecs(suites, acc = []) {
  for (const suite of suites) {
    acc.push(...(suite.specs ?? []));
    collectSpecs(suite.suites ?? [], acc);
  }
  return acc;
}

function fmtMs(ms) {
  if (ms >= 60_000) return `${(ms / 60_000).toFixed(1)}m`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function render(input) {
  const specs = collectSpecs(input.suites ?? []);
  if (specs.length === 0) return '(no specs in results.json)';

  const rows = specs.map((spec) => {
    // Playwright runs each test once here (retries 0); take the last result.
    const results = spec.tests.flatMap((t) => t.results);
    const last = results.at(-1);
    const duration = results.reduce((sum, r) => sum + (r.duration ?? 0), 0);
    const status = last?.status ?? 'skipped';
    const label =
      status === 'passed' ? 'passed' : status === 'skipped' ? 'skipped' : status === 'timedOut' ? 'timed out' : 'failed';
    return {
      title: spec.title,
      file: spec.file.replace(/^.*[\\/]e2e[\\/]/, 'e2e/'),
      tests: spec.tests.length,
      label,
      duration,
    };
  });

  rows.sort((a, b) => b.duration - a.duration);
  const total = rows.reduce((s, r) => s + r.duration, 0);
  const passed = rows.filter((r) => r.label === 'passed').length;

  return [
    '### e2e timing breakdown',
    '',
    '| Spec | Tests | Result | Wall time |',
    '|---|---|---|---|',
    ...rows.map(
      (r) => `| \`${r.file}\` — ${r.title} | ${r.tests} | ${r.label} | ${fmtMs(r.duration)} |`,
    ),
    '',
    `**Total: ${rows.length} spec(s), ${passed} passed, ${fmtMs(total)}**`,
  ].join('\n');
}

let input;
try {
  input = JSON.parse(readFileSync(file, 'utf8'));
} catch (error) {
  const note = `(no timing data — results.json missing or unparseable${file ? ` at ${file}` : ''}: ${error.message})`;
  console.log(note);
  process.exit(0);
}

const markdown = render(input);
if (summaryPath) {
  try {
    appendFileSync(summaryPath, `\n${markdown}\n`);
  } catch (error) {
    console.error(`e2e-timing: could not append to step summary: ${error.message}`);
  }
}
console.log(markdown);
