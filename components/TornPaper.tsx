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

// Seeds available as `url(#torn-N)` filters. Each gives a different torn edge so
// adjacent sheets never share an identical silhouette.
const TORN_SEEDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 13, 14, 15, 16, 17];

// Apply a raw CSS filter string on web only; no-op on native (graceful fallback
// to softly rounded sheets handled by the caller's borderRadius).
function webFilter(value: string): ViewStyle {
  return isWeb ? ({ filter: value } as unknown as ViewStyle) : {};
}

function webStyle(value: Record<string, string | number>): ViewStyle {
  return isWeb ? (value as unknown as ViewStyle) : {};
}

// A seamless grayscale paper-grain tile. The browser rasterises this SVG ONCE
// and reuses it as a background-image, composited with the sheet colour via
// background-blend-mode. This is far cheaper than a live feTurbulence filter on
// every sheet (which made scrolling janky) yet keeps the grain clearly visible.
// Two contrast ranges: a light grain for the cream face (multiply) and a dark
// grain for the espresso face (screen).
const buildNoise = (slope: number, intercept: number): string =>
  `url("data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='f'><feTurbulence type='fractalNoise' baseFrequency='0.55' numOctaves='2' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/><feComponentTransfer><feFuncR type='linear' slope='${slope}' intercept='${intercept}'/><feFuncG type='linear' slope='${slope}' intercept='${intercept}'/><feFuncB type='linear' slope='${slope}' intercept='${intercept}'/></feComponentTransfer></filter><rect width='100%' height='100%' filter='url(#f)'/></svg>`,
  )}")`;
const NOISE_CREAM = buildNoise(0.26, 0.74);
const NOISE_ESPRESSO = buildNoise(0.4, 0);

// The torn-edge SVG filter defs. These MUST be REAL DOM <filter> nodes so that
// `filter: url(#torn-N)` actually resolves on web — react-native-svg's web build
// does not reliably emit usable SVG filter primitives (FeDisplacementMap etc.),
// which silently leaves every sheet as a plain rounded rectangle (= "card UI").
// So on web we inject the exact raw SVG markup the approved mockup uses. On
// native this is a no-op (filters are a web-only effect).
const TORN_DEFS_HTML = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>${TORN_SEEDS.map(
  (s) =>
    `<filter id="torn-${s}" x="-12%" y="-12%" width="124%" height="124%"><feTurbulence type="fractalNoise" baseFrequency="0.013 0.016" numOctaves="3" seed="${s}" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="11" xChannelSelector="R" yChannelSelector="G"/></filter>`,
).join("")}<filter id="paper-grain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter></defs></svg>`;

export function TornDefs() {
  React.useEffect(() => {
    if (!isWeb || typeof document === "undefined") return;
    if (document.getElementById("torn-paper-defs")) return;
    const host = document.createElement("div");
    host.id = "torn-paper-defs";
    host.setAttribute("aria-hidden", "true");
    host.style.cssText = "position:absolute;width:0;height:0;overflow:hidden";
    host.innerHTML = TORN_DEFS_HTML;
    document.body.appendChild(host);
  }, []);
  return null;
}

// A subtle paper-grain overlay. Web-only (relies on SVG filter + blend mode).
export function Grain() {
  if (!isWeb) return null;
  return (
    <View
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFill,
        webStyle({
          filter: "url(#paper-grain)",
          opacity: 0.08,
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

  // Derive backing/underlayer silhouettes by indexing into TORN_SEEDS so the
  // result is ALWAYS a defined filter id. Raw arithmetic (e.g. (seed+6)%16+1)
  // could yield 10, but there is no torn-10 filter — an unresolved url(#torn-10)
  // renders a plain rectangle and regresses the sheet back to a "card".
  const seedIdx = Math.max(0, TORN_SEEDS.indexOf(seed));
  const backSeed = TORN_SEEDS[(seedIdx + 6) % TORN_SEEDS.length];
  const underSeed = TORN_SEEDS[(seedIdx + 3) % TORN_SEEDS.length];

  // On web the torn SVG displacement filter supplies the organic edge, so the
  // base shape is a SHARP rectangle (exactly like the mockup) — no radius, or it
  // reads as a rounded card. On native (no filters) fall back to soft corners.
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
            webFilter(`url(#torn-${backSeed})`),
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
            webFilter(`url(#torn-${underSeed})`),
            { transform: [{ rotate: `${rotate + 1.4}deg` }] },
          ]}
        />
      )}
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          faceRadius,
          { backgroundColor: face },
          // Paper fibre baked into the face as a tiled noise background-image
          // (rasterised once) and blended with the sheet colour. The torn
          // displacement filter on this same View then warps the grain with the
          // edge — giving visible structure WITHOUT a per-sheet live filter.
          isWeb
            ? webStyle({
                backgroundImage: espresso ? NOISE_ESPRESSO : NOISE_CREAM,
                backgroundBlendMode: espresso ? "screen" : "multiply",
                backgroundSize: "170px 170px",
              })
            : {},
          webFilter(`url(#torn-${seed}) ${shadow}`),
          isWeb ? {} : styles.nativeFaceShadow,
        ]}
      />
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
          webFilter(`url(#torn-${seed})`),
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
  defs: {
    position: "absolute",
    width: 0,
    height: 0,
  },
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
