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
