// Seeds the mock catalog into Sanity. Requires apps/studio/.env with
// SANITY_PROJECT_ID and a write-capable SANITY_TOKEN.
import { createSanityClient, seedCatalog } from '@forge-pro/cms';

const client = createSanityClient();
if (!client) {
  console.log('Seed skipped: set SANITY_PROJECT_ID (+ SANITY_TOKEN to write) in apps/studio/.env');
  process.exit(0);
}

try {
  const count = await seedCatalog(client);
  console.log(`Seeded ${count} catalog items (categories, vendor, templates, components).`);
} catch (error) {
  console.error('Seed failed:', error instanceof Error ? error.message : error);
  process.exit(1);
}
