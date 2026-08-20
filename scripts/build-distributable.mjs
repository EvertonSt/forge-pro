/**
 * build-distributable.mjs
 *
 * Creates a self-contained ZIP archive of Forge-Pro:
 *   - Desktop installer (exe)
 *   - All 10 templates (source only, no node_modules)
 *   - User Guide PDF
 *   - Marketing presentation
 *   - Deploy script
 *   - README with instructions
 */
import { execSync } from 'node:child_process';
import { mkdirSync, existsSync, writeFileSync, copyFileSync, readdirSync, statSync } from 'node:fs';
import { join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = join(__dirname, '..');
const STAGE = join(ROOT, 'dist-stage');
const ZIP_OUT = join(ROOT, 'Forge-Pro-Distributable.zip');

const TEMPLATES = [
  'nimbus', 'atlas', 'lumen', 'studio', 'forge',
  'pulse', 'sage', 'mesa', 'ledger', 'quill'
];

// ─── helpers ──────────────────────────────────────────────────────────────
function run(cmd) {
  console.log(`  $ ${cmd}`);
  execSync(cmd, { cwd: ROOT, stdio: 'inherit', shell: 'bash' });
}

function rmrf(p) {
  if (existsSync(p)) execSync(`rm -rf "${p}"`, { shell: 'bash' });
}

function cp(src, dest) {
  execSync(`cp -r "${src}" "${dest}"`, { shell: 'bash' });
}

// ─── step 1: clean stage ──────────────────────────────────────────────────
console.log('\n🔨 Building Forge-Pro Distributable\n');
console.log('1. Cleaning staging directory...');
rmrf(STAGE);
mkdirSync(STAGE, { recursive: true });

// ─── step 2: copy desktop installer ───────────────────────────────────────
console.log('2. Copying desktop installer...');
const installer = join(ROOT, 'apps', 'desktop', 'release', 'Forge Pro-Setup-0.1.0.exe');
if (existsSync(installer)) {
  mkdirSync(join(STAGE, 'Install'), { recursive: true });
  cp(installer, join(STAGE, 'Install'));
  console.log('   ✓ Installer copied');
} else {
  console.log('   ⚠ Installer not found — skipping (build with npm run package in apps/desktop)');
}

// ─── step 3: copy templates (excluding node_modules, .next, dist) ─────────
console.log('3. Copying 10 templates (source only)...');
mkdirSync(join(STAGE, 'Templates'), { recursive: true });
const EXCLUDES = ['node_modules', '.next', 'dist', '.turbo', '.vercel'];

for (const t of TEMPLATES) {
  const src = join(ROOT, 'templates', t);
  const dest = join(STAGE, 'Templates', t);
  if (!existsSync(src)) { console.log(`   ⚠ ${t} not found — skipping`); continue; }

  // Use rsync-style exclude to skip heavy dirs
  const excludeFlags = EXCLUDES.map(e => `--exclude='${e}'`).join(' ');
  run(`rsync -a ${excludeFlags} "${src}/" "${dest}/" 2>/dev/null || cp -r "${src}" "${dest}"`);
  console.log(`   ✓ ${t}`);
}

// ─── step 4: copy docs ────────────────────────────────────────────────────
console.log('4. Copying documentation...');
mkdirSync(join(STAGE, 'Docs'), { recursive: true });

const docs = [
  ['docs/Forge-Pro-User-Guide.pdf', 'Forge-Pro-User-Guide.pdf'],
  ['docs/Forge-Pro-Presentation.html', 'Forge-Pro-Presentation.html'],
  ['DEPLOY.md', 'DEPLOY.md'],
];

for (const [src, dest] of docs) {
  const srcPath = join(ROOT, src);
  if (existsSync(srcPath)) {
    cp(srcPath, join(STAGE, 'Docs', dest));
    console.log(`   ✓ ${dest}`);
  }
}

// ─── step 5: copy deploy script ───────────────────────────────────────────
console.log('5. Copying deploy script...');
mkdirSync(join(STAGE, 'Scripts'), { recursive: true });
const deployScript = join(ROOT, 'scripts', 'deploy-vercel.sh');
if (existsSync(deployScript)) {
  cp(deployScript, join(STAGE, 'Scripts'));
  console.log('   ✓ deploy-vercel.sh');
}

// ─── step 6: write README ─────────────────────────────────────────────────
console.log('6. Writing README...');
const readme = `═══════════════════════════════════════════════════════════════
                    FORGE-PRO  v1.0
        Premium Website Templates Marketplace
═══════════════════════════════════════════════════════════════

Welcome to Forge-Pro! This package contains everything you
need to deploy 10 production-ready website templates.

───────────────────────────────────────────────────────────────
QUICK START (5 minutes)
───────────────────────────────────────────────────────────────

  1. DEPLOY A TEMPLATE (Free on Vercel)

     a) Install Vercel CLI:
        npm i -g vercel

     b) Login:
        vercel login

     c) Deploy any template:
        cd Templates/nimbus
        npm install
        vercel --prod

     Your site is live at: nimbus-forge.vercel.app

  2. DEPLOY ALL 10 AT ONCE

     ./Scripts/deploy-vercel.sh

  3. INSTALL THE DESKTOP APP (Windows)

     Double-click:
       Install/Forge Pro-Setup-0.1.0.exe

     Follow the installer prompts. The app runs in demo mode
     with sample data — no backend required.

───────────────────────────────────────────────────────────────
WHAT'S INCLUDED
───────────────────────────────────────────────────────────────

  Install/
    Forge Pro-Setup-0.1.0.exe    Desktop app installer (Windows x64)

  Templates/
    nimbus/    AI SaaS Landing Page        (Astro)
    atlas/     SaaS Dashboard              (Next.js)
    lumen/     E-commerce Store            (Astro)
    studio/    Creative Agency             (SvelteKit)
    forge/     Local Business / Booking    (Next.js)
    pulse/     Blog / Newsletter           (Astro)
    sage/      Course Platform / LMS       (Next.js)
    mesa/      Restaurant / Hospitality    (Astro)
    ledger/    Finance Dashboard           (Next.js)
    quill/     Documentation / KB          (Astro)

  Docs/
    Forge-Pro-User-Guide.pdf          Complete user guide
    Forge-Pro-Presentation.html       Marketing slide deck
    DEPLOY.md                         Deployment documentation

  Scripts/
    deploy-vercel.sh                  One-command Vercel deploy

───────────────────────────────────────────────────────────────
TEMPLATE FEATURES (ALL 10)
───────────────────────────────────────────────────────────────

  ✅ Responsive at 320 / 768 / 1280 / 1920px
  ✅ Zero console errors
  ✅ Dark / light theme toggle
  ✅ WCAG AA+ accessible
  ✅ SEO optimized (meta, OG, JSON-LD, sitemap)
  ✅ Toast notifications & micro-interactions
  ✅ Print-ready, mobile-first design
  ✅ Free hosting on Vercel ($0/month)

───────────────────────────────────────────────────────────────
CUSTOMIZATION
───────────────────────────────────────────────────────────────

  1. Edit CSS variables in the global stylesheet:
     templates/<name>/src/styles/global.css  (Astro)
     templates/<name>/src/app/globals.css     (Next.js)

     :root {
       --accent: #e63946;    /* Change your brand color */
       --bg: #faf9f7;        /* Change background */
     }

  2. Replace images in public/ or update <img> src URLs

  3. Edit content directly in page files (JSX/Astro)

  4. Add the forge-pro:verify meta tag for marketplace submission:
     <meta name="forge-pro:verify" content="YOUR_TOKEN" />

───────────────────────────────────────────────────────────────
NEED HELP?
───────────────────────────────────────────────────────────────

  📖  Read Docs/Forge-Pro-User-Guide.pdf
  🚀  Read Docs/DEPLOY.md for deployment details
  🎨  Open Docs/Forge-Pro-Presentation.html for overview

───────────────────────────────────────────────────────────────
SYSTEM REQUIREMENTS
───────────────────────────────────────────────────────────────

  • Node.js 22+ (for template development)
  • Windows, macOS, or Linux
  • Modern browser (Chrome, Firefox, Safari, Edge)

═══════════════════════════════════════════════════════════════
  Built with ❤️  •  August 2026
  forge-pro.vercel.app
═══════════════════════════════════════════════════════════════
`;
writeFileSync(join(STAGE, 'README.txt'), readme, 'utf8');
console.log('   ✓ README.txt');

// ─── step 7: create ZIP ───────────────────────────────────────────────────
console.log('\n7. Creating ZIP archive...');
rmrf(ZIP_OUT);

// Use PowerShell Compress-Archive (available on all Windows)
const stagePath = STAGE.replace(/\//g, '\\');
const zipPath = ZIP_OUT.replace(/\//g, '\\');
run(`powershell -NoProfile -Command "Compress-Archive -Path '${stagePath}\\*' -DestinationPath '${zipPath}' -CompressionLevel Optimal"`);

// ─── step 8: report ───────────────────────────────────────────────────────
const { size } = statSync(ZIP_OUT);
const sizeMB = (size / 1024 / 1024).toFixed(1);
console.log(`\n✅ Done!`);
console.log(`   ZIP: ${ZIP_OUT}`);
console.log(`   Size: ${sizeMB} MB`);
console.log(`\n   Contents:`);

// List top-level dirs
for (const d of readdirSync(STAGE)) {
  const s = statSync(join(STAGE, d));
  if (s.isDirectory()) {
    const count = readdirSync(join(STAGE, d)).length;
    console.log(`   📁 ${d}/ (${count} items)`);
  } else {
    console.log(`   📄 ${d} (${(s.size/1024).toFixed(0)}KB)`);
  }
}

// Clean up stage
console.log('\n8. Cleaning up staging directory...');
rmrf(STAGE);
console.log('   ✓ Done\n');
