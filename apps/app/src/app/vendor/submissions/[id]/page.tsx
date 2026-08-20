import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Submission } from '@forge-pro/shared-types';
import { getCurrentVendor } from '@/lib/vendor/auth';
import { getSubmissionDetail, listJobsForSubmission, getReportForJob, isDemoMode, formatPrice } from '@/lib/vendor/portal-data';
import { deriveChip } from '@/lib/vendor/status';
import { StatusChip } from '@/components/vendor/StatusChip';
import { ReportView } from '@/components/vendor/ReportView';
import { WithdrawButton } from '@/components/vendor/WithdrawButton';
import { ResubmitForm } from '@/components/vendor/ResubmitForm';
import { DemoSimulateButtons } from '@/components/vendor/DemoSimulateButtons';

export const dynamic = 'force-dynamic';

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function shortId(id: string): string {
  return id.length > 12 ? `${id.slice(0, 8)}…` : id;
}

interface TimelineEvent {
  title: string;
  meta: string;
  tone: 'neutral' | 'success' | 'brand' | 'danger';
}

function buildTimeline(
  submission: Submission,
  jobs: Array<{ id: string; status: string; createdAt: string; finishedAt: string | null; attempts: number }>,
): TimelineEvent[] {
  const events: TimelineEvent[] = [{ title: 'Draft created', meta: formatDate(submission.createdAt), tone: 'neutral' }];
  if (submission.artifactSha256) {
    events.push({ title: 'Artifact uploaded', meta: `sha256 ${submission.artifactSha256.slice(0, 12)}…`, tone: 'neutral' });
  }
  if (submission.previewUrl && submission.verificationToken) {
    events.push({ title: 'Preview URL ownership proven', meta: submission.previewUrl, tone: 'success' });
  }
  for (const job of jobs) {
    const tone = job.status === 'passed' ? 'success' : job.status === 'running' ? 'brand' : job.status === 'rejected' ? 'danger' : 'neutral';
    events.push({
      title: `QA run ${job.status}`,
      meta: `${formatDate(job.finishedAt ?? job.createdAt)} · run ${Math.max(1, job.attempts)}`,
      tone,
    });
  }
  if (submission.status === 'published') {
    events.push({ title: 'Published', meta: formatDate(submission.publishedAt), tone: 'success' });
  } else if (submission.status === 'withdrawn') {
    events.push({ title: 'Withdrawn', meta: formatDate(submission.withdrawnAt), tone: 'danger' });
  } else if (submission.status === 'qa_passed') {
    events.push({ title: 'QA passed — awaiting publish', meta: '', tone: 'brand' });
  }
  return events;
}

