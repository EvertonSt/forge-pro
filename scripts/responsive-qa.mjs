/**
 * Responsive QA — Playwright screenshots at 4 breakpoints for all 5 templates.
 * 
 * Usage: node scripts/responsive-qa.mjs [--template nimbus] [--output ./qa-screenshots]
 * 
 * Outputs: qa-screenshots/<template>/<width>px.png + index.html report
 */

import { chromium } from 'playwright';
import { execSync, spawn } from 'child_process';
import { existsSync, mkdirSync, writeFileSync, readdirSync, readFileSync } from 'fs';
import { join, resolve } from 'path';

const BREAKPOINTS = [
  { width: 320, height: 568, label: '320px', device: 'iPhone SE' },
  { width: 768, height: 1024, label: '768px', device: 'iPad' },
  { width: 1280, height: 800, label: '1280px', device: 'Laptop' },
  { width: 1920, height: 1080, label: '1920px', device: 'Desktop' },
];

const TEMPLATES = [
  // Batch 1
  { name: 'nimbus', port: 4320, cmd: 'npm', args: ['run', 'dev', '--', '--port', '4320', '--host'], url: 'http://localhost:4320' },
  { name: 'atlas', port: 3000, cmd: 'npm', args: ['run', 'dev', '--', '-p', '3000'], url: 'http://localhost:3000' },
  { name: 'lumen', port: 4321, cmd: 'npm', args: ['run', 'dev', '--', '--port', '4321', '--host'], url: 'http://localhost:4321' },
  { name: 'studio', port: 5173, cmd: 'npm', args: ['run', 'dev', '--', '--port', '5173'], url: 'http://localhost:5173' },
  { name: 'forge', port: 3001, cmd: 'npm', args: ['run', 'dev', '--', '-p', '3001'], url: 'http://localhost:3001' },
  // Batch 2
  { name: 'pulse', port: 4322, cmd: 'npm', args: ['run', 'dev', '--', '--port', '4322', '--host'], url: 'http://localhost:4322' },
  { name: 'sage', port: 3002, cmd: 'npm', args: ['run', 'dev', '--', '-p', '3002'], url: 'http://localhost:3002' },
  { name: 'mesa', port: 4323, cmd: 'npm', args: ['run', 'dev', '--', '--port', '4323', '--host'], url: 'http://localhost:4323' },
  { name: 'ledger', port: 3003, cmd: 'npm', args: ['run', 'dev', '--', '-p', '3003'], url: 'http://localhost:3003' },
  { name: 'quill', port: 4324, cmd: 'npm', args: ['run', 'dev', '--', '--port', '4324', '--host'], url: 'http://localhost:4324' },
];

// Parse args
const args = process.argv.slice(2);
const onlyTemplate = args.find((a, i) => args[i - 1] === '--template');
const outputDir = resolve(args.find((a, i) => args[i - 1] === '--output') || './qa-screenshots');

const templates = onlyTemplate
  ? TEMPLATES.filter(t => t.name === onlyTemplate)
  : TEMPLATES;

const ROOT = resolve(import.meta.dirname, '..');

async function waitForServer(url, timeoutMs = 60000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch {}
    await new Promise(r => setTimeout(r, 1000));
  }
  return false;
}

function killPort(port) {
  try {
    if (process.platform === 'win32') {
      execSync(`powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort ${port} -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"`, { stdio: 'ignore' });
    } else {
      execSync(`lsof -ti:${port} | xargs kill -9 2>/dev/null || true`, { stdio: 'ignore' });
    }
  } catch {}
}

