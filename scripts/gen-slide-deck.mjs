import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const SS_DIR = path.join(ROOT, 'qa-screenshots');

const templates = [
  { id: 'nimbus',  name: 'Nimbus',  tag: 'Astro',     icon: '🚀', desc: 'AI SaaS Landing Page',         detail: 'Glassmorphic nav, gradient mesh hero, pricing toggle, testimonials marquee, blog, newsletter.' },
  { id: 'atlas',   name: 'Atlas',   tag: 'Next.js',   icon: '📊', desc: 'SaaS Dashboard',              detail: 'Full analytics dashboard, data tables, SVG charts, settings, billing, command palette.' },
  { id: 'lumen',   name: 'Lumen',   tag: 'Astro',     icon: '💡', desc: 'E-commerce Store',            detail: 'Product grid, filters/sort, detail pages, working cart (localStorage), wishlist.' },
  { id: 'studio',  name: 'Studio',  tag: 'SvelteKit', icon: '🎨', desc: 'Creative Agency',             detail: 'Cinematic scroll-driven, case studies, team grid, custom cursor, contact form.' },
  { id: 'forge',   name: 'Forge',   tag: 'Next.js',   icon: '🏪', desc: 'Local Business / Booking',    detail: 'Services, booking widget, business hours, gallery, testimonials, team profiles.' },
  { id: 'pulse',   name: 'Pulse',   tag: 'Astro',     icon: '📝', desc: 'Blog / Newsletter',           detail: 'Markdown blog, reading progress, TOC, search, newsletter signup, dark mode.' },
  { id: 'sage',    name: 'Sage',    tag: 'Next.js',   icon: '📚', desc: 'Course Platform / LMS',       detail: 'Course catalog, lesson player, progress tracking, pricing, instructor profiles.' },
  { id: 'mesa',    name: 'Mesa',    tag: 'Astro',     icon: '🍽️', desc: 'Restaurant / Hospitality',    detail: 'Fine dining aesthetic, menu with dietary tags, reservation widget, gallery.' },
  { id: 'ledger',  name: 'Ledger',  tag: 'Next.js',   icon: '💰', desc: 'Finance Dashboard',           detail: 'Net worth charts, transactions, budgets, goals, subscriptions, command palette.' },
  { id: 'quill',   name: 'Quill',   tag: 'Astro',     icon: '📖', desc: 'Documentation / KB',          detail: 'Sidebar nav, TOC, code blocks, version switcher, full-text search.' },
];

function embedImage(templateId, breakpoint = '1280px') {
  const imgPath = path.join(SS_DIR, templateId, `${breakpoint}.png`);
  if (!fs.existsSync(imgPath)) return '';
  const buf = fs.readFileSync(imgPath);
  return `data:image/png;base64,${buf.toString('base64')}`;
}

function thumbImage(templateId) {
  return embedImage(templateId, '1280px');
}

// Build slides
const slides = [];

// Slide 1: Cover
slides.push({
  type: 'cover',
  html: `
    <div class="slide-content cover-slide">
      <div class="badge">Documentation v1.0 — August 2026</div>
      <h1>Forge-<span class="accent">Pro</span></h1>
      <p class="subtitle">An AI-Native, Self-QA'd Marketplace<br>for Premium Website Templates</p>
      <div class="stats-row">
        <div class="stat"><span class="stat-num">10</span><span class="stat-label">Templates</span></div>
        <div class="stat"><span class="stat-num">5</span><span class="stat-label">Frameworks</span></div>
        <div class="stat"><span class="stat-num">0</span><span class="stat-label">$ Cost to Host</span></div>
      </div>
      <p class="hint">Press → or click to advance</p>
    </div>`
});

// Slide 2: Problem
slides.push({
  type: 'content',
  html: `
    <div class="slide-content">
      <h2>The Problem</h2>
      <div class="two-col">
        <div class="col">
          <div class="pain-card">
            <div class="pain-icon">💸</div>
            <h3>$2,000–$5,000</h3>
            <p>Average agency cost for a single website</p>
          </div>
          <div class="pain-card">
            <div class="pain-icon">⏱️</div>
            <h3>4–8 Weeks</h3>
            <p>Typical turnaround for custom development</p>
          </div>
        </div>
        <div class="col">
          <div class="pain-card">
            <div class="pain-icon">🐛</div>
            <h3>Unknown Quality</h3>
            <p>No standardized QA, accessibility, or performance checks</p>
          </div>
          <div class="pain-card">
            <div class="pain-icon">🔒</div>
            <h3>Vendor Lock-in</h3>
            <p>Proprietary platforms, no source code access</p>
          </div>
        </div>
      </div>
    </div>`
});

