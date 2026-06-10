---
name: Paper Layers material language
description: How the Coffee Nest "Paper Layers" visual system is composed (now driven by REAL paper-texture PNGs, not solid colors + SVG masks), plus typography, CoffeeIcons prop gotchas, theme/nav rules.
---

# Paper Layers material language

The classic theme is a torn-paper system in `components/TornPaper.tsx` (`TornDefs`, `TornSheet`,
`TornBox`, `IconStamp`, `Grain`, `Hairline`) + `components/PolyBackground.tsx` for the app
background. `app/index.tsx` is the canonical composition — copy it for any classic-theme screen.

**THE MATERIAL IS A SET OF ~18 REAL PAPER-TEXTURE PNGs sliced from the user's labelled design-system
template, used DIRECTLY as layer backgrounds (no solid fill / gradient / SVG mask for the FACE):**
- Assets in `assets/textures/` (exported by `assets/textures/index.ts` via `require`). Slicing is
  100% LOCAL — `magick crop +repage` then a floodfill cutout
  (`-alpha set -bordercolor "#000000" -border 2 -fuzz 32% -fill none -draw "alpha 0,0 floodfill" -shave 2x2 -trim`)
  which gives clean torn edges AND preserves interior coffee stains. NO external bg-removal tool
  needed. Pitfall: `-trim` + high fuzz EATS small low-contrast elements (tiles/chips) → for those,
  crop a clean OPAQUE interior swatch (`-alpha off`, no floodfill) and round them in-component.
- `assets/textures/index.ts` exports: `coffeeBgTexture` (opaque dark bg); `SHEET_TEXTURES` map +
  `SheetVariant` type (`main|wide|small|tall|long|hero|accent`); `accentButtonTexture`;
  `iconTileTextures[]` (ACCENT-03 + TILE-01..04 + CHIP-01..04 = the icon-stamp variety pool).
- Surface mapping ("Keine Filter, sondern direkt diese grafischen Vorlagen"):
  1. **DARK COFFEE (BG-01)** = whole-app bg → `PolyBackground` renders `coffeeBgTexture` cover Image.
  2. **TornSheet `variant`** picks the exact labelled shape; falls back from `tone` when omitted
     (cream→`main`, espresso→`hero`) so legacy call sites keep working. Wired: list rows→`long`,
     stats panel + settings sections→`wide`, settings backup→`accent`, discoveries category cards→
     `small`, coffee masthead→`tall`, stained hero (tone espresso)→`hero`. All sheets stay LIGHT.
  3. **IconStamp** = `iconTileTextures[seed % len]` (rounded clip); ignores `tone`/`color`.
  4. **TornBox** (add/save buttons) = `accentButtonTexture` (light AMBER paper), NOT solid+mask
     anymore — `tornMaskUri`/`maskStyle` were DELETED. `color` prop is ignored (`void color`).
- `TornSheet` face = `<Image resizeMode="stretch">`; torn edge from PNG alpha. Depth = offset/mirrored
  peek backing (opacity ~0.4) + web `drop-shadow` on a non-masked wrapper (`heavy` = hero/accent gets
  a stronger shadow). `flip = seed%2===0` mirrors silhouettes. Native → `styles.nativeFaceShadow`.
- **CRITICAL button contrast:** the amber button texture is LIGHT, so TornBox foreground icons/text
  MUST be DARK (`colors.espresso`) — white (`#FFF8EC`)/`creamText` washes out (architect-flagged
  regression). Applied to every add/save/checkmark/spinner inside a TornBox.
- **Bump `web-pwa/sw.js` CACHE (`coffeenest-vN`) on ANY texture asset change** or installed PWAs
  serve stale textures.

