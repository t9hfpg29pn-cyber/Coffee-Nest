#!/usr/bin/env node
/**
 * Standalone Web/PWA build for Coffee Nest.
 *
 * Produces a fully static site in `web-dist/` that can be deployed to
 * Cloudflare Pages, Netlify, or any static host. No Replit-only env
 * vars are required.
 *
 * Steps:
 *   1. Run `expo export --platform web` to produce the SPA bundle.
 *   2. Copy `web-pwa/*` (manifest, service worker, redirects, headers,
 *      icons) into the output directory.
 *   3. Patch `index.html` with PWA meta tags, manifest link, iOS
 *      standalone hints and the service-worker registration snippet.
 */

const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "web-dist");
const PWA_SRC = path.join(ROOT, "web-pwa");

function run(cmd, args, opts = {}) {
  console.log(`> ${cmd} ${args.join(" ")}`);
  const r = spawnSync(cmd, args, { stdio: "inherit", cwd: ROOT, ...opts });
  if (r.status !== 0) {
    process.exit(r.status || 1);
  }
}

function copyRecursive(src, dest) {
  fs.cpSync(src, dest, { recursive: true });
}

console.log("==> 1/3  Exporting Expo web bundle");
if (fs.existsSync(OUT)) {
  fs.rmSync(OUT, { recursive: true, force: true });
}
run("npx", [
  "expo",
  "export",
  "--platform",
  "web",
  "--output-dir",
  "web-dist",
]);

// ---------------------------------------------------------------------------
// Relocate exported assets out of any `node_modules/` path.
//
// Expo hashes vendored assets (icon fonts, Google Fonts) into
// `web-dist/assets/node_modules/...`. That path is a deployment landmine:
// .gitignore (and many CDN / deploy ignore rules) match `node_modules/` at any
// depth, so those font files never reach GitHub/Cloudflare → icons render as
// empty squares in production. We rename the directory to `assets/_packages`
// and rewrite every reference in the JS bundles and HTML so the output is
// completely free of `node_modules` path segments.
// ---------------------------------------------------------------------------
console.log("==> Relocating vendored assets out of node_modules/ path");
const NM_DIR = path.join(OUT, "assets", "node_modules");
const PKG_DIR = path.join(OUT, "assets", "_packages");
const FROM_TOKEN = "assets/node_modules/";
const TO_TOKEN = "assets/_packages/";

if (fs.existsSync(NM_DIR)) {
  if (fs.existsSync(PKG_DIR)) {
    fs.rmSync(PKG_DIR, { recursive: true, force: true });
  }
  fs.renameSync(NM_DIR, PKG_DIR);

  // Rewrite references in every text asset (JS bundles, HTML, CSS, JSON, map).
  const exts = new Set([".js", ".html", ".css", ".json", ".map"]);
  let rewritten = 0;
  const modifiedStatic = [];
  const STATIC_DIR = path.join(OUT, "_expo", "static");
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (exts.has(path.extname(entry.name))) {
        const before = fs.readFileSync(full, "utf-8");
        if (before.includes(FROM_TOKEN)) {
          fs.writeFileSync(full, before.split(FROM_TOKEN).join(TO_TOKEN));
          rewritten++;
          // Track hash-named, immutable-cached bundles we mutated so we can
          // rename them (cache-bust) below.
          const ext = path.extname(entry.name);
          if (full.startsWith(STATIC_DIR + path.sep) && (ext === ".js" || ext === ".css")) {
            modifiedStatic.push(full);
          }
        }
      }
    }
  };
  walk(OUT);
  console.log(`   moved assets/node_modules → assets/_packages, rewrote ${rewritten} file(s)`);

  // Hard fail if any node_modules reference survived in a text asset.
  let leaks = 0;
  const checkLeaks = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        checkLeaks(full);
      } else if (exts.has(path.extname(entry.name))) {
        if (fs.readFileSync(full, "utf-8").includes(FROM_TOKEN)) {
          console.error(`   ! leftover '${FROM_TOKEN}' reference in ${path.relative(OUT, full)}`);
          leaks++;
        }
      }
    }
  };
  checkLeaks(OUT);
  if (leaks > 0) {
    console.error("Post-build check failed: node_modules asset references remain.");
    process.exit(1);
  }

  // -------------------------------------------------------------------------
  // Cache-bust the bundles whose CONTENT we just changed.
  //
  // Expo derives a hashed filename from the source modules, NOT from the final
  // emitted bytes — so our rewrite leaves the filename unchanged. Combined with
  // `Cache-Control: immutable` (see web-pwa/_headers), returning visitors who
  // already cached the broken bundle (with node_modules URLs) would keep
  // serving it forever. Rename each mutated bundle with a fresh content hash
  // and rewrite every reference to it so old immutable cache entries are bypassed.
  // -------------------------------------------------------------------------
  if (modifiedStatic.length > 0) {
    const crypto = require("crypto");
    const tokenMap = new Map(); // oldBasename -> newBasename
    for (const full of modifiedStatic) {
      const buf = fs.readFileSync(full);
      const hash8 = crypto.createHash("md5").update(buf).digest("hex").slice(0, 8);
      const ext = path.extname(full);
      const oldBase = path.basename(full);
      const newBase = oldBase.replace(new RegExp(`\\${ext}$`), `-c${hash8}${ext}`);
      const newFull = path.join(path.dirname(full), newBase);
      fs.renameSync(full, newFull);
      tokenMap.set(oldBase, newBase);
      // Keep a sibling sourcemap consistent with the renamed bundle.
      const oldMap = full + ".map";
      if (fs.existsSync(oldMap)) {
        fs.renameSync(oldMap, newFull + ".map");
      }
    }

    // Replace every reference to the old basenames across all text assets.
    let refRewrites = 0;
    const rewriteRefs = (dir) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          rewriteRefs(full);
        } else if (exts.has(path.extname(entry.name))) {
          let content = fs.readFileSync(full, "utf-8");
          let changed = false;
          for (const [oldBase, newBase] of tokenMap) {
            if (content.includes(oldBase)) {
              content = content.split(oldBase).join(newBase);
              changed = true;
            }
          }
          if (changed) {
            fs.writeFileSync(full, content);
            refRewrites++;
          }
        }
      }
    };
    rewriteRefs(OUT);
    console.log(`   cache-busted ${tokenMap.size} bundle(s), updated refs in ${refRewrites} file(s)`);

    // Verify index.html no longer points at any pre-rename bundle name.
    const idx = fs.readFileSync(path.join(OUT, "index.html"), "utf-8");
    for (const oldBase of tokenMap.keys()) {
      if (idx.includes(oldBase)) {
        console.error(`Post-build check failed: index.html still references stale bundle ${oldBase}`);
        process.exit(1);
      }
    }
  }
}

