---
name: Paper Layers material language
description: How the Coffee Nest "Paper Layers" visual system is composed (now driven by REAL paper-texture PNGs, not solid colors + SVG masks), plus typography, CoffeeIcons prop gotchas, theme/nav rules.
---

# Paper Layers material language

The classic theme is a torn-paper system in `components/TornPaper.tsx` (`TornDefs`, `TornSheet`,
`TornBox`, `IconStamp`, `Grain`, `Hairline`) + `components/PolyBackground.tsx` for the app
background. `app/index.tsx` is the canonical composition — copy it for any classic-theme screen.

**THE MATERIAL IS NOW FOUR REAL PAPER-TEXTURE PHOTOS, used DIRECTLY as layer backgrounds:**
- Assets in `assets/textures/` (exported by `assets/textures/index.ts` via `require`):
  `coffee_bg.png` (dark coffee, full rectangle), `paper_main.png`, `paper_stained.png`,
  `paper_accent.png` (last three are background-removed → torn-edge cutouts on transparent alpha).
  They were sliced from the user's labelled spec composite with ImageMagick (`magick`/`convert`),
  then `remove_image_background_tool` on #2/#3/#4.
- Surface mapping the user dictated ("Keine Filter, sondern direkt diese grafischen Vorlagen"):
  1. **DARK COFFEE** = whole-app background → `PolyBackground` renders `coffeeBgTexture` as an
     absolute-fill cover `Image` when `design==="classic"` (it USED to `return null`).
  2. **MAIN PAPER (light)** = `TornSheet tone="cream"` → `paperMainTexture` (normal cards/lists/pages).
  3. **COFFEE-STAINED PAPER (light tan)** = `TornSheet tone="espresso"` → `paperStainedTexture`.
     NOTE: tone "espresso" is now a LIGHT plane (it used to be a dark brown plane).
  4. **ACCENT TILE (light kraft)** = `IconStamp` backing → `paperAccentTexture` (all small icon stamps).
- `TornSheet` face = `<Image source resizeMode="stretch">`; torn edge comes from the PNG's own
  alpha, NOT an SVG mask/gradient/solid fill. Depth = an offset/rotated/`scaleX`-mirrored peek
  backing image (opacity ~0.5) + a web `drop-shadow` on a non-masked wrapper so the shadow hugs the
  alpha edge. `flip = seed % 2 === 0` mirrors silhouettes so adjacent sheets differ. Native has no
  filter → wrapper carries `styles.nativeFaceShadow`.
- **TornBox stays SOLID color + baked SVG mask** (the gold add/save buttons) — there is no gold
  paper texture, so it is the ONLY remaining user of `tornMaskUri`/`maskStyle`. `IconStamp` keeps
  `tone`/`color` props for call-site compatibility but IGNORES them (`void tone; void color;`).

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
