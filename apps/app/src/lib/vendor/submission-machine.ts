import type { SubmissionStatus, Verdict } from '@forge-pro/shared-types';

/**
 * The submission state machine — docs/vendor-portal.md §3.
 *
 * Pure and synchronous so every transition is unit-testable. The app applies
 * it around DB writes; the DB row is the source of truth, this only decides
 * what a transition is *allowed* to do next.
 */

export type SubmissionEvent =
  | { type: 'submit' }
  | { type: 'qa_completed'; verdict: Verdict }
  | { type: 'resubmit' }
  | { type: 'withdraw' }
  | { type: 'publish' };

/** Next status for a transition, or the current status when it's illegal. */
export function nextStatus(current: SubmissionStatus, event: SubmissionEvent): SubmissionStatus {
  switch (event.type) {
    case 'submit':
      return current === 'draft' ? 'submitted' : current;
    case 'qa_completed':
      if (current === 'submitted') {
        if (event.verdict === 'passed') return 'qa_passed';
        if (event.verdict === 'rejected') return 'qa_rejected';
        // 'error' — retryable run failure; submission stays submitted.
        return 'submitted';
      }
      return current;
    case 'resubmit':
      return current === 'qa_rejected' ? 'submitted' : current;
    case 'withdraw':
      return current === 'draft' || current === 'submitted' || current === 'qa_rejected'
        ? 'withdrawn'
        : current;
    case 'publish':
      return current === 'qa_passed' ? 'published' : current;
  }
}

/** True when the transition changes the status (i.e. it's legal). */
export function canTransition(current: SubmissionStatus, event: SubmissionEvent): boolean {
  return nextStatus(current, event) !== current;
}
