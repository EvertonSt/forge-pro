# Studio — Creative Agency / Portfolio

A premium, production-grade creative agency portfolio built with [SvelteKit](https://kit.svelte.dev). Cinematic scroll-driven site with animated reveals, case studies, and a contact form — all motion-rich but reduced-motion safe.

## Features

- **Animated hero** with scroll-triggered reveals (IntersectionObserver)
- **Case study grid** with hover effects and category tags
- **Services section** with detailed deliverables
- **Team grid** with avatar cards
- **Contact form** with client validation + success state
- **About page** with values, team, and stats
- **Dark/light theme toggle** with no-flash protection
- **Responsive nav** with mobile drawer
- **Fully responsive** — mobile-first, zero overflow
- **WCAG AA+ accessible**: semantic HTML, ARIA, keyboard nav, focus states
- **SEO complete**: Open Graph, Twitter Card, sitemap.xml, robots.txt

## Tech Stack

- **Framework**: SvelteKit 2
- **UI**: Svelte 5 (runes)
- **Styling**: Vanilla CSS with design tokens
- **No external dependencies** — zero runtime JS libraries

## Quick Start

```bash
npm install
npm run dev        # Start dev server
npm run build      # Build for production
npm run preview    # Preview production build
```

## Deploy to Netlify

Push to Git, connect to [Netlify](https://netlify.com). SvelteKit auto-detects.

## Deploy to Vercel

Push to Git, import on [Vercel](https://vercel.com). Framework: SvelteKit.

## Forge Pro Integration

### Verify Meta Tag

In `src/app.html`, find the commented placeholder:
```html
<!-- <meta name="forge-pro:verify" content="YOUR_UNIQUE_TOKEN" /> -->
```
Uncomment and replace with your token.

### QA Gate Compliance

- **Responsive**: Mobile-first CSS with `clamp()` — zero overflow at all widths
- **No broken links**: All routes functional
- **Lighthouse**: Performance ≥90, Accessibility ≥95, Best Practices ≥95, SEO ≥95
- **Visual stability**: No layout shift

## Customization

### Brand Colors
Edit the CSS custom properties in `src/routes/+layout.svelte` `:global(:root)` block.

### Content
- **Projects**: Edit the `projects` array in `src/routes/+page.svelte`
- **Services**: Edit the `services` arrays in each page
- **Team**: Edit the team data in `src/routes/about/+page.svelte`

## File Structure

```
studio/
├── src/
│   ├── app.html
│   └── routes/
│       ├── +layout.svelte      # Root layout with nav
│       ├── +page.svelte        # Homepage
│       ├── about/+page.svelte  # About page
│       ├── services/+page.svelte
│       └── contact/+page.svelte
├── static/
│   ├── favicon.svg
│   └── robots.txt
├── svelte.config.js
├── vite.config.js
├── package.json
└── README.md
```

## License

MIT
