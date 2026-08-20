/**
 * Demo data for the vendor portal — used only when Supabase is not configured
 * (see portal-data.ts). Kept typed against the shared contracts so the UI
 * renders the exact shapes it will see in production; nothing here is
 * fabricated at runtime, it's a static snapshot of what real rows look like.
 */
import type { QaRunReport, Submission } from '@forge-pro/shared-types';

const DAY = 86_400_000;

/**
 * Fixture timestamps are relative to now so the demo always looks recent.
 * Under the Playwright e2e, DEMO_FIXED_NOW (ms epoch, set in the webServer
 * env) pins the clock so golden screenshots are deterministic across runs
 * and machines.
 */
function iso(daysAgo: number, hour = 10): string {
  const fixed = process.env.DEMO_FIXED_NOW ? Number(process.env.DEMO_FIXED_NOW) : NaN;
  const base = Number.isFinite(fixed) ? new Date(fixed) : new Date();
  return new Date(base.getTime() - daysAgo * DAY - hour * 3_600_000).toISOString();
}

/** Mirrors the qa_jobs row contract (docs/architecture.md §3.1). */
export interface DemoJob {
  id: string;
  submissionId: string;
  status: 'queued' | 'running' | 'passed' | 'rejected' | 'error';
  attempts: number;
  createdAt: string;
  finishedAt: string | null;
}

export const DEMO_VENDOR_ID = 'vendor-demo';
export const DEMO_ADMIN_ID = 'admin-demo';

/** A vendor application row — vendor_profiles joined with profiles. */
export interface DemoVendorApplication {
  id: string;
  userId: string;
  displayName: string | null;
  bio: string | null;
  website: string | null;
  email: string;
  role: 'buyer' | 'vendor' | 'admin';
  approvedAt: string | null;
  createdAt: string;
}

export const DEMO_VENDOR_APPLICATIONS: DemoVendorApplication[] = [
  {
    id: 'vendorapp_pending_maya',
    userId: 'user-maya',
    displayName: 'Maya Chen',
    bio: 'Design engineer building accessible interfaces for 6 years.',
    website: 'https://maya.studio',
    email: 'maya@maya.studio',
    role: 'buyer',
    approvedAt: null,
    createdAt: iso(2, 9),
  },
  {
    id: 'vendorapp_pending_jon',
    userId: 'user-jon',
    displayName: 'Jon Rivers',
    bio: null,
    website: 'https://jon.dev',
    email: 'jon@jon.dev',
    role: 'buyer',
    approvedAt: null,
    createdAt: iso(1, 17),
  },
  {
    id: 'vendorapp_approved_diego',
    userId: 'user-diego',
    displayName: 'Diego Souza',
    bio: 'Solo maker shipping small, focused component kits.',
    website: 'https://diego.dev',
    email: 'diego@diego.dev',
    role: 'vendor',
    approvedAt: iso(20, 12),
    createdAt: iso(25, 10),
  },
];

/** Vendor display names for the admin submissions table (demo). */
export const DEMO_VENDOR_NAMES: Record<string, string> = {
  [DEMO_VENDOR_ID]: 'You (demo vendor)',
  'user-diego': 'Diego Souza',
};

// ---------------------------------------------------------------------------
// Reports
// ---------------------------------------------------------------------------

const PASSED_SMOKE = [
  { id: 'overflow@320', status: 'passed' as const },
  { id: 'overflow@768', status: 'passed' as const },
  { id: 'overflow@1280', status: 'passed' as const },
  { id: 'overflow@1920', status: 'passed' as const },
  { id: 'probe:main@320', status: 'passed' as const },
  { id: 'probe:header@768', status: 'passed' as const },
  { id: 'probe:footer@1280', status: 'passed' as const },
  { id: 'probe:main@1920', status: 'passed' as const },
];

