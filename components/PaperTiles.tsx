import React from "react";
import { Image, ImageStyle, StyleProp } from "react-native";

/**
 * Paper-native category icons — hand-crafted tiles cut from the user's design
 * template into transparent PNGs (silhouette alpha, baked shadow kept). These
 * are fixed brown-on-cream stamps, so they're used in the Klassisch (paper)
 * theme; the Lowpoly theme keeps the tintable SVG icons from CoffeeIcons.
 */

const AROMA: Record<number, any> = {
  1: require("@/assets/textures/icons/aroma_chocolate.png"),
  2: require("@/assets/textures/icons/aroma_nutty.png"),
  3: require("@/assets/textures/icons/aroma_roasty.png"),
  4: require("@/assets/textures/icons/aroma_fruity.png"),
  5: require("@/assets/textures/icons/aroma_floral.png"),
};

const ROAST: Record<string, any> = {
  light: require("@/assets/textures/icons/roast_light.png"),
  "medium-light": require("@/assets/textures/icons/roast_cinnamon.png"),
  medium: require("@/assets/textures/icons/roast_medium.png"),
  "medium-dark": require("@/assets/textures/icons/roast_dark.png"),
  dark: require("@/assets/textures/icons/roast_very_dark.png"),
};

const PROCESS: Record<string, any> = {
  washed: require("@/assets/textures/icons/proc_washed.png"),
  natural: require("@/assets/textures/icons/proc_natural.png"),
  honey: require("@/assets/textures/icons/proc_honey.png"),
  anaerobic: require("@/assets/textures/icons/proc_anaerobic.png"),
  experimental: require("@/assets/textures/icons/proc_experimental.png"),
  decaf: require("@/assets/textures/icons/proc_decaf.png"),
};

const GRIND: Record<number, any> = {
  1: require("@/assets/textures/icons/grind_very_fine.png"),
  2: require("@/assets/textures/icons/grind_fine.png"),
  3: require("@/assets/textures/icons/grind_medium.png"),
  4: require("@/assets/textures/icons/grind_coarse.png"),
  5: require("@/assets/textures/icons/grind_very_coarse.png"),
};

const GRINDER: Record<string, any> = {
  niche: require("@/assets/textures/icons/grinder_niche.png"),
  commandante: require("@/assets/textures/icons/grinder_commandante.png"),
};

// Navigation / content icons — same hand-crafted paper tiles (cream tile +
// brown glyph + baked shadow). Used full-surface as their own button/holder;
// never wrap these in another tile, card or border.
const NAV: Record<string, any> = {
  roastery: require("@/assets/textures/icons/nav_roastery.png"),
  coffee: require("@/assets/textures/icons/nav_coffee.png"),
  worldmap: require("@/assets/textures/icons/nav_worldmap.png"),
  compass: require("@/assets/textures/icons/nav_compass.png"),
  discoveries: require("@/assets/textures/icons/nav_discoveries.png"),
  favorite: require("@/assets/textures/icons/nav_favorite.png"),
  profile: require("@/assets/textures/icons/nav_profile.png"),
  search: require("@/assets/textures/icons/nav_search.png"),
  settings: require("@/assets/textures/icons/nav_settings.png"),
};

export const aromaTileSource = (step: number) => AROMA[step];
export const roastTileSource = (level: string) => ROAST[level];
export const processTileSource = (method: string) => PROCESS[method];
export const grindTileSource = (step: number) => GRIND[step];
export const grinderTileSource = (design: string) => GRINDER[design] ?? GRINDER.commandante;
export const navTileSource = (name: string) => NAV[name];

export function PaperTile({
  source,
  size = 40,
  style,
}: {
  source: any;
  size?: number;
  style?: StyleProp<ImageStyle>;
}) {
  if (!source) return null;
  return <Image source={source} style={[{ width: size, height: size }, style]} resizeMode="contain" />;
}
