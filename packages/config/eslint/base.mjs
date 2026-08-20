import tseslint from 'typescript-eslint';

/** Shared flat ESLint config used by every app and package. */
export default tseslint.config(
  {
    ignores: ['dist/**', '.next/**', '.astro/**', 'node_modules/**', 'coverage/**'],
  },
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  }
);
