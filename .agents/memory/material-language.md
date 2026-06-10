---
name: Material language (cut-paper layers)
description: Where Coffee Nest's card depth/material lives and the rule for tuning it
---
Coffee Nest's card "material" is centralized in the **`PaperSurface`** primitive in `components/Paper.tsx` (drop-in card replacement; also `TornDivider`). The aesthetic is a BOLD **cut-paper LAYERS** look: depth reads via **visibly OFFSET + rotated backing sheets in a contrasting tone, overlap, and asymmetric border-radii — NOT drop shadows**. A subtle organic SVG "paper-field" background lives in `components/PolyBackground.tsx` (now shown for `classic` light too, not only lowpoly).

**V2 change (important):** the old fiddly decoration — top **deckle band** and **dog-ear** — was REMOVED entirely. Those props no longer exist; do not reintroduce them. The prior "deckle + dog-ear" pass was rejected as "a dashboard with a paper theme."

**PaperSurface contract:** pass SIZING/margin via `style` (root); inner padding/layout via `contentStyle`. The sheet owns borderWidth + overflow + asymmetric radii + offset backing layer(s). Props: `onPress`/`onLongPress`/`disabled`/`testID`/`style`/`contentStyle`/`tone`("raised"|"mid"|"dark")/`accentBorder`/`flip`/`layers`(1|2). `tone="dark"` = espresso "feature" sheet with a LIGHT cream backing (use it as a container; put light `tone="raised"` cards inside it for the dark-container/light-collectible-card pattern — give the inner grid padding so cards don't touch the dark edge). `layers={2}` adds a second far backing sheet (magazine stack). When non-interactive it renders a plain `View` (no nested-pressable conflicts in forms). For list cards, alternate `flip={index % 2 === 1}`.

**Hero/dark text:** every palette in `constants/colors.ts` (light/dark/lowpoly) carries hero tokens — `heroSurface/heroBacking/heroText/heroTextSub/heroBorder/heroTint`. On any `tone="dark"` surface, color text/icons with `heroText`/`heroTextSub`/`heroTint`, never the normal `text`/`textSecondary`/`tint`.

**Default theme:** `classic` (warm cream) is the DEFAULT (`ThemeContext` initial state) and **`useThemeColors()` returns `Colors.light` for classic ALWAYS — it no longer follows system dark mode**. The dark option is `lowpoly`. (`Colors.dark` is now effectively unused by the hook but kept exported.)

**Rule:** tune card material app-wide through `PaperSurface` geometry (backing offset/rotation, layers, radii, tone) — not per-screen structural edits. Legacy `useCardExtras()` shadow tokens still exist and some screens keep an unused `const cardExtras = useCardExtras()` read (harmless — tsconfig has no noUnusedLocals), but PaperSurface itself uses NO shadow; only modal/overlay sheets still use `cardExtras.shadow` (left out of the reskin scope intentionally).
**Why:** the brief is a deliberately bold cut-paper LAYERS reskin ("go 30% too far") against a warm-cream reference image; functions/data/navigation/IA/texts must stay unchanged — pure visual.
**How to apply:** if a screen feels flat/"dashboard", deepen LAYERING in PaperSurface (bigger backing offset, second layer, edge/tone contrast) — keep palette in `constants/colors.ts` (3-tier paper + darker `backdrop` backing + hero set) and never alter functional/layout/IA. Do NOT add the bottom tab bar from the reference image (nav stays Stack).
