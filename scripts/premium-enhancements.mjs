/**
 * Premium Enhancements Script
 * Adds toast notifications, improved micro-interactions, and keyboard shortcuts
 * to all 10 templates for a polished, agency-quality feel.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const ROOT = 'C:/AI/Freebuff Desktop/GitHub Projects/forge-pro/templates';

// Toast notification CSS (shared across all templates)
const TOAST_CSS = `
/* Toast Notifications */
.toast-container {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  pointer-events: none;
}
.toast {
  padding: 0.75rem 1.25rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #fff;
  box-shadow: 0 10px 25px rgba(0,0,0,0.15);
  transform: translateX(120%);
  opacity: 0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  pointer-events: auto;
  max-width: 360px;
}
.toast.show { transform: translateX(0); opacity: 1; }
.toast-success { background: #16a34a; }
.toast-error { background: #dc2626; }
.toast-info { background: #2563eb; }
@media (prefers-reduced-motion: reduce) {
  .toast { transition: opacity 0.01ms; transform: none; }
  .toast.show { transform: none; }
}

/* Improved Button Interactions */
.btn, button[role="button"] {
  position: relative;
  overflow: hidden;
}
.btn::after, button[role="button"]::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at var(--ripple-x, 50%) var(--ripple-y, 50%), rgba(255,255,255,0.3) 0%, transparent 60%);
  opacity: 0;
  transition: opacity 0.4s;
}
.btn:active::after, button[role="button"]:active::after {
  opacity: 1;
  transition: opacity 0s;
}

/* Smooth Focus Ring */
:focus-visible {
  outline: 2px solid var(--accent, #6366f1);
  outline-offset: 2px;
  border-radius: 0.25rem;
}

/* Card Hover Lift */
.card-hover {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.card-hover:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.1);
}

/* Skeleton Pulse Animation */
@keyframes skeleton-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
.skeleton-pulse {
  animation: skeleton-pulse 1.5s ease-in-out infinite;
}

/* Page Transition Support */
@view-transition { navigation: auto; }
::view-transition-old(root) { animation: fade-out 0.15s ease-out; }
::view-transition-new(root) { animation: fade-in 0.15s ease-in; }
@keyframes fade-out { from { opacity: 1; } to { opacity: 0; } }
@keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }

