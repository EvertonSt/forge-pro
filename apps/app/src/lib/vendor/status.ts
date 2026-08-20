/**
 * Derived status chips — the in-queue state is *derived* from the latest
 * qa_jobs row (docs/vendor-portal.md §3), so the queue stays the single
 * source of truth for what the runner is doing.
 */
import type { SubmissionStatus } from '@forge-pro/shared-types';
import type { DemoJob } from './demo-data';

export type ChipTone = 'neutral' | 'brand' | 'success' | 'danger' | 'amber';

export interface ChipSpec {
  label: string;
  tone: ChipTone;
  pulse?: boolean;
}

export function deriveChip(status: SubmissionStatus, job: DemoJob | null): ChipSpec {
  switch (status) {
    case 'draft':
      return { label: 'Draft', tone: 'neutral' };
    case 'withdrawn':
      return { label: 'Withdrawn', tone: 'neutral' };
    case 'qa_rejected':
      return { label: 'QA rejected', tone: 'danger' };
    case 'qa_passed':
      return { label: 'QA passed', tone: 'amber' };
    case 'published':
      return { label: 'Published', tone: 'success' };
    case 'submitted':
      if (job?.status === 'running') return { label: 'Running', tone: 'brand', pulse: true };
      if (job?.status === 'error') return { label: 'Run error', tone: 'danger' };
      if (job?.status === 'queued') return { label: 'Queued', tone: 'amber' };
      return { label: 'Submitted', tone: 'neutral' };
  }
}