export const REP_PUBLISHED: QaRunReport = {
  schemaVersion: 1,
  submissionId: 'sub_published',
  jobId: 'job_published_1',
  artifactSha256: 'a1f3c9d2e4b5a6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1',
  runnerVersion: '0.1.0',
  startedAt: '2026-08-14T09:12:00Z',
  finishedAt: '2026-08-14T09:18:42Z',
  thresholds: {
    schemaVersion: 1,
    lighthouse: {
      formFactor: 'mobile',
      runs: 1,
      minScores: { performance: 55, seo: 85, accessibility: 85, bestPractices: 80 },
      minComposite: 75,
      weights: { performance: 0.3, seo: 0.2, accessibility: 0.35, bestPractices: 0.15 },
    },
    responsive: {
      breakpoints: [320, 768, 1280, 1920],
      maxConsoleErrors: 0,
      probes: ['main', 'header', 'footer'],
      navigationTimeoutMs: 30_000,
    },
    links: { maxDepth: 3, maxUrls: 50, allowlist: [], checkExternal: true, failOnExternal: false },
    visual: { breakpoints: [320, 768, 1280], diffTolerancePct: 0.1 },
    retry: { maxAttempts: 2, backoffSeconds: 30 },
  },
  verdict: 'passed',
  compositeScore: 84.2,
  scores: { performance: 62, seo: 91, accessibility: 89, bestPractices: 84 },
  suites: {
    smoke: { status: 'passed', checks: PASSED_SMOKE, consoleErrors: [] },
    links: { status: 'passed', broken: [], total: 37 },
    visual: { status: 'passed', diffPct: 0.02, isBaseline: false },
    lighthouse: { status: 'passed', composite: 84.2, lcp: 1.9, cls: 0.02, tbt: 120 },
  },
  artifacts: {
    htmlReport: 'qa-artifacts/sub_published/job_published_1/report.html',
    screenshots: [
      'qa-artifacts/sub_published/job_published_1/visual/1280-current.png',
      'qa-artifacts/sub_published/job_published_1/visual/1280-diff.png',
    ],
    lighthouseHtml: 'qa-artifacts/sub_published/job_published_1/lighthouse/mobile-report.html',
  },
  aiNarrative: null,
};

export const REP_PASSED_PENDING: QaRunReport = {
  ...REP_PUBLISHED,
  submissionId: 'sub_passed',
  jobId: 'job_passed_1',
  artifactSha256: 'b2c4d0e3f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2',
  startedAt: '2026-08-13T15:40:00Z',
  finishedAt: '2026-08-13T15:46:11Z',
  compositeScore: 89.1,
  scores: { performance: 88, seo: 90, accessibility: 92, bestPractices: 85 },
  suites: {
    smoke: { status: 'passed', checks: PASSED_SMOKE, consoleErrors: [] },
    links: { status: 'passed', broken: [], total: 24 },
    visual: { status: 'passed', diffPct: 0, isBaseline: true },
    lighthouse: { status: 'passed', composite: 89.1, lcp: 1.2, cls: 0.01, tbt: 90 },
  },
};

const FAILED_SMOKE = [
  { id: 'overflow@320', status: 'failed' as const, detail: 'scrollWidth 496px exceeds viewport width 320px' },
  { id: 'overflow@768', status: 'passed' as const },
  { id: 'overflow@1280', status: 'passed' as const },
  { id: 'overflow@1920', status: 'passed' as const },
  { id: 'probe:main@320', status: 'passed' as const },
  { id: 'probe:header@768', status: 'passed' as const },
  { id: 'probe:footer@1280', status: 'failed' as const, detail: "selector 'footer' is not visible at 1280px" },
  { id: 'probe:main@1920', status: 'passed' as const },
  { id: 'console-errors', status: 'failed' as const, detail: '3 console errors exceeded budget of 0' },
];

