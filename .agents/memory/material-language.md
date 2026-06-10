---
name: Paper Layers material language
description: How the Coffee Nest "Paper Layers" torn-paper visual system is composed, why the first attempt failed, and CoffeeIcons prop gotchas.
---

# Paper Layers material language

The classic ("light") theme is a torn-paper system implemented with `components/TornPaper.tsx`
(`TornDefs`, `TornSheet`, `TornBox`, `IconStamp`, `Grain`, `Hairline`). `app/index.tsx` is the
canonical, approved translation — copy its composition for any classic-theme screen.

**The composition (and the TWO failure modes that got rejected):**
- The palette is LIGHT and airy, NOT dark. `colors.background` (classic/light) is a flat warm
  BEIGE table `#E9DDC9` (= `--paper-bg`); cream "pages" = `<TornSheet tone="cream">` (#F4EAD5);
  kraft backing (#CBAB7B) peeks behind each torn sheet; espresso (a WARM milk-chocolate brown
  `#6E4A2A`, NOT near-black) is for feature/hero planes only. ALL light-theme tokens mirror
  `artifacts/mockup-sandbox/src/components/mockups/paper-layers/_group.css` 1:1 — copy them exactly.
- **Failure mode 1 — "card UI with paper texture":** depth must come from overlap + offset kraft
  backing + slight per-item rotation + light/cream contrast + a soft drop-shadow in the face
  filter — NEVER from boxed cards/box-shadows. Content/stats sit DIRECTLY on a cream sheet (no
  inner cards, stat tiles, full-border boxes, cards-in-cards). List rows = kraft `IconStamp` + big
  Fraunces serif name.
- **Failure mode 2 — "medieval parchment on old tiles":** caused by (a) making `background` a
  DARK espresso table + near-black espresso planes (looks aged, not a high-end journal), and
  (b) the grain/texture on hard rectangles. Fixes: keep the table LIGHT beige; `PolyBackground`
  returns null for classic (flat bg only, no dark soak); espresso is warm brown; and TornSheet/
  TornBox now always apply a small web borderRadius so sheets never collapse to hard rectangles
  if the torn SVG filter silently fails to apply on web.
- **Why:** the user rejected a dark-table version as "parchment on tiles … not an organic,
  high-quality coffee journal." The approved target is light, airy, organic.
- **How to apply:** text on the beige background or on cream = ink/inkSoft/inkFaint; ONLY text
  inside an espresso sheet uses creamText/creamTextSoft/creamTextFaint. After any dark→light
  palette flip, audit every empty/loading state for cream-on-background text (it goes invisible).
  Bottom-sheet MODALS may keep a rounded elevated surface — that exception is fine.

**Torn edges on RN-Web — use STATIC baked masks, NOT live per-element filters:**
- The torn silhouette is now a self-contained `mask-image` data-URI that BAKES the same
  `feTurbulence`+`feDisplacementMap` once (`tornMaskUri(seed)` in `components/TornPaper.tsx`, memoized
  per seed; `maskSize:100% 100%`, both `maskImage` + `WebkitMaskImage`). It does NOT depend on any
  shared DOM `<defs>` — `TornDefs` is now a no-op kept only for API compat.
- **Why:** the old approach applied a LIVE `filter: url(#torn-N)` to every sheet, with defs injected
  into `document.body`. In a static mockup that's fine, but the real app renders one filtered sheet
  PER list item and scrolls → turbulence recomputed on every repaint = jank, AND when a live filter
  lags/fails the offset backing layer paints as a plain rectangle peeking out (user's "leere Blöcke,
  besonders am linken Rand"). Baked masks rasterize once, composite cheaply, and never fall back to a
  bare rectangle.
- **How to apply:** RN-Web passes unknown style props straight through (`createReactDOMStyle` +
  `normalizeValueWithProperty` leave string values like `maskImage`/`filter`/`backgroundImage`
  unchanged), so set them via a `webStyle()` helper (web-only). Mask SVG: 320×320, rect inset 16px so
  ±5.5px displacement (`scale 11`) never clips to a straight edge. Drop-shadow MUST live on a
  NON-masked wrapper View (mask is applied after filter, so a mask on the same element clips the
  shadow halo). On native there are no masks → keep the rounded-corner fallback.

**Multi-tonality on cream = subtle WARM gradient + kraft showing through torn edges:**
- The TornSheet face is a SOLID base colour + a subtle warm `backgroundImage` linear-gradient (cream:
  `surfaceElevated→surface`; espresso: `espresso3→espresso→espresso2`, all theme tokens). Plus the
  baked torn mask lets the offset kraft/espresso2 backing peek through the edges = real
  "Mehrfarbigkeit". Global `Grain` is now a STATIC tiled noise data-URI (not a live full-screen
  turbulence filter), opacity ~0.05, `mixBlendMode:multiply`.
- **Why:** a DESATURATED noise/mottle overlay (`saturate 0`) washed cream into muddy grey and was
  rejected; but a flat solid cream with no working edges read as "gar keine Struktur". The fix is warm
  tonal variation (gradient between warm tokens, never grey) + reliable torn edges revealing the kraft
  backing. **How to apply:** for more depth, deepen the warm gradient stops or strengthen the backing
  peek/contrast — never add a desaturated noise fill.
- **Torn params** (keep 1:1 with mockup intent): mask region `-14%/128%`, `baseFrequency 0.013 0.016`,
  `numOctaves 3`, `scale 11`; grain tile `baseFrequency 0.9 numOctaves 2`. Any integer seed is valid
  now (the mask is generated on demand) — back/under seeds = `seed+6`/`seed+3`.
- **Entdeckungen contrast structure:** AROMEN and AUFBEREITUNGEN are `tone="espresso"` DARK planes
  whose section label/sub use `creamTextSoft`/`creamTextFaint`; each CategoryCard is a
  `tone="cream"` chip (`peek={false}`) with an espresso `IconStamp` + `goldLight` icon, so cream
  chips POP against the dark plane. Rendering those sections as flat `tone="cream"` (the bug) made
  the whole screen look pale and flat. `IconStamp` defaults to `tone="espresso"` — don't pass `kraft`.
- **Grid sizing gotcha:** `TornSheet` applies its `style` prop to the INNER container, and when
  `onPress` is set it is wrapped in a bare `Pressable` (no flex). For a flex-grid item, wrap the
  TornSheet in an outer `<View style={{flexBasis:"44%",flexGrow:1}}>` — putting flexBasis on the
  TornSheet itself does NOT size the grid item.

**Typography = "Vintage-Röster" (Fraunces serif + Inter), user-specified roles:**
- Headlines use `@expo-google-fonts/fraunces` (loaded in `app/_layout.tsx`: `Fraunces_500Medium`,
  `_600SemiBold`, `_700Bold`). Per-screen constants: `SERIF_BLACK="Fraunces_700Bold"`,
  `SERIF_BOLD="Fraunces_600SemiBold"`, `SERIF_MED="Inter_400Regular"`. (Playfair Display was fully
  removed — do not reintroduce.)
- Role map the user explicitly dictated: app-name kicker "COFFEE NEST" = `Inter_500Medium` uppercase
  letterspaced; page titles (Seitenüberschriften) = Fraunces Bold; entity/card titles (Kartentitel,
  e.g. roastery/coffee/grinder/aroma name) = Fraunces Semibold; section labels = `Inter_600SemiBold`
  uppercase letterspaced; everything else — Fließtext, Metadaten, AND ALL NUMBERS/scores/stats/% —
  = Inter (`Inter_700Bold` for emphasized figures, `_600SemiBold`/`_500Medium`/`_400Regular` for body).
- **Why:** user said serif belongs ONLY on page headers + card titles; numbers are Metadaten → Inter.
  An earlier pass wrongly left score/stat/rating numbers in serif (`SERIF_BOLD`) and was flagged.
- **How to apply:** the `SERIF_*` constants are overloaded, so DON'T assume `SERIF_BOLD` means "serif
  everywhere" — at each usage decide by ROLE: a real entity/card title or display heading keeps serif;
  any numeric/insight-readout value (scoreValue, discoveryStatValue, ratings, mapProgressPct,
  duoPrimary/centerPrimary insight values) must be an explicit `"Inter_*"`. Monogram stamp initials
  stay serif (decorative).

**CoffeeIcons.tsx prop gotcha (caused 2 build failures):**
- Some exports are SCALE/STATE glyphs with a REQUIRED non-size prop, not generic icons:
  `AromaIcon` needs `step`, `ProcessingIcon` needs `method`, `RoastIcon` needs `level`,
  `GrinderIcon` needs `design`. Using them bare (only size+color) is a tsc error.
- Prop-free icons safe for decorative/stamp use: CupIcon, RoasteryIcon, GlobeIcon, GemIcon,
  OriginPinIcon, CompassIcon, TrophyIcon, MillIcon, StarIcon, HaseIcon, DodoIcon.

**Theme behavior (still true, survives every reskin):**
- `classic` is the DEFAULT theme (`ThemeContext` initial state). `useThemeColors()` returns
  `Colors.light` for classic ALWAYS — it does NOT follow system dark mode. The dark option is
  `lowpoly`. `Colors.dark` is effectively unused by the hook but kept exported.
- NAV IS STACK ONLY. The reference mockups show a bottom tab bar — that is an artifact; do NOT
  add tabs. Keep the existing hierarchical Stack navigation.

**History:** an earlier `PaperSurface`/`components/Paper.tsx` "cut-paper layers" system (with
deckle/dog-ear, then offset/rotated backings) was fully REPLACED by `TornPaper.tsx`. No
`PaperSurface` references remain — do not reintroduce it.
