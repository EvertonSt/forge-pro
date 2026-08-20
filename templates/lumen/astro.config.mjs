import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://lumen-template.example.com',
  output: 'static',
  build: { inlineStylesheets: 'auto' },
});
