import tailwind from 'prettier-plugin-tailwindcss';

/** Shared Prettier config (wired from the repo root via "prettier" field). */
export default {
  plugins: [tailwind],
  printWidth: 100,
  singleQuote: true,
  trailingComma: 'all',
};
