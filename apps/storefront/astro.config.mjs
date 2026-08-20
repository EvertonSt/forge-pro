import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

// Static-by-default: the storefront is read-heavy and SEO-critical. Islands
// (concierge chat, search) hydrate only where needed.
export default defineConfig({
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
  output: 'static',
});
