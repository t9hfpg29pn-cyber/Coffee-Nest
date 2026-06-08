---
name: Expo web export hides assets under node_modules path
description: Why exported icon fonts vanish on GitHub/Cloudflare and how the build avoids it
---

# Expo web export buries vendored assets under a `node_modules/` path

`expo export --platform web` hashes vendored assets (icon fonts from
`@expo/vector-icons`, Google Fonts from `@expo-google-fonts/*`) into
`web-dist/assets/node_modules/...`.

**The trap:** a standard `.gitignore` has `node_modules/`, which matches that
segment at ANY depth. So when the prebuilt `web-dist/` is committed and pushed,
every exported font is silently dropped. GitHub/Cloudflare never receive them →
on the live site all icons render as empty squares / tofu (the glyph char is
set but the font file 404s). Works locally because the files exist on disk.

**Fix (in `scripts/build-web.js`):** after `expo export`, rename
`web-dist/assets/node_modules` → `web-dist/assets/_packages` and string-replace
`assets/node_modules/` → `assets/_packages/` across all text assets
(.js/.html/.css/.json/.map). A post-step hard-fails if any `assets/node_modules/`
reference survives. This removes the landmine entirely (also dodges CDN/deploy
ignore rules that special-case node_modules).

**Why:** never rely on a gitignore negation hack for this — `node_modules/`
excludes the directory, and git can't reliably re-include files whose parent dir
is excluded. Relocating the path out of `node_modules` is the robust solution.

**How to apply:** if icons/fonts disappear only in production (static host),
first check `git check-ignore -v <font path>` — if `.gitignore:node_modules/`
matches an exported asset, this is the cause.
