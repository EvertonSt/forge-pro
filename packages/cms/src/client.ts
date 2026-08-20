import { createClient, type SanityClient } from '@sanity/client';
import type { CatalogItem } from '@forge-pro/shared-types';

export interface SanityEnv {
  projectId?: string;
  dataset?: string;
  token?: string;
}

export function getSanityEnv(): SanityEnv {
  return {
    projectId: process.env.SANITY_PROJECT_ID,
    dataset: process.env.SANITY_DATASET ?? 'production',
    token: process.env.SANITY_TOKEN,
  };
}

/**
 * Create a Sanity client from env. Returns null when SANITY_PROJECT_ID is
 * unset so apps can fall back to the mock catalog without crashing.
 */
export function createSanityClient(env: SanityEnv = getSanityEnv()): SanityClient | null {
  if (!env.projectId) {
    return null;
  }
  return createClient({
    projectId: env.projectId,
    dataset: env.dataset ?? 'production',
    apiVersion: '2026-08-01',
    // CDN when reading without a token; direct API when writing.
    useCdn: !env.token,
    token: env.token,
  });
}

const catalogQuery = /* groq */ `*[_type in ['template', 'component'] && published == true]{
  _type,
  _id,
  "slug": slug.current,
  title,
  description,
  previewUrl,
  price,
  "categories": category->name,
  framework,
  stack,
  componentType,
  versions[] { version, notes, releasedAt },
  qaBadge { status, compositeScore, scores, lastRunAt, reportUrl }
}`;

function mapDocToCatalogItem(doc: Record<string, unknown>): CatalogItem | null {
  const kind = doc['_type'];
  if (kind !== 'template' && kind !== 'component') {
    return null;
  }
  const categories = Array.isArray(doc['categories'])
    ? (doc['categories'] as (string | null)[]).filter((c): c is string => Boolean(c))
    : doc['categories']
      ? [doc['categories'] as string]
      : [];
  const priceRaw = (doc['price'] ?? {}) as { amount?: number; currency?: string };
  const base = {
    kind,
    slug: doc['slug'] as string,
    title: doc['title'] as string,
    description: (doc['description'] as string) ?? '',
    previewUrl: (doc['previewUrl'] as string) ?? '',
    price: {
      amount: priceRaw.amount ?? 0,
      currency: priceRaw.currency ?? 'USD',
    },
    categories,
    published: true,
    qaBadge: {
      status: ((doc['qaBadge'] as { status?: string })?.status ?? 'pending') as CatalogItem['qaBadge']['status'],
      compositeScore: (doc['qaBadge'] as { compositeScore?: number | null })?.compositeScore ?? null,
      scores: (doc['qaBadge'] as { scores?: CatalogItem['qaBadge']['scores'] })?.scores ?? {
        performance: null,
        seo: null,
        accessibility: null,
        bestPractices: null,
      },
      lastRunAt: (doc['qaBadge'] as { lastRunAt?: string | null })?.lastRunAt ?? null,
      reportUrl: (doc['qaBadge'] as { reportUrl?: string | null })?.reportUrl ?? null,
    },
  };

  if (kind === 'template') {
    return {
      ...base,
      kind: 'template',
      framework: (doc['framework'] as string) ?? '',
      stack: Array.isArray(doc['stack']) ? (doc['stack'] as string[]) : [],
      versions: Array.isArray(doc['versions'])
        ? (doc['versions'] as Array<{ version?: string; notes?: string; releasedAt?: string }>).map(
            (v) => ({ version: v.version ?? '', notes: v.notes, releasedAt: v.releasedAt })
          )
        : [],
    } as CatalogItem;
  }
  return {
    ...base,
    kind: 'component',
    framework: (doc['framework'] as string) ?? '',
    componentType: (doc['componentType'] as string) ?? '',
  } as CatalogItem;
}

/** Fetch the published catalog from Sanity and normalize it to CatalogItem[]. */
export async function fetchCatalog(client: SanityClient): Promise<CatalogItem[]> {
  const docs = (await client.fetch(catalogQuery)) as Record<string, unknown>[];
  return docs.map(mapDocToCatalogItem).filter((item): item is CatalogItem => item !== null);
}
