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
  Playfair serif name.
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

**Torn edges on RN-Web — the #1 "looks like card UI" cause:**
- The torn silhouette is a CSS `filter: url(#torn-N)` displacement filter applied to plain Views.
  It only works if real DOM `<filter>` defs with that id exist. `react-native-svg`'s web build does
  NOT reliably emit usable filter primitives (`<Filter>`/`<FeTurbulence>`/`<FeDisplacementMap>`),
  AND rendering a raw `React.createElement("div", {dangerouslySetInnerHTML})` through RNW's reconciler
  throws "Invalid hook call". Working approach (`TornDefs` in `components/TornPaper.tsx`): inject the
  raw SVG `<defs>` string into `document.body` once via `useEffect` + `host.innerHTML` (id-guarded).
- **Why:** when the filter id doesn't resolve, every sheet falls back to a rounded rectangle with an
  offset kraft block behind it = exactly a drop-shadow card. User read this as "80% card UI". The
  palette being correct is NOT enough — the displacement filter MUST actually paint.
- **How to apply:** on web keep the sheet base shape SHARP (borderRadius 0) so the displacement
  supplies the only edge; only use rounded corners on native (no filters there). If sheets ever look
  like cards again on web, first confirm `#torn-N` filters exist in the live DOM, not the palette.

**Paper texture must be a rasterised background-image, NOT a per-sheet live filter:**
- A live `feTurbulence` SVG filter applied to every TornSheet (e.g. an overlay with
  `filter: url(#paper-grain) url(#torn-N)`) makes web scrolling janky and sections paint slowly —
  turbulence is recomputed per element. It was ALSO too subtle to read as structure.
- Working approach: bake the grain into the face as a tiled noise `background-image` (an SVG
  `feTurbulence` data-URI built once via `buildNoise(slope,intercept)` in `components/TornPaper.tsx`),
  composited with the sheet colour via `background-blend-mode` (`multiply` on cream, `screen` on
  espresso). The browser rasterises it ONCE; the face's existing torn filter still warps the grain
  with the edge. Visible texture, ~zero per-item cost.
- **Why:** user reported both "Oberflächen nicht strukturiert" AND "Performance hakelig" from the same
  live-filter overlay. **How to apply:** never add a live SVG filter that scales with list length;
  prefer a single rasterised tile + blend mode. Keep only ONE global `Grain` live filter per screen.

**Torn seed ids skip 10 — never derive seeds by raw arithmetic:**
- `TORN_SEEDS` in `components/TornPaper.tsx` is `[1..9, 11..17]` — there is intentionally NO `torn-10`.
  Deriving a backing/under silhouette with `(seed + k) % 16 + 1` can land on `10`; `url(#torn-10)`
  is unresolved, the View renders as a plain rectangle, and that single list item visually regresses
  to a "card". Always pick back/under seeds by INDEXING into `TORN_SEEDS`
  (`TORN_SEEDS[(idx + k) % TORN_SEEDS.length]`) so the result is guaranteed to be a defined filter id.
- **Why:** `LIST_SEEDS` contains `3`, and `(3+6)%16+1 = 10` → the backing of every 10th roastery/coffee
  sheet silently lost its torn edge. Found in code review, not visible in tsc.

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
