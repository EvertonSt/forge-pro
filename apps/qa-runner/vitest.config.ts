import { defineConfig } from 'vitest/config';

/**
 * The runner's source uses NodeNext-style `.js` extension imports
 * (e.g. `import './config.js'`); Vite resolves those to their `.ts` sources
 * natively, and tsc's bundler resolution does the same for the typecheck
 * (tsconfig.tests.json).
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    // The callback retry test advances fake timers; keep headroom for the
    // smoke-suite-style fetches if suites are added later.
    testTimeout: 15_000,
  },
});