export const REP_REJECTED: QaRunReport = {
  schemaVersion: 1,
  submissionId: 'sub_rejected',
  jobId: 'job_rejected_2',
  artifactSha256: 'c3d5e1f4a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c3',
  runnerVersion: '0.1.0',
  startedAt: '2026-08-14T11:02:00Z',
  finishedAt: '2026-08-14T11:08:19Z',
  thresholds: REP_PUBLISHED.thresholds,
  verdict: 'rejected',
  compositeScore: 57.3,
  scores: { performance: 41, seo: 78, accessibility: 64, bestPractices: 58 },
  suites: {
    smoke: {
      status: 'failed',
      checks: FAILED_SMOKE,
      consoleErrors: [
        "TypeError: Cannot read properties of undefined (reading 'map') — main.bundle.js:141",
        "Uncaught ReferenceError: nimbus is not defined — vendor.js:12",
        'Failed to load resource: 404 (Not Found) — /assets/img/logo.png',
      ],
    },
    links: {
      status: 'failed',
      broken: ['/missing.html', '/assets/img/logo.png', 'https://fonts.googleapis.com/css?family=Nimbus'],
      total: 41,
    },
    visual: { status: 'failed', diffPct: 4.2, isBaseline: false },
    lighthouse: { status: 'failed', composite: 57.3, lcp: 4.8, cls: 0.34, tbt: 480 },
  },
  artifacts: {
    htmlReport: 'qa-artifacts/sub_rejected/job_rejected_2/report.html',
    screenshots: [
      'qa-artifacts/sub_rejected/job_rejected_2/visual/1280-current.png',
      'qa-artifacts/sub_rejected/job_rejected_2/visual/1280-diff.png',
    ],
    brokenLinks: 'qa-artifacts/sub_rejected/job_rejected_2/links/broken.json',
    lighthouseHtml: 'qa-artifacts/sub_rejected/job_rejected_2/lighthouse/mobile-report.html',
  },
  aiNarrative: {
    summary:
      'The template fails responsive checks at 320px (horizontal overflow), is missing the footer element at tablet width, and throws a client-side error that breaks the main grid. Lighthouse accessibility is below the 85 threshold, mostly due to missing labels and low color contrast on buttons.',
    issues: [
      {
        severity: 'high',
        category: 'template_defect',
        title: 'Horizontal overflow at 320px',
        detail:
          'The pricing grid uses a fixed min-width of 480px. At 320px the page scrolls sideways, which breaks mobile layout.',
        suggestedFix:
          'Replace fixed min-width with `minmax(0, 1fr)` grid columns, or add `overflow-x: clip` on the section and let cards wrap.',
      },
      {
        severity: 'high',
        category: 'template_defect',
        title: 'Runtime error in main.bundle.js:141',
        detail:
          "`products.map` is called before the data has loaded, so the initial render throws and the grid never paints.",
        suggestedFix:
          'Guard the map with an early return while `products` is undefined, or default it to an empty array.',
      },
      {
        severity: 'medium',
        category: 'minor_issue',
        title: 'Footer missing at 1280px',
        detail:
          'The footer is present in the DOM but hidden by a media query that never matches, so it is invisible at tablet width.',
        suggestedFix:
          'Check the breakpoint in the footer media query — it likely targets 1024px while the layout switches columns at 1280px.',
      },
    ],
  },
};

export const REP_DIEGO_PASSED: QaRunReport = {
  ...REP_PUBLISHED,
  submissionId: 'sub_diego_published',
  jobId: 'job_diego_published_1',
  artifactSha256: 'a2b4c6d8e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5',
  startedAt: iso(1, 11),
  finishedAt: iso(1, 11),
  compositeScore: 78.4,
  scores: { performance: 71, seo: 88, accessibility: 84, bestPractices: 79 },
  suites: {
    smoke: { status: 'passed', checks: PASSED_SMOKE, consoleErrors: [] },
    links: { status: 'passed', broken: [], total: 29 },
    visual: { status: 'passed', diffPct: 0.03, isBaseline: false },
    lighthouse: { status: 'passed', composite: 78.4, lcp: 2.4, cls: 0.03, tbt: 210 },
  },
};

export const REP_DIEGO_REJECTED: QaRunReport = {
  ...REP_REJECTED,
  submissionId: 'sub_diego_rejected',
  jobId: 'job_diego_rejected_1',
  artifactSha256: 'b3c5d7e9f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f6',
  startedAt: iso(2, 16),
  finishedAt: iso(2, 16),
  compositeScore: 63.1,
  scores: { performance: 58, seo: 80, accessibility: 61, bestPractices: 66 },
  suites: {
    smoke: {
      status: 'failed',
      checks: [
        { id: 'probe:footer@768', status: 'failed' as const, detail: "selector 'footer' is not visible at 768px" },
        { id: 'console-errors', status: 'failed' as const, detail: '2 console errors exceeded budget of 0' },
      ],
      consoleErrors: ['Warning: validateDOMNesting — <p> cannot appear as a child of <button> — Form.js:22'],
    },
    links: { status: 'passed', broken: [], total: 18 },
    visual: { status: 'failed', diffPct: 1.9, isBaseline: false },
    lighthouse: { status: 'failed', composite: 63.1, lcp: 3.1, cls: 0.09, tbt: 340 },
  },
};

