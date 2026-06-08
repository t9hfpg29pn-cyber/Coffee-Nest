---
name: Grinder data model
description: How grinders are stored and related to coffees in Coffee Nest
---

Grinders are stored in AsyncStorage key `grinders` as `Grinder[]` objects `{ name, design: "niche"|"commandante" }` (each design maps to a custom SVG icon in `components/CoffeeIcons.tsx` via `GrinderIcon`).

**Relations stay keyed by grinder NAME (string), not by object.** `coffee.grinderName` and `grindSettings[].grinder` are name strings. When you need the first grinder's identity for a default, use `grinders[0].name`, never the object.

**Why:** the model was migrated from a legacy `string[]`. Keeping the name as the relation key avoids rewriting every coffee record on migration and keeps backups human-readable.

**How to apply:**
- Read/write grinders only via `getGrinders`/`saveGrinders`. `normalizeGrinders()` tolerates legacy `string[]`, objects missing `design` (defaults to `commandante`, `niche` if name matches `/niche/i`), and dedups names case-insensitively (names are used as React keys).
- On import, always set grinders deterministically — fall back to `DEFAULT_GRINDERS` when the backup has none, so an "overwrite all" restore is faithful.
- Export already carries full coffee objects (origins/processingMethod/roastLevel) because `getAllCoffees()` returns whole records and import re-sets the `coffees` array verbatim.
