import type { SanityClient } from '@sanity/client';
import { mockCategories, mockCatalog, mockVendor } from './mockCatalog.js';

/**
 * Seed the mock catalog into a Sanity project using deterministic _ids
 * (category.<slug>, template.<slug>, ...) so re-running is idempotent.
 * Requires a write token on the client.
 */
export async function seedCatalog(client: SanityClient): Promise<number> {
  const transaction = client.transaction();

  for (const category of mockCategories) {
    transaction.createOrReplace({
      _id: `category.${category.slug}`,
      _type: 'category',
      title: category.name,
      slug: { _type: 'slug', current: category.slug },
      description: category.description,
    });
  }

  transaction.createOrReplace({
    _id: `vendorProfile.${mockVendor.slug}`,
    _type: 'vendorProfile',
    title: mockVendor.title,
    slug: { _type: 'slug', current: mockVendor.slug },
    bio: mockVendor.bio,
    website: mockVendor.website,
  });

  for (const item of mockCatalog) {
    const docId = `${item.kind}.${item.slug}`;
    const base = {
      title: item.title,
      slug: { _type: 'slug', current: item.slug },
      description: item.description,
      price: { amount: item.price.amount, currency: item.price.currency },
      previewUrl: item.previewUrl,
      framework: item.framework,
      stack: item.stack,
      category: item.categories[0]
        ? { _type: 'reference', _ref: `category.${slugify(item.categories[0])}` }
        : undefined,
      vendor: { _type: 'reference', _ref: `vendorProfile.${mockVendor.slug}` },
      published: item.published,
      qaBadge: item.qaBadge,
    };

    if (item.kind === 'template') {
      transaction.createOrReplace({
        _id: docId,
        _type: 'template',
        ...base,
        versions: item.versions.map((v) => ({
          version: v.version,
          notes: v.notes,
          releasedAt: v.releasedAt,
        })),
      });
    } else {
      transaction.createOrReplace({
        _id: docId,
        _type: 'component',
        ...base,
        componentType: item.componentType,
      });
    }
  }

  await transaction.commit();
  return mockCatalog.length;
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
