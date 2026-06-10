import React from "react";
import {
  View,
  Pressable,
  ViewStyle,
  StyleProp,
  StyleSheet,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { useThemeColors } from "@/context/ThemeContext";

type Tone = "raised" | "mid" | "dark";

// A sheet of paper laid on the table. It is NOT a UI card: depth comes from a
// visibly OFFSET backing sheet in a contrasting tone (Flächenversatz) plus a
// strong light/dark contrast — never from drop shadows, dog-ears or texture.
// `tone="dark"` makes a dark espresso "feature" sheet (the showpiece layer)
// whose backing is light, so it reads as the top of the stack.
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
  layers = 1,
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
  layers?: 1 | 2;
}) {
  const colors = useThemeColors();
  const isDark = tone === "dark";
  const sheetColor = isDark
    ? colors.heroSurface
    : tone === "mid"
    ? colors.surface
    : colors.surfaceElevated;
  const backingColor = isDark ? colors.heroBacking : colors.backdrop;
  const borderColor = accentBorder ?? (isDark ? colors.heroBorder : colors.border);

  // Large, varied, asymmetric corners cut the rectangle identity. flip mirrors
  // the geometry so a list reads as hand-laid sheets, not a uniform grid.
  const radii: ViewStyle = flip
    ? {
        borderTopLeftRadius: 7,
        borderTopRightRadius: 26,
        borderBottomRightRadius: 11,
        borderBottomLeftRadius: 22,
      }
    : {
        borderTopLeftRadius: 26,
        borderTopRightRadius: 7,
        borderBottomRightRadius: 22,
        borderBottomLeftRadius: 11,
      };

  // Backing peeks toward the bottom and one side. flip sends it to the other
  // side so adjacent sheets lean apart.
  const nearOffset: ViewStyle = flip
    ? { top: 10, bottom: -10, left: -8, right: 8 }
    : { top: 10, bottom: -10, left: 8, right: -8 };
  const nearRot = flip ? "-1.3deg" : "1.3deg";
  const farOffset: ViewStyle = flip
    ? { top: -9, bottom: 9, left: 9, right: -9 }
    : { top: -9, bottom: 9, left: -9, right: 9 };
  const farRot = flip ? "2.6deg" : "-2.6deg";

  const sheet = (
    <View style={styles.stack}>
      {layers >= 2 && (
        <View
          pointerEvents="none"
          style={[
            styles.layer,
            radii,
            farOffset,
            { backgroundColor: backingColor, transform: [{ rotate: farRot }] },
          ]}
        />
      )}
      <View
        pointerEvents="none"
        style={[
          styles.layer,
          radii,
          nearOffset,
          { backgroundColor: backingColor, transform: [{ rotate: nearRot }] },
        ]}
      />
      <View
        style={[
          styles.sheet,
          radii,
          { backgroundColor: sheetColor, borderColor },
          contentStyle,
        ]}
      >
        {children}
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
  layer: {
    position: "absolute",
  },
  sheet: {
    borderWidth: 1,
    overflow: "hidden",
  },
  tornDivider: {
    height: 6,
    width: "100%",
  },
});
