import React from "react";
import { StyleSheet, View, Pressable, ViewStyle } from "react-native";
import Svg, { Polygon } from "react-native-svg";
import { useTheme } from "@/context/ThemeContext";

export function PolyBackground() {
  const { design } = useTheme();
  if (design !== "lowpoly") return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg
        width="100%"
        height="100%"
        viewBox="0 0 375 812"
        preserveAspectRatio="xMidYMid slice"
      >
        <Polygon points="0,0 375,0 120,180"      fill="rgba(255,255,255,0.10)" />
        <Polygon points="375,0 280,320 120,180"   fill="rgba(0,0,0,0.12)" />
        <Polygon points="0,0 120,180 0,450"       fill="rgba(255,255,255,0.07)" />
        <Polygon points="120,180 280,320 200,400" fill="rgba(255,255,255,0.09)" />
        <Polygon points="280,320 375,0 375,600"   fill="rgba(0,0,0,0.11)" />
        <Polygon points="280,320 375,600 200,400" fill="rgba(0,0,0,0.08)" />
        <Polygon points="0,450 120,180 200,400"   fill="rgba(255,255,255,0.08)" />
        <Polygon points="0,450 200,400 60,700"    fill="rgba(0,0,0,0.10)" />
        <Polygon points="60,700 200,400 320,650"  fill="rgba(255,255,255,0.07)" />
        <Polygon points="320,650 200,400 375,600" fill="rgba(0,0,0,0.09)" />
        <Polygon points="375,600 375,812 320,650" fill="rgba(255,255,255,0.08)" />
        <Polygon points="0,700 60,700 0,812"      fill="rgba(255,255,255,0.07)" />
        <Polygon points="60,700 320,650 180,812"  fill="rgba(0,0,0,0.09)" />
        <Polygon points="320,650 375,812 180,812" fill="rgba(255,255,255,0.08)" />
        <Polygon points="60,700 180,812 0,812"    fill="rgba(0,0,0,0.07)" />
      </Svg>
    </View>
  );
}

export function PolyCornerCut() {
  const { design } = useTheme();
  if (design !== "lowpoly") return null;
  return (
    <View
      style={{ position: "absolute", top: 0, right: 0, width: 28, height: 28 }}
      pointerEvents="none"
    >
      <Svg width="28" height="28" viewBox="0 0 28 28">
        <Polygon points="28,0 28,28 0,0" fill="#e1a24a" fillOpacity="0.30" />
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
            points="12,0 288,0 300,12 300,42 288,54 12,54 0,42 0,12"
            fill={color}
          />
          <Polygon
            points="12,0 288,0 300,12 150,30 0,12"
            fill="rgba(255,255,255,0.10)"
          />
        </Svg>
      )}
      {children}
    </Pressable>
  );
}
