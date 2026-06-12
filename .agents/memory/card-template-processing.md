---
name: List-item card design
description: How roastery/coffee list-item cards must look, and the stretched-template approach the user explicitly rejected.
---

# List-item cards = PaperCard row (NOT a full-bleed template PNG)

Each list item (1 roastery on `app/index.tsx`, 1 coffee on `app/roastery/[id].tsx`) is a
`PaperCard variant="light"` (shape rotates `LIST_SHAPES[i % 3]`, `shadow={2}`) whose content
is ONE horizontal row:

`[PaperTile navTileSource("roastery"|"coffee") size 60] · [text col: name + meta + ratings] · [gold Ionicons chevron-forward]`

- name → `FONTS.displayBold` 22/27 `coffee800`; meta → `FONTS.display` 15 `coffee600`
  (coffee shows price `formatPrice(...) + " €/kg"` first, `aromaDescription` fallback;
  roastery shows `location · N Kaffees`); ratings → gold `accent300` "Hase X · Dodo Y"
  (`renderScore`, Dodo gated by `user2active`, "–" when unrated). Chevron `accent300`.
- The nav_*.png tiles already bake the cream rounded tile + glyph + shadow, so PaperTile is
  the whole icon — never wrap it in another tile/box/border.

**Why:** the user rejected ("ganz und gar nicht was ich wollte") the earlier approach of
using a wide template PNG (`card_coffee.png` / `card_roastery.png`, icon + chevron baked in)
stretched full-bleed as the entire card via `TemplateCard`. Target was the example image
`attached_assets/255FE606-…png` — a clean PaperCard row. Do NOT resurrect stretched
template-PNG-as-card.

**How to apply:** keep both screens' row structure + styles identical. `TemplateCard` and the
`cardRoasteryTexture`/`cardCoffeeTexture` exports + `card_*.png` assets were deleted as dead.
`StretchSheet` (CSS `background-size:100% 100%`) still exists for genuine sheet backgrounds —
that's a different use case (see rnweb-paper-sheet-stretch.md), not list cards.
