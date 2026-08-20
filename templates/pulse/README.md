# Pulse — Content / Blog / Newsletter Platform

A modern publishing platform for writers, newsletter creators, and independent journalists. Typography-forward design with excellent readability.

## Features

- **Content Management**: Markdown/MDX-based blog with collections
- **Reading Experience**: Reading progress bar, table of contents, share buttons, related posts
- **Search**: Client-side search over all posts
- **Tags & Topics**: Browse by topic with tag pages
- **Newsletter**: Mock subscription with success state
- **Dark/Light Theme**: No-flash toggle with system preference detection
- **SEO**: Open Graph, Twitter Card, JSON-LD, sitemap.xml, robots.txt
- **Accessibility**: Semantic HTML, ARIA, keyboard navigation, WCAG AA+

## Tech Stack

- **Framework**: Astro
- **Styling**: CSS Custom Properties, fluid typography (clamp)
- **Content**: Astro Content Collections (Markdown)
- **Fonts**: Playfair Display (serif) + Inter (sans-serif)
- **Icons**: Inline SVG

## Local Development

```bash
npm install
npm run dev
```

Open http://localhost:4321 in your browser.

## Deploy to Netlify

1. Push to GitHub
2. Connect repo to Netlify
3. Build command: `npm run build`
4. Publish directory: `dist`

## Deploy to Vercel

1. Push to GitHub
2. Import repo in Vercel
3. Framework: Astro
4. Build command: `npm run build`
5. Output directory: `dist`

## Forge Pro Verify Meta Tag

Insert your verification token in `src/layouts/Layout.astro`:

```html
<meta name="forge-pro:verify" content="YOUR_UNIQUE_TOKEN" />
```

The line is clearly marked with a comment in the `<head>` section.

## Customization

### Brand Colors
Edit CSS variables in `src/styles/global.css`:
- `--accent`: Primary brand color (default: red #e63946)
- `--bg`: Background color
- `--text`: Text color

### Typography
Swap font families in the `<link>` tag in `Layout.astro` and update `--font-serif` / `--font-sans` variables.

### Content
- Add posts in `src/content/posts/` as Markdown files
- Update site metadata in `Layout.astro`
- Edit navigation links in the `<nav>` section

## QA-Gate Pre-Flight

- ✅ Responsive at 320 / 768 / 1280 / 1920px (zero horizontal overflow)
- ✅ Zero console errors
- ✅ All internal links resolve (including 404 page)
- ✅ SEO: meta tags, Open Graph, JSON-LD, sitemap, robots.txt
- ✅ Dark/light theme with no-flash
- ✅ WCAG AA+ accessible (semantic HTML, focus states, keyboard nav)
