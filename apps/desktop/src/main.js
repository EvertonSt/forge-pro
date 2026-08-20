'use strict';

/**
 * Forge Pro — desktop shell.
 *
 * Boots the portal's production build (the staged Next.js standalone server
 * in runtime/app — see scripts/prepare-runtime.mjs) and opens it in a native
 * window. Runs purely in demo mode: no Supabase env is set, so the app serves
 * the file-backed demo store with the pinned vendor/admin identities
 * (ALLOW_DEMO_MODE=1). The demo store persists under the OS user-data dir, so
 * portal state survives restarts.
 *
 * The server runs as a child of this process using Electron's bundled Node
 * (ELECTRON_RUN_AS_NODE=1) — no Node installation required on the user's
 * machine.
 */

const { app, BrowserWindow, Menu, dialog, shell } = require('electron');
const { spawn, execFile } = require('node:child_process');
const { existsSync } = require('node:fs');
const http = require('node:http');
const { join } = require('node:path');

const HOST = '127.0.0.1';
const PORT = Number(process.env.FORGE_PORT) || 4310;
const READY_TIMEOUT_MS = 90_000;

let server = null;
let mainWindow = null;
let portalReady = false;

function runtimeAppDir() {
  return app.isPackaged
    ? join(process.resourcesPath, 'app')
    : join(__dirname, '..', 'runtime', 'app');
}

/** The bundled PDF guide (extraResources `to: guide`); the repo copy in dev. */
function guidePdfPath() {
  return app.isPackaged
    ? join(process.resourcesPath, 'guide', 'Forge-Pro-Desktop-Guide.pdf')
    : join(__dirname, '..', 'Forge-Pro-Desktop-Guide.pdf');
}

/** Minimal menu: File → Open guide / Quit. Replaces the default menu. */
function buildMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Open user guide (PDF)',
          accelerator: 'F1',
          click: () => {
            const pdf = guidePdfPath();
            if (!existsSync(pdf)) {
              dialog.showErrorBox('Forge Pro', `Guide not found: ${pdf}\n\nRegenerate with pnpm desktop:guide.`);
              return;
            }
            shell.openPath(pdf);
          },
        },
        { type: 'separator' },
        { role: 'quit', label: 'Exit' },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function log(stream, chunk) {
  const line = String(chunk).trimEnd();
  if (line) stream(`[portal] ${line}`);
}

function startPortal(runtime, demoStore) {
  const serverJs = join(runtime, 'server.js');
  return spawn(process.execPath, [serverJs], {
    cwd: runtime,
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: '1',
      NODE_ENV: 'production',
      HOSTNAME: HOST,
      PORT: String(PORT),
      ALLOW_DEMO_MODE: '1',
      DEMO_STORE_DIR: demoStore,
      NEXT_TELEMETRY_DISABLED: '1',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  });
}

function waitForPortal(timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  const url = `http://${HOST}:${PORT}/vendor`;
  return new Promise((resolve, reject) => {
    const probe = () => {
      const req = http.get(url, (res) => {
        res.resume();
        if (res.statusCode === 200) return resolve();
        if (Date.now() > deadline) return reject(new Error(`portal not ready (HTTP ${res.statusCode})`));
        setTimeout(probe, 400);
      });
      req.on('error', () => {
        if (Date.now() > deadline) return reject(new Error('portal did not become ready in time'));
        setTimeout(probe, 400);
      });
      req.setTimeout(2_000, () => req.destroy());
    };
    probe();
  });
}

function stopPortal() {
  if (!server) return;
  const child = server;
  server = null;
  try {
    child.kill();
  } catch {
    // already gone
  }
  // Windows: force-kill the process tree so a lingering server never holds
  // the port for the next launch.
  if (process.platform === 'win32' && child.pid) {
    execFile('taskkill', ['/pid', String(child.pid), '/T', '/F'], () => {});
  }
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'Forge Pro — Vendor Portal (demo)',
    autoHideMenuBar: true,
    webPreferences: {
      // The page is served by the local portal; no Node access needed.
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  mainWindow.loadURL(`http://${HOST}:${PORT}/vendor`);
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Single instance: a second launch focuses the existing window instead of
// booting a second portal on the same port.
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(async () => {
    buildMenu();
    const runtime = runtimeAppDir();
    const serverJs = join(runtime, 'server.js');
    if (!existsSync(serverJs)) {
      dialog.showErrorBox(
        'Forge Pro',
        `The portal runtime is missing (${serverJs}).\n\nRe-run the runtime prepare step before launching.`,
      );
      app.quit();
      return;
    }

    const demoStore = join(app.getPath('userData'), 'demo-store');
    server = startPortal(runtime, demoStore);
    server.stdout.on('data', (d) => log(console.log, d));
    server.stderr.on('data', (d) => log(console.error, d));
    server.on('exit', (code, signal) => {
      // Normal shutdown: stopPortal() nulls the handle before killing, so an
      // exit with the handle still set is an unexpected crash — before or
      // after ready. Surface it and quit rather than stranding a dead window.
      if (server === null) return;
      server = null;
      dialog.showErrorBox(
        'Forge Pro',
        `The portal server exited unexpectedly (code ${code ?? 'n/a'}${signal ? `, signal ${signal}` : ''}).\n\nSee the terminal output for details.`,
      );
      app.quit();
    });

    try {
      await waitForPortal(READY_TIMEOUT_MS);
      portalReady = true;
      await createWindow();
    } catch (error) {
      dialog.showErrorBox('Forge Pro', `Could not start the portal: ${error.message}`);
      app.quit();
    }
  });

  app.on('window-all-closed', () => {
    stopPortal();
    app.quit();
  });

  app.on('before-quit', () => {
    stopPortal();
  });
}
