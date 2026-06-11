---
name: Verifying Expo web builds without screenshots
description: How to confirm the Expo RN-Web app actually compiles when the app_preview screenshot proxy is unreachable, and why browser-console errors can be stale.
---

# Verifying Expo web builds in this repl

The `app_preview` screenshot proxy is frequently unreachable here (PAGE_UNREACHABLE / ERR_CONNECTION_REFUSED). When it is, verify the build by requesting the bundle directly:

`curl -s "http://localhost:8081/node_modules/expo-router/entry.bundle?platform=web&dev=true&transform.routerRoot=app" -o /tmp/b.js -w "HTTP %{http_code} size=%{size_download}\n"`

- HTTP 200 + multi-MB size = clean build. `index.bundle` is the WRONG entry (404 UnableToResolve); expo-router uses the entry path above.
- To detect real failures, grep the bundle for `Duplicate declaration|Missing semicolon|UnableToResolveError`. Note: the strings `BABEL_TRANSFORM_ERROR_FORMAT` / `SyntaxError:` appear in Metro's runtime regex definitions even on success — those are not errors.

**Why:** `refresh_all_logs` browser-console output can show **stale** Metro TransformError/SyntaxError lines captured during an intermediate (e.g. subagent) edit. tsc passing + a fresh 200 bundle is authoritative. After a *fatal* transform error, restart the `Start Frontend` workflow so Metro re-bundles from a clean state, then re-curl.

## Metro `.local` watcher ENOENT crash (now patched)

`Error: ENOENT ... watch '.../.local/skills/.old-media-generation-*'` stack from Metro. Replit syncs platform skills under `.local/` at runtime, creating/deleting temporary `.old-*` dirs; Metro's FallbackWatcher walks the root and dies when one vanishes mid-crawl. In plain `npx expo start` the dev server often survived (entry.bundle still 200), but **in `--tunnel` mode it is FATAL** — it kills the process before "Tunnel ready", so the tunnel never comes up.

**Fix (durable):** `patches/metro-file-map+0.83.3.patch` wraps `_watchdir`'s `_fs.watch(dir,...)` in try/catch and returns false on `isIgnorableFileError(error)` (already imported in FallbackWatcher.js). patch-package runs on postinstall so it survives reinstalls. NOTE: `npx patch-package <pkg>` to *generate* a patch fails here (registry install blocked by package-firewall) — build the patch file by hand (revert node_modules to pristine, `git diff --no-index`, rewrite headers to `a/node_modules/... b/node_modules/...`, drop in `patches/`, then `npx patch-package` to apply). Clearing caches / `resolver.blockList` do NOT stop it (crash is in the initial crawl).

## Expo Go over 5G / foreign network = tunnel mode

Phone "Could not connect to development server" on `:8081`: `.replit` maps localPort 8081→externalPort 80, and the LAN `exp://172.x:8081` URL is unreachable off-network. Fix = tunnel mode: set the `Start Frontend` workflow command to `npx expo start --tunnel` (via configureWorkflow; persists to `.replit`. Do NOT edit package.json's expo:dev script, do NOT run expo in a bare shell). `@expo/ngrok` is already installed. Success looks like `Tunnel connected. / Tunnel ready.` + a `exp://<slug>-anonymous-8081.exp.direct` URL in the log. watchman was installed but Metro still picked FallbackWatcher (binary not on the workflow's PATH), so the patch above — not watchman — is what actually fixes it.
