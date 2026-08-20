# Quill — Documentation / Knowledge Base

A docs site for a product or open-source project. Built with Astro and MDX content.

## Features

- **Landing Page**: Hero with code preview, feature grid, CTA
- **Docs Layout**: Collapsible sidebar, main content, right TOC, breadcrumbs
- **Full-Text Search**: Client-side search across all docs
- **Version Switcher**: v1/v2 content switching
- **Code Blocks**: Syntax highlighting, copy button, file labels
- **Prev/Next Navigation**: Sequential doc browsing
- **Changelog**: Release history with added/changed/fixed sections
- **API Reference**: Endpoints, tables, error codes
- **Dark/Light Theme**: No-flash toggle with system preference
- **404 Page**: Themed error page

## Tech Stack

- **Framework**: Astro
- **Content**: Astro Content Collections (Markdown)
- **Styling**: CSS Custom Properties
- **Search**: Client-side JS filtering
- **Code Highlighting**: Shiki (GitHub Dark theme)

## Local Development

```bash
npm install
npm run dev
```

Open http://localhost:4321 in your browser.

## Deploy to Netlify

1. Push to GitHub · Connect to Netlify
2. Build: `npm run build` · Publish: `dist`

## Deploy to Vercel

1. Push to GitHub · Import in Vercel
2. Framework: Astro

## Forge Pro Verify Meta Tag

Insert in both `src/layouts/DocsLayout.astro` and `src/pages/index.astro` `<head>`:

```html
<meta name="forge-pro:verify" content="YOUR_UNIQUE_TOKEN" />
```

## Adding Docs

1. Create a new `.md` file in `src/content/docs/`
2. Add frontmatter: `title`, `description`, `order`, `section`, `version`
3. The sidebar and navigation update automatically

```markdown
---
title: "My New Page"
description: "Description for SEO."
order: 5
section: "basics"
---

## Content here

Write your docs in Markdown.
```

## Customization

### Brand
- `--accent`: Purple (#7c3aed) — change for your brand
- Logo: edit the SVG in the header of `DocsLayout.astro`
- Font: swap Inter in the Google Fonts `<link>`

### Sections
Edit the `section` values in doc frontmatter to reorganize the sidebar.

## QA-Gate Pre-Flight

- ✅ Responsive at 320 / 768 / 1280 / 1920px
- ✅ Zero console errors
- ✅ All internal links resolve (404 page present)
- ✅ SEO: meta tags, Open Graph, robots.txt
- ✅ Dark/light theme with no-flash
- ✅ WCAG AA+ accessible
