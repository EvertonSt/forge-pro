# Ledger — Personal Finance Dashboard

A secure-feeling money-management dashboard with net-worth tracking, transaction search, budget monitoring, savings goals, and subscription management. All mock data; no real accounts.

## Features

- **Overview**: Net-worth SVG trend chart, account cards, income/expense summary
- **Transactions**: Searchable/sortable/filterable table with pagination
- **Budgets**: Progress rings per category with overspend alerts
- **Goals**: Savings goals with contribution progress and time estimates
- **Recurring**: Subscriptions/bills with cadence and next-date
- **Settings**: Profile, security toggles, appearance (dark/light)
- **Command Palette**: Cmd/Ctrl+K for quick navigation
- **Dark/Light Theme**: System preference detection, localStorage persistence
- **Responsive**: Sidebar collapses to mobile drawer
- **Keyboard Shortcuts**: Full keyboard navigation support

## Tech Stack

- **Framework**: Next.js (App Router)
- **Styling**: CSS Custom Properties, tabular numbers
- **Charts**: Hand-built SVG (no chart library)
- **State**: React hooks, localStorage

## Local Development

```bash
npm install
npm run dev
```

Open http://localhost:3000 in your browser.

## Deploy to Netlify

1. Push to GitHub · Connect to Netlify
2. Build: `npm run build` · Publish: `.next`

## Deploy to Vercel

1. Push to GitHub · Import in Vercel
2. Framework: Next.js

## Forge Pro Verify Meta Tag

Insert in `src/app/layout.tsx` `<head>`:

```html
<meta name="forge-pro:verify" content="YOUR_UNIQUE_TOKEN" />
```

## Customization

### Brand Colors
Edit CSS variables in `src/app/globals.css`:
- `--accent`: Blue (#2563eb) — primary action color
- `--success`: Green — positive amounts
- `--danger`: Red — negative amounts/overspend

### Mock Data
Edit `src/lib/data.ts` to replace accounts, transactions, budgets, goals, and recurring data with your own.

## QA-Gate Pre-Flight

- ✅ Responsive at 320 / 768 / 1280 / 1920px
- ✅ Zero console errors
- ✅ All internal links resolve (404 page present)
- ✅ SEO: meta tags, Open Graph, JSON-LD, robots.txt
- ✅ Dark/light theme with no-flash
- ✅ WCAG AA+ accessible (semantic HTML, focus states, keyboard nav)