**Because espresso planes flipped dark→LIGHT, their text/icon colors were flipped for contrast:**
- The 5 `tone="espresso"` call sites (index "HEUTE ENTDECKT"; discoveries GEMEINSAMER FAVORIT hero +
  AROMEN + AUFBEREITUNGEN; coffee BEWERTUNGEN) had cream text on dark. They now mirror the proven
  cream-plane palette: `creamText→ink`, `creamTextSoft→inkSoft`, `creamTextFaint→inkFaint`,
  `goldLight→gold`, `hairCream→hair` (and `<Hairline cream>`→`<Hairline>`), and on the coffee
  BEWERTUNGEN sliders `espresso3→kraft` (border) / `espresso3→paperBg2` (surface).
- **Why:** stained paper is light tan, so old light-gold/cream text would be light-on-light. Reusing
  the exact tokens that already work on `tone="cream"` planes is the safe, low-risk choice.
- **How to apply:** after ANY dark→light plane flip, audit every text/icon/divider/border/surface
  color inside that plane; section LABELS use `inkFaint` to match cream planes, accent labels use
  `gold`, body/value text uses `ink`/`inkSoft`. Light theme tokens live in `constants/colors.ts`
  (`light`): ink `#3A2716`, inkSoft `#7A6447`, inkFaint `#A38C70`, gold `#B07526`, kraft `#CBAB7B`,
  paperBg2 `#E2D4BC`, hair `rgba(58,39,22,0.14)`.

**RN-Web style passthrough (still true, reused for the drop-shadow):**
- RN-Web passes unknown style strings straight through, so set web-only props (`filter`,
  `backgroundImage`, `maskImage`) via the `webStyle()` helper (no-op on native). `Image` does NOT
  accept a `pointerEvents` PROP (tsc "No overload matches") — wrap a decorative Image in a
  `<View pointerEvents="none">` instead of putting pointerEvents on the Image.
- `Grain` is a static tiled noise data-URI overlay (opacity ~0.05, `mixBlendMode:multiply`), kept.
  The baked-mask machinery (`tornMaskUri`, `maskStyle`, 320×320 SVG, inset 16px, `baseFrequency
  0.013 0.016`, `numOctaves 3`, `scale 11`) survives only for TornBox.

**Composition rules that survive the reskin:**
- Depth = overlap + offset backing + slight per-item rotation + soft shadow — NEVER boxed cards /
  box-shadows / cards-in-cards. Content/stats sit directly on a sheet; list rows = `IconStamp` +
  big Fraunces serif name.
- **Grid sizing gotcha:** `TornSheet` applies `style` to its INNER container and, when `onPress` is
  set, wraps in a bare `Pressable` (no flex). For a flex-grid item, wrap the TornSheet in an outer
  `<View style={{flexBasis:"44%",flexGrow:1}}>` — flexBasis on the TornSheet itself won't size it.
- Entdeckungen AROMEN/AUFBEREITUNGEN are `tone="espresso"` planes (now light stained) containing
  `tone="cream"` CategoryCard chips (`peek={false}`) whose `IconStamp` icon is now `gold` (was
  `goldLight`, flipped for the light accent tile). Don't render these sections as flat `tone="cream"`.

**Typography = "Vintage-Röster" (Fraunces serif + Inter), user-specified roles:**
- Headlines use `@expo-google-fonts/fraunces` (loaded in `app/_layout.tsx`). Per-screen constants:
  `SERIF_BLACK="Fraunces_700Bold"`, `SERIF_BOLD="Fraunces_600SemiBold"`, `SERIF_MED="Inter_400Regular"`.
  (Playfair Display was removed — do not reintroduce.)
- Role map: app-name kicker = `Inter_500Medium` uppercase letterspaced; page titles = Fraunces Bold;
  entity/card titles = Fraunces Semibold; section labels = `Inter_600SemiBold` uppercase; everything
  else incl. ALL NUMBERS/scores/stats/% = Inter (`Inter_700Bold` for emphasized figures).
- **Why:** user said serif belongs ONLY on page headers + card titles; numbers are Metadaten → Inter.
- **How to apply:** `SERIF_*` is overloaded — decide by ROLE at each usage; any numeric/insight value
  must be explicit `"Inter_*"`. Monogram stamp initials stay serif (decorative).

