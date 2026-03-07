import React from "react";
import { StyleSheet, View } from "react-native";
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
        <Polygon points="0,0 375,0 120,180" fill="rgba(255,255,255,0.04)" />
        <Polygon points="375,0 280,320 120,180" fill="rgba(0,0,0,0.07)" />
        <Polygon points="0,0 120,180 0,450" fill="rgba(255,255,255,0.03)" />
        <Polygon points="120,180 280,320 200,400" fill="rgba(255,255,255,0.05)" />
        <Polygon points="280,320 375,0 375,600" fill="rgba(0,0,0,0.06)" />
        <Polygon points="280,320 375,600 200,400" fill="rgba(0,0,0,0.04)" />
        <Polygon points="0,450 120,180 200,400" fill="rgba(255,255,255,0.04)" />
        <Polygon points="0,450 200,400 60,700" fill="rgba(0,0,0,0.06)" />
        <Polygon points="60,700 200,400 320,650" fill="rgba(255,255,255,0.03)" />
        <Polygon points="320,650 200,400 375,600" fill="rgba(0,0,0,0.05)" />
        <Polygon points="375,600 375,812 320,650" fill="rgba(255,255,255,0.04)" />
        <Polygon points="0,700 60,700 0,812" fill="rgba(255,255,255,0.03)" />
        <Polygon points="60,700 320,650 180,812" fill="rgba(0,0,0,0.05)" />
        <Polygon points="320,650 375,812 180,812" fill="rgba(255,255,255,0.04)" />
        <Polygon points="60,700 180,812 0,812" fill="rgba(0,0,0,0.04)" />
      </Svg>
    </View>
  );
}