// Slide 3: Solution
slides.push({
  type: 'content',
  html: `
    <div class="slide-content">
      <h2>The Forge-Pro Solution</h2>
      <div class="feature-grid">
        <div class="feature-card">
          <div class="feature-icon">🤖</div>
          <h3>AI-Native QA Gate</h3>
          <p>Automated responsive, accessibility, SEO, and Lighthouse checks on every submission</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">📦</div>
          <h3>10 Premium Templates</h3>
          <p>Production-ready sites worth $2K–$5K each, built with Astro, Next.js, SvelteKit</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">🚀</div>
          <h3>One-Click Deploy</h3>
          <p>Free hosting on Vercel — all 11 projects at $0/month</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">🎨</div>
          <h3>Fully Customizable</h3>
          <p>CSS variables, Markdown content, swap images — make it yours in minutes</p>
        </div>
      </div>
    </div>`
});

// Slide 4: Quality Gate
slides.push({
  type: 'content',
  html: `
    <div class="slide-content">
      <h2>Automated QA Gate</h2>
      <p class="lead">Every template must pass rigorous automated checks before listing</p>
      <div class="qa-grid">
        <div class="qa-item pass">✅ Responsive at 320 / 768 / 1280 / 1920px</div>
        <div class="qa-item pass">✅ Zero horizontal overflow at any width</div>
        <div class="qa-item pass">✅ Zero console errors</div>
        <div class="qa-item pass">✅ Zero broken links (real 404 page)</div>
        <div class="qa-item pass">✅ Lighthouse Performance ≥ 90</div>
        <div class="qa-item pass">✅ Accessibility ≥ 95 (WCAG AA+)</div>
        <div class="qa-item pass">✅ Best Practices ≥ 95</div>
        <div class="qa-item pass">✅ SEO ≥ 95</div>
        <div class="qa-item pass">✅ Dark/light theme toggle</div>
        <div class="qa-item pass">✅ Keyboard navigation</div>
        <div class="qa-item pass">✅ Semantic HTML + ARIA labels</div>
        <div class="qa-item pass">✅ JSON-LD structured data</div>
      </div>
    </div>`
});

// Template showcase slides (one per template)
for (const t of templates) {
  const img = thumbImage(t.id);
  slides.push({
    type: 'showcase',
    html: `
      <div class="slide-content showcase-slide">
        <div class="showcase-left">
          <div class="showcase-badge"><span class="tag">${t.tag}</span></div>
          <h2>${t.icon} ${t.name}</h2>
          <p class="showcase-desc">${t.desc}</p>
          <ul class="showcase-features">
            ${t.detail.split(', ').map(f => `<li>${f}</li>`).join('\n            ')}
          </ul>
          <div class="showcase-meta">
            <span>✅ Dark/Light</span>
            <span>✅ Responsive</span>
            <span>✅ SEO Ready</span>
          </div>
        </div>
        <div class="showcase-right">
          <div class="screenshot-frame">
            <img src="${img}" alt="${t.name} screenshot at 1280px" />
          </div>
        </div>
      </div>`
  });
}

// Deployment slide
slides.push({
  type: 'content',
  html: `
    <div class="slide-content">
      <h2>Deploy in 3 Steps</h2>
      <div class="deploy-steps">
        <div class="deploy-step">
          <div class="step-num">1</div>
          <h3>Install</h3>
          <code>npm i -g vercel</code>
        </div>
        <div class="deploy-step">
          <div class="step-num">2</div>
          <h3>Login</h3>
          <code>vercel login</code>
        </div>
        <div class="deploy-step">
          <div class="step-num">3</div>
          <h3>Deploy</h3>
          <code>./scripts/deploy-vercel.sh</code>
        </div>
      </div>
      <div class="deploy-result">
        <p>All 11 projects → free <code>*.vercel.app</code> subdomains</p>
        <div class="cost-badge">$0 / month on Vercel Free Tier</div>
      </div>
    </div>`
});

