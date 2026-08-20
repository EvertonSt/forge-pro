/**
 * Admin data layer (docs/vendor-portal.md §4) — the /admin views read through
 * this seam, same real/demo split as portal-data. Real mode queries via the
 * service-role client (RLS protects browser reads; writes are service-role);
 * demo mode serves fixtures + store state.
 */
import type { Submission } from '@forge-pro/shared-types';
import { getSupabase } from '@forge-pro/db';
import {
  isDemoMode,
  loadSubmissionsWithJobs,
  scoresForSubmissions,
  type SubmissionWithJob,
} from './portal-data';
import { SUBMISSION_SELECT, parseSubmission } from './queries';
import { DEMO_SUBMISSIONS, DEMO_JOBS } from './demo-data';
import {
  demoJobForSubmission,
  demoVendorName,
  isDemoUnpublished,
  listDemoApplications,
  listDemoStoreSubmissions,
} from './demo-store';

export interface VendorApplicationRow {
  id: string;
  userId: string;
  displayName: string | null;
  bio: string | null;
  website: string | null;
  email: string;
  role: 'buyer' | 'vendor' | 'admin';
  approvedAt: string | null;
  createdAt: string;
}

export interface AdminSubmissionRow extends SubmissionWithJob {
  /** Display name of the owning vendor (demo + real). */
  vendorName: string;
  /** True when an admin has unpublished the item (demo only — real lives in Sanity). */
  unpublished: boolean;
  /** Composite from the current report, or null. */
  score: number | null;
}

/** All vendor applications (pending + approved), newest first. */
export async function listVendorApplications(): Promise<VendorApplicationRow[]> {
  if (isDemoMode()) {
    return listDemoApplications();
  }
  const db = getSupabase();
  if (!db) return [];
  const { data: rows } = await db
    .from('vendor_profiles')
    .select('id, user_id, display_name, bio, website, approved_at, created_at, profiles(email, role)')
    .order('created_at', { ascending: false });
  return (rows ?? []).map((row) => {
    const profile = (row as { profiles?: { email?: string | null; role?: string | null } }).profiles ?? {};
    const role = profile.role === 'vendor' || profile.role === 'admin' || profile.role === 'buyer' ? profile.role : 'buyer';
    return {
      id: String(row.id),
      userId: String(row.user_id),
      displayName: (row.display_name as string | null) ?? null,
      bio: (row.bio as string | null) ?? null,
      website: (row.website as string | null) ?? null,
      email: profile.email ?? '',
      role,
      approvedAt: (row.approved_at as string | null) ?? null,
      createdAt: String(row.created_at),
    };
  });
}

/** All submissions across vendors, newest first, with latest job + score. */
export async function listAllSubmissions(): Promise<AdminSubmissionRow[]> {
  if (isDemoMode()) {
    const demo = DEMO_SUBMISSIONS.map((submission) => {
      const jobs = DEMO_JOBS.filter((j) => j.submissionId === submission.id).sort((a, b) =>
        a.createdAt < b.createdAt ? 1 : -1,
      );
      return { submission, job: jobs[0] ?? null };
    });
    const storeSubs = listDemoStoreSubmissions().map((submission) => ({
      submission,
      job: demoJobForSubmission(submission.id),
    }));
    const all = [...storeSubs, ...demo];
    const scores = await scoresForSubmissions(all.map((r) => r.submission));
    return all.map(({ submission, job }) => ({
      submission,
      job,
      vendorName: demoVendorName(submission.vendorId),
      unpublished: isDemoUnpublished(submission.id),
      score: scores.get(submission.id) ?? null,
    }));
  }

  const db = getSupabase();
  if (!db) return [];
  const rows = await loadSubmissionsWithJobs(db);
  const scores = await scoresForSubmissions(rows.map((r) => r.submission));
  const vendorNames = await loadVendorNames(rows.map((r) => r.submission.vendorId));
  return rows.map(({ submission, job }) => ({
    submission,
    job,
    vendorName: vendorNames.get(submission.vendorId) ?? '—',
    unpublished: false,
    score: scores.get(submission.id) ?? null,
  }));
}

async function loadVendorNames(vendorIds: string[]): Promise<Map<string, string>> {
  const db = getSupabase();
  if (!db) return new Map();
  const ids = [...new Set(vendorIds)];
  const { data: rows } = await db.from('profiles').select('id, full_name, email').in('id', ids);
  const map = new Map<string, string>();
  for (const row of rows ?? []) {
    map.set(String(row.id), String(row.full_name ?? row.email ?? ''));
  }
  return map;
}

/** Load a submission row for admin mutations (unpublish). */
export async function getAdminSubmission(id: string): Promise<Submission | null> {
  if (isDemoMode()) {
    const all = await listAllSubmissions();
    return all.find((r) => r.submission.id === id)?.submission ?? null;
  }
  const db = getSupabase();
  if (!db) return null;
  const { data: row } = await db.from('submissions').select(SUBMISSION_SELECT).eq('id', id).single();
  if (!row) return null;
  return parseSubmission(row);
}
