// Real paper-texture images sliced directly from the user's labelled "COFFEE
// NEST – DESIGN SYSTEM VORLAGE". Each labelled element becomes the literal
// background of the matching app surface — no solid fills, gradients or SVG
// filters faking paper.
//
//   BG-01      coffee_bg        — dark coffee plane, whole-app background
//   PAPER-01   paper_main       — standard cards / pages
//   PAPER-02   paper_wide       — wide section panels (Sektionen)
//   PAPER-03   paper_small      — small sub-cards / grid cards (Unterkarten)
//   PAPER-04   paper_tall       — tall / side cards
//   PAPER-05   paper_long       — list elements (Listenelemente)
//   ACCENT-01  paper_stained    — coffee-stained hero card (Hero)
//   ACCENT-02  accent_section   — accent section plane
//   ACCENT-03  accent_tile      — icon tile
//   ACCENT-04  accent_button    — button / chip
//   TILE-01..04 / CHIP-01..04   — warm accent swatches, icon-stamp variety pool

export const coffeeBgTexture = require("./coffee_bg.png");

// Whole-app page background — the user's real kraft-paper photo, tiled at its
// native resolution behind every screen (replaces the old solid beige fill).
export const paperBgTexture = require("./paper_bg.png");

export const paperMainTexture = require("./paper_main.png");
export const paperWideTexture = require("./paper_wide.png");
// PAPER-02 opaque interior swatch — printed-paper fill for the roastery card.
export const paper02CardTexture = require("./paper02_card.png");
export const paperSmallTexture = require("./paper_small.png");
export const paperTallTexture = require("./paper_tall.png");
export const paperLongTexture = require("./paper_long.png");
export const paperStainedTexture = require("./paper_stained.png");
export const accentSectionTexture = require("./accent_section.png");
export const accentTileTexture = require("./accent_tile.png");
export const accentButtonTexture = require("./accent_button.png");
export const sheetCutoutTexture = require("./sheet_cutout.png");
export const sheetGradientTexture = require("./sheet_gradient.png");

// Sheet-shape lookup. A TornSheet picks its background from here by `variant`.
export const SHEET_TEXTURES = {
  main: paperMainTexture,
  wide: paperWideTexture,
  small: paperSmallTexture,
  tall: paperTallTexture,
  long: paperLongTexture,
  hero: paperStainedTexture,
  accent: accentSectionTexture,
  cutout: sheetCutoutTexture,
  gradient: sheetGradientTexture,
} as const;

export type SheetVariant = keyof typeof SHEET_TEXTURES;

// Small warm accent swatches (ACCENT-03 + TILE-01..04 + CHIP-01..04). Used as
// the rotating backing pool behind icon stamps so adjacent stamps differ.
export const iconTileTextures = [
  accentTileTexture,
  require("./tile_01.png"),
  require("./tile_02.png"),
  require("./tile_03.png"),
  require("./tile_04.png"),
  require("./chip_01.png"),
  require("./chip_02.png"),
  require("./chip_03.png"),
  require("./chip_04.png"),
];