async function screenshotTemplate(browser, template) {
  const templateDir = join(ROOT, 'templates', template.name);
  const outDir = join(outputDir, template.name);
  mkdirSync(outDir, { recursive: true });

  console.log(`\n🚀 Starting ${template.name} on port ${template.port}...`);
  killPort(template.port);

  const child = spawn(template.cmd, template.args, {
    cwd: templateDir,
    stdio: 'pipe',
    shell: true,
    env: { ...process.env, NODE_ENV: 'development' },
  });

  child.stdout?.on('data', d => {
    const s = d.toString();
    if (s.includes('Ready') || s.includes('ready') || s.includes('Local:')) {
      console.log(`  ✅ ${template.name} server ready`);
    }
  });
  child.stderr?.on('data', d => {
    const s = d.toString();
    if (s.includes('ready') || s.includes('listening')) {
      console.log(`  ✅ ${template.name} server ready`);
    }
  });

  const ready = await waitForServer(template.url);
  if (!ready) {
    console.log(`  ❌ ${template.name} failed to start — skipping`);
    child.kill('SIGKILL');
    return [];
  }

  const context = await browser.newContext();
  const screenshots = [];

  for (const bp of BREAKPOINTS) {
    console.log(`  📸 ${bp.label} (${bp.device})...`);
    await context.close();
    const page = await (await browser.newContext({
      viewport: { width: bp.width, height: bp.height },
    })).newPage();

    try {
      await page.goto(template.url, { waitUntil: 'networkidle', timeout: 30000 });
      // Wait for animations to settle
      await page.waitForTimeout(1000);

      const filename = `${bp.label}.png`;
      await page.screenshot({ path: join(outDir, filename), fullPage: true });

      // Check for horizontal overflow — test actual scrollability
      const overflowInfo = await page.evaluate(() => {
        const body = document.body;
        const html = document.documentElement;
        const bodyScroll = body.scrollWidth;
        const htmlScroll = html.scrollWidth;
        const clientWidth = html.clientWidth;
        // overflow-x: hidden on html prevents actual scrolling
        const canScrollHorizontally = html.scrollLeftMax > 0 || (htmlScroll > clientWidth && getComputedStyle(html).overflowX !== 'hidden' && getComputedStyle(body).overflowX !== 'hidden');
        return { bodyScroll, htmlScroll, clientWidth, canScrollHorizontally };
      });
      const bodyWidth = overflowInfo.bodyScroll;
      const viewportWidth = bp.width;
      const hasOverflow = overflowInfo.canScrollHorizontally;

      // Check for console errors
      const errors = [];
      page.on('pageerror', err => errors.push(err.message));

      screenshots.push({
        template: template.name,
        breakpoint: bp.label,
        device: bp.device,
        width: bp.width,
        filename,
        hasOverflow,
        bodyWidth,
        errors: errors.length,
      });

      console.log(`    ${hasOverflow ? '⚠️  OVERFLOW' : '✅'} body=${bodyWidth}px html=${overflowInfo.htmlScroll}px client=${overflowInfo.clientWidth}px viewport=${viewportWidth}px`);
    } catch (err) {
      console.log(`    ❌ Error: ${err.message}`);
      screenshots.push({
        template: template.name,
        breakpoint: bp.label,
        device: bp.device,
        width: bp.width,
        filename: null,
        hasOverflow: false,
        bodyWidth: 0,
        errors: 0,
        error: err.message,
      });
    }
    await page.close();
  }

  await context.close();
  child.kill('SIGKILL');
  killPort(template.port);

  return screenshots;
}

