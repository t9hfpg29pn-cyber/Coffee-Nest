import React from "react";
import { StyleSheet, View, Pressable, ViewStyle } from "react-native";
import Svg, { Polygon, Path } from "react-native-svg";
import { useTheme } from "@/context/ThemeContext";

// Organic "paper field" behind every screen — large, soft, overlapping torn
// layers (never a technical low-poly mesh). A few big shapes give the warm
// table real depth so the sheets read as resting ON something.
export function PolyBackground() {
  const { design } = useTheme();

  if (design === "classic") {
    return (
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Svg
          width="100%"
          height="100%"
          viewBox="0 0 375 812"
          preserveAspectRatio="xMidYMid slice"
        >
          {/* A brighter sheet of paper draped across the top of the field */}
          <Path
            d="M0,0 H375 V236 C300,286 246,198 166,248 C88,296 40,216 0,260 Z"
            fill="rgba(255,253,247,0.6)"
          />
          {/* A warmer torn band through the middle */}
          <Path
            d="M0,250 C90,212 150,300 250,256 C322,226 360,282 375,252 V486 C300,524 228,442 148,490 C80,532 30,456 0,496 Z"
            fill="rgba(120,84,50,0.05)"
          />
          {/* A deeper soak settling toward the base */}
          <Path
            d="M0,486 C80,524 150,452 232,498 C300,536 350,470 375,500 V812 H0 Z"
            fill="rgba(70,44,26,0.07)"
          />
        </Svg>
      </View>
    );
  }

  if (design !== "lowpoly") return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg
        width="100%"
        height="100%"
        viewBox="0 0 375 812"
        preserveAspectRatio="xMidYMid slice"
      >
        {/* Upper sheet — lighter soak draped from the top */}
        <Path
          d="M0,0 H375 V250 C300,300 250,210 170,260 C90,308 40,230 0,275 Z"
          fill="rgba(255,236,210,0.06)"
        />
        {/* A warm torn band catching the light */}
        <Path
          d="M0,250 C90,210 150,300 250,255 C320,224 360,280 375,250 V430 C300,470 230,390 150,440 C80,484 30,410 0,452 Z"
          fill="rgba(225,162,74,0.05)"
        />
        {/* Mid shadowed layer */}
        <Path
          d="M0,430 C80,470 150,400 230,448 C300,490 350,420 375,452 V650 C290,690 220,610 140,660 C70,704 30,630 0,672 Z"
          fill="rgba(0,0,0,0.12)"
        />
        {/* Deepest soak settling at the base */}
        <Path
          d="M0,640 C90,690 160,610 250,665 C320,708 355,640 375,672 V812 H0 Z"
          fill="rgba(0,0,0,0.16)"
        />
        {/* Faint highlight torn across the lower third */}
        <Path
          d="M0,560 C100,520 170,600 260,558 C330,525 360,575 375,556"
          stroke="rgba(255,236,210,0.05)"
          strokeWidth={26}
          fill="none"
        />
      </Svg>
    </View>
  );
}

// A folded paper dog-ear, kept for surfaces that aren't a PaperSurface.
export function PolyCornerCut() {
  const { design } = useTheme();
  if (design !== "lowpoly") return null;
  return (
    <View
      style={{ position: "absolute", top: 0, right: 0, width: 22, height: 22 }}
      pointerEvents="none"
    >
      <Svg width="22" height="22" viewBox="0 0 22 22">
        <Polygon points="22,0 22,22 0,0" fill="#190b04" fillOpacity="0.55" />
        <Polygon points="22,0 0,0 22,10" fill="#e1a24a" fillOpacity="0.20" />
      </Svg>
    </View>
  );
}

export function PolyActionButton({
  onPress,
  disabled = false,
  color,
  children,
  style,
}: {
  onPress: () => void;
  disabled?: boolean;
  color: string;
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  const { design } = useTheme();
  const isLowpoly = design === "lowpoly";

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        style,
        isLowpoly
          ? {
              height: 54,
              justifyContent: "center" as const,
              alignItems: "center" as const,
              flexDirection: "row" as const,
              gap: 8,
              opacity: pressed ? 0.85 : disabled ? 0.5 : 1,
              transform: [{ scale: pressed ? 0.97 : 1 }],
            }
          : {
              height: 54,
              borderRadius: 16,
              backgroundColor: color,
              justifyContent: "center" as const,
              alignItems: "center" as const,
              flexDirection: "row" as const,
              gap: 8,
              opacity: pressed ? 0.85 : disabled ? 0.5 : 1,
            },
      ]}
    >
      {isLowpoly && (
        <Svg
          width="100%"
          height="54"
          viewBox="0 0 300 54"
          preserveAspectRatio="none"
          style={StyleSheet.absoluteFill}
        >
          <Polygon
            points="14,0 286,0 300,14 300,40 284,54 14,54 0,40 0,12"
            fill={color}
          />
          <Polygon
            points="14,0 286,0 300,14 150,28 0,12"
            fill="rgba(255,255,255,0.10)"
          />
        </Svg>
      )}
      {children}
    </Pressable>
  );
}
