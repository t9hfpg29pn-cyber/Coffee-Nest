---
name: Card-template PNG processing
description: How the roastery/coffee label-card template PNGs were cut so they sit cleanly on the tiled paper page background.
---

# Label-card template PNGs vs the tiled page background

The user-supplied label-card templates (factory/cup icon + roastery chevron baked in)
ship as **opaque RGB PNGs with a flat cream surround + a baked drop shadow** around the
rounded card. Dropped in full-bleed over the global tiled kraft page background, that flat
surround renders as an obvious lighter **rectangular patch** (page bg avg ≈ RGB(235,210,178);
surrounds are flatter/lighter creams). It looks broken.

**Fix applied:** flood-fill the connected surround to transparent from all four corners,
then trim ONLY the vertical transparent margins (keep full width).

**Why:**
- Flood-fill fuzz must be LOW (~4%). The kraft card body is only ~13–23 luminance darker
  than the cream surround, so fuzz ≥8% eats the card fill and leaves just the icon + a ghost
  outline. 4% removes the flat cream but keeps the card body AND its soft drop shadow (the
  shadow reads as natural depth on the page bg).
- Trim **vertical only, keep full width** so the icon's/chevron's horizontal positions stay
  fixed → the text-overlay `paddingLeft`/`paddingRight` percentages (relative to full PNG
  width) remain valid. Only the aspect-ratio constant changes. Trimming all sides would
  shift the icon fractions and force recomputing the padding.

**How to apply / verify:** the live screenshot proxy is frequently down here, so verify
visually by compositing with ImageMagick and reading the result image: tile `paper_bg.png`,
drop the cut card on top, overlay sample text at the real padding %, then `read` the PNG.
DejaVu fonts live at `/usr/share/fonts/truetype/dejavu/` (ImageMagick `annotate` needs an
explicit `-font` path or it errors). Originals are recoverable from `attached_assets/`.
