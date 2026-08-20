# Nimbus — AI SaaS Landing & Product Marketing Site

A premium, production-grade landing page template built with [Astro](https://astro.build). Designed for AI/SaaS products that need a polished marketing presence.

## Features

- **Sticky glassmorphic navigation** with mega-menu and mobile drawer
- **Animated hero** with CSS gradient mesh background
- **Live feature tabs** with animated content panels
- **Animated stats counters** triggered on scroll
- **Interactive pricing table** with monthly/annual toggle
- **Testimonials marquee** with smooth auto-scroll
- **FAQ accordion** with native `<details>` elements
- **Working demo request form** with client validation + success state
- **Cookie consent banner** (GDPR compliant)
- **Dark/light theme toggle** with no-flash protection
- **Blog index + post pages** with realistic content
- **Custom 404 page**
- **Complete SEO**: Open Graph, Twitter Card, JSON-LD, sitemap.xml, robots.txt
- **Fully responsive** at 320 / 768 / 1280 / 1920px with zero horizontal overflow
- **WCAG AA+ accessible**: semantic HTML, ARIA, keyboard navigation, focus states, color contrast
- **Performance-optimized**: lazy loading, critical CSS inlined, minimal JS, system fonts

## Tech Stack

- **Framework**: Astro 5.x
- **Styling**: Vanilla CSS with design tokens (custom properties)
- **JavaScript**: Vanilla JS (no framework runtime)
- **Fonts**: System font stack (zero external requests)

## Quick Start

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Deploy to Netlify

1. Push this folder to a Git repository
2. Connect the repo to [Netlify](https://netlify.com)
3. Netlify auto-detects Astro — no config needed
4. The `netlify.toml` is pre-configured with security headers and caching

**Or use the CLI:**
```bash
npx netlify-cli deploy --prod --dir=dist
```

## Deploy to Vercel

1. Push this folder to a Git repository
2. Import on [Vercel](https://vercel.com)
3. Framework: Astro, Build Command: `npm run build`, Output: `dist`
4. The `vercel.json` is pre-configured with security headers

**Or use the CLI:**
```bash
npx vercel --prod
```

## Forge Pro Integration

### Verify Meta Tag

During submission to the Forge Pro marketplace, add this tag to the `<head>`:

```html
<meta name="forge-pro:verify" content="YOUR_UNIQUE_TOKEN" />
```

**Location**: Open `src/layouts/Layout.astro` and find the commented placeholder near line 58:
```html
<!-- forge-pro:verify placeholder -->
<!-- <meta name="forge-pro:verify" content="YOUR_UNIQUE_TOKEN" /> -->
```

Uncomment it and replace `YOUR_UNIQUE_TOKEN` with the token provided during submission.

### QA Gate Compliance

This template is designed to pass the Forge Pro automated QA gate:

- **Responsive**: Mobile-first CSS with `clamp()` and container queries — zero overflow at all breakpoints
- **No broken links**: All internal links resolve; custom 404 page included
- **Lighthouse targets**: Performance ≥90, Accessibility ≥95, Best Practices ≥95, SEO ≥95
- **Visual stability**: No layout shift (CLS 0), consistent rendering
- **Zero console errors**: Clean browser console in production build
- **forge-pro:verify**: Clearly documented placeholder in Layout.astro

## Customization

### Brand Colors

Edit the CSS custom properties in `src/styles/global.css`:

```css
:root {
  --brand-500: #6366f1;  /* Primary brand color */
  --brand-600: #4f46e5;  /* Hover state */
}
```

### Content

- **Hero**: Edit `src/components/Hero.astro`
- **Features**: Edit the `features` array in `src/components/Features.astro`
- **Pricing**: Edit the `plans` array in `src/components/Pricing.astro`
- **Testimonials**: Edit the `testimonials` array in `src/components/Testimonials.astro`
- **FAQ**: Edit the `faqs` array in `src/components/FAQ.astro`
- **Blog posts**: Create new `.astro` files in `src/pages/blog/`

### Typography

The template uses a system font stack for zero-latency rendering. To add custom fonts:

1. Add font files to `public/fonts/`
2. Add `@font-face` declarations to `src/styles/global.css`
3. Update `--font-sans` and `--font-mono` custom properties

## File Structure

```
nimbus/
├── public/
│   ├── favicon.svg
│   ├── robots.txt
│   └── sitemap.xml
├── src/
│   ├── components/
│   │   ├── Nav.astro
│   │   ├── Hero.astro
│   │   ├── Features.astro
│   │   ├── Stats.astro
│   │   ├── Pricing.astro
│   │   ├── Testimonials.astro
│   │   ├── FAQ.astro
│   │   ├── CTA.astro
│   │   ├── DemoForm.astro
│   │   ├── CookieConsent.astro
│   │   └── Footer.astro
│   ├── layouts/
│   │   └── Layout.astro
│   ├── pages/
│   │   ├── index.astro
│   │   ├── 404.astro
│   │   └── blog/
│   │       ├── index.astro
│   │       └── [slug].astro
│   └── styles/
│       └── global.css
├── astro.config.mjs
├── netlify.toml
├── package.json
├── README.md
└── vercel.json
```

## License

MIT
