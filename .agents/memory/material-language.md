---
name: Paper Layers material language
description: How the Coffee Nest "Paper Layers" torn-paper visual system is composed, why the first attempt failed, and CoffeeIcons prop gotchas.
---

# Paper Layers material language

The classic ("light") theme is a torn-paper system implemented with `components/TornPaper.tsx`
(`TornDefs`, `TornSheet`, `TornBox`, `IconStamp`, `Grain`, `Hairline`). `app/index.tsx` is the
canonical, approved translation — copy its composition for any classic-theme screen.

**The composition (and the failure mode to avoid):**
- A redesign that puts paper *texture* on cards STILL READS AS A CARD UI and will be rejected.
- The fix is a 3-plane contrast model: a DARK espresso "table" = `colors.background`; cream
  paper "pages" = `<TornSheet tone="cream">`; dark espresso "glued notes" = `<TornSheet tone="espresso">`
  used sparingly for hero/feature blocks. Depth comes from overlap + offset kraft backing +
  slight per-item rotation + contrast — NEVER from boxed cards or box-shadows.
- Content/stats sit DIRECTLY on a cream sheet: no inner cards, no stat tiles, no full-border
  boxes, no cards-in-cards. List entries use a kraft `IconStamp` + big Playfair serif name.
- **Why:** the user explicitly rejected the first attempt as "a card UI with paper texture";
  the approved direction is "a surface BUILT FROM overlapping paper layers".
- **How to apply:** never render primary text directly on `colors.background` (it is dark) —
  always inside a cream sheet. Text on cream = ink/inkSoft/inkFaint; on espresso =
  creamText/creamTextSoft/creamTextFaint. Bottom-sheet MODALS may keep a rounded elevated
  surface (the canonical index add-modal does) — that exception is fine, it is not a page card.

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