// Value / Pricing slide
slides.push({
  type: 'content',
  html: `
    <div class="slide-content">
      <h2>Value Proposition</h2>
      <div class="price-comparison">
        <div class="price-card old">
          <div class="price-label">Traditional Agency</div>
          <div class="price-amount">$2,000–$5,000</div>
          <ul>
            <li>4–8 week turnaround</li>
            <li>No QA guarantees</li>
            <li>Limited revisions</li>
            <li>Vendor lock-in</li>
          </ul>
        </div>
        <div class="price-card new">
          <div class="price-label">Forge-Pro Templates</div>
          <div class="price-amount">$0–$500</div>
          <ul>
            <li>Instant deployment</li>
            <li>Automated QA verified</li>
            <li>Full source code</li>
            <li>Free hosting forever</li>
          </ul>
          <div class="price-badge">Up to 99% Savings</div>
        </div>
      </div>
    </div>`
});

// CTA / Final slide
slides.push({
  type: 'cover',
  html: `
    <div class="slide-content cover-slide">
      <h1>Get Started with<br>Forge-<span class="accent">Pro</span></h1>
      <p class="subtitle">10 premium templates. Free hosting.<br>Automated quality. Zero compromises.</p>
      <div class="cta-links">
        <div class="cta-item">
          <span class="cta-label">Repository</span>
          <code>github.com/your-org/forge-pro</code>
        </div>
        <div class="cta-item">
          <span class="cta-label">Deploy Script</span>
          <code>./scripts/deploy-vercel.sh</code>
        </div>
        <div class="cta-item">
          <span class="cta-label">User Guide</span>
          <code>docs/Forge-Pro-User-Guide.pdf</code>
        </div>
      </div>
    </div>`
});