export default async function SubmissionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentVendor();
  const detail = await getSubmissionDetail(id);
  if (!detail) notFound();

  const { submission } = detail;
  if (user.role !== 'admin' && submission.vendorId !== user.userId) notFound();

  const chip = deriveChip(submission.status, detail.job);
  const jobs = await listJobsForSubmission(id);
  const demo = isDemoMode();

  // Latest job that produced a report, for the inline report view.
  const reportJob = jobs.find((j) => ['passed', 'rejected'].includes(j.status));
  const latestReport = reportJob ? await getReportForJob(reportJob.id) : null;

  const timeline = buildTimeline(submission, jobs);
  const title = submission.title ?? 'Untitled draft';

  const canResubmit = submission.status === 'qa_rejected';
  const canWithdraw = ['draft', 'submitted', 'qa_rejected'].includes(submission.status);

  return (
    <div>
      <div className="vp-breadcrumb">
        <Link href="/vendor" className="vp-link">
          Dashboard
        </Link>
        <span>›</span>
        <span>{shortId(submission.id)}</span>
      </div>

      <div className="vp-page-head" style={{ marginBottom: 'var(--fp-space-4)' }}>
        <div className="vp-title-row">
          <h1 className="vp-page-title">{title}</h1>
          <StatusChip spec={chip} />
          {submission.itemType === 'template' ? <span className="vp-tag vp-tag--brand">template</span> : <span className="vp-tag vp-tag--brand">component</span>}
          {submission.submittedVersion ? <span className="vp-mono vp-muted">v{submission.submittedVersion}</span> : null}
        </div>
        {canWithdraw ? (
          <div className="vp-head-actions">
            <WithdrawButton id={submission.id} />
          </div>
        ) : null}
      </div>

      <div className="vp-grid-2" style={{ marginBottom: 'var(--fp-space-6)' }}>
        <div className="vp-card">
          <div className="vp-card-head">
            <h3 className="vp-card-title">Details</h3>
          </div>
          <div className="vp-card-body">
            <dl className="vp-kv">
              <dt>Type</dt>
              <dd>{submission.itemType}</dd>
              <dt>Framework</dt>
              <dd>{submission.framework ?? '—'}</dd>
              <dt>Stack</dt>
              <dd>{submission.stack.length ? submission.stack.join(', ') : '—'}</dd>
              <dt>Category</dt>
              <dd>{submission.category ?? '—'}</dd>
              {submission.componentType ? (
                <>
                  <dt>Component type</dt>
                  <dd>{submission.componentType}</dd>
                </>
              ) : null}
              <dt>Price</dt>
              <dd>{submission.priceCents !== null ? formatPrice(submission.priceCents, submission.currency ?? 'USD') : '—'}</dd>
              <dt>Created</dt>
              <dd>{formatDate(submission.createdAt)}</dd>
            </dl>
          </div>
        </div>

        <div className="vp-card">
          <div className="vp-card-head">
            <h3 className="vp-card-title">Artifact &amp; preview</h3>
          </div>
          <div className="vp-card-body">
            <dl className="vp-kv">
              <dt>Preview URL</dt>
              <dd>
                {submission.previewUrl ? (
                  <a href={submission.previewUrl} target="_blank" rel="noreferrer" className="vp-link">
                    {submission.previewUrl}
                  </a>
                ) : (
                  '—'
                )}
              </dd>
              <dt>Ownership</dt>
              <dd>
                {submission.verificationToken ? (
                  <span className="vp-chip vp-chip--success">proven</span>
                ) : (
                  <span className="vp-chip vp-chip--neutral">not proven</span>
                )}
              </dd>
              <dt>Artifact sha256</dt>
              <dd title={submission.artifactSha256 ?? undefined}>{submission.artifactSha256 ? submission.artifactSha256.slice(0, 24) + '…' : '—'}</dd>
              <dt>Zip</dt>
              <dd className="vp-mono">{submission.zipUrl ?? '—'}</dd>
              <dt>Sanity item</dt>
              <dd className="vp-mono">{submission.itemSanityId ?? '—'}</dd>
            </dl>
          </div>
        </div>
      </div>

      <div className="vp-card" style={{ marginBottom: 'var(--fp-space-6)' }}>
        <div className="vp-card-head">
          <h3 className="vp-card-title">Timeline</h3>
        </div>
        <div className="vp-card-body">
          <ul className="vp-timeline">
            {timeline.map((event, i) => (
              <li key={i} className="vp-timeline-item">
                <span className={`vp-timeline-dot vp-timeline-dot--${event.tone}`} />
                <div className="vp-timeline-title">{event.title}</div>
                <div className="vp-timeline-meta">{event.meta}</div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {submission.status === 'submitted' && !latestReport ? (
        <div className="vp-banner vp-banner--warn">
          <div>
            <div className="vp-banner-title">QA run in progress</div>
            The gate is testing this artifact. Reports appear here when the run completes.
          </div>
        </div>
      ) : null}

      {demo && submission.status === 'submitted' && detail.job?.status === 'queued' ? (
        <div className="vp-card" style={{ marginBottom: 'var(--fp-space-6)' }}>
          <div className="vp-card-head">
            <h3 className="vp-card-title">Demo: simulate the runner</h3>
            <span className="vp-small vp-muted">this is what the real QA gate does</span>
          </div>
          <div className="vp-card-body">
            <div className="vp-notice" style={{ marginBottom: 12 }}>
              No runner is connected in demo mode, so a queued job never completes on its own. Simulating a
              completion exercises the same path the real runner&apos;s callback uses — report recorded, state
              machine advanced, report view populated.
            </div>
            <DemoSimulateButtons id={submission.id} />
          </div>
        </div>
      ) : null}

      {submission.status === 'submitted' && detail.job?.status === 'error' ? (
        <div className="vp-banner vp-banner--error" style={{ marginTop: 'var(--fp-space-4)' }}>
          <div>
            <div className="vp-banner-title">Run failed after {detail.job.attempts} attempt{detail.job.attempts === 1 ? '' : 's'}</div>
            The runner errored — this was an infrastructure failure, not a quality verdict. Resubmit to retry.
          </div>
        </div>
      ) : null}

      {submission.status === 'qa_passed' ? (
        <div className="vp-banner vp-banner--success" style={{ marginBottom: 'var(--fp-space-6)' }}>
          <div>
            <div className="vp-banner-title">QA passed — publishing</div>
            This submission passed the gate and is being published to the catalog. If publish fails you can retry
            from here.
          </div>
        </div>
      ) : null}

      {canResubmit ? (
        <div className="vp-card" style={{ marginBottom: 'var(--fp-space-6)' }} id="fix">
          <div className="vp-card-head">
            <h3 className="vp-card-title">Fix &amp; resubmit</h3>
            <span className="vp-small vp-muted">the report above shows what failed</span>
          </div>
          <div className="vp-card-body">
            {demo ? (
              <div className="vp-notice">
                Demo mode: the QA runner isn&apos;t connected, so resubmission isn&apos;t available here. In real
                mode, re-upload the fixed zip through the upload route, then this starts a fresh QA run against
                the same baseline.
              </div>
            ) : (
              <ResubmitForm id={submission.id} currentVersion={submission.submittedVersion} />
            )}
          </div>
        </div>
      ) : null}

      {latestReport ? (
        <div style={{ marginBottom: 'var(--fp-space-6)' }}>
          <div className="vp-card-head" style={{ paddingLeft: 0, paddingRight: 0 }}>
            <h3 className="vp-card-title">Latest report</h3>
            {reportJob ? (
              <Link href={`/vendor/submissions/${submission.id}/report/${reportJob.id}`} className="vp-link vp-small">
                full report →
              </Link>
            ) : null}
          </div>
          <ReportView report={latestReport} context={title} />
        </div>
      ) : null}

      {jobs.length > 0 ? (
        <div className="vp-card">
          <div className="vp-card-head">
            <h3 className="vp-card-title">QA runs</h3>
          </div>
          <table className="vp-table">
            <thead>
              <tr>
                <th>Job</th>
                <th>Status</th>
                <th>Attempts</th>
                <th>Started</th>
                <th style={{ textAlign: 'right' }}>Report</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id}>
                  <td className="vp-mono">{shortId(job.id)}</td>
                  <td>
                    <StatusChip
                      spec={
                        job.status === 'passed'
                          ? { label: 'passed', tone: 'success' }
                          : job.status === 'rejected'
                            ? { label: 'rejected', tone: 'danger' }
                            : job.status === 'running'
                              ? { label: 'running', tone: 'brand', pulse: true }
                              : job.status === 'error'
                                ? { label: 'error', tone: 'danger' }
                                : { label: 'queued', tone: 'amber' }
                      }
                    />
                  </td>
                  <td>{job.attempts}</td>
                  <td className="vp-muted">{formatDate(job.createdAt)}</td>
                  <td style={{ textAlign: 'right' }}>
                    {['passed', 'rejected'].includes(job.status) ? (
                      <Link href={`/vendor/submissions/${submission.id}/report/${job.id}`} className="vp-btn vp-btn--ghost vp-btn--sm">
                        View
                      </Link>
                    ) : (
                      <span className="vp-muted vp-small">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
