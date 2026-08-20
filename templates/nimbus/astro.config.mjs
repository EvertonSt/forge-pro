import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://nimbus-template.example.com',
  output: 'static',
  build: {
    inlineStylesheets: 'auto',
  },
});
