# Atlas — Full SaaS Dashboard Web App

A premium, production-grade SaaS dashboard built with [Next.js](https://nextjs.org) App Router. A complete, navigable front-end dashboard with analytics, data tables, settings, and billing — all with mock data and no backend required.

## Features

- **Sidebar navigation** with collapsible sections and mobile drawer
- **Topbar** with search, notifications, and user menu
- **Command palette** (⌘K / Ctrl+K) with keyboard navigation
- **Keyboard shortcuts** (⌘⇧T for theme toggle)
- **Analytics dashboard** with SVG bar charts and progress bars
- **Data table** with sorting, filtering, and pagination
- **Settings pages** (Profile, Notifications, Security, API Keys) with tabs
- **Billing page** with plan cards, payment method, and invoice history
- **Dark/light theme toggle** with no-flash protection
- **Skeleton loaders** and shimmer animations
- **Status badges** (completed, processing, pending, failed)
- **Fully responsive** — collapses to mobile drawer at 1024px
- **Zero external dependencies** — all charts and UI built with vanilla React
- **Complete SEO** — Open Graph, Twitter Card, semantic HTML

## Tech Stack

- **Framework**: Next.js 15 (App Router, static export)
- **UI**: React 19 — zero UI library dependencies
- **Styling**: Vanilla CSS with design tokens (custom properties)
- **JavaScript**: Client-side only (all pages are `'use client'`)

## Quick Start

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run start
```

## Deploy to Netlify

1. Push to a Git repository
2. Connect to [Netlify](https://netlify.com)
3. Build command: `npm run build`, Publish directory: `out`
4. The `netlify.toml` is pre-configured

**CLI:**
```bash
npx netlify-cli deploy --prod --dir=out
```

## Deploy to Vercel

1. Push to a Git repository
2. Import on [Vercel](https://vercel.com)
3. Framework: Next.js, Build Command: `npm run build`, Output: `out`

**CLI:**
```bash
npx vercel --prod
```

## Forge Pro Integration

### Verify Meta Tag

During Forge Pro marketplace submission, add this to the `<head>`:

```html
<meta name="forge-pro:verify" content="YOUR_UNIQUE_TOKEN" />
```

**Location**: Open `src/app/layout.tsx` and find the commented placeholder:
```tsx
{/* forge-pro:verify placeholder — uncomment during submission:
<meta name="forge-pro:verify" content="YOUR_UNIQUE_TOKEN" /> */}
```

### QA Gate Compliance

- **Responsive**: Mobile-first CSS — sidebar collapses to drawer, stat grid adapts
- **No broken links**: Dashboard routes are all client-side
- **Lighthouse targets**: Performance ≥90, Accessibility ≥95, Best Practices ≥95, SEO ≥95
- **Visual stability**: Zero CLS — fixed sidebar, predictable layouts
- **Zero console errors**: Clean build output
- **robots.txt**: Disallows crawling (dashboard app)

## Customization

### Brand Colors

Edit CSS custom properties in `src/app/globals.css`:

```css
:root {
  --brand-500: #6366f1;  /* Primary brand color */
  --accent: var(--brand-500);
}
```

### Sidebar Navigation

Edit the `sidebarLinks` array in `src/app/page.tsx`.

### Mock Data

Replace the `orders`, `stats`, and `chartData` arrays in each page component.

### Add Pages

Create new files in `src/app/` following the Next.js App Router convention:
```
src/app/
├── analytics/page.tsx
├── customers/page.tsx
├── products/page.tsx
├── settings/page.tsx
└── billing/page.tsx
```

## File Structure

```
atlas/
├── public/
│   └── robots.txt
├── src/
│   └── app/
│       ├── layout.tsx          # Root layout with theme bootstrap
│       ├── globals.css         # Design system tokens
│       ├── page.tsx            # Main dashboard
│       ├── settings/page.tsx   # Settings with tabs
│       ├── billing/page.tsx    # Billing with plan cards
│       └── next-env.d.ts
├── netlify.toml
├── next.config.ts
├── package.json
├── README.md
├── tsconfig.json
└── vercel.json
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| ⌘K / Ctrl+K | Open command palette |
| ⌘⇧T / Ctrl+Shift+T | Toggle dark/light theme |
| Escape | Close command palette |
| ↑ ↓ | Navigate command palette |

## License

MIT
