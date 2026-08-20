import { createSanityClient, fetchCatalog, mockCatalog } from '@forge-pro/cms';
import type { CatalogItem, Money } from '@forge-pro/shared-types';

/**
 * Catalog access for storefront pages. Reads Sanity when configured;
 * falls back to the mock catalog so the site runs with zero credentials.
 */
export async function getCatalog(): Promise<CatalogItem[]> {
  const client = createSanityClient();
  if (!client) {
    return mockCatalog;
  }
  try {
    const items = await fetchCatalog(client);
    return items.length > 0 ? items : mockCatalog;
  } catch (error) {
    console.warn('[storefront] Sanity fetch failed — using mock catalog.', error);
    return mockCatalog;
  }
}

export function formatPrice(price: Money): string {
  const value = (price.amount / 100).toFixed(2);
  return `$${value} ${price.currency}`;
}
