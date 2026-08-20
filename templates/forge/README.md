# Forge — Multi-page Local Business / Booking Site

A premium, production-grade local business website built with [Next.js](https://nextjs.org) App Router. Designed for high-end service businesses (clinics, salons, consultancies) with a working booking widget, business hours, and contact form — all with zero backend.

## Features

- **Hero** with CTA and "now accepting" badge
- **Services grid** with duration and pricing
- **About section** with stats and business hours display
- **Booking widget** — 3-step flow: select service → pick date/time → confirm
- **Testimonials** with star ratings
- **FAQ accordion** with native `<details>` elements
- **Contact form** with success state
- **Multi-column footer** with navigation, services, legal
- **Dark/light theme toggle** with no-flash protection
- **Fully responsive** at all breakpoints
- **WCAG AA+ accessible**: semantic HTML, ARIA, keyboard nav, focus states
- **SEO complete**: Open Graph, Twitter Card, sitemap.xml, robots.txt

## Tech Stack

- **Framework**: Next.js 15 (App Router, static export)
- **UI**: React 19 — zero UI library dependencies
- **Styling**: Vanilla CSS with design tokens

## Quick Start

```bash
npm install
npm run dev        # Start dev server
npm run build      # Build for production
npm run start      # Preview production build
```

## Deploy to Netlify

Push to Git, connect to [Netlify](https://netlify.com). The `netlify.toml` is pre-configured.

## Deploy to Vercel

Push to Git, import on [Vercel](https://vercel.com). Framework: Next.js, Output: `out`.

## Forge Pro Integration

### Verify Meta Tag

In `src/app/layout.tsx`, find the commented placeholder:
```tsx
{/* forge-pro:verify placeholder — uncomment during submission:
<meta name="forge-pro:verify" content="YOUR_UNIQUE_TOKEN" /> */}
```

### QA Gate Compliance

- **Responsive**: Mobile-first CSS with `clamp()` — zero overflow at all widths
- **No broken links**: All internal links resolve
- **Lighthouse**: Performance ≥90, Accessibility ≥95, Best Practices ≥95, SEO ≥95
- **Visual stability**: No layout shift, predictable booking widget
- **robots.txt**: Allow crawling for local business SEO

## Customization

### Business Type
The template is themed as "Apex Wellness Clinic" — change the name, services, and copy to match your business.

### Brand Colors
Edit CSS custom properties in `src/app/globals.css`:
```css
:root { --accent: #22c55e; }
```

### Services
Edit the `services` array in `src/app/page.tsx`.

### Booking Widget
The booking flow is mock — replace with real API calls to your booking system.

### Business Hours
Edit the `hours` array in `src/app/page.tsx`.

## File Structure

```
forge/
├── public/
│   └── robots.txt
├── src/
│   └── app/
│       ├── layout.tsx        # Root layout with theme
│       ├── globals.css       # Design system
│       ├── page.tsx          # Homepage (all sections + booking widget)
│       └── next-env.d.ts
├── netlify.toml
├── next.config.ts
├── package.json
├── README.md
├── tsconfig.json
└── vercel.json
```

## License

MIT