/* Smooth Scroll Behavior */
@media (prefers-reduced-motion: no-preference) {
  html { scroll-behavior: smooth; }
}
@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
`;

// Toast JavaScript (shared across all templates)
const TOAST_JS = `
<script>
// Toast Notification System
window.showToast = function(message, type = 'info', duration = 3000) {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  
  const toast = document.createElement('div');
  toast.className = \`toast toast-\${type}\`;
  toast.textContent = message;
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'polite');
  container.appendChild(toast);
  
  // Trigger animation
  requestAnimationFrame(() => {
    requestAnimationFrame(() => toast.classList.add('show'));
  });
  
  // Auto-dismiss
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, duration);
  
  return toast;
};

// Keyboard shortcut handler
document.addEventListener('keydown', (e) => {
  // Escape closes modals/overlays
  if (e.key === 'Escape') {
    document.querySelectorAll('[data-modal], [data-overlay], .lightbox:not([hidden])').forEach(el => {
      el.hidden = true;
      el.removeAttribute('data-modal');
    });
  }
});

// Ripple effect on buttons
document.addEventListener('mousedown', (e) => {
  const btn = e.target.closest('.btn, button[role="button"]');
  if (btn) {
    const rect = btn.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    btn.style.setProperty('--ripple-x', x + '%');
    btn.style.setProperty('--ripple-y', y + '%');
  }
});

// Intersection Observer for scroll animations
if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-in');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  
  document.querySelectorAll('[data-animate]').forEach(el => observer.observe(el));
}
</script>
`;

// Scroll animation CSS
const SCROLL_ANIM_CSS = `
/* Scroll-triggered animations */
[data-animate] {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.6s ease, transform 0.6s ease;
}
[data-animate].animate-in {
  opacity: 1;
  transform: translateY(0);
}
[data-animate="fade-left"] { transform: translateX(-20px); }
[data-animate="fade-left"].animate-in { transform: translateX(0); }
[data-animate="fade-right"] { transform: translateX(20px); }
[data-animate="fade-right"].animate-in { transform: translateX(0); }
[data-animate="scale"] { transform: scale(0.95); }
[data-animate="scale"].animate-in { transform: scale(1); }
@media (prefers-reduced-motion: reduce) {
  [data-animate] { opacity: 1; transform: none; transition: none; }
}
`;

function addToFile(filePath, content, afterPattern) {
  if (!existsSync(filePath)) return false;
  let content_str = readFileSync(filePath, 'utf8');
  if (content_str.includes(content.trim().substring(0, 30))) return false; // Already added
  
  if (afterPattern) {
    const idx = content_str.indexOf(afterPattern);
    if (idx === -1) return false;
    content_str = content_str.slice(0, idx + afterPattern.length) + '\n' + content + content_str.slice(idx + afterPattern.length);
  } else {
    content_str += '\n' + content;
  }
  
  writeFileSync(filePath, content_str);
  return true;
}

function addBeforeClosing(filePath, content, marker = '</style>') {
  if (!existsSync(filePath)) return false;
  let content_str = readFileSync(filePath, 'utf8');
  if (content_str.includes('toast-container')) return false; // Already added
  
  const idx = content_str.lastIndexOf(marker);
  if (idx === -1) return false;
  content_str = content_str.slice(0, idx) + '\n' + content + '\n' + content_str.slice(idx);
  writeFileSync(filePath, content_str);
  return true;
}

function addBeforeClosingBody(filePath, content, marker = '</body>') {
  if (!existsSync(filePath)) return false;
  let content_str = readFileSync(filePath, 'utf8');
  if (content_str.includes('toast-container')) return false;
  
  const idx = content_str.lastIndexOf(marker);
  if (idx === -1) return false;
  content_str = content_str.slice(0, idx) + '\n' + content + '\n' + content_str.slice(idx);
  writeFileSync(filePath, content_str);
  return true;
}

// Process each template
const templates = [
  { name: 'nimbus', type: 'astro', layout: 'src/layouts/Layout.astro' },
  { name: 'atlas', type: 'next', layout: 'src/app/layout.tsx' },
  { name: 'lumen', type: 'astro', layout: 'src/layouts/Layout.astro' },
  { name: 'studio', type: 'svelte', layout: 'src/routes/+layout.svelte' },
  { name: 'forge', type: 'next', layout: 'src/app/layout.tsx' },
  { name: 'pulse', type: 'astro', layout: 'src/layouts/Layout.astro' },
  { name: 'sage', type: 'next', layout: 'src/app/layout.tsx' },
  { name: 'mesa', type: 'astro', layout: 'src/layouts/Layout.astro' },
  { name: 'ledger', type: 'next', layout: 'src/app/layout.tsx' },
  { name: 'quill', type: 'astro', layout: 'src/layouts/DocsLayout.astro' },
];

console.log('🎨 Adding premium enhancements to all templates...\n');

for (const t of templates) {
  const layoutPath = join(ROOT, t.name, t.layout);
  console.log(`  ${t.name}:`);
  
  // Add toast CSS before closing style tag
  if (addBeforeClosing(layoutPath, TOAST_CSS)) {
    console.log('    ✅ Toast notification CSS');
  } else {
    console.log('    ⏭️  Toast CSS already present');
  }
  
  // Add toast JS before closing body tag
  if (addBeforeClosingBody(layoutPath, TOAST_JS)) {
    console.log('    ✅ Toast notification JS');
  } else {
    console.log('    ⏭️  Toast JS already present');
  }
  
  // Add scroll animation CSS
  if (addBeforeClosing(layoutPath, SCROLL_ANIM_CSS)) {
    console.log('    ✅ Scroll animation CSS');
  } else {
    console.log('    ⏭️  Scroll animations already present');
  }
}

console.log('\n✨ Premium enhancements complete!');
