---
name: Material language (paper-journal)
description: Where Coffee Nest's card depth/material lives and the rule for tuning it
---
Coffee Nest's surface "material" (depth, shadows, corner radius, top highlight) is centralized in `useCardExtras()` in `context/ThemeContext.tsx`. It returns `{ shadow, elevatedShadow, topHighlight, cardRadius }`; almost every card across screens spreads `cardExtras.shadow` + uses `colors.surfaceElevated`/`colors.border`/`topHighlight`/`cardRadius`.

Material levels: Ebene 1 = `colors.background`; Ebene 2 = `shadow` (normal cards); Ebene 3 = `elevatedShadow` (important content, e.g. the GEMEINSAMER FAVORIT heroCard in discoveries).

**Rule:** tune the app-wide material feel ONLY through `useCardExtras()` tokens, never via per-screen structural/layout edits.
**Why:** the design brief is "modernize the surface material, change NOTHING functional/layout/IA/navigation; always choose calm over effects (no floating cards, no 3D, no glassmorphism, no noise)." Centralized tokens keep that constraint safe and consistent.
**How to apply:** if a screen still feels too "dashboard," adjust shadow opacity/spread, radius, or topHighlight here — do not add per-card structural changes. Keep the existing palette in `constants/colors.ts` intact (material ≠ color redefinition).
