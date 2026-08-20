/**
 * @forge-pro/cms — Sanity schemas, client, and catalog seed data.
 *
 * Sanity is the editorial source of truth for catalog *display* (templates,
 * components, vendor profiles, categories). Transactional data lives in
 * Supabase; the boundary rule is documented in docs/architecture.md §1.3.
 */

export { schemas, categorySchema, vendorProfileSchema, templateSchema, componentSchema } from './schemas/index.js';
export { createSanityClient, getSanityEnv, fetchCatalog, type SanityEnv } from './client.js';
export { mockCatalog, mockCategories, mockVendor } from './mockCatalog.js';
export { seedCatalog } from './seed.js';
