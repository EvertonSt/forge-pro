<script>
  /** @type {import('./$types').LayoutData} */
  let { children } = $props();

  let mobileOpen = $state(false);

  function toggleTheme() {
    const html = document.documentElement;
    const current = html.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    localStorage.setItem('studio-theme', next);
  }

  function closeMobile() { mobileOpen = false; }
</script>

<nav class="nav" role="navigation" aria-label="Main navigation">
  <div class="nav__inner container">
    <a href="/" class="nav__logo">Studio</a>

    <button class="nav__toggle" onclick={() => mobileOpen = !mobileOpen} aria-label="Toggle menu" aria-expanded={mobileOpen}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
      </svg>
    </button>

    <ul class="nav__links" class:open={mobileOpen}>
      <li><a href="/" class="nav__link" onclick={closeMobile}>Work</a></li>
      <li><a href="/about" class="nav__link" onclick={closeMobile}>About</a></li>
      <li><a href="/services" class="nav__link" onclick={closeMobile}>Services</a></li>
      <li><a href="/contact" class="nav__link" onclick={closeMobile}>Contact</a></li>
    </ul>

    <div class="nav__actions">
      <button class="theme-toggle" onclick={toggleTheme} aria-label="Toggle theme">
        <svg class="sun" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
          <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
        </svg>
        <svg class="moon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
      </button>
      <a href="/contact" class="btn btn--primary btn--sm">Get in Touch</a>
    </div>
  </div>
</nav>

<main id="main">
  {@render children()}
</main>

<footer class="footer" role="contentinfo">
  <div class="container footer__inner">
    <div class="footer__brand">
      <div class="footer__logo">Studio</div>
      <p>Creative agency crafting digital experiences that move people.</p>
    </div>
    <div class="footer__links">
      <div class="footer__col">
        <h4>Navigation</h4>
        <a href="/">Work</a>
        <a href="/about">About</a>
        <a href="/services">Services</a>
        <a href="/contact">Contact</a>
      </div>
      <div class="footer__col">
        <h4>Social</h4>
        <a href="#">Twitter</a>
        <a href="#">Instagram</a>
        <a href="#">Dribbble</a>
        <a href="#">LinkedIn</a>
      </div>
    </div>
  </div>
  <div class="container footer__bottom">
    <p>© 2026 Studio. All rights reserved.</p>
  </div>
</footer>

