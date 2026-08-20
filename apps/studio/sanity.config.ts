import { defineConfig } from 'sanity';
import { schemas } from '@forge-pro/cms';

// Copy apps/studio/.env.example → apps/studio/.env and set SANITY_PROJECT_ID.
const projectId = process.env.SANITY_PROJECT_ID ?? 'replace-me';
const dataset = process.env.SANITY_DATASET ?? 'production';

export default defineConfig({
  name: 'forge-pro',
  title: 'Forge Pro',
  projectId,
  dataset,
  plugins: [],
  schema: { types: schemas },
});
