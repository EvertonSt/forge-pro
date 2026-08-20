/* Root layout — Atlas Dashboard */
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'Atlas Dashboard', template: '%s | Atlas Dashboard' },
  description: 'Atlas — A premium SaaS dashboard for managing your business analytics, billing, and team.',
  openGraph: {
    title: 'Atlas Dashboard',
    description: 'A premium SaaS dashboard for managing your business.',
    type: 'website',
  },
};

/* Theme bootstrap: reads localStorage on client, applies to <html> before paint */
const themeScript = `
(function() {
  try {
    var t = localStorage.getItem('atlas-theme');
    if (!t) t = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', t);
  } catch(e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="theme-color" content="#2563eb" />
        <meta name="description" content="Atlas — A complete SaaS dashboard with analytics, data tables, settings, and billing." />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Atlas — SaaS Dashboard" />
        <meta property="og:description" content="A complete SaaS dashboard with analytics, data tables, settings, and billing." />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Atlas — SaaS Dashboard" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@context': 'https://schema.org', '@type': 'WebApplication', name: 'Atlas', description: 'A complete SaaS dashboard with analytics, data tables, settings, and billing', applicationCategory: 'BusinessApplication' }) }} />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {/* forge-pro:verify placeholder — uncomment during submission:
        <meta name="forge-pro:verify" content="YOUR_UNIQUE_TOKEN" /> */}
      </head>
      <body>
        <a href="#main" style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 }}>Skip to main content</a>
        {children}
      

<script dangerouslySetInnerHTML={{ __html: "// Toast Notification System\nwindow.showToast = function(message, type = 'info', duration = 3000) {\n   var container = document.querySelector('.toast-container');\n  if (!container) {\n    container = document.createElement('div');\n    container.className = 'toast-container';\n    document.body.appendChild(container);\n  }\n  \n  const toast = document.createElement('div');\n  toast.className = `toast toast-${type}`;\n  toast.textContent = message;\n  toast.setAttribute('role', 'alert');\n  toast.setAttribute('aria-live', 'polite');\n  container.appendChild(toast);\n  \n  // Trigger animation\n  requestAnimationFrame(() => {\n    requestAnimationFrame(() => toast.classList.add('show'));\n  });\n  \n  // Auto-dismiss\n  setTimeout(() => {\n    toast.classList.remove('show');\n    setTimeout(() => toast.remove(), 300);\n  }, duration);\n  \n  return toast;\n};\n\n// Keyboard shortcut handler\ndocument.addEventListener('keydown', (e) => {\n  // Escape closes modals/overlays\n  if (e.key === 'Escape') {\n    document.querySelectorAll('[data-modal], [data-overlay], .lightbox:not([hidden])').forEach(el => {\n      el.hidden = true;\n      el.removeAttribute('data-modal');\n    });\n  }\n});\n\n// Ripple effect on buttons\ndocument.addEventListener('mousedown', (e) => {\n  const btn = e.target.closest('.btn, button[role=\"button\"]');\n  if (btn) {\n    const rect = btn.getBoundingClientRect();\n    const x = ((e.clientX - rect.left) / rect.width) * 100;\n    const y = ((e.clientY - rect.top) / rect.height) * 100;\n    btn.style.setProperty('--ripple-x', x + '%');\n    btn.style.setProperty('--ripple-y', y + '%');\n  }\n});\n\n// Intersection Observer for scroll animations\nif (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {\n  const observer = new IntersectionObserver((entries) => {\n    entries.forEach(entry => {\n      if (entry.isIntersecting) {\n        entry.target.classList.add('animate-in');\n        observer.unobserve(entry.target);\n      }\n    });\n  }, { threshold: 0.1 });\n  \n  document.querySelectorAll('[data-animate]').forEach(el => observer.observe(el));\n}" }} />

</body>
    </html>
  );
}
