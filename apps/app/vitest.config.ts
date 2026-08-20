import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

/**
 * The demo-loop e2e tests drive the real Next.js route handlers directly
 * (no dev server) with the `@/` path alias resolved to the app source.
 * Workspace packages (@forge-pro/*) resolve through their dist/ via pnpm's
 * node_modules symlinks — run `pnpm build` first (turbo's test task depends
 * on ^build for that reason).
 */
export default defineConfig({
  esbuild: {
    // The app's tsconfig uses jsx: preserve (Next default); make the test
    // files compile with the automatic runtime so <ReportView/> works
    // without an explicit React import.
    jsx: 'automatic',
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.{ts,tsx}'],
    // The verify step fetches a real local HTTP server; keep headroom.
    testTimeout: 30_000,
    hookTimeout: 30_000,
    // Each run gets a fresh .demo dir via DEMO_STORE_DIR; never touch the
    // developer's real `.demo/` state.
    fileParallelism: false,
  },
});
