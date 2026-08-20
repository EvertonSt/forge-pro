# Mesa — Restaurant / Hospitality Website

An elegant, appetite-driving site for a restaurant, cafe, or hotel. Fine-dining aesthetic with warm dark/light theme.

## Features

- **Cinematic Hero**: Full-bleed image with overlay CTA
- **Menu**: Categorized (Starters/Mains/Desserts/Drinks) with dietary tags (V/VG/GF), prices, and filters
- **Reservation Widget**: Date/time/party-size form with mock confirmation
- **About**: Story page with chef photo, philosophy, and stats
- **Gallery**: Grid with lightbox, hover effects
- **Events**: Wine dinners, chef's table, jazz brunch cards
- **Contact**: Address, hours, phone, map placeholder
- **Dark/Light Theme**: Warm fine-dining palette with no-flash toggle

## Tech Stack

- **Framework**: Astro
- **Styling**: CSS Custom Properties, fluid typography
- **Interactivity**: Vanilla JS (menu filter, lightbox, form, theme)

## Local Development

```bash
npm install
npm run dev
```

Open http://localhost:4321 in your browser.

## Deploy to Netlify

1. Push to GitHub
2. Connect repo to Netlify
3. Build: `npm run build` · Publish: `dist`

## Deploy to Vercel

1. Push to GitHub · Import in Vercel
2. Framework: Astro · Build: `npm run build`

## Forge Pro Verify Meta Tag

Insert in `src/layouts/Layout.astro` `<head>`:

```html
<meta name="forge-pro:verify" content="YOUR_UNIQUE_TOKEN" />
```

## Customization

### Brand
- `--accent`: Gold (#b8860b) — change for your brand color
- `--font-serif`: Playfair Display — swap for your preferred serif
- Menu items: edit the `menuCategories` array in `src/pages/index.astro`

### Images
Replace the Unsplash URLs in `index.astro` and `about.astro` with your own photos.

## QA-Gate Pre-Flight

- ✅ Responsive at 320 / 768 / 1280 / 1920px
- ✅ Zero console errors
- ✅ All internal links resolve (404 page present)
- ✅ SEO: meta tags, Open Graph, JSON-LD, sitemap, robots.txt
- ✅ Dark/light theme with no-flash
- ✅ WCAG AA+ accessible
