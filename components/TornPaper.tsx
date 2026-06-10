import React from "react";
import {
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";
import { useThemeColors } from "@/context/ThemeContext";

const isWeb = Platform.OS === "web";

// Apply web-only inline style props (filter, mask, gradients) that React Native
// Web passes straight through to the DOM. No-op on native.
function webStyle(value: Record<string, string | number>): ViewStyle {
  return isWeb ? (value as unknown as ViewStyle) : {};
}

// ── Torn edge as a STATIC baked mask ────────────────────────────────────────
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
  const colors = useThemeColors();
  const espresso = tone === "espresso";

  const face = espresso ? colors.espresso : colors.surface;
  const backing = espresso ? colors.espresso2 : colors.kraft;
  const shadow = espresso
    ? "drop-shadow(0 12px 20px rgba(74,48,24,0.24))"
    : "drop-shadow(0 10px 16px rgba(58,39,22,0.16))";

  // A gentle warm gradient gives the face visible multi-tonality (the user asked
  // for "Struktur / Mehrfarbigkeit") without a desaturated noise wash that muddied
  // the cream before. Tones stay inside the same warm family per theme.
  const faceGradient = espresso
    ? `linear-gradient(150deg, ${colors.espresso3} 0%, ${colors.espresso} 56%, ${colors.espresso2} 100%)`
    : `linear-gradient(150deg, ${colors.surfaceElevated} 0%, ${colors.surface} 62%, ${colors.surface} 100%)`;

  // Distinct seeds for the backing/underlayer so adjacent silhouettes differ.
  const backSeed = seed + 6;
  const underSeed = seed + 3;

  // On native there are no masks/filters, so fall back to soft rounded corners.
  const faceRadius: ViewStyle = isWeb ? {} : { borderRadius: 14 };
  const backRadius: ViewStyle = isWeb ? {} : { borderRadius: 16 };

  const inner = (
    <View style={[styles.container, style]}>
      {peek && (
        <View
          pointerEvents="none"
          style={[
            styles.backing,
            backRadius,
            { backgroundColor: backing },
            maskStyle(backSeed),
            { transform: [{ rotate: `${rotate - 1}deg` }] },
          ]}
        />
      )}
      {espresso && (
        <View
          pointerEvents="none"
          style={[
            styles.under,
            backRadius,
            { backgroundColor: colors.espresso3, opacity: 0.85 },
            maskStyle(underSeed),
            { transform: [{ rotate: `${rotate + 1.4}deg` }] },
          ]}
        />
      )}
      {/* Shadow wrapper carries the drop-shadow on web. It is NOT masked, so the
          shadow follows the torn silhouette of the masked face child instead of
          being clipped away by the mask. */}
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, isWeb ? webStyle({ filter: shadow }) : null]}
      >
        <View
          style={[
            StyleSheet.absoluteFill,
            faceRadius,
            { backgroundColor: face },
            isWeb ? webStyle({ backgroundImage: faceGradient }) : null,
            maskStyle(seed),
            isWeb ? null : styles.nativeFaceShadow,
          ]}
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

// A small torn espresso "stamp" carrying a gold icon — used for category chips
// (aromas, processing methods). The icon shape itself is untouched; only the
// backing is the torn-paper material.
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
  const colors = useThemeColors();
  const fill = color ?? (tone === "kraft" ? colors.kraft : colors.espresso);
  return (
    <TornBox color={fill} seed={seed} style={[{ width: size, height: size }, style]}>
      {children}
    </TornBox>
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
