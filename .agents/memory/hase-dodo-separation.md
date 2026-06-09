---
name: Hase/Dodo rater separation
description: The strict rule that the two coffee raters' scores must never be combined except in one explicit place
---

# Hase / Dodo rater separation

The app has two raters (names from `UserNamesContext`: `name1`/`name2`, defaults "Hase"/"Dodo"; second rater toggled by `user2active`). All per-user analytics on the Entdeckungen (/discoveries) page must keep the two scores separate.

**Rule:** Never combine the two ratings into an averaged `(hase + dodo) / 2` score anywhere EXCEPT `getSharedFavoriteCoffee()` in `lib/storage.ts` (the "Gemeinsamer Favorit" card). 

**Why:** Product requirement — mixing the two raters' tastes into one number is only meaningful for the single explicit "shared favorite" metric; everywhere else (Lieblingsländer, Spitzenreiter, category "best coffee") it misrepresents each person's taste.

**How to apply:**
- Per-user metrics (favorite country, top coffee) compute Hase and Dodo independently and return both.
- Category "best coffee" (Aromen/Aufbereitungen) ranks by `Math.max` of the available individual ratings — a real single score, not an average.
- Gate every user2-derived data path AND UI by `user2active`: shared-favorite render, the map's `favoriteDodo` marker prop, and the `hasProfile` emptiness check. Legacy data can still contain Dodo ratings after the second rater is disabled, so guard rendering, not just data presence.
