import type { CatalogItem } from '@forge-pro/shared-types';

/**
 * Mock catalog — used two ways:
 * 1. Storefront fallback when SANITY_PROJECT_ID isn't configured (dev UX).
 * 2. Seed data for `pnpm seed` so a fresh Sanity project gets content.
 *
 * One template carries a verified QA badge so the badge UI is visible before
 * the real QA gate ships in Phase 2.
 */
export const mockCatalog: CatalogItem[] = [
  {
    kind: 'template',
    slug: 'launchpad-saas',
    title: 'Launchpad — SaaS landing',
    description:
      'A conversion-focused SaaS landing page: hero, pricing, testimonials, and a polished footer. Ships with a Lighthouse-friendly setup and zero build-time dependencies.',
    previewUrl: 'https://example.com/preview/launchpad-saas',
    price: { amount: 7900, currency: 'USD' },
    categories: ['SaaS', 'Landing'],
    framework: 'Astro',
    stack: ['Astro', 'Tailwind CSS', 'TypeScript'],
    versions: [
      { version: '1.0.0', notes: 'Initial release.', releasedAt: '2026-07-01T00:00:00Z' },
    ],
    qaBadge: {
      status: 'verified',
      compositeScore: 94,
      scores: { performance: 98, seo: 96, accessibility: 92, bestPractices: 90 },
      lastRunAt: '2026-08-10T12:00:00Z',
      reportUrl: 'https://example.com/qa-reports/launchpad-saas/latest',
    },
    published: true,
  },
  {
    kind: 'template',
    slug: 'boutique-storefront',
    title: 'Boutique — e-commerce theme',
    description:
      'A clean storefront for small brands: product grid, product detail, cart, and checkout-ready pages. Responsive from 320px up.',
    previewUrl: 'https://example.com/preview/boutique-storefront',
    price: { amount: 12900, currency: 'USD' },
    categories: ['E-commerce'],
    framework: 'Next.js',
    stack: ['Next.js', 'Tailwind CSS', 'React'],
    versions: [],
    qaBadge: { status: 'pending', compositeScore: null, scores: { performance: null, seo: null, accessibility: null, bestPractices: null }, lastRunAt: null, reportUrl: null },
    published: true,
  },
  {
    kind: 'template',
    slug: 'portfolio-aurora',
    title: 'Aurora — portfolio',
    description:
      'A bold, image-forward portfolio for designers and studios. Subtle motion, strong typography, and an about/contact flow.',
    previewUrl: 'https://example.com/preview/portfolio-aurora',
    price: { amount: 5900, currency: 'USD' },
    categories: ['Portfolio'],
    framework: 'Astro',
    stack: ['Astro', 'Tailwind CSS', 'TypeScript'],
    versions: [],
    qaBadge: { status: 'pending', compositeScore: null, scores: { performance: null, seo: null, accessibility: null, bestPractices: null }, lastRunAt: null, reportUrl: null },
    published: true,
  },
  {
    kind: 'component',
    slug: 'pricing-table',
    title: 'Pricing table',
    description:
      'Three-tier pricing table with a monthly/yearly toggle, feature comparison, and CTA states. Copy-paste ready.',
    previewUrl: 'https://example.com/preview/pricing-table',
    price: { amount: 1900, currency: 'USD' },
    categories: ['Pricing', 'SaaS'],
    framework: 'React',
    stack: ['React', 'Tailwind CSS'],
    componentType: 'Pricing',
    qaBadge: { status: 'pending', compositeScore: null, scores: { performance: null, seo: null, accessibility: null, bestPractices: null }, lastRunAt: null, reportUrl: null },
    published: true,
  },
  {
    kind: 'component',
    slug: 'sticky-nav',
    title: 'Sticky navigation',
    description:
      'Accessible sticky nav with mobile menu, active-link states, and scroll progress. Ships as a single self-contained component.',
    previewUrl: 'https://example.com/preview/sticky-nav',
    price: { amount: 1200, currency: 'USD' },
    categories: ['Navigation'],
    framework: 'Astro',
    stack: ['Astro', 'Tailwind CSS'],
    componentType: 'Navigation',
    qaBadge: { status: 'pending', compositeScore: null, scores: { performance: null, seo: null, accessibility: null, bestPractices: null }, lastRunAt: null, reportUrl: null },
    published: true,
  },
];

export const mockCategories = [
  { name: 'SaaS', slug: 'saas', description: 'SaaS landing pages and marketing sites.' },
  { name: 'E-commerce', slug: 'e-commerce', description: 'Storefronts and product catalogs.' },
  { name: 'Portfolio', slug: 'portfolio', description: 'Personal and studio portfolios.' },
  { name: 'Landing', slug: 'landing', description: 'Single-purpose landing pages.' },
  { name: 'Pricing', slug: 'pricing', description: 'Pricing and billing UI.' },
  { name: 'Navigation', slug: 'navigation', description: 'Navbars, menus, and site navigation.' },
];

export const mockVendor = {
  slug: 'forge-pro',
  title: 'Forge Pro',
  bio: 'The Forge Pro team — QA-first templates, verified before they ship.',
  website: 'https://forge-pro.example.com',
};
