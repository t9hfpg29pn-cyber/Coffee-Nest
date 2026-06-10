import React from "react";
import {
  Image,
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";
import { useThemeColors } from "@/context/ThemeContext";
import {
  paperMainTexture,
  paperStainedTexture,
  paperAccentTexture,
} from "@/assets/textures";

const isWeb = Platform.OS === "web";

// Apply web-only inline style props (filter, mask, gradients) that React Native
// Web passes straight through to the DOM. No-op on native.
function webStyle(value: Record<string, string | number>): ViewStyle {
  return isWeb ? (value as unknown as ViewStyle) : {};
}

// ── Torn edge as a STATIC baked mask (TornBox / gold buttons only) ──────────
// NOTE: TornSheet and IconStamp now use the real paper-texture PNGs directly,
// so their torn edges come from the images' own transparent alpha. The baked
// SVG mask below is only still used by TornBox (the solid gold add/save buttons,
// for which no paper texture exists).
// The approved mockup tears each sheet with a live `feTurbulence` +
// `feDisplacementMap` SVG filter applied to every element. That is fine for a
// single static mockup screen, but the real app renders one sheet PER list item
// and scrolls — re-running turbulence on every repaint causes the jank the user
// reported, and when a live filter lags/fails the offset backing paints as a
// plain rectangle (the "empty blocks", especially on the left edge).
//
// So we bake the EXACT same displacement once into a self-contained SVG data
// URI and use it as a `mask-image`. The browser rasterises the mask a single
// time and compositing it is GPU-cheap, so the torn silhouette is identical to
// the mockup but reliable and scroll-friendly. Memoised per seed.
const maskCache: Record<number, string> = {};
function tornMaskUri(seed: number): string {
  if (maskCache[seed]) return maskCache[seed];
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='320' height='320' viewBox='0 0 320 320' preserveAspectRatio='none'>` +
    `<filter id='t' x='-14%' y='-14%' width='128%' height='128%'>` +
    `<feTurbulence type='fractalNoise' baseFrequency='0.013 0.016' numOctaves='3' seed='${seed}' result='n'/>` +
    `<feDisplacementMap in='SourceGraphic' in2='n' scale='11' xChannelSelector='R' yChannelSelector='G'/>` +
    `</filter>` +
    `<rect x='16' y='16' width='288' height='288' fill='#fff' filter='url(#t)'/>` +
    `</svg>`;
  const uri = `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  maskCache[seed] = uri;
  return uri;
}

function maskStyle(seed: number): ViewStyle {
  if (!isWeb) return {};
  const uri = tornMaskUri(seed);
  return {
    maskImage: uri,
    WebkitMaskImage: uri,
    maskSize: "100% 100%",
    WebkitMaskSize: "100% 100%",
    maskRepeat: "no-repeat",
    WebkitMaskRepeat: "no-repeat",
  } as unknown as ViewStyle;
}

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

export type SheetTone = "cream" | "espresso";

// A torn sheet of paper with a kraft (or darker espresso) backing peeking out
// behind it. NOT a UI card: depth comes from the torn silhouette, the offset
// backing and the cream/espresso contrast — never from a rectangular box shadow.
export function TornSheet({
  children,
  tone = "cream",
  seed = 2,
  rotate = -0.6,
  peek = true,
  onPress,
  onLongPress,
  disabled,
  testID,
  style,
  contentStyle,
}: {
  children: React.ReactNode;
  tone?: SheetTone;
  seed?: number;
  rotate?: number;
  peek?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
  testID?: string;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
}) {
  const espresso = tone === "espresso";
  // The face IS the real paper photo: cream -> main sheet, espresso (now a LIGHT
  // coffee-stained sheet) -> stained sheet. No solid fill / gradient / SVG mask;
  // the torn silhouette comes from the PNG's own transparent alpha edge.
  const tex = espresso ? paperStainedTexture : paperMainTexture;
  const flip = seed % 2 === 0; // mirror the silhouette so adjacent sheets differ
  const shadow = espresso
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
        style={[StyleSheet.absoluteFill, isWeb ? webStyle({ filter: shadow }) : styles.nativeFaceShadow]}
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
  const r: ViewStyle = isWeb ? {} : { borderRadius: radius };
  return (
    <View style={style}>
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          r,
          { backgroundColor: color },
          maskStyle(seed),
        ]}
      />
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
  // The accent paper tile (texture #4) now backs every small icon stamp. tone /
  // color are accepted for call-site compatibility but no longer drive a fill.
  void tone;
  void color;
  const flip = seed % 2 === 0;
  return (
    <View style={[{ width: size, height: size }, style]}>
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { transform: [{ scaleX: flip ? -1 : 1 }] }]}
      >
        <Image source={paperAccentTexture} resizeMode="stretch" style={StyleSheet.absoluteFill} />
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