<style>
  :global(*) { box-sizing: border-box; margin: 0; padding: 0; }
  :global(html) { font-family: 'Inter', system-ui, sans-serif; scroll-behavior: smooth; color-scheme: light dark; }
  :global(body) { font-size: 1rem; line-height: 1.6; color: var(--text); background: var(--bg); -webkit-font-smoothing: antialiased; overflow-x: hidden; }
  :global(a) { color: inherit; text-decoration: none; }
  :global(button) { font: inherit; cursor: pointer; border: none; background: none; }
  :global(ul) { list-style: none; }
  :global(h1,h2,h3,h4) { text-wrap: balance; line-height: 1.2; font-weight: 700; }
  :global(p) { text-wrap: pretty; }
  :global(:focus-visible) { outline: 2px solid var(--accent); outline-offset: 2px; border-radius: 0.25rem; }
  :global(.sr-only) { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); border: 0; }

  :global(:root) {
    --brand-500: #e11d48; --brand-600: #be123c;
    --stone-50:#fafaf9;--stone-100:#f5f5f4;--stone-200:#e7e5e4;--stone-300:#d6d3d1;
    --stone-400:#a8a29e;--stone-500:#78716c;--stone-600:#57534e;--stone-700:#44403c;
    --stone-800:#292524;--stone-900:#1c1917;--stone-950:#0c0a09;
    --bg:#fff;--bg-secondary:var(--stone-50);--bg-tertiary:var(--stone-100);
    --text:var(--stone-900);--text-secondary:var(--stone-600);--text-muted:var(--stone-400);
    --border:var(--stone-200);--border-strong:var(--stone-300);
    --accent:var(--brand-500);--accent-light:rgba(225,29,72,0.08);
    --shadow-sm:0 1px 2px rgba(0,0,0,0.05);--shadow-md:0 4px 6px -1px rgba(0,0,0,0.07);
    --shadow-lg:0 10px 15px -3px rgba(0,0,0,0.08);
    --radius:0.5rem;--radius-lg:0.75rem;--radius-xl:1rem;
    --ease:cubic-bezier(0.4,0,0.2,1);--duration:200ms;
    --gutter:clamp(1rem,0.5rem + 2vw,2rem);--max-w:72rem;
  }
  :global([data-theme="dark"]) {
    --bg:var(--stone-950);--bg-secondary:var(--stone-900);--bg-tertiary:var(--stone-800);
    --text:var(--stone-50);--text-secondary:var(--stone-400);--text-muted:var(--stone-500);
    --border:var(--stone-800);--border-strong:var(--stone-700);--accent-light:rgba(225,29,72,0.15);
  }
  :global(.container) { width: min(100% - var(--gutter)*2, var(--max-w)); margin-inline: auto; padding-inline: var(--gutter); }
  :global(.section) { padding-block: clamp(3rem, 2rem + 4vw, 6rem); }
  :global(.btn) { display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.75rem 1.5rem; border-radius: var(--radius-lg); font-weight: 600; font-size: 0.875rem; transition: all var(--duration) var(--ease); white-space: nowrap; }
  :global(.btn--primary) { background: var(--accent); color: #fff; }
  :global(.btn--primary:hover) { background: var(--brand-600); transform: translateY(-1px); }
  :global(.btn--secondary) { background: transparent; color: var(--text); border: 1px solid var(--border-strong); }
  :global(.btn--secondary:hover) { background: var(--bg-secondary); }
  :global(.btn--sm) { padding: 0.5rem 1rem; font-size: 0.8125rem; }
  :global(.btn--lg) { padding: 0.875rem 2rem; }
  :global(.input) { width: 100%; padding: 0.75rem 1rem; border-radius: var(--radius-lg); font-size: 0.9375rem; background: var(--bg); border: 1px solid var(--border); color: var(--text); transition: border-color var(--duration) var(--ease), box-shadow var(--duration) var(--ease); }
  :global(.input:focus) { outline: none; border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-light); }
  :global(.input::placeholder) { color: var(--text-muted); }

  @media (prefers-reduced-motion: reduce) {
    :global(*), :global(*::before), :global(*::after) { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
  }

  .nav { position: sticky; top: 0; z-index: 100; background: var(--bg); border-bottom: 1px solid var(--border); padding: 0.75rem 0; }
  .nav__inner { display: flex; align-items: center; justify-content: space-between; }
  .nav__logo { font-size: 1.25rem; font-weight: 800; letter-spacing: -0.025em; }
  .nav__links { display: flex; gap: 0.25rem; }
  .nav__link { padding: 0.5rem 1rem; border-radius: var(--radius); font-size: 0.9375rem; font-weight: 500; color: var(--text-secondary); transition: all var(--duration) var(--ease); }
  .nav__link:hover { color: var(--text); background: var(--bg-secondary); }
  .nav__actions { display: flex; align-items: center; gap: 0.5rem; }
  .nav__toggle { display: none; padding: 0.375rem; color: var(--text-secondary); }
  .theme-toggle { display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: var(--radius); color: var(--text-secondary); transition: all var(--duration) var(--ease); }
  .theme-toggle:hover { background: var(--bg-secondary); color: var(--text); }
  [data-theme="light"] .moon { display: none; }
  [data-theme="dark"] .sun { display: none; }

  .footer { border-top: 1px solid var(--border); padding-top: 3rem; padding-bottom: 1.5rem; margin-top: 4rem; }
  .footer__inner { display: grid; grid-template-columns: 1.5fr 2fr; gap: 3rem; margin-bottom: 2rem; }
  .footer__logo { font-size: 1.25rem; font-weight: 800; margin-bottom: 0.5rem; }
  .footer__brand p { font-size: 0.875rem; color: var(--text-secondary); max-width: 20rem; }
  .footer__links { display: grid; grid-template-columns: repeat(2, 1fr); gap: 2rem; }
  .footer__col { display: flex; flex-direction: column; gap: 0.5rem; }
  .footer__col h4 { font-size: 0.8125rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.25rem; }
  .footer__col a { font-size: 0.875rem; color: var(--text-secondary); transition: color 0.15s; }
  .footer__col a:hover { color: var(--text); }
  .footer__bottom { border-top: 1px solid var(--border); padding-top: 1.5rem; font-size: 0.8125rem; color: var(--text-muted); }

  @media (max-width: 768px) {
    .nav__links { display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: var(--bg); flex-direction: column; align-items: center; justify-content: center; gap: 0.5rem; z-index: 99; }
    .nav__links.open { display: flex; }
    .nav__toggle { display: flex; z-index: 101; }
    .footer__inner { grid-template-columns: 1fr; }
  }


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

</style>
