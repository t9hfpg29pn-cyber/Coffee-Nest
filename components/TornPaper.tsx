import React from "react";
import {
  Image,
  ImageBackground,
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";
import { Asset } from "expo-asset";
import { useThemeColors } from "@/context/ThemeContext";
import {
  SHEET_TEXTURES,
  SheetVariant,
  accentButtonTexture,
  iconTileTextures,
  paperBgTexture,
} from "@/assets/textures";

const isWeb = Platform.OS === "web";

// Apply web-only inline style props (filter, mask, gradients) that React Native
// Web passes straight through to the DOM. No-op on native.
function webStyle(value: Record<string, string | number>): ViewStyle {
  return isWeb ? (value as unknown as ViewStyle) : {};
}

// Every paper surface — sheets, icon stamps and buttons — now renders a real
// sliced texture PNG whose torn/rounded silhouette comes from the image's own
// transparent alpha. No live SVG turbulence/displacement mask runs per element
// (that caused the scroll jank and the "empty block" rectangles the user
// reported), so the only baked SVG left is the cheap tiled paper grain below.

// A subtle warm paper grain, baked ONCE into a tiled data-URI image (not a live
// full-screen turbulence filter, which was a major scroll cost). Web-only.
let grainUri: string | null = null;
function grainBg(): string {
  if (grainUri) return grainUri;
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'>` +
    `<filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter>` +
    `<rect width='160' height='160' filter='url(#n)'/>` +
    `</svg>`;
  grainUri = `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  return grainUri;
}

// Kept for API compatibility — torn edges are now self-contained masks, so no
// shared SVG <defs> need injecting. No-op.
export function TornDefs() {
  return null;
}

export function Grain() {
  if (!isWeb) return null;
  return (
    <View
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFill,
        webStyle({
          backgroundImage: grainBg(),
          backgroundRepeat: "repeat",
          opacity: 0.05,
          mixBlendMode: "multiply",
        }),
      ]}
    />
  );
}

// Whole-app page background: the user's real kraft-paper photo, tiled at its
// native resolution so the texture fully covers the screen without being
// stretched/upscaled (which would soften it). On web we hand the tiling to the
// DOM (background-repeat) using the asset URI — RN Web does not tile <Image>
// reliably; on native we use ImageBackground with resizeMode="repeat".
let paperBgUri: string | null = null;
function paperBgCssUri(): string {
  if (paperBgUri) return paperBgUri;
  paperBgUri = Asset.fromModule(paperBgTexture).uri;
  return paperBgUri;
}

export function PaperBackground() {
  if (isWeb) {
    return (
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          webStyle({
            backgroundImage: `url("${paperBgCssUri()}")`,
            backgroundRepeat: "repeat",
            backgroundSize: "auto",
          }),
        ]}
      />
    );
  }
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <ImageBackground
        source={paperBgTexture}
        resizeMode="repeat"
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

export type SheetTone = "cream" | "espresso";

// A torn sheet of paper with a kraft (or darker espresso) backing peeking out
// behind it. NOT a UI card: depth comes from the torn silhouette, the offset
// backing and the cream/espresso contrast — never from a rectangular box shadow.
export function TornSheet({
  children,
  tone = "cream",
  variant,
  seed = 2,
  rotate = -0.6,
  peek = true,
  flat = false,
  onPress,
  onLongPress,
  disabled,
  testID,
  style,
  contentStyle,
}: {
  children: React.ReactNode;
  tone?: SheetTone;
  variant?: SheetVariant;
  seed?: number;
  rotate?: number;
  peek?: boolean;
  flat?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
  testID?: string;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
}) {
  // Each sheet's face IS a real sliced paper photo. `variant` picks the exact
  // labelled shape (main/wide/small/tall/long list element, stained hero, accent
  // section); when omitted we fall back from `tone` so legacy call sites keep
  // working: cream -> main sheet, espresso -> light coffee-stained hero sheet.
  // The torn silhouette comes from the PNG's own transparent alpha edge.
  const v: SheetVariant = variant ?? (tone === "espresso" ? "hero" : "main");
  const tex = SHEET_TEXTURES[v];
  const heavy = v === "hero" || v === "accent" || v === "gradient";
  const flip = seed % 2 === 0; // mirror the silhouette so adjacent sheets differ
  const shadow = heavy
    ? "drop-shadow(0 12px 22px rgba(20,12,6,0.42))"
    : "drop-shadow(0 10px 18px rgba(20,12,6,0.34))";

  const inner = (
    <View style={[styles.container, style]}>
      {peek && (
        // A second sheet stacked DIRECTLY beneath: inset on the left & right so it
        // never pokes past the sides (the chaotic "Flächen schieben vom linken
        // Rand" the user reported), with only a soft peek at the bottom. No
        // rotation, no mirror — calm, predictable layering.
        <View
          pointerEvents="none"
          style={{ position: "absolute", top: 8, left: 7, right: 7, bottom: -7, opacity: 0.38 }}
        >
          <Image source={tex} resizeMode="stretch" style={StyleSheet.absoluteFill} />
        </View>
      )}
      {/* Shadow wrapper carries the drop-shadow on web so it hugs the PNG's torn
          alpha edge instead of a rectangle. */}
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          isWeb ? webStyle({ filter: flat ? "none" : shadow }) : flat ? null : styles.nativeFaceShadow,
        ]}
      >
        <Image
          source={tex}
          resizeMode="stretch"
          style={[StyleSheet.absoluteFill, { transform: [{ scaleX: flip ? -1 : 1 }] }]}
        />
      </View>
      <View style={[styles.content, contentStyle]}>{children}</View>
    </View>
  );

  if (onPress || onLongPress) {
    return (
      <Pressable
        testID={testID}
        onPress={onPress}
        onLongPress={onLongPress}
        disabled={disabled}
        style={({ pressed }) => ({
          opacity: pressed ? 0.94 : 1,
          transform: [{ scale: pressed ? 0.988 : 1 }],
        })}
      >
        {inner}
      </Pressable>
    );
  }

  return (
    <View testID={testID} style={styles.wrap}>
      {inner}
    </View>
  );
}

export function StretchSheet({
  children,
  variant,
  style,
  contentStyle,
  testID,
}: {
  children: React.ReactNode;
  variant: SheetVariant;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  testID?: string;
}) {
  const tex = SHEET_TEXTURES[variant];
  if (isWeb) {
    const uri = Asset.fromModule(tex).uri;
    return (
      <View testID={testID} style={styles.wrap}>
        <View
          style={[
            styles.container,
            webStyle({
              backgroundImage: `url("${uri}")`,
              backgroundSize: "100% 100%",
              backgroundRepeat: "no-repeat",
              filter: "drop-shadow(0 10px 18px rgba(20,12,6,0.34))",
            }),
            style,
          ]}
        >
          <View style={[styles.content, contentStyle]}>{children}</View>
        </View>
      </View>
    );
  }
  return (
    <View testID={testID} style={styles.wrap}>
      <View style={[styles.container, style]}>
        <Image source={tex} resizeMode="stretch" style={StyleSheet.absoluteFill} />
        <View style={[styles.content, contentStyle]}>{children}</View>
      </View>
    </View>
  );
}

// A torn-edged block of a single colour with centred children. Used for small
// solid elements (the gold add button, icon stamps) that should share the
// torn-paper material rather than read as flat UI chips.
export function TornBox({
  children,
  color,
  seed = 4,
  radius = 10,
  style,
}: {
  children?: React.ReactNode;
  color: string;
  seed?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}) {
  // The button face IS the real ACCENT-04 button/chip paper texture. `color` is
  // accepted for call-site compatibility but no longer drives a solid fill.
  void color;
  const flip = seed % 2 === 0;
  return (
    <View style={style}>
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          { borderRadius: radius, overflow: "hidden", transform: [{ scaleX: flip ? -1 : 1 }] },
        ]}
      >
        <Image source={accentButtonTexture} resizeMode="stretch" style={StyleSheet.absoluteFill} />
      </View>
      <View style={[StyleSheet.absoluteFill, styles.stampInner]}>{children}</View>
    </View>
  );
}

// A small torn "stamp" carrying an icon — used for category chips, list-item
// markers, etc. The backing is the real ACCENT paper-tile texture (image #4);
// the icon shape itself is untouched.
export function IconStamp({
  children,
  size = 44,
  seed = 4,
  tone = "espresso",
  color,
  style,
}: {
  children: React.ReactNode;
  size?: number;
  seed?: number;
  tone?: "espresso" | "kraft";
  color?: string;
  style?: StyleProp<ViewStyle>;
}) {
  // Each stamp is backed by one of the small warm accent swatches (ACCENT-03 +
  // TILE-01..04 + CHIP-01..04), chosen by seed so neighbouring stamps differ.
  // tone / color are accepted for call-site compatibility but no longer drive a
  // fill. A rounded clip keeps the swatch reading as a soft paper tile.
  void tone;
  void color;
  const tex = iconTileTextures[seed % iconTileTextures.length];
  const flip = seed % 2 === 0;
  const radius = Math.round(size * 0.3);
  return (
    <View style={[{ width: size, height: size }, style]}>
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          { borderRadius: radius, overflow: "hidden", transform: [{ scaleX: flip ? -1 : 1 }] },
        ]}
      >
        <Image source={tex} resizeMode="stretch" style={StyleSheet.absoluteFill} />
      </View>
      <View style={[StyleSheet.absoluteFill, styles.stampInner]}>{children}</View>
    </View>
  );
}

// A torn hairline used in place of a flat divider rule inside sheets.
export function Hairline({
  color,
  cream = false,
}: {
  color?: string;
  cream?: boolean;
}) {
  const colors = useThemeColors();
  const c = color ?? (cream ? colors.hairCream : colors.hair);
  return <View style={[styles.hairline, { backgroundColor: c }]} />;
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: "stretch",
  },
  container: {
    position: "relative",
    alignSelf: "stretch",
  },
  backing: {
    position: "absolute",
    top: -7,
    right: -6,
    bottom: -10,
    left: -8,
  },
  under: {
    position: "absolute",
    top: -4,
    right: -10,
    bottom: -7,
    left: 4,
  },
  content: {
    position: "relative",
  },
  hairline: {
    height: 1,
    width: "100%",
  },
  stampInner: {
    alignItems: "center",
    justifyContent: "center",
  },
  nativeFaceShadow: {
    shadowColor: "#3A2716",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: 3,
  },
});