console.log("==> 2/3  Copying PWA assets from web-pwa/");
if (!fs.existsSync(PWA_SRC)) {
  console.error(`Missing source folder: ${PWA_SRC}`);
  process.exit(1);
}
for (const name of fs.readdirSync(PWA_SRC)) {
  copyRecursive(path.join(PWA_SRC, name), path.join(OUT, name));
  console.log(`   + ${name}`);
}

console.log("==> 3/3  Patching index.html with PWA tags");
const indexPath = path.join(OUT, "index.html");
if (!fs.existsSync(indexPath)) {
  console.error(`Expected ${indexPath} after expo export, but it is missing.`);
  process.exit(1);
}
let html = fs.readFileSync(indexPath, "utf-8");
if (!/<\/head>/i.test(html)) {
  console.error("index.html has no </head> — Expo export markup changed; update scripts/build-web.js.");
  process.exit(1);
}

const injections = `    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="Coffee Nest" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="theme-color" content="#2b1408" />
    <link rel="manifest" href="/manifest.webmanifest" />
    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
    <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png" />
    <link rel="icon" type="image/png" sizes="512x512" href="/icon-512.png" />
    <script>
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', function () {
          navigator.serviceWorker.register('/sw.js').catch(function (e) {
            console.warn('SW registration failed', e);
          });
        });
      }
    </script>
`;

// Remove any stale viewport / theme tags expo emitted so ours win, then inject.
html = html.replace(
  /\s*<meta name="apple-mobile-web-app-capable"[^>]*>/g,
  "",
);
html = html.replace(
  /\s*<meta name="apple-mobile-web-app-status-bar-style"[^>]*>/g,
  "",
);
html = html.replace(/\s*<meta name="theme-color"[^>]*>/g, "");
html = html.replace(/\s*<link rel="manifest"[^>]*>/g, "");
html = html.replace(/\s*<link rel="apple-touch-icon"[^>]*>/g, "");

if (!/viewport-fit=cover/.test(html)) {
  html = html.replace(
    /<meta name="viewport"[^>]*>/,
    '<meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover" />',
  );
}

const beforeInject = html;
html = html.replace(/<\/head>/i, `${injections}  </head>`);
if (html === beforeInject) {
  console.error("Failed to inject PWA tags into index.html (no </head> match).");
  process.exit(1);
}

fs.writeFileSync(indexPath, html);

// Post-build assertions: fail loudly if anything required is missing.
const required = [
  ["index.html contains manifest link", /<link[^>]+rel="manifest"[^>]+manifest\.webmanifest/i.test(html)],
  ["index.html registers service worker", /serviceWorker\.register\(['"]\/sw\.js['"]\)/.test(html)],
  ["index.html has theme-color meta", /<meta[^>]+name="theme-color"/i.test(html)],
  ["index.html has apple-mobile-web-app-capable", /apple-mobile-web-app-capable/.test(html)],
  ["index.html has viewport-fit=cover", /viewport-fit=cover/.test(html)],
];
for (const [name, ok] of required) {
  if (!ok) {
    console.error(`Post-build check failed: ${name}`);
    process.exit(1);
  }
}
for (const f of ["manifest.webmanifest", "sw.js", "_redirects", "_headers", "apple-touch-icon.png", "icon-192.png", "icon-512.png"]) {
  if (!fs.existsSync(path.join(OUT, f))) {
    console.error(`Post-build check failed: ${f} missing from web-dist/`);
    process.exit(1);
  }
}

console.log("\n✔ Build complete → web-dist/  (all post-build checks passed)");
console.log("  Deploy that folder to Cloudflare Pages, Netlify, etc.");
