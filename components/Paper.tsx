import React from "react";
import {
  View,
  Pressable,
  ViewStyle,
  StyleProp,
  StyleSheet,
} from "react-native";
import Svg, { Path, Polygon } from "react-native-svg";
import { useThemeColors } from "@/context/ThemeContext";

type Tone = "raised" | "mid";

// A sheet of coffee-soaked paper. Depth comes from *visible* layering — a darker
// backing sheet peeking out at an angle, asymmetric cut corners, a deckled
// (torn) saturation band along the top edge, and a folded dog-ear — never from
// drop shadows or 3D lift.
export function PaperSurface({
  children,
  onPress,
  onLongPress,
  disabled,
  testID,
  style,
  contentStyle,
  tone = "raised",
  accentBorder,
  flip = false,
  deckle = true,
  dogEar = true,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
  testID?: string;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  tone?: Tone;
  accentBorder?: string;
  flip?: boolean;
  deckle?: boolean;
  dogEar?: boolean;
}) {
  const colors = useThemeColors();
  const sheetColor = tone === "mid" ? colors.surface : colors.surfaceElevated;
  const borderColor = accentBorder ?? colors.border;

  // Asymmetric corners break the rectangle identity. flip mirrors the geometry
  // so lists of cards read as a hand-laid collage, not a uniform grid.
  const corners: ViewStyle = flip
    ? {
        borderTopLeftRadius: 4,
        borderTopRightRadius: 19,
        borderBottomRightRadius: 5,
        borderBottomLeftRadius: 16,
      }
    : {
        borderTopLeftRadius: 19,
        borderTopRightRadius: 4,
        borderBottomRightRadius: 16,
        borderBottomLeftRadius: 5,
      };

  const rot = flip ? "-0.8deg" : "0.8deg";

  const sheet = (
    <View style={styles.stack}>
      {/* Backing sheet — a darker, soaked layer peeking out at an angle */}
      <View
        pointerEvents="none"
        style={[
          styles.backing,
          corners,
          {
            backgroundColor: colors.backdrop,
            transform: [{ rotate: rot }],
          },
        ]}
      />
      {/* Main sheet */}
      <View
        style={[
          styles.sheet,
          corners,
          { backgroundColor: sheetColor, borderColor },
          contentStyle,
        ]}
      >
        {deckle && (
          <View pointerEvents="none" style={styles.deckle}>
            <Svg
              width="100%"
              height="100%"
              viewBox="0 0 100 12"
              preserveAspectRatio="none"
            >
              <Path
                d="M0,0 H100 V6 C88,9 78,4 66,7 C54,10 44,5 32,8 C20,11 10,5 0,8 Z"
                fill={colors.tint}
                fillOpacity={0.14}
              />
            </Svg>
          </View>
        )}
        {children}
        {dogEar && (
          <View
            pointerEvents="none"
            style={[styles.dogEar, flip ? { left: 0 } : { right: 0 }]}
          >
            <Svg width="20" height="20" viewBox="0 0 20 20">
              {flip ? (
                <>
                  <Polygon points="0,0 0,20 20,0" fill={colors.backdrop} />
                  <Polygon points="0,0 20,0 0,9" fill={colors.tint} fillOpacity={0.18} />
                </>
              ) : (
                <>
                  <Polygon points="20,0 20,20 0,0" fill={colors.backdrop} />
                  <Polygon points="20,0 0,0 20,9" fill={colors.tint} fillOpacity={0.18} />
                </>
              )}
            </Svg>
          </View>
        )}
      </View>
    </View>
  );

  if (onPress || onLongPress) {
    return (
      <Pressable
        testID={testID}
        onPress={onPress}
        onLongPress={onLongPress}
        disabled={disabled}
        style={({ pressed }) => [
          { opacity: pressed ? 0.94 : 1, transform: [{ scale: pressed ? 0.987 : 1 }] },
          style,
        ]}
      >
        {sheet}
      </Pressable>
    );
  }

  return <View testID={testID} style={style}>{sheet}</View>;
}

// A torn paper fold used in place of hairline dividers inside a sheet.
export function TornDivider({ color }: { color: string }) {
  return (
    <View pointerEvents="none" style={styles.tornDivider}>
      <Svg width="100%" height="100%" viewBox="0 0 100 6" preserveAspectRatio="none">
        <Path
          d="M0,3 C16,1 26,5 40,3 C54,1 64,5 78,3 C88,1.5 94,4 100,3"
          stroke={color}
          strokeWidth={1}
          fill="none"
          strokeOpacity={0.7}
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    position: "relative",
  },
  backing: {
    position: "absolute",
    left: 6,
    right: -6,
    top: 7,
    bottom: -7,
  },
  sheet: {
    borderWidth: 1,
    overflow: "hidden",
  },
  deckle: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 12,
  },
  dogEar: {
    position: "absolute",
    top: 0,
    width: 20,
    height: 20,
  },
  tornDivider: {
    height: 6,
    width: "100%",
  },
});