// Generate HTML
const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Forge-Pro — Marketing Presentation</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #0f172a;
    --surface: #1e293b;
    --accent: #818cf8;
    --accent-bright: #a5b4fc;
    --text: #f1f5f9;
    --text-muted: #94a3b8;
    --green: #22c55e;
    --red: #ef4444;
    --gold: #f59e0b;
  }

  html, body {
    height: 100%;
    font-family: 'Inter', -apple-system, sans-serif;
    background: var(--bg);
    color: var(--text);
    overflow: hidden;
  }

  /* Slide container */
  .deck {
    width: 100vw;
    height: 100vh;
    position: relative;
  }

  .slide {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.5s ease, transform 0.5s ease;
    transform: translateX(40px);
  }

  .slide.active {
    opacity: 1;
    pointer-events: all;
    transform: translateX(0);
  }

  .slide.prev {
    transform: translateX(-40px);
  }

  /* Progress bar */
  .progress {
    position: fixed;
    top: 0;
    left: 0;
    height: 3px;
    background: var(--accent);
    transition: width 0.4s ease;
    z-index: 100;
  }

  /* Slide counter */
  .counter {
    position: fixed;
    bottom: 1.5rem;
    right: 2rem;
    font-size: 0.85rem;
    color: var(--text-muted);
    font-family: 'JetBrains Mono', monospace;
    z-index: 100;
  }

  /* Nav arrows */
  .nav-btn {
    position: fixed;
    top: 50%;
    transform: translateY(-50%);
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: var(--surface);
    border: 1px solid rgba(255,255,255,0.1);
    color: var(--text-muted);
    font-size: 1.2rem;
    cursor: pointer;
    z-index: 100;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .nav-btn:hover { background: var(--accent); color: white; border-color: var(--accent); }
  .nav-btn.left { left: 1rem; }
  .nav-btn.right { right: 1rem; }

  /* Slide content */
  .slide-content {
    max-width: 1100px;
    width: 100%;
    padding: 3rem;
  }

  /* Cover slide */
  .cover-slide {
    text-align: center;
  }
  .cover-slide .badge {
    display: inline-block;
    padding: 0.4rem 1rem;
    background: rgba(129,140,248,0.15);
    border: 1px solid rgba(129,140,248,0.3);
    border-radius: 2rem;
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--accent);
    margin-bottom: 2rem;
  }
  .cover-slide h1 {
    font-size: 4.5rem;
    font-weight: 900;
    letter-spacing: -0.04em;
    line-height: 1.05;
    margin-bottom: 1.5rem;
  }
  .accent { color: var(--accent); }
  .subtitle {
    font-size: 1.3rem;
    color: var(--text-muted);
    line-height: 1.6;
    margin-bottom: 3rem;
  }
  .stats-row {
    display: flex;
    justify-content: center;
    gap: 4rem;
    margin-bottom: 3rem;
  }
  .stat { text-align: center; }
  .stat-num {
    display: block;
    font-size: 3rem;
    font-weight: 800;
    color: var(--accent-bright);
  }
  .stat-label {
    font-size: 0.85rem;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }
  .hint {
    font-size: 0.8rem;
    color: var(--text-muted);
    opacity: 0.5;
  }

  /* Content slides */
  .slide-content h2 {
    font-size: 2.5rem;
    font-weight: 800;
    margin-bottom: 0.5rem;
    letter-spacing: -0.02em;
  }
  .lead {
    font-size: 1.1rem;
    color: var(--text-muted);
    margin-bottom: 2rem;
  }

  /* Two column */
  .two-col {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
    margin-top: 2rem;
  }

  /* Pain / feature cards */
  .pain-card, .feature-card {
    background: var(--surface);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 12px;
    padding: 1.5rem;
    margin-bottom: 1rem;
  }
  .pain-icon, .feature-icon {
    font-size: 2rem;
    margin-bottom: 0.5rem;
  }
  .pain-card h3, .feature-card h3 {
    font-size: 1.1rem;
    font-weight: 700;
    margin-bottom: 0.3rem;
  }
  .pain-card p, .feature-card p {
    font-size: 0.9rem;
    color: var(--text-muted);
  }

  /* Feature grid */
  .feature-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.25rem;
    margin-top: 2rem;
  }

  /* QA grid */
  .qa-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
    margin-top: 1.5rem;
  }
  .qa-item {
    background: var(--surface);
    border-radius: 8px;
    padding: 0.8rem 1rem;
    font-size: 0.95rem;
    border-left: 3px solid var(--green);
  }

  /* Showcase slide */
  .showcase-slide {
    display: grid;
    grid-template-columns: 1fr 1.3fr;
    gap: 2.5rem;
    align-items: center;
  }
  .showcase-badge { margin-bottom: 1rem; }
  .tag {
    display: inline-block;
    padding: 0.25rem 0.75rem;
    background: rgba(129,140,248,0.15);
    border: 1px solid rgba(129,140,248,0.3);
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--accent);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .showcase-slide h2 {
    font-size: 2.2rem;
    margin-bottom: 0.5rem;
  }
  .showcase-desc {
    font-size: 1.1rem;
    color: var(--text-muted);
    margin-bottom: 1.25rem;
  }
  .showcase-features {
    list-style: none;
    padding: 0;
    margin-bottom: 1.5rem;
  }
  .showcase-features li {
    padding: 0.35rem 0;
    padding-left: 1.2rem;
    position: relative;
    font-size: 0.95rem;
    color: var(--text-muted);
  }
  .showcase-features li::before {
    content: '›';
    position: absolute;
    left: 0;
    color: var(--accent);
    font-weight: 700;
  }
  .showcase-meta {
    display: flex;
    gap: 1rem;
    font-size: 0.8rem;
    color: var(--green);
  }
  .screenshot-frame {
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid rgba(255,255,255,0.08);
    box-shadow: 0 20px 60px rgba(0,0,0,0.5);
    background: #000;
  }
  .screenshot-frame img {
    width: 100%;
    height: auto;
    display: block;
  }

  /* Deploy steps */
  .deploy-steps {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 2rem;
    margin: 2.5rem 0;
    text-align: center;
  }
  .deploy-step {
    background: var(--surface);
    border-radius: 12px;
    padding: 2rem 1.5rem;
    border: 1px solid rgba(255,255,255,0.06);
  }
  .step-num {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    background: var(--accent);
    color: white;
    border-radius: 50%;
    font-weight: 700;
    font-size: 1.1rem;
    margin-bottom: 1rem;
  }
  .deploy-step h3 {
    font-size: 1.2rem;
    margin-bottom: 0.75rem;
  }
  .deploy-step code {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.85rem;
    background: rgba(0,0,0,0.3);
    padding: 0.3rem 0.75rem;
    border-radius: 6px;
    color: var(--accent-bright);
  }
  .deploy-result {
    text-align: center;
    margin-top: 1rem;
  }
  .deploy-result p {
    font-size: 1.1rem;
    color: var(--text-muted);
    margin-bottom: 0.75rem;
  }
  .cost-badge {
    display: inline-block;
    padding: 0.5rem 1.5rem;
    background: rgba(34,197,94,0.15);
    border: 1px solid rgba(34,197,94,0.3);
    border-radius: 2rem;
    font-weight: 700;
    color: var(--green);
    font-size: 1.1rem;
  }

  /* Price comparison */
  .price-comparison {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
    margin-top: 2.5rem;
  }
  .price-card {
    border-radius: 12px;
    padding: 2rem;
    text-align: center;
  }
  .price-card.old {
    background: rgba(239,68,68,0.08);
    border: 1px solid rgba(239,68,68,0.2);
  }
  .price-card.new {
    background: rgba(34,197,94,0.08);
    border: 2px solid rgba(34,197,94,0.3);
    position: relative;
  }
  .price-label {
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--text-muted);
    margin-bottom: 0.75rem;
  }
  .price-amount {
    font-size: 2.8rem;
    font-weight: 900;
    margin-bottom: 1.5rem;
  }
  .price-card.old .price-amount { color: var(--red); }
  .price-card.new .price-amount { color: var(--green); }
  .price-card ul {
    list-style: none;
    padding: 0;
    text-align: left;
  }
  .price-card li {
    padding: 0.5rem 0;
    font-size: 0.95rem;
    color: var(--text-muted);
    border-bottom: 1px solid rgba(255,255,255,0.05);
  }
  .price-badge {
    position: absolute;
    top: -12px;
    right: 20px;
    background: var(--green);
    color: #000;
    padding: 0.3rem 0.75rem;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
  }

  /* CTA slide */
  .cta-links {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    align-items: center;
    margin-top: 2rem;
  }
  .cta-item {
    text-align: center;
  }
  .cta-label {
    display: block;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--text-muted);
    margin-bottom: 0.25rem;
  }
  .cta-item code {
    font-family: 'JetBrains Mono', monospace;
    font-size: 1rem;
    background: var(--surface);
    padding: 0.5rem 1.25rem;
    border-radius: 8px;
    color: var(--accent-bright);
    border: 1px solid rgba(255,255,255,0.06);
  }
