---
name: Paper-native material language (single design)
description: Coffee Nest's CURRENT one-and-only visual system — theme/paper-native.tsx PaperCard + frameless PNG icon tiles. Covers PaperCard rules, the frameless tile-picker selection language, what's dead (lowpoly/torn-paper), typography, extraction + verify gotchas.
---

# Paper-native material language (single design)

There is now exactly ONE design. The Klassisch/Lowpoly toggle is RETIRED. The design system lives in
`theme/paper-native.tsx` and exports everything: `COLORS`, `FONTS`, `ui` (StyleSheet), `PaperCard`,
`WAVES`, `TEXTURES`. **`app/index.tsx` is the canonical composition — copy its patterns for any screen.**
Converted screens: `app/index.tsx`, `app/roastery/[id].tsx`, `app/settings.tsx`, `app/coffee/[id].tsx`.

## PaperCard is THE only paper surface
`<PaperCard variant shape shadow style contentStyle>` (react-native-svg torn-wave clip + baked
texture). NEVER hand-roll a paper surface, gradient, or SVG mask.
- `variant`: `light` (cream card — default for content cards), `dark` (espresso hero/FAB), `accent`,
  `tile` (amber — but for ICON tiles use a bare PaperTile instead, see below), `chip` (small amber
  pill for +/save/filter buttons).
- `shape`: 1|2|3 — CYCLE across consecutive cards (`const SHAPES=[1,2,3]; SHAPES[i%3]`) so neighbouring
  torn edges differ.
- `shadow`: 0|1|2|3 (quiet warm depth). Content auto-gets 20px padding (override via contentStyle, never <16px — the wave clips ~2-3%).
- Layout: root `<View style={ui.appBg}>` (= COLORS.paperDim bg). Page header sits DIRECTLY on appBg
  (NO card): `ui.eyebrow` kicker + Fraunces title (FONTS.display ~30-32, COLORS.coffee800) + chip/
  Ionicons action buttons. Each content/category section = its own `PaperCard variant="light"` opening
  with a `ui.eyebrow` label. `ui.input`/`ui.label`, `ui.btnPrimary`/`btnPrimaryText`, `ui.btnSecondary`,
  `ui.rate`/`rateActive` (number buttons), `ui.sheet`+`ui.sheetHandle` (bottom-sheet modals),
  `ui.divider` (1px hairline) are the ready-made controls.
- Web insets (MANDATORY every screen): `topPad = Platform.OS==="web"?67:insets.top`,
  `bottomPad = Platform.OS==="web"?34:insets.bottom`.

> NOTE: this REVERSES the old torn-paper "the page is the single surface, NEVER boxed cards / no
> cards-in-cards" rule. paper-native is explicitly card-based (PaperCard torn-wave cards, list rows
> and category sections are each their own card). Do not reapply the old "one big page sheet" rule.

## ★ Frameless PNG icon tiles — the selection language (user's hard requirement)
Hand-crafted PNG tiles (cream tile + brown glyph + baked shadow) live in `assets/textures/icons/`,
rendered by `components/PaperTiles.tsx` `PaperTile` (`{source, size=40, style?:ImageStyle}` →
`<Image resizeMode="contain">`). Source-helper maps keyed off domain values: `aromaTileSource(step)`,
`roastTileSource(level)`, `processTileSource(method)`, `grindTileSource(step)`,
`grinderTileSource(design)`, and `navTileSource(name)` (roastery/coffee/worldmap/compass/discoveries/
favorite/profile/search/settings — nav+content icons).
- **nav coffee + roastery are BROWN LINE-ART cut-throughs, NOT cream-tile stamps and NOT filled
  silhouettes** (user: "durch die Kachel hindurch gedruckt … vollständig durchscheinend"). KEY INSIGHT
  about the templates: the cup/factory INTERIOR is kraft-cream (≈239,209,169 — same as the paper), only
  the OUTLINES/strokes are brown (≈152,103,41). So the correct icon keeps only the dark brown lines and
  leaves ALL light pixels (cup body + factory windows + surrounding kraft) TRANSPARENT, so the card kraft
  shows through the whole body. A FILLED silhouette or an eroded flood-fill BOTH get rejected.
- **Extraction recipe (the one that works): write the alpha via `-fx`, never CopyOpacity/CopyAlpha.**
  `magick raw.png -alpha set -channel A -fx "((0.80 - intensity)/0.38)*0.92" +channel -trim +repage
  -resize 200x200 -background none -gravity center -extent 240x240 png32:out.png`. The fx maps
  negLum=(1-intensity) through a level (lo 0.20, hi 0.58) × opacity, dark lines→opaque brown,
  light→transparent. `-channel A -fx` ONLY touches alpha so the original brown RGB is preserved.
  **IMv7 gotcha (cost ~6 attempts): both `-compose CopyOpacity` AND `-compose CopyAlpha` DESATURATE the
  visible pixels to gray/black** (loading a separate grayscale mask, or `-draw floodfill`/`-opaque` ops
  on a Gray-colorspace clone, drag the colored base to gray; `-colorspace sRGB` on the mask does NOT
  fix it). Flood-fill alpha also fails: high fuzz erodes the glyph into holes (the rejected "grungy"
  look). Use the `-fx` method.