export const REP_WITHDRAWN: QaRunReport = {
  ...REP_REJECTED,
  submissionId: 'sub_withdrawn',
  jobId: 'job_withdrawn_1',
  artifactSha256: 'd4e6f2a5b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c4',
  startedAt: '2026-08-09T13:20:00Z',
  finishedAt: '2026-08-09T13:25:44Z',
  compositeScore: 61.8,
  scores: { performance: 55, seo: 82, accessibility: 68, bestPractices: 60 },
  suites: {
    smoke: {
      status: 'failed',
      checks: [
        { id: 'overflow@320', status: 'failed' as const, detail: 'scrollWidth 412px exceeds viewport width 320px' },
        { id: 'probe:footer@768', status: 'failed' as const, detail: "selector 'footer' is not visible at 768px" },
      ],
      consoleErrors: [],
    },
    links: { status: 'passed', broken: [], total: 12 },
    visual: { status: 'passed', diffPct: 0.8, isBaseline: false },
    lighthouse: { status: 'failed', composite: 61.8, lcp: 3.4, cls: 0.12, tbt: 310 },
  },
  aiNarrative: null,
};

// ---------------------------------------------------------------------------
// Submissions + jobs
// ---------------------------------------------------------------------------

export const DEMO_SUBMISSIONS: Submission[] = [
  {
    id: 'sub_published',
    vendorId: DEMO_VENDOR_ID,
    itemType: 'template',
    status: 'published',
    title: 'Aurora Landing Page',
    description:
      'A conversion-focused SaaS landing page template with hero, pricing grid, FAQ accordion, and testimonial sections. Fully responsive, WCAG-tagged semantic markup, and zero-dependency animations.',
    framework: 'Astro',
    stack: ['Tailwind', 'TypeScript'],
    category: 'landing-page',
    componentType: null,
    priceCents: 12_900,
    currency: 'USD',
    screenshots: ['vendor-uploads/sub_published/screens/hero.png'],
    previewUrl: 'https://aurora-demo.forge.pro',
    verificationToken: '3f2a8c41e7b09d56',
    zipUrl: 'vendor-uploads/sub_published/source-a1f3c9d2e4b5.zip',
    artifactSha256: 'a1f3c9d2e4b5a6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1',
    submittedVersion: '1.2.0',
    itemSanityId: 'template.aurora-landing-page',
    currentQaReportId: 'rep_published',
    withdrawnAt: null,
    publishedAt: iso(1, 9),
    createdAt: iso(4, 14),
  },
  {
    id: 'sub_rejected',
    vendorId: DEMO_VENDOR_ID,
    itemType: 'component',
    status: 'qa_rejected',
    title: 'Nimbus Dashboard Kit',
    description:
      'A set of dashboard primitives: data tables, stat cards, charts, and an activity feed. Includes light/dark theming and keyboard-navigable widgets.',
    framework: 'React',
    stack: ['TypeScript', 'Tailwind'],
    category: 'dashboard',
    componentType: 'kit',
    priceCents: 8_900,
    currency: 'USD',
    screenshots: [],
    previewUrl: 'https://nimbus-demo.forge.pro',
    verificationToken: 'b7d1e93f2a604c81',
    zipUrl: 'vendor-uploads/sub_rejected/source-c3d5e1f4a6b7.zip',
    artifactSha256: 'c3d5e1f4a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c3',
    submittedVersion: '0.9.1',
    itemSanityId: null,
    currentQaReportId: 'rep_rejected',
    withdrawnAt: null,
    publishedAt: null,
    createdAt: iso(2, 11),
  },
  {
    id: 'sub_running',
    vendorId: DEMO_VENDOR_ID,
    itemType: 'template',
    status: 'submitted',
    title: 'Pulse Blog Theme',
    description:
      'A minimal, typography-first blog theme with a reading-progress bar, estimated read time, and a newsletter signup block.',
    framework: 'Astro',
    stack: ['MDX'],
    category: 'blog',
    componentType: null,
    priceCents: 6_900,
    currency: 'USD',
    screenshots: [],
    previewUrl: 'https://pulse-demo.forge.pro',
    verificationToken: 'c8e2f0a4b3d51792',
    zipUrl: 'vendor-uploads/sub_running/source-e5f7a3b6c8d9.zip',
    artifactSha256: 'e5f7a3b6c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c5',
    submittedVersion: '1.0.0',
    itemSanityId: null,
    currentQaReportId: null,
    withdrawnAt: null,
    publishedAt: null,
    createdAt: iso(1, 16),
  },
  {
    id: 'sub_errored',
    vendorId: DEMO_VENDOR_ID,
    itemType: 'component',
    status: 'submitted',
    title: 'Cinder Form Kit',
    description:
      'Accessible form components: inputs with validation states, select menus, date pickers, and a file upload dropzone.',
    framework: 'React',
    stack: ['Zod', 'Tailwind'],
    category: 'forms',
    componentType: 'kit',
    priceCents: 4_900,
    currency: 'USD',
    screenshots: [],
    previewUrl: 'https://cinder-demo.forge.pro',
    verificationToken: 'd9f3a1b5c4e62803',
    zipUrl: 'vendor-uploads/sub_errored/source-f6a8b4c7d9e0.zip',
    artifactSha256: 'f6a8b4c7d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c6',
    submittedVersion: '1.1.0',
    itemSanityId: null,
    currentQaReportId: null,
    withdrawnAt: null,
    publishedAt: null,
    createdAt: iso(1, 8),
  },
  {
    id: 'sub_passed',
    vendorId: DEMO_VENDOR_ID,
    itemType: 'template',
    status: 'qa_passed',
    title: 'Halcyon Portfolio',
    description:
      'A portfolio template with a project grid, case-study pages, and a contact section. Built for photographers and designers.',
    framework: 'Astro',
    stack: ['Tailwind'],
    category: 'portfolio',
    componentType: null,
    priceCents: 11_900,
    currency: 'USD',
    screenshots: [],
    previewUrl: 'https://halcyon-demo.forge.pro',
    verificationToken: 'e0a4b2c6d5f73914',
    zipUrl: 'vendor-uploads/sub_passed/source-b2c4d0e3f5a6.zip',
    artifactSha256: 'b2c4d0e3f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2',
    submittedVersion: '1.0.0',
    itemSanityId: null,
    currentQaReportId: 'rep_passed',
    withdrawnAt: null,
    publishedAt: null,
    createdAt: iso(2, 15),
  },
  {
    id: 'sub_draft',
    vendorId: DEMO_VENDOR_ID,
    itemType: 'template',
    status: 'draft',
    title: null,
    description: null,
    framework: null,
    stack: [],
    category: null,
    componentType: null,
    priceCents: null,
    currency: null,
    screenshots: [],
    previewUrl: null,
    verificationToken: 'f1b5c3d7e6a84925',
    zipUrl: null,
    artifactSha256: null,
    submittedVersion: null,
    itemSanityId: null,
    currentQaReportId: null,
    withdrawnAt: null,
    publishedAt: null,
    createdAt: iso(0, 18),
  },
  {
    id: 'sub_diego_published',
    vendorId: 'user-diego',
    itemType: 'template',
    status: 'published',
    title: 'Fjord Marketing Site',
    description:
      'A clean marketing site template for product launches: hero, feature grid, pricing, and a changelog section. Built to pass the QA gate on the first run.',
    framework: 'Astro',
    stack: ['Tailwind'],
    category: 'marketing',
    componentType: null,
    priceCents: 10_900,
    currency: 'USD',
    screenshots: [],
    previewUrl: 'https://fjord-demo.forge.pro',
    verificationToken: 'b0c2d4e6f8a1b3c5',
    zipUrl: 'vendor-uploads/sub_diego_published/source-a2b4c6d8e0f1.zip',
    artifactSha256: 'a2b4c6d8e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5',
    submittedVersion: '1.1.0',
    itemSanityId: 'template.fjord-marketing-site',
    currentQaReportId: 'rep_diego_passed',
    withdrawnAt: null,
    publishedAt: iso(1, 11),
    createdAt: iso(6, 13),
  },
  {
    id: 'sub_diego_rejected',
    vendorId: 'user-diego',
    itemType: 'component',
    status: 'qa_rejected',
    title: 'Reef Form Elements',
    description:
      'Accessible form primitives with validation states and focus management. Currently failing the gate on contrast and console noise.',
    framework: 'React',
    stack: ['TypeScript'],
    category: 'forms',
    componentType: 'kit',
    priceCents: 4_500,
    currency: 'USD',
    screenshots: [],
    previewUrl: 'https://reef-demo.forge.pro',
    verificationToken: 'c1d3e5f7a9b2c4d6',
    zipUrl: 'vendor-uploads/sub_diego_rejected/source-b3c5d7e9f1a2.zip',
    artifactSha256: 'b3c5d7e9f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f6',
    submittedVersion: '0.8.0',
    itemSanityId: null,
    currentQaReportId: 'rep_diego_rejected',
    withdrawnAt: null,
    publishedAt: null,
    createdAt: iso(2, 16),
  },
  {
    id: 'sub_withdrawn',
    vendorId: DEMO_VENDOR_ID,
    itemType: 'component',
    status: 'withdrawn',
    title: 'Vex Modal Component',
    description:
      'A focus-trapped, scroll-locked modal component with keyboard dismissal and ARIA wiring.',
    framework: 'React',
    stack: [],
    category: 'overlays',
    componentType: 'single',
    priceCents: 3_900,
    currency: 'USD',
    screenshots: [],
    previewUrl: 'https://vex-demo.forge.pro',
    verificationToken: 'a2c6d4e8f7b95036',
    zipUrl: 'vendor-uploads/sub_withdrawn/source-d4e6f2a5b7c8.zip',
    artifactSha256: 'd4e6f2a5b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c4',
    submittedVersion: '0.4.0',
    itemSanityId: null,
    currentQaReportId: 'rep_withdrawn',
    withdrawnAt: iso(1, 7),
    publishedAt: null,
    createdAt: iso(3, 13),
  },
];

