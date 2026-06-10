---
name: Material language (cut-paper journal)
description: Where Coffee Nest's card depth/material lives and the rule for tuning it
---
Coffee Nest's card "material" is now centralized in the **`PaperSurface`** primitive in `components/Paper.tsx` (drop-in card replacement; also `TornDivider`). The aesthetic is a BOLD layered/cut-paper journal: layering reads via **edges/offset/overlap, NOT drop shadows**, with asymmetric border-radii, a top deckle band, optional dog-ear, and an organic SVG paper-landscape background in `components/PolyBackground.tsx`.

**PaperSurface contract:** pass SIZING/margin via `style` (root); inner padding/layout via `contentStyle`. The sheet itself owns borderWidth + overflow + asymmetric radii + deckle band + dog-ear. Props: `onPress`/`onLongPress`/`disabled`/`testID`/`style`/`contentStyle`/`tone`("raised"|"mid")/`accentBorder`/`flip`/`deckle`/`dogEar`. It renders a plain `View` when non-interactive (no nested-pressable conflicts in forms). For list cards, alternate `flip={index % 2 === 1}` for organic asymmetry. After migrating, strip `borderRadius`/`borderWidth` from the screen's `styles.section`/`styles.card` (PaperSurface owns them); leftover empty `card: {}` is fine.

**Rule:** tune card material app-wide through `PaperSurface` (geometry/deckle/dog-ear) — not per-screen structural edits. The legacy `useCardExtras()` shadow tokens in `context/ThemeContext.tsx` still exist and some screens may keep an unused `const cardExtras = useCardExtras()` read (harmless — tsconfig has no noUnusedLocals), but new cards should route through PaperSurface, not raw `surfaceElevated` Views + `cardExtras.shadow`.
**Why:** the current brief shifted from "calm modernized material" to a deliberately bold cut-paper reskin ("go 30% too far"). Functions/data/navigation/IA must stay unchanged — it is a pure visual/material reskin.
**How to apply:** if a screen still feels flat/"dashboard", deepen layering in PaperSurface (offset backing sheet, edge contrast, radii, deckle/dog-ear) — keep palette in `constants/colors.ts` (3-tier paper + backdrop) and never alter functional/layout/IA.
