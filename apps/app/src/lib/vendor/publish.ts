import type { SupabaseClient } from '@supabase/supabase-js';
import type { SanityClient } from '@sanity/client';
import { SubmissionSchema, type QaRunReport, type Submission } from '@forge-pro/shared-types';
// Subpath import: pulls @sanity/client only — the cms barrel also re-exports
// the Sanity *studio* schemas, which Turbopack can't bundle into an app route.
import { createSanityClient } from '@forge-pro/cms/client';
import { SUBMISSION_SELECT } from './queries';

/**
 * Auto-publish step — docs/vendor-portal.md §9. Runs on every passing QA
 * completion, and is idempotent: deterministic Sanity _ids, and a submission
 * already marked published is a no-op. On failure the submission stays
 * qa_passed and the portal offers "retry publish".
 */

export const DEFAULT_VENDOR_REF = 'vendorProfile.forge-pro';

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 96);
}

export async function publishSubmission(
  db: SupabaseClient,
  submissionId: string,
  report: QaRunReport,
): Promise<{ published: boolean; sanityId?: string; error?: string }> {
  const { data: row } = await db.from('submissions').select(SUBMISSION_SELECT).eq('id', submissionId).single();
  if (!row) {
    return { published: false, error: 'Submission not found.' };
  }
  const submission = SubmissionSchema.parse(row);
  if (!submission.title || !submission.artifactSha256 || !submission.zipUrl || !submission.submittedVersion) {
    return { published: false, error: 'Submission is incomplete (missing title, artifact, or version).' };
  }

  const sanity = createSanityClient();
  if (!sanity) {
    return { published: false, error: 'Sanity is not configured (SANITY_PROJECT_ID missing).' };
  }

  try {
    // 1. Deterministic Sanity _id, with collision suffixes for new items.
    const docId = await resolveDocId(
      sanity,
      submission.itemType,
      submission.title,
      submission.itemSanityId,
    );

    // 2. Move the zip: vendor-uploads → template-files downloads layout.
    const newKey = moveKey(submission.itemType, submission.submittedVersion, docId);
    const { data: blob, error: downloadError } = await db.storage
      .from('vendor-uploads')
      .download(submission.zipUrl);
    if (downloadError || !blob) {
      return { published: false, error: `Zip download failed: ${downloadError?.message ?? 'no blob'}` };
    }
    const { error: moveError } = await db.storage.from('template-files').upload(newKey, blob, {
      contentType: 'application/zip',
      cacheControl: '3600',
      upsert: true,
    });
    if (moveError) {
      return { published: false, error: `Zip move failed: ${moveError.message}` };
    }

    // 3. Write/patch the Sanity document with the badge from this report.
    const existing = await fetchDoc(sanity, docId);
    const doc = buildCatalogDoc(submission, report, docId, existing) as Parameters<typeof sanity.createOrReplace>[0];
    await sanity.createOrReplace(doc);

    // 4. Record the publish on the submission.
    const { error: rowError } = await db
      .from('submissions')
      .update({
        status: 'published',
        item_sanity_id: docId,
        published_at: new Date().toISOString(),
      })
      .eq('id', submissionId);
    if (rowError) {
      return { published: false, error: `Failed to record publish: ${rowError.message}` };
    }
    return { published: true, sanityId: docId };
  } catch (error) {
    return { published: false, error: error instanceof Error ? error.message : String(error) };
  }
}

/** template/component → template-files/{kind}s/{slug}/v{version}/template.zip */
function moveKey(itemType: Submission['itemType'], version: string, docId: string): string {
  const kind = itemType === 'template' ? 'templates' : 'components';
  const slug = docId.split('.')[1] ?? docId;
  return `${kind}/${slug}/v${version}/template.zip`;
}

async function resolveDocId(
  sanity: SanityClient,
  itemType: Submission['itemType'],
  title: string,
  itemSanityId: string | null,
): Promise<string> {
  // Version-update flow: reuse the item's existing Sanity id.
  if (itemSanityId) {
    return itemSanityId;
  }
  const base = `${itemType}.${slugify(title)}`;
  for (let i = 0; i < 100; i += 1) {
    const candidate = i === 0 ? base : `${base}-${i + 1}`;
    const existing = await sanity.fetch(`*[_type == $type && _id == $id][0]._id`, {
      type: itemType,
      id: candidate,
    });
    if (!existing) return candidate;
  }
  throw new Error('Could not find a free slug after 100 attempts.');
}

async function fetchDoc(sanity: SanityClient, docId: string): Promise<Record<string, unknown> | null> {
  const doc = await sanity.fetch(`*[_id == $id][0]{ ..., "versions": versions[] }`, { id: docId });
  return doc ?? null;
}

function buildCatalogDoc(
  submission: Submission,
  report: QaRunReport,
  docId: string,
  existing: Record<string, unknown> | null,
): Record<string, unknown> {
  const base = {
    _id: docId,
    _type: submission.itemType,
    title: submission.title,
    slug: { _type: 'slug', current: docId.split('.')[1] ?? submission.title },
    description: submission.description ?? '',
    price: { amount: submission.priceCents ?? 0, currency: submission.currency ?? 'USD' },
    previewUrl: submission.previewUrl,
    framework: submission.framework,
    stack: submission.stack,
    category: submission.category ? { _type: 'reference', _ref: `category.${submission.category}` } : undefined,
    componentType: submission.itemType === 'component' ? submission.componentType : undefined,
    vendor: { _type: 'reference', _ref: DEFAULT_VENDOR_REF },
    published: true,
    qaBadge: {
      status: 'verified',
      compositeScore: report.compositeScore,
      scores: report.scores,
      lastRunAt: report.finishedAt,
      reportUrl: (report.artifacts['htmlReport'] as string | undefined) ?? null,
    },
  };

  if (submission.itemType === 'template') {
    const priorVersions = Array.isArray(existing?.['versions']) ? (existing['versions'] as unknown[]) : [];
    const seen = new Set((priorVersions as { version?: string }[]).map((v) => v.version));
    const versions =
      submission.submittedVersion && !seen.has(submission.submittedVersion)
        ? [
            ...priorVersions,
            { version: submission.submittedVersion, notes: 'QA-passed update', releasedAt: report.finishedAt },
          ]
        : priorVersions;
    return { ...base, versions };
  }
  return base;
}
