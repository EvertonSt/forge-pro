# Sage — Online Course / Education / LMS Platform

A sellable course platform front-end with catalog, lesson player, student dashboard, and instructor profiles. All data is mock; no backend required.

## Features

- **Dashboard**: Progress rings, learning stats, continue-learning cards
- **Course Catalog**: Category/level filters, search, sort (popular, rating, price)
- **Course Detail**: Curriculum accordion, instructor bio, reviews, enroll CTA
- **Lesson Player**: Video placeholder, sidebar lesson list, notes, prev/next navigation
- **Pricing**: Monthly/annual toggle, 3-tier cards, FAQ accordion
- **Instructor Profile**: Stats, bio, course grid
- **Command Palette**: Cmd/Ctrl+K for quick navigation
- **Dark/Light Theme**: No-flash toggle with system preference detection
- **Responsive**: Collapses to mobile drawer on small screens

## Tech Stack

- **Framework**: Next.js (App Router)
- **Styling**: CSS Custom Properties, inline styles
- **State**: React hooks, localStorage for theme
- **Data**: Mock TypeScript data layer

## Local Development

```bash
npm install
npm run dev
```

Open http://localhost:3000 in your browser.

## Deploy to Netlify

1. Push to GitHub
2. Connect repo to Netlify
3. Build command: `npm run build`
4. Publish directory: `out`

## Deploy to Vercel

1. Push to GitHub
2. Import repo in Vercel
3. Framework: Next.js
4. Build command: `npm run build`

## Forge Pro Verify Meta Tag

Insert your verification token in `src/app/layout.tsx`:

```html
<meta name="forge-pro:verify" content="YOUR_UNIQUE_TOKEN" />
```

The line is clearly marked with a comment in the `<head>` section.

## Customization

### Brand Colors
Edit CSS variables in `src/app/globals.css`:
- `--accent`: Primary brand color (default: indigo #6366f1)
- `--bg`: Background color
- `--text`: Text color

### Course Data
Edit `src/lib/data.ts` to add your own courses, lessons, and enrolled data.

### Navigation
Edit the `navItems` array in `src/app/layout.tsx` to change navigation links.

## QA-Gate Pre-Flight

- ✅ Responsive at 320 / 768 / 1280 / 1920px (zero horizontal overflow)
- ✅ Zero console errors
- ✅ All internal links resolve (including 404 page)
- ✅ SEO: meta tags, Open Graph, JSON-LD, sitemap, robots.txt
- ✅ Dark/light theme with no-flash
- ✅ WCAG AA+ accessible (semantic HTML, focus states, keyboard nav)
