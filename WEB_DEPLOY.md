# Coffee Nest — Standalone Web/PWA Deployment

The Expo app can be exported as a fully static, installable PWA that runs on
any static host (Cloudflare Pages, Netlify, GitHub Pages, S3, …) without any
Replit-specific environment variables.

## Build

```bash
node scripts/build-web.js
```

This produces `web-dist/` containing:

- `index.html` (with PWA meta tags + service-worker registration)
- `_expo/static/js/web/entry-*.js` (the app bundle)
- `assets/` (images, fonts, etc.)
- `manifest.webmanifest` (PWA app manifest)
- `sw.js` (offline service worker, network-first for navigations, cache-first
  for assets)
- `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`
- `_redirects`, `_headers` (Netlify / Cloudflare Pages config)

All data is stored locally via AsyncStorage — no backend required for the
deployed app. `getApiUrl()` in `lib/query-client.ts` falls back to
`window.location.origin` so any future API calls just hit the same origin.

## Cloudflare Pages

1. Connect the repo.
2. Build command: `node scripts/build-web.js`
3. Build output directory: `web-dist`
4. Node version: `20` (set in env vars).

`_redirects` and `_headers` are honoured automatically.

## Netlify

`netlify.toml` is already configured. Just connect the repo or drag-drop
`web-dist/` into Netlify Drop.

## Editing PWA assets

The source PWA assets live in `web-pwa/` and are copied verbatim into
`web-dist/` by the build script. Edit `web-pwa/manifest.webmanifest`,
`web-pwa/sw.js`, the icons, etc., then rebuild.

## Notes

- The build script never reads `REPLIT_INTERNAL_APP_DOMAIN`,
  `REPLIT_DEV_DOMAIN` or `EXPO_PUBLIC_DOMAIN`.
- Service-worker cache name is `coffeenest-v1` — bump it in `web-pwa/sw.js`
  when you ship breaking changes to force clients to refetch.
