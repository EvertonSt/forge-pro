import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getCurrentVendor } from '@/lib/vendor/auth';
import { getSubmissionDetail, getReportForJob, listJobsForSubmission } from '@/lib/vendor/portal-data';
import { deriveChip } from '@/lib/vendor/status';
import { StatusChip } from '@/components/vendor/StatusChip';
import { ReportView } from '@/components/vendor/ReportView';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Forge Pro — QA report' };

export default async function ReportPage({ params }: { params: Promise<{ id: string; jobId: string }> }) {
  const { id, jobId } = await params;
  const user = await getCurrentVendor();
  const detail = await getSubmissionDetail(id);
  if (!detail) notFound();
  if (user.role !== 'admin' && detail.submission.vendorId !== user.userId) notFound();

  const report = await getReportForJob(jobId);
  if (!report) {
    const jobs = await listJobsForSubmission(id);
    const job = jobs.find((j) => j.id === jobId);
    return (
      <div>
        <div className="vp-breadcrumb">
          <Link href="/vendor" className="vp-link">
            Dashboard
          </Link>
          <span>›</span>
          <Link href={`/vendor/submissions/${id}`} className="vp-link">
            {detail.submission.title ?? 'Submission'}
          </Link>
          <span>›</span>
          <span>report</span>
        </div>
        <div className="vp-card">
          <div className="vp-card-body vp-empty">
            {job
              ? `No report for job ${jobId.slice(0, 8)} — it ended with status “${job.status}”. Error verdicts are retryable run failures and produce no quality report.`
              : 'Job not found.'}
          </div>
        </div>
      </div>
    );
  }

  const title = detail.submission.title ?? 'Untitled draft';
  const chip = deriveChip(detail.submission.status, detail.job);

  return (
    <div>
      <div className="vp-breadcrumb">
        <Link href="/vendor" className="vp-link">
          Dashboard
        </Link>
        <span>›</span>
        <Link href={`/vendor/submissions/${id}`} className="vp-link">
          {title}
        </Link>
        <span>›</span>
        <span>report</span>
      </div>

      <div className="vp-page-head" style={{ marginBottom: 'var(--fp-space-4)' }}>
        <div className="vp-title-row">
          <h1 className="vp-page-title">QA report</h1>
          <StatusChip spec={chip} />
          <span className="vp-mono vp-muted">job {jobId.slice(0, 8)}…</span>
        </div>
        <div className="vp-head-actions">
          <Link href={`/vendor/submissions/${id}`} className="vp-btn vp-btn--ghost vp-btn--sm">
            ← Back to submission
          </Link>
        </div>
      </div>

      <ReportView report={report} context={title} />
    </div>
  );
}
