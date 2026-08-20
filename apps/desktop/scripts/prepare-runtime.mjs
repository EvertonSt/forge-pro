/**
 * prepare-runtime — stage the portal's production build for the desktop shell.
 *
 * 1. Builds the app + its workspace dependencies (turbo `^build` handles the
 *    dependency order; the app's next.config.mjs emits `output: standalone`).
 * 2. Assembles `apps/desktop/runtime/app`:
 *      .next/standalone/   → the self-contained server (server.js + trimmed
 *                            node_modules — this is what `next start` needs,
 *                            minus dev tooling, so the installer stays small)
 *      .next/static/       → copied next to the server (standalone requires
 *                            this move — it is NOT inside the standalone dir)
 *      public/             → copied next to the server, if the app has one
 *
 * The result is `apps/desktop/runtime/app`, which electron-builder mounts as
 * extraResources (`to: app`) and the main process runs with
 * ELECTRON_RUN_AS_NODE=1. Re-run after any app change: `pnpm desktop:prepare`.
 *
 * Usage: node apps/desktop/scripts/prepare-runtime.mjs
 */
import { copyFileSync, cpSync, existsSync, lstatSync, mkdirSync, readdirSync, readlinkSync, rmSync, symlinkSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..', '..', '..');
const appDir = join(repoRoot, 'apps', 'app');
const desktopDir = join(repoRoot, 'apps', 'desktop');
const runtimeApp = join(desktopDir, 'runtime', 'app');

function fail(message) {
  console.error(`prepare-runtime: ${message}`);
  process.exit(1);
}

function copy(src, dest) {
  if (!existsSync(src)) return false;
  cpSync(src, dest, { recursive: true });
  return true;
}

/**
 * Rebuild the pnpm store links in the STAGED tree. Node's cpSync hard-crashes
 * on this layout on Windows and robocopy mangles the symlinks, so after the
 * real files are copied we recreate every link by hand, pointing at the
 * staged store (the runtime must be relocatable — the packaged app lives in
 * Program Files, not the build checkout).
 *
 * Two kinds of links:
 *   1. Store-internal links (e.g. `.pnpm/next@…/node_modules/styled-jsx` →
 *      `../styled-jsx@…/node_modules/styled-jsx`): mirrored 1:1, resolved
 *      against the destination parent (identical relative structure).
 *   2. Top-level links (node_modules/next → .pnpm/next@…/node_modules/next):
 *      derived from the store's link manifest at `.pnpm/node_modules` — every
 *      entry there is a top-level name the runtime resolves.
 */
function relinkTree(srcNm, destNm) {
  const makeLink = (dest, relTarget) => {
    const absTarget = resolve(dirname(dest), relTarget);
    mkdirSync(dirname(dest), { recursive: true });
    // robocopy can leave a mangled link at the same path (absolute target
    // into the build checkout) — always replace, never keep a stale one.
    try {
      rmSync(dest, { recursive: true, force: true });
    } catch {
      // not a link / locked — junction removal is safe either way
    }
    symlinkSync(absTarget, dest, 'junction');
  };

  // 1. Mirror store-internal links.
  const walk = (srcDir, destDir) => {
    for (const name of readdirSync(srcDir)) {
      const src = join(srcDir, name);
      const dest = join(destDir, name);
      const st = lstatSync(src);
      if (st.isSymbolicLink()) {
        makeLink(dest, readlinkSync(src));
      } else if (st.isDirectory()) {
        mkdirSync(dest, { recursive: true });
        walk(src, dest);
      }
    }
  };
  walk(srcNm, destNm);

  // 2. Top-level links from the manifest. `.pnpm/node_modules/<name>` points
  //    at `../<storeDir>/node_modules/<name>`; from the top level that is
  //    `.pnpm/<storeDir>/node_modules/<name>`.
  const manifest = join(srcNm, '.pnpm', 'node_modules');
  if (existsSync(manifest)) {
    for (const name of readdirSync(manifest)) {
      const srcLink = join(manifest, name);
      if (!lstatSync(srcLink).isSymbolicLink()) continue;
      const relTarget = readlinkSync(srcLink);
      const stripped = relTarget.replace(/^\.\.(\\|\/)/, '');
      const topLevel = join(destNm, name);
      if (name.startsWith('@')) {
        mkdirSync(dirname(topLevel), { recursive: true });
      }
      makeLink(topLevel, join('.pnpm', stripped));
    }
  }

  console.log(
    `prepare-runtime: relinked ${relative(process.cwd(), srcNm)} symlinks into the staged node_modules`,
  );
}

/**
 * Next's standalone trace occasionally drops package files (it traced
 * @swc/helpers' cjs but not its esm, for example). Merge any missing FILES
 * from the repo's real pnpm store into the staged store — links are already
 * handled by relinkTree, so only regular files are copied here.
 */
function healStoreGaps(stagedPnpm, repoPnpm) {
  let healed = 0;
  const copyMissing = (srcDir, destDir) => {
    for (const name of readdirSync(srcDir)) {
      const src = join(srcDir, name);
      const dest = join(destDir, name);
      const st = lstatSync(src);
      if (st.isSymbolicLink()) continue;
      if (st.isDirectory()) {
        if (!existsSync(dest)) mkdirSync(dest, { recursive: true });
        copyMissing(src, dest);
      } else if (!existsSync(dest)) {
        mkdirSync(dirname(dest), { recursive: true });
        copyFileSync(src, dest);
        healed += 1;
      }
    }
  };
  for (const dir of readdirSync(stagedPnpm)) {
    if (dir === 'node_modules') continue;
    const repoDir = join(repoPnpm, dir);
    if (!existsSync(repoDir)) continue;
    copyMissing(repoDir, join(stagedPnpm, dir));
  }
  if (healed > 0) {
    console.log(`prepare-runtime: healed ${healed} file(s) the Next trace dropped from the staged store`);
  }
}

/**
 * Copy a directory tree. On Windows, robocopy handles the pnpm store layout
 * (junctions + native binaries) that Node's cpSync crashes on; exit codes
 * 0–7 are success, 8+ is a failure. /R:0 /W:0 keep it from retry-hanging on
 * a locked file.
 */
function copyTree(src, dest) {
  if (!existsSync(src)) return false;
  if (process.platform === 'win32') {
    // windowsVerbatimArguments: paths with spaces must be quoted ourselves.
    const r = spawnSync(
      'robocopy',
      [`"${src}"`, `"${dest}"`, '/E', '/R:0', '/W:0', '/NFL', '/NDL', '/NJH', '/NJS', '/NP'],
      { windowsVerbatimArguments: true },
    );
    // Exit codes are bit flags: 1 = files copied, 8 = some failed (the pnpm
    // symlink entries — recreated by relinkTree), 16 = fatal (reject).
    if (r.status === null || (r.status & 16) !== 0 || (r.status & 1) === 0) {
      fail(`robocopy ${src} → ${dest} failed (exit ${r.status})`);
    }
    return true;
  }
  cpSync(src, dest, { recursive: true });
  return true;
}

// Run the build through the package manager. On POSIX, pnpm is a real
// executable and turbo finds it on PATH. On Windows, pnpm is usually a bash
// shim (no .cmd/.exe), so neither cmd-spawned children nor turbo's binary
// probe can resolve it — route through `bash -lc`, which this repo's dev
// tooling (bootstrap-e2e.sh, the docker aliases) already assumes.
console.log('prepare-runtime: building the app + workspace deps (turbo)...');
const build =
  process.platform === 'win32'
    ? spawnSync(
        'bash',
        ['-lc', `cd "$0" && pnpm turbo run build --filter=@forge-pro/app...`, repoRoot],
        { stdio: 'inherit' },
      )
    : spawnSync(
        'pnpm',
        ['turbo', 'run', 'build', '--filter=@forge-pro/app...'],
        { cwd: repoRoot, stdio: 'inherit' },
      );
if (build.status !== 0) fail(`turbo build failed (exit ${build.status})`);

const standalone = join(appDir, '.next', 'standalone');
const flatServer = join(standalone, 'server.js');
const nestedServer = join(standalone, 'apps', 'app', 'server.js');
const serverJs = existsSync(flatServer) ? flatServer : nestedServer;
if (!existsSync(serverJs)) {
  fail(`expected ${standalone}/server.js — is output:'standalone' set in apps/app/next.config.mjs?`);
}

console.log('prepare-runtime: staging runtime/app...');
rmSync(join(desktopDir, 'runtime'), { recursive: true, force: true });
mkdirSync(runtimeApp, { recursive: true });

// Two layouts, both flattened to runtime/app/server.js:
//   flat:    standalone/server.js + standalone/node_modules
//   nested:  standalone/apps/app/server.js (+ the shared node_modules)
if (flatServer === serverJs) {
  copy(standalone, runtimeApp);
} else {
  copy(join(standalone, 'apps', 'app'), runtimeApp);
  if (existsSync(join(standalone, 'node_modules'))) {
    copyTree(join(standalone, 'node_modules'), join(runtimeApp, 'node_modules'));
    relinkTree(join(standalone, 'node_modules'), join(runtimeApp, 'node_modules'));
    healStoreGaps(
      join(runtimeApp, 'node_modules', '.pnpm'),
      join(repoRoot, 'node_modules', '.pnpm'),
    );
  }
}
// .next/static must sit next to the server (standalone output does not
// include it), and public/ likewise.
copy(join(appDir, '.next', 'static'), join(runtimeApp, '.next', 'static'));
copy(join(appDir, 'public'), join(runtimeApp, 'public'));

if (!existsSync(join(runtimeApp, 'server.js'))) fail('runtime/app/server.js missing after staging');
if (!existsSync(join(runtimeApp, '.next', 'static'))) fail('runtime/app/.next/static missing after staging');

function dirSize(path) {
  let total = 0;
  for (const name of readdirSync(path)) {
    const full = join(path, name);
    const st = lstatSync(full);
    if (st.isDirectory()) total += dirSize(full);
    else total += st.size;
  }
  return total;
}

const mb = (dirSize(runtimeApp) / 1024 / 1024).toFixed(1);
console.log(`prepare-runtime: staged ${runtimeApp} (${mb} MB)`);
console.log('prepare-runtime: done — run pnpm desktop:dev to preview, or pnpm desktop:package for the installer.');