function generateReport(allScreenshots) {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Responsive QA Report — Forge Pro Templates</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: system-ui, sans-serif; padding: 2rem; background: #0f172a; color: #e2e8f0; }
  h1 { font-size: 1.5rem; margin-bottom: 0.5rem; }
  .subtitle { color: #94a3b8; margin-bottom: 2rem; }
  .template-section { margin-bottom: 3rem; }
  .template-name { font-size: 1.25rem; font-weight: 700; margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 1px solid #334155; }
  .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
  .card { background: #1e293b; border-radius: 0.75rem; overflow: hidden; border: 1px solid #334155; }
  .card-header { padding: 0.75rem 1rem; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #334155; }
  .card-header h3 { font-size: 0.875rem; font-weight: 600; }
  .badge { padding: 2px 8px; border-radius: 999px; font-size: 0.6875rem; font-weight: 600; }
  .badge--pass { background: #065f46; color: #34d399; }
  .badge--fail { background: #7f1d1d; color: #fca5a5; }
  .screenshot { padding: 0.5rem; background: #0f172a; }
  .screenshot img { width: 100%; height: auto; border-radius: 0.375rem; display: block; }
  .summary { display: grid; grid-template-columns: repeat(5, 1fr); gap: 1rem; margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid #334155; }
  .summary-card { background: #1e293b; border-radius: 0.75rem; padding: 1rem; text-align: center; border: 1px solid #334155; }
  .summary-card h4 { font-size: 0.875rem; margin-bottom: 0.5rem; }
  .summary-card .stat { font-size: 2rem; font-weight: 800; }
  .stat--good { color: #34d399; }
  .stat--bad { color: #fca5a5; }
  @media (max-width: 768px) { .grid { grid-template-columns: repeat(2, 1fr); } .summary { grid-template-columns: repeat(2, 1fr); } }
</style>
</head>
<body>
<h1>🔍 Responsive QA Report</h1>
<p class="subtitle">Forge Pro Templates — Screenshots at 320px, 768px, 1280px, 1920px</p>

${allScreenshots.length === 0 ? '<p style="color:#f59e0b">No screenshots captured. Check server logs above.</p>' : ''}

${templates.map(t => {
  const shots = allScreenshots.filter(s => s.template === t.name);
  return `
<div class="template-section">
  <h2 class="template-name">${t.name.charAt(0).toUpperCase() + t.name.slice(1)}</h2>
  <div class="grid">
    ${shots.map(s => `
    <div class="card">
      <div class="card-header">
        <h3>${s.breakpoint} — ${s.device}</h3>
        <span class="badge ${s.hasOverflow ? 'badge--fail' : 'badge--pass'}">${s.hasOverflow ? 'OVERFLOW' : 'PASS'}</span>
      </div>
      <div class="screenshot">
        ${s.filename ? (() => { try { const imgData = readFileSync(join(outputDir, s.template, s.filename)); const b64 = imgData.toString('base64'); return `<img src="data:image/png;base64,${b64}" alt="${s.template} at ${s.breakpoint}" loading="lazy" style="max-width:100%;height:auto" />`; } catch { return '<p style="padding:2rem;text-align:center;color:#f59e0b">Image not found</p>'; } })() : '<p style="padding:2rem;text-align:center;color:#f59e0b">Failed to capture</p>'}
      </div>
    </div>`).join('')}
  </div>
</div>`;
}).join('')}

<div class="summary">
  <div class="summary-card">
    <h4>Total Screenshots</h4>
    <div class="stat">${allScreenshots.length}</div>
  </div>
  <div class="summary-card">
    <h4>Overflow Issues</h4>
    <div class="stat ${allScreenshots.filter(s => s.hasOverflow).length > 0 ? 'stat--bad' : 'stat--good'}">${allScreenshots.filter(s => s.hasOverflow).length}</div>
  </div>
  <div class="summary-card">
    <h4>Templates Tested</h4>
    <div class="stat">${new Set(allScreenshots.map(s => s.template)).size}</div>
  </div>
  <div class="summary-card">
    <h4>Breakpoints</h4>
    <div class="stat">${BREAKPOINTS.length}</div>
  </div>
  <div class="summary-card">
    <h4>Overall</h4>
    <div class="stat ${allScreenshots.some(s => s.hasOverflow) ? 'stat--bad' : 'stat--good'}">${allScreenshots.some(s => s.hasOverflow) ? '⚠️' : '✅'}</div>
  </div>
</div>
</body>
</html>`;

  writeFileSync(join(outputDir, 'index.html'), html);
  console.log(`\n📊 Report: ${join(outputDir, 'index.html')}`);
}

// Main
async function main() {
  console.log('🔍 Responsive QA — Screenshot Verification');
  console.log(`   Breakpoints: ${BREAKPOINTS.map(b => b.label).join(', ')}`);
  console.log(`   Templates: ${templates.map(t => t.name).join(', ')}`);
  console.log(`   Output: ${outputDir}\n`);

  mkdirSync(outputDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const allScreenshots = [];

  for (const template of templates) {
    const shots = await screenshotTemplate(browser, template);
    allScreenshots.push(...shots);
  }

  await browser.close();

  generateReport(allScreenshots);

  // Summary
  const overflowCount = allScreenshots.filter(s => s.hasOverflow).length;
  console.log(`\n${'═'.repeat(50)}`);
  console.log(`   Total: ${allScreenshots.length} screenshots`);
  console.log(`   Overflow issues: ${overflowCount}`);
  console.log(`   Status: ${overflowCount === 0 ? '✅ ALL PASS' : '⚠️  ISSUES FOUND'}`);
  console.log(`${'═'.repeat(50)}\n`);

  process.exit(overflowCount > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