</style>
</head>
<body>

<div class="progress" id="progress"></div>
<div class="counter" id="counter"></div>
<button class="nav-btn left" onclick="navigate(-1)">‹</button>
<button class="nav-btn right" onclick="navigate(1)">›</button>

<div class="deck" id="deck">
${slides.map((s, i) => `  <div class="slide${i === 0 ? ' active' : ''}" data-index="${i}">${s.html}</div>`).join('\n')}
</div>

<script>
let current = 0;
const total = ${slides.length};
const slides = document.querySelectorAll('.slide');
const progress = document.getElementById('progress');
const counter = document.getElementById('counter');

function updateUI() {
  slides.forEach((s, i) => {
    s.classList.remove('active', 'prev');
    if (i === current) s.classList.add('active');
    else if (i < current) s.classList.add('prev');
  });
  progress.style.width = ((current + 1) / total * 100) + '%';
  counter.textContent = (current + 1) + ' / ' + total;
}

function navigate(dir) {
  current = Math.max(0, Math.min(total - 1, current + dir));
  updateUI();
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); navigate(1); }
  if (e.key === 'ArrowLeft') { e.preventDefault(); navigate(-1); }
  if (e.key === 'Home') { current = 0; updateUI(); }
  if (e.key === 'End') { current = total - 1; updateUI(); }
});

// Touch support
let touchStartX = 0;
document.addEventListener('touchstart', (e) => { touchStartX = e.touches[0].clientX; });
document.addEventListener('touchend', (e) => {
  const dx = e.changedTouches[0].clientX - touchStartX;
  if (Math.abs(dx) > 50) navigate(dx < 0 ? 1 : -1);
});

updateUI();
</script>
</body>
</html>`;

const outPath = path.join(ROOT, 'docs', 'Forge-Pro-Presentation.html');
fs.writeFileSync(outPath, html, 'utf8');
console.log(`✅ Presentation generated: ${outPath}`);
console.log(`   ${slides.length} slides, ${(fs.statSync(outPath).size / 1024 / 1024).toFixed(1)} MB`);
