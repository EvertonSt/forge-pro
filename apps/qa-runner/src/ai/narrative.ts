/**
 * AI report narrative (M5) — prompt structure ported from the Argus project
 * (`src/triage/prompt.ts`, github.com/EvertonSt/argus).
 *
 * Argus's triage stage exists to tell a real product bug apart from a flaky
 * test or a stale selector. The gate's narrative has the same shape: tell a
 * genuine template defect apart from a gate-harness artifact, and turn each
 * failed check into an actionable fix. The verdict itself stays deterministic
 * (§1) — Claude explains and triages, never passes or fails.
 *
 * Ported structure: deliberately spelled-out category definitions, explicit
 * judgement rules, strict JSON-only output with confidence/reasoning/fix.
 */

export interface NarrativeFailure {
  id: string;
  detail?: string;
}

export interface NarrativeInput {
  url: string;
  failedChecks: NarrativeFailure[];
  suiteSummaries: string[];
}

/** Ported and adapted from Argus's TRIAGE_SYSTEM_PROMPT. */
export const FAILURE_TRIAGE_SYSTEM_PROMPT = `You are a senior QA engineer writing the report for an automated template-quality gate.

Explain each failed check and classify it into exactly one verdict:

- "template_defect" — the submission genuinely fails a quality bar. The
  template's own content or layout is wrong: real horizontal overflow, a
  missing structural element, a page that does not load, broken links, or a
  Lighthouse category below threshold. This is a defect in the template.

- "harness_artifact" — the failure says more about the gate than the
  template: console noise from third-party scripts, a probe selector that was
  too strict for a legitimate layout choice, or an environment/timing issue.
  The template most likely behaves correctly.

- "minor_issue" — real but low-impact: cosmetic, below-threshold-but-close,
  or an issue that only affects an edge case.

Judgement rules:
- Horizontal overflow at a breakpoint is template_defect unless the offending
  element is the probe itself.
- A missing footer/nav/main is template_defect when the template claims to
  include one; harness_artifact when the probe list is simply mismatched.
- Console errors from the template's own code are template_defect; errors
  from third-party embeds are harness_artifact.
- Set "confidence" honestly. Ambiguous evidence deserves a value near 0.5.
- Keep "reasoning" to one or two sentences a human can scan quickly.
- For template_defect and minor_issue, "suggestedFix" must be a concrete
  change a developer could make (element, CSS rule, or config).

Respond with ONLY a JSON object. No markdown fences, no commentary:

{
  "summary": "one or two sentences for the vendor",
  "failures": [
    { "id": "overflow@320", "verdict": "template_defect", "confidence": 0.0,
      "reasoning": "one or two sentences", "suggestedFix": "concrete change" }
  ]
}`;

export function buildNarrativePrompt(input: NarrativeInput): string {
  const failures = input.failedChecks
    .map((f) => `- ${f.id}${f.detail ? ` — ${f.detail.slice(0, 300)}` : ''}`)
    .join('\n');

  return [
    `Target: ${input.url}`,
    '',
    'Failed checks:',
    failures || '- (none — score-only narrative)',
    '',
    'Suite summaries:',
    input.suiteSummaries.map((s) => `  ${s}`).join('\n'),
    '',
    'Classify each failure.',
  ].join('\n');
}
