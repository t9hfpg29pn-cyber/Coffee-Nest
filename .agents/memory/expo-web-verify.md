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
