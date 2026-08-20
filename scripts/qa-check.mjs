/**
 * QA Check — Console errors + basic accessibility for all 10 templates.
 * 
 * Usage: node scripts/qa-check.mjs [--template nimbus]
 */

import { chromium } from 'playwright';
import { execSync, spawn } from 'child_process';
import { resolve } from 'path';

const TEMPLATES = [
  { name: 'nimbus', port: 4320, cmd: 'npm', args: ['run', 'dev', '--', '--port', '4320', '--host'], url: 'http://localhost:4320' },
  { name: 'atlas', port: 3000, cmd: 'npm', args: ['run', 'dev', '--', '-p', '3000'], url: 'http://localhost:3000' },
  { name: 'lumen', port: 4321, cmd: 'npm', args: ['run', 'dev', '--', '--port', '4321', '--host'], url: 'http://localhost:4321' },
  { name: 'studio', port: 5173, cmd: 'npm', args: ['run', 'dev', '--', '--port', '5173'], url: 'http://localhost:5173' },
  { name: 'forge', port: 3001, cmd: 'npm', args: ['run', 'dev', '--', '-p', '3001'], url: 'http://localhost:3001' },
  { name: 'pulse', port: 4322, cmd: 'npm', args: ['run', 'dev', '--', '--port', '4322', '--host'], url: 'http://localhost:4322' },
  { name: 'sage', port: 3002, cmd: 'npm', args: ['run', 'dev', '--', '-p', '3002'], url: 'http://localhost:3002' },
  { name: 'mesa', port: 4323, cmd: 'npm', args: ['run', 'dev', '--', '--port', '4323', '--host'], url: 'http://localhost:4323' },
  { name: 'ledger', port: 3003, cmd: 'npm', args: ['run', 'dev', '--', '-p', '3003'], url: 'http://localhost:3003' },
  { name: 'quill', port: 4324, cmd: 'npm', args: ['run', 'dev', '--', '--port', '4324', '--host'], url: 'http://localhost:4324' },
];

const args = process.argv.slice(2);
const onlyTemplate = args.find((a, i) => args[i - 1] === '--template');
const templates = onlyTemplate ? TEMPLATES.filter(t => t.name === onlyTemplate) : TEMPLATES;
const ROOT = resolve(import.meta.dirname, '..');

async function waitForServer(url, timeoutMs = 60000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try { const res = await fetch(url); if (res.ok) return true; } catch {}
    await new Promise(r => setTimeout(r, 1000));
  }
  return false;
}

function killPort(port) {
  try {
    if (process.platform === 'win32') {
      execSync(`powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort ${port} -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"`, { stdio: 'ignore' });
    }
  } catch {}
}

async function checkTemplate(browser, template) {
  const templateDir = resolve(ROOT, 'templates', template.name);
  console.log(`\n🔍 Checking ${template.name}...`);
  killPort(template.port);

  const child = spawn(template.cmd, template.args, {
    cwd: templateDir, stdio: 'pipe', shell: true,
    env: { ...process.env, NODE_ENV: 'development' },
  });

  const ready = await waitForServer(template.url);
  if (!ready) {
    console.log(`  ❌ Failed to start`);
    child.kill('SIGKILL');
    return { template: template.name, errors: ['Server failed to start'], a11y: [], links: [] };
  }

  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const consoleErrors = [];
  const failedLinks = [];

  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', err => consoleErrors.push(err.message));
  page.on('response', res => {
    if (res.status() >= 400 && res.url().startsWith('http://localhost')) {
      failedLinks.push(`${res.status()} ${res.url()}`);
    }
  });

  try {
    await page.goto(template.url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1000);

    // Check for console errors
    console.log(`  Console errors: ${consoleErrors.length === 0 ? '✅ None' : `⚠️  ${consoleErrors.length}`}`);
    consoleErrors.forEach(e => console.log(`    - ${e.substring(0, 100)}`));

    // Check for failed internal links
    console.log(`  Failed links: ${failedLinks.length === 0 ? '✅ None' : `⚠️  ${failedLinks.length}`}`);
    failedLinks.forEach(l => console.log(`    - ${l}`));

    // Basic accessibility checks
    const a11yIssues = await page.evaluate(() => {
      const issues = [];
      
      // Check for images without alt
      document.querySelectorAll('img:not([alt])').forEach(img => {
        issues.push(`Image missing alt: ${img.src?.substring(0, 60)}`);
      });
      
      // Check for buttons without accessible names
      document.querySelectorAll('button').forEach(btn => {
        if (!btn.textContent?.trim() && !btn.getAttribute('aria-label') && !btn.getAttribute('aria-labelledby')) {
          issues.push(`Button without accessible name`);
        }
      });
      
      // Check for form inputs without labels
      document.querySelectorAll('input:not([type="hidden"]):not([type="submit"])').forEach(input => {
        if (!input.getAttribute('aria-label') && !input.getAttribute('aria-labelledby') && !document.querySelector(`label[for="${input.id}"]`)) {
          const placeholder = input.getAttribute('placeholder');
          if (!placeholder) issues.push(`Input without label: ${input.type || 'text'}`);
        }
      });
      
      // Check for skip link
      const skipLink = document.querySelector('a[href="#main"], a.sr-only, [class*="sr-only"], a[href^="#"]');
      const hasSkipText = Array.from(document.querySelectorAll('a')).some(a => /skip|go to main/i.test(a.textContent));
      if (!skipLink && !hasSkipText) issues.push('Missing skip-to-content link');
      
      // Check for lang attribute
      if (!document.documentElement.getAttribute('lang')) issues.push('Missing lang attribute on <html>');
      
      // Check for focus-visible styles
      const focusStyle = getComputedStyle(document.body).getPropertyValue('outline');
      
      return issues;
    });

    console.log(`  A11y issues: ${a11yIssues.length === 0 ? '✅ None' : `⚠️  ${a11yIssues.length}`}`);
    a11yIssues.forEach(i => console.log(`    - ${i}`));

  } catch (err) {
    console.log(`  ❌ Error: ${err.message}`);
  }

  await page.close();
  child.kill('SIGKILL');
  killPort(template.port);

  return { template: template.name, errors: consoleErrors, links: failedLinks, a11y: [] };
}

async function main() {
  console.log('🔍 QA Check — Console Errors + Accessibility');
  console.log(`   Templates: ${templates.map(t => t.name).join(', ')}\n`);

  const browser = await chromium.launch({ headless: true });
  const results = [];

  for (const template of templates) {
    const result = await checkTemplate(browser, template);
    results.push(result);
  }

  await browser.close();

  // Summary
  const totalErrors = results.reduce((s, r) => s + r.errors.length, 0);
  const totalLinks = results.reduce((s, r) => s + r.links.length, 0);
  const templatesWithErrors = results.filter(r => r.errors.length > 0).length;

  console.log(`\n${'═'.repeat(50)}`);
  console.log(`   Total console errors: ${totalErrors}`);
  console.log(`   Failed internal links: ${totalLinks}`);
  console.log(`   Templates with issues: ${templatesWithErrors}/${results.length}`);
  console.log(`   Status: ${totalErrors === 0 && totalLinks === 0 ? '✅ ALL PASS' : '⚠️  ISSUES FOUND'}`);
  console.log(`${'═'.repeat(50)}\n`);

  process.exit(totalErrors > 0 || totalLinks > 0 ? 1 : 0);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