export const DEMO_JOBS: DemoJob[] = [
  {
    id: 'job_published_1',
    submissionId: 'sub_published',
    status: 'passed',
    attempts: 0,
    createdAt: iso(1, 9),
    finishedAt: iso(1, 9),
  },
  {
    id: 'job_rejected_1',
    submissionId: 'sub_rejected',
    status: 'rejected',
    attempts: 0,
    createdAt: iso(3, 12),
    finishedAt: iso(3, 12),
  },
  {
    id: 'job_rejected_2',
    submissionId: 'sub_rejected',
    status: 'rejected',
    attempts: 0,
    createdAt: iso(2, 11),
    finishedAt: iso(2, 11),
  },
  {
    id: 'job_running_1',
    submissionId: 'sub_running',
    status: 'running',
    attempts: 0,
    createdAt: iso(1, 16),
    finishedAt: null,
  },
  {
    id: 'job_errored_1',
    submissionId: 'sub_errored',
    status: 'error',
    attempts: 2,
    createdAt: iso(1, 12),
    finishedAt: iso(1, 12),
  },
  {
    id: 'job_errored_2',
    submissionId: 'sub_errored',
    status: 'error',
    attempts: 2,
    createdAt: iso(1, 8),
    finishedAt: iso(1, 8),
  },
  {
    id: 'job_passed_1',
    submissionId: 'sub_passed',
    status: 'passed',
    attempts: 0,
    createdAt: iso(2, 15),
    finishedAt: iso(2, 15),
  },
  {
    id: 'job_withdrawn_1',
    submissionId: 'sub_withdrawn',
    status: 'rejected',
    attempts: 0,
    createdAt: iso(3, 13),
    finishedAt: iso(3, 13),
  },
  {
    id: 'job_diego_published_1',
    submissionId: 'sub_diego_published',
    status: 'passed',
    attempts: 0,
    createdAt: iso(1, 11),
    finishedAt: iso(1, 11),
  },
  {
    id: 'job_diego_rejected_1',
    submissionId: 'sub_diego_rejected',
    status: 'rejected',
    attempts: 0,
    createdAt: iso(2, 16),
    finishedAt: iso(2, 16),
  },
];

/** Report artifact keyed by job id — mirrors reportUrl resolution in real mode. */
export const DEMO_REPORTS_BY_JOB: Record<string, QaRunReport> = {
  job_published_1: REP_PUBLISHED,
  job_passed_1: REP_PASSED_PENDING,
  job_rejected_2: REP_REJECTED,
  job_withdrawn_1: REP_WITHDRAWN,
  job_diego_published_1: REP_DIEGO_PASSED,
  job_diego_rejected_1: REP_DIEGO_REJECTED,
};

/** Composite score per submission for the dashboard's score column. */
export const DEMO_SCORE_BY_SUBMISSION: Record<string, number | null> = {
  sub_published: REP_PUBLISHED.compositeScore,
  sub_rejected: REP_REJECTED.compositeScore,
  sub_passed: REP_PASSED_PENDING.compositeScore,
  sub_withdrawn: REP_WITHDRAWN.compositeScore,
  sub_diego_published: REP_DIEGO_PASSED.compositeScore,
  sub_diego_rejected: REP_DIEGO_REJECTED.compositeScore,
};