- **Verify by READING, not screenshot** (proxy down): sample the real card bg first
  (`magick screenshot -crop … -resize 1x1 -format "%[pixel:p{0,0}]"` → card is ≈srgb(227,207,176) tan,
  NOT flat #F2EBDC), composite the icon on that tan, append beside a crop of the template, and read.
- **The PNG tile IS the button. NEVER wrap it in a bordered View, a colored View, a
  `PaperCard variant="tile"`, or an `IconStamp`.** That framing is the exact thing the user rejected
  (repeatedly). Bare full-surface only.
- **The PNGs CANNOT be tinted.** So selection is shown by **scale + opacity + a gold underline bar +
  a gold label** — NEVER a ring/border/ink-tint. Canonical pattern (shared as `TileOption` in
  coffee/[id].tsx; inline in settings grinder chooser):
  ```tsx
  <PaperTile source={sourceFor(v)} size={52-56}
    style={{ transform:[{scale: active?1.0:0.84}], opacity: active?1:0.4 }} />
  <View style={{height:3, width: active?18:0, borderRadius:2, backgroundColor:COLORS.accent300, marginTop:6}} />
  <Text style={{ fontFamily: active?"Inter_600SemiBold":"Inter_500Medium", color: active?COLORS.accent400:COLORS.coffee600 }}>{label}</Text>
  ```
  5 fixed tiles → row `justifyContent:"space-between"`; 6 (Aufbereitung) → `flexWrap:"wrap"` 3/row.
- **Exception — input surfaces keep borders.** A bordered `ui.input` (e.g. the MAHLGRAD 0–50
  grind-level TextInput, price field) is NOT an icon frame; that's allowed. The grind level stays a
  continuous 0–50 value (`normalizeGrindLevel`/`parseGrindLevel`) — do NOT swap it for 1–5 grind tiles
  (would destroy saved data fidelity). Grinder *selection* IS frameless tiles.
- `bg_*.png` background crops + the 5 grind tiles for level are extracted but intentionally unused.

## What is now DEAD (kept alive only by app/discoveries.tsx — known follow-up)
`context/ThemeContext.tsx` (DesignMode/setDesign retained so discoveries compiles; `useThemeColors()`
now UNCONDITIONALLY returns `Colors.light` — lowpoly path deleted), `components/TornPaper.tsx`
(TornDefs/TornSheet/TornBox/IconStamp/Grain/Hairline), `components/PolyBackground.tsx`,
`components/Paper.tsx`, `components/CoffeeIcons.tsx` SVGs, and the `lowpoly` palette in
`constants/colors.ts`. `app/discoveries.tsx` is the LAST torn-paper screen. **When it's converted to
paper-native, delete all of the above** — they become pure dead weight. (Web/PWA icons are out of
scope — Expo Go only.)

## Typography — Fraunces serif + Inter (via FONTS in paper-native)
`@expo-google-fonts/fraunces` loaded in `app/_layout.tsx`. `FONTS.display="Fraunces_600SemiBold"`,
`FONTS.displayBold="Fraunces_700Bold"`, `FONTS.eyebrow="Fraunces_500Medium"`. Roles: page titles +
entity/card titles = FONTS.display; emphasized figures/stats = FONTS.displayBold; section kickers =
`ui.eyebrow` (Fraunces_500Medium, uppercase, letterspaced, COLORS.accent400); body/meta/labels/rating
scores = Inter (`Inter_400/500/600`). (Playfair Display removed — do not reintroduce. The old
torn-paper `SERIF_*` per-screen constants are gone from the converted screens.)

## Extraction rule (still relevant for any FUTURE tile cuts)
Tiles are cut by `scripts/extract_icons.py` (`python3 scripts/extract_icons.py save`; NAME_MAPS define
index→name order; silhouette alpha, baked shadow kept). **CRITICAL: strip the German caption band
UNDER every tile** (e.g. "Kaffeebohne", "Niche Zero (Elektrische Mühle)") — rejected twice when
captions leaked. The dark-threshold detector merges tile+caption; `tile_bottom()` cuts at the
near-empty row gap, guarded to the lower half so internal icon gaps don't amputate the glyph. ALWAYS
re-verify per-sheet montages (`extract_icons.py nav actions rkc grinders cat` → /tmp/icon_extract/
*_montage.png) BEFORE `save`.

## Verify gotchas
- Screenshot proxy is frequently DOWN under `--tunnel` (`PAGE_UNREACHABLE`/ERR_CONNECTION_REFUSED).
  Confirm a clean build by curling the entry bundle instead — both must be 200:
  `curl localhost:8081/node_modules/expo-router/entry.bundle?platform=ios&dev=true` and `platform=web`.
- For app tsc, EXCLUDE the separate `artifacts/mockup-sandbox` sub-project (own tsconfig, always
  errors): `npx tsc --noEmit | rg -v artifacts/mockup-sandbox`.
- Don't restart `Start Frontend` unless deps changed / hard error; the mockup-sandbox workflow stays failed.
- NAV IS STACK ONLY. Reference mockups show a tab bar — that's an artifact; do NOT add tabs.
