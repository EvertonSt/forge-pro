import { chromium } from 'playwright';
import type { ThresholdConfig } from '../config.js';

/**
 * Suite 1 — smoke & responsive (docs/qa-gate.md §4).
 *
 * For every configured breakpoint: the page must load, must not overflow
 * horizontally, and configured probe elements must be visible. Error-level
 * console messages and page errors are collected across the whole run and
 * compared against the total budget.
 */

export interface SmokeCheck {
  id: string;
  status: 'passed' | 'failed';
  detail?: string;
}

export interface SmokeResult {
  status: 'passed' | 'failed' | 'error';
  checks: SmokeCheck[];
  consoleErrors: string[];
}

export async function runSmokeSuite(url: string, config: ThresholdConfig): Promise<SmokeResult> {
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
  } catch (error) {
    console.error('forge-qa: chromium launch failed', error instanceof Error ? error.message : error);
    return {
      status: 'error',
      checks: [],
      consoleErrors: [],
    };
  }

  const checks: SmokeCheck[] = [];
  const consoleErrors: string[] = [];

  try {
    for (const width of config.responsive.breakpoints) {
      checks.push(...(await checkBreakpoint(browser, url, width, config, consoleErrors)));
    }
  } catch (error) {
    checks.push({
      id: 'smoke-run',
      status: 'failed',
      detail: `Suite crashed: ${error instanceof Error ? error.message : String(error)}`,
    });
  } finally {
    await browser.close();
  }

  // Console-error budget is global (the whole run), not per breakpoint.
  checks.push({
    id: 'console-errors',
    status: consoleErrors.length <= config.responsive.maxConsoleErrors ? 'passed' : 'failed',
    detail:
      consoleErrors.length > 0 ? `${consoleErrors.length} error-level message(s): ${consoleErrors.join(' | ').slice(0, 400)}` : undefined,
  });

  const failed = checks.some((c) => c.status === 'failed');
  return { status: failed ? 'failed' : 'passed', checks, consoleErrors };
}

async function checkBreakpoint(
  browser: Awaited<ReturnType<typeof chromium.launch>>,
  url: string,
  width: number,
  config: ThresholdConfig,
  consoleErrors: string[]
): Promise<SmokeCheck[]> {
  const context = await browser.newContext({
    viewport: { width, height: 900 },
    deviceScaleFactor: 1,
    reducedMotion: 'reduce',
    locale: 'en-US',
  });
  const page = await context.newPage();

  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(String(error)));

  const checks: SmokeCheck[] = [];
  try {
    await page.goto(url, {
      waitUntil: 'networkidle',
      timeout: config.responsive.navigationTimeoutMs,
    });
    // Let layout settle before measuring.
    await page.waitForTimeout(500);

    const { scrollWidth, innerWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    }));
    checks.push({
      id: `overflow@${width}`,
      status: scrollWidth <= innerWidth ? 'passed' : 'failed',
      detail: scrollWidth > innerWidth ? `scrollWidth ${scrollWidth} > innerWidth ${innerWidth}` : undefined,
    });

    for (const probe of config.responsive.probes) {
      let visible = false;
      try {
        visible = await page.locator(probe).first().isVisible();
      } catch {
        visible = false;
      }
      checks.push({
        id: `probe:${probe}@${width}`,
        status: visible ? 'passed' : 'failed',
        detail: visible ? undefined : `No visible element matching '${probe}'`,
      });
    }
  } catch (error) {
    checks.push({
      id: `navigate@${width}`,
      status: 'failed',
      detail: error instanceof Error ? error.message : String(error),
    });
  } finally {
    await context.close();
  }

  return checks;
}
