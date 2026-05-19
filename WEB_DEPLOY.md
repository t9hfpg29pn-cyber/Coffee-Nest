# Coffee Nest — Standalone Offline-First PWA

Coffee Nest is a 100% client-side React Native Web app. There is no backend,
no API, no database, no auth. All data lives in the browser via
`AsyncStorage` (which on web is backed by `localStorage`). Backup and restore
go through a JSON file the user picks or downloads — no server involved.

After the first load the service worker keeps the app shell and assets cached,
so it runs fully offline. It is installable as a PWA on iOS, Android and
desktop.

## Build

```bash
npm run build:web
# equivalent to: node scripts/build-web.js
```

This produces a deployable folder `web-dist/` containing:

- `index.html` (with PWA meta tags + service-worker registration)
- `_expo/static/js/web/entry-*.js` (the app bundle)
- `assets/` (images, fonts, etc.)
- `manifest.webmanifest` (PWA app manifest)
- `sw.js` (offline service worker — network-first for navigations, cache-first
  for static assets)
- `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`
- `_redirects`, `_headers` (Netlify / Cloudflare Pages config)

No Replit-only env vars are required. The build script does not read
`REPLIT_INTERNAL_APP_DOMAIN`, `REPLIT_DEV_DOMAIN` or `EXPO_PUBLIC_DOMAIN`.

## Deploy to Cloudflare Pages

1. Connect the repository to Cloudflare Pages.
2. Build command: `npm run build:web`
3. Build output directory: `web-dist`
4. Node version: `20` (set as env var `NODE_VERSION`).

`_redirects` (SPA fallback) and `_headers` (cache rules) are honoured
automatically.

## Deploy to Netlify

`netlify.toml` at the repo root is already configured:

```toml
[build]
  command = "node scripts/build-web.js"
  publish = "web-dist"
```

Either connect the repo or drag-drop `web-dist/` into Netlify Drop.

## Editing PWA assets

Source PWA files live in `web-pwa/` and are copied verbatim into `web-dist/`
during the build. Edit `web-pwa/manifest.webmanifest`, `web-pwa/sw.js`, the
icons, etc., then rebuild.

When you ship breaking app changes, bump the `CACHE` constant in
`web-pwa/sw.js` (e.g. `coffeenest-v1` → `coffeenest-v2`) so installed clients
refetch.

## Data: import / export

In **Einstellungen → Datensicherung** the user can:

- **Export** — download a JSON file containing all roasteries, coffees and
  grinder settings.
- **Import** — pick a JSON backup; data is restored into `AsyncStorage`,
  overwriting whatever is there.

This is the only way to move data between devices since no account/sync
backend exists.
