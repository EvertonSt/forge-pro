// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://quill-template.netlify.app',
  output: 'static',
  markdown: {
    shikiConfig: {
      theme: 'github-dark',
    },
  },
});
