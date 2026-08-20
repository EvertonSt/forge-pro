// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://pulse-template.netlify.app',
  output: 'static',
  markdown: {
    shikiConfig: {
      theme: 'github-dark'
    }
  }
});
