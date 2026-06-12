---
name: Expo Go connect on Replit
description: Why Expo Go on a physical device fails with "Could not connect to development server" and the env-var fix.
---

# Expo Go "Could not connect to development server" on Replit

Symptom: Expo Go on a real iPhone/Android shows the red "Could not connect to development server" screen; the URL it tried is `https://<repl-domain>:8081/node_modules/expo-router/entry.bundle?...`. The web PWA preview works fine — only the native device fails.

**Root cause:** Replit maps Metro's local port 8081 to **external port 80** (see `.replit` `[[ports]]`), so the public dev server is reachable at the bare `https://$REPLIT_DEV_DOMAIN` (TLS 443) with **no port suffix**. But by default Expo advertises `<hostname>:8081` in its manifest (`launchAsset.url`, `hostUri`, `debuggerHost`). Expo Go then tries `https://<domain>:8081`, where no TLS service is listening → connection fails. Confirm reachability with `curl https://$REPLIT_DEV_DOMAIN/status` → `packager-status:running`.

**Fix:** Make Expo advertise the bare HTTPS proxy URL by setting these env vars in the *Start Frontend workflow command* (not in a shell — the expo skill forbids running `npx expo` directly; update the workflow via `configureWorkflow`):

```
EXPO_PACKAGER_PROXY_URL=https://$REPLIT_DEV_DOMAIN REACT_NATIVE_PACKAGER_HOSTNAME=$REPLIT_DEV_DOMAIN npx expo start --port 8081
```

`EXPO_PACKAGER_PROXY_URL` overrides the manifest URL verbatim (no port appended); after restart the manifest `launchAsset.url` becomes `https://<domain>/node_modules/...` and `hostUri`/`debuggerHost` drop the port. Both empty by default in this repl, which is why it broke.

**Notes:**
- Use `REPLIT_DEV_DOMAIN` here (it maps to 8081 via external 80, verified). The generic Replit Expo template references `REPLIT_EXPO_DEV_DOMAIN` for multi-port setups — not needed when 8081→external 80 on the base domain.
- `configureWorkflow` for the Expo frontend must pass `outputType: "console"` (port 8081 is not a webview port); omit `waitForPort` (8081 isn't in the supported-ports list).
- Web/PWA preview is unaffected by these vars (served same-origin via the Replit webview proxy).