**CoffeeIcons.tsx prop gotcha (caused build failures):**
- Scale/state glyphs need a REQUIRED non-size prop: `AromaIcon` needs `step`, `ProcessingIcon` needs
  `method`, `RoastIcon` needs `level`, `GrinderIcon` needs `design`. Bare usage = tsc error.
- Prop-free (safe for stamps): CupIcon, RoasteryIcon, GlobeIcon, GemIcon, OriginPinIcon, CompassIcon,
  TrophyIcon, MillIcon, StarIcon, HaseIcon, DodoIcon.

**Theme + nav (survives every reskin):**
- `classic` is the DEFAULT theme; `useThemeColors()` returns `Colors.light` for classic ALWAYS (does
  NOT follow system dark mode). The dark option is `lowpoly`.
- NAV IS STACK ONLY. Reference mockups show a tab bar — that's an artifact; do NOT add tabs.

**Verify gotchas:** screenshot proxy is frequently DOWN (`PAGE_UNREACHABLE`/ERR_CONNECTION_REFUSED);
confirm a clean build by curling the expo-router entry bundle instead —
`curl localhost:8081/node_modules/expo-router/entry.bundle?platform=web&dev=true&hot=false` = 200.
For app tsc, exclude the separate `artifacts/mockup-sandbox` sub-project (its own tsconfig, always
errors). Don't restart `Start Frontend` unless deps/error; the mockup-sandbox workflow stays failed.

**History:** `PaperSurface`/`components/Paper.tsx` → `TornPaper.tsx` (solid+mask) → CURRENT
texture-PNG system. Do not reintroduce `PaperSurface` or the solid-color/gradient/mask FACE for sheets.

## Layout rule: the PAGE is the single paper surface (not every element)
"Die Seite selbst ist die Papierfläche, NICHT jedes Element." Max 3 Ebenen (CATEGORIES, not
individual sheets) visible at once: (1) dark coffee bg, (2) ONE large cream page TornSheet that
fills the screen, (3) a few highlight/accent sheets. Reference = Apple Journal/Notes.

**How to apply on a classic-theme list/detail screen:** wrap the WHOLE screen in ONE
`<ScrollView>` → ONE `<TornSheet tone="cream" variant="main" peek={false} flat>` (the page). The
masthead (kicker/title/filter/add) sits DIRECTLY on that page followed by a hairline rule
(`styles.headerRule`); list entries are plain `Pressable` rows with `rowDivider` hairlines on the
same page; loading/empty states render inside it too (so `centerState` must use `paddingVertical`,
NOT `flex:1`, or it collapses to 0 height inside the page). Highlight tiles (Heute=espresso,
Entdeckungen=cream wide) are the ONLY nested sheets allowed = the layer-3 category.
**Why:** a standalone masthead TornSheet + separate list TornSheet = TWO page-papers in the
"one große Papierfläche" category → architect FAIL ("4 paper planes at top"). Do NOT give the
masthead its own sheet. Applies to `app/index.tsx` + `app/roastery/[id].tsx`.

## Direction reversal: roastery list = standalone clean cards (NOT page-rows)
The "page-is-the-surface / hairline rows" approach was REJECTED by the user for the home-screen
roastery list item. New direction (June 2026): each roastery is a STANDALONE clean "index card"
in a modern coffee-journal style — light solid surface (`surfaceElevated`), large radius (~20),
hairline border, ONE subtle soft shadow (the only depth cue), generous airy padding, 56x56 warm
gold-tint icon tile, serif title > quiet meta line ("Ort · N Kaffees") > subtle accent rating
("name 8.0 | name 6.0" in gold, medium weight not bold), centered chevron.
**Explicitly forbidden on this card:** torn/irregular edges, cutout paper shapes, water stains,
folded corners, paper layers, multiple shadows, "text on a big surface".
**Why:** user called the torn-paper/page-surface look "Scrapbook/Bastelprojekt/Pergamentrolle"
and wants "hochwertige Karteikarte" calm premium quality, validated on this ONE component before
rolling out. **How to apply:** this is the reference card to propagate to other lists later;
do NOT expand scope to other screens until the user approves this one.
