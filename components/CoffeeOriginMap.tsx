import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Polygon, G, Text as SvgText } from "react-native-svg";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import type { MapRegionData } from "@/constants/coffeeMap";

const AnimatedG = Animated.createAnimatedComponent(G);

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const DOUBLE_TAP_ZOOM = 2.4;

export interface CoffeeOriginMapColors {
  discovered: string;
  undiscovered: string;
  favorite: string;
  stroke: string;
  labelOnDiscovered: string;
  labelOnUndiscovered: string;
  star: string;
}

interface Props {
  data: MapRegionData;
  discovered: Set<string>;
  favorite: string | null;
  onSelectCountry: (country: string) => void;
  colors: CoffeeOriginMapColors;
  height?: number;
  /** When set, plays a one-shot first-discovery highlight on this country. */
  highlightCountry?: string | null;
  onHighlightComplete?: () => void;
}

function clamp(v: number, min: number, max: number): number {
  "worklet";
  return Math.min(Math.max(v, min), max);
}

export function CoffeeOriginMap({
  data,
  discovered,
  favorite,
  onSelectCountry,
  colors,
  height = 300,
  highlightCountry = null,
  onHighlightComplete,
}: Props) {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);
  const containerW = useSharedValue(0);
  const containerH = useSharedValue(0);

  // First-discovery highlight animation (driven by the screen)
  const highlightScale = useSharedValue(1);

  useEffect(() => {
    if (!highlightCountry) return;
    if (!data.countries.some((mc) => mc.id === highlightCountry)) {
      onHighlightComplete?.();
      return;
    }
    highlightScale.value = 1;
    highlightScale.value = withSequence(
      withTiming(1.12, { duration: 230 }),
      withTiming(1, { duration: 270 }, (finished) => {
        if (finished && onHighlightComplete) runOnJS(onHighlightComplete)();
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlightCountry]);

  const clampTranslate = () => {
    "worklet";
    const maxX = (containerW.value * (scale.value - 1)) / 2;
    const maxY = (containerH.value * (scale.value - 1)) / 2;
    translateX.value = clamp(translateX.value, -maxX, maxX);
    translateY.value = clamp(translateY.value, -maxY, maxY);
  };

  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = clamp(savedScale.value * e.scale, MIN_ZOOM, MAX_ZOOM);
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      clampTranslate();
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const pan = Gesture.Pan()
    .minDistance(6)
    .onUpdate((e) => {
      translateX.value = savedTranslateX.value + e.translationX;
      translateY.value = savedTranslateY.value + e.translationY;
    })
    .onEnd(() => {
      clampTranslate();
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .maxDuration(260)
    .onEnd(() => {
      if (scale.value > 1.05) {
        scale.value = withTiming(MIN_ZOOM, { duration: 220 });
        savedScale.value = MIN_ZOOM;
        translateX.value = withTiming(0, { duration: 220 });
        translateY.value = withTiming(0, { duration: 220 });
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      } else {
        scale.value = withTiming(DOUBLE_TAP_ZOOM, { duration: 220 });
        savedScale.value = DOUBLE_TAP_ZOOM;
      }
    });

  const composed = Gesture.Exclusive(
    doubleTap,
    Gesture.Simultaneous(pan, pinch)
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const highlightData = highlightCountry
    ? data.countries.find((c) => c.id === highlightCountry) ?? null
    : null;

  const highlightProps = useAnimatedProps(() => {
    const cx = highlightData?.labelX ?? 0;
    const cy = highlightData?.labelY ?? 0;
    return {
      transform: `translate(${cx} ${cy}) scale(${highlightScale.value}) translate(${-cx} ${-cy})`,
    } as any;
  });

  return (
    <View
      style={[styles.container, { height }]}
      onLayout={(e) => {
        containerW.value = e.nativeEvent.layout.width;
        containerH.value = e.nativeEvent.layout.height;
      }}
    >
      <GestureDetector gesture={composed}>
        <Animated.View style={[styles.fill, animatedStyle]}>
          <Svg
            width="100%"
            height="100%"
            viewBox={data.viewBox}
            preserveAspectRatio="xMidYMid meet"
          >
            {data.countries.map((c) => {
              const isDiscovered = discovered.has(c.id);
              const isFavorite = favorite === c.id;
              const fill = isFavorite
                ? colors.favorite
                : isDiscovered
                ? colors.discovered
                : colors.undiscovered;
              const labelColor = isDiscovered
                ? colors.labelOnDiscovered
                : colors.labelOnUndiscovered;
              return (
                <G key={c.id} onPress={() => onSelectCountry(c.id)}>
                  <Polygon
                    points={c.points}
                    fill={fill}
                    stroke={colors.stroke}
                    strokeWidth={isFavorite ? 2.5 : 1.5}
                    strokeLinejoin="round"
                  />
                  <SvgText
                    x={c.labelX}
                    y={c.labelY + (isFavorite ? 4 : 3)}
                    fill={labelColor}
                    fontSize={c.small ? 11 : 14}
                    fontWeight="700"
                    textAnchor="middle"
                  >
                    {c.name}
                  </SvgText>
                  {isFavorite && (
                    <SvgText
                      x={c.labelX}
                      y={c.labelY - (c.small ? 10 : 14)}
                      fill={colors.star}
                      fontSize={c.small ? 13 : 16}
                      textAnchor="middle"
                    >
                      ★
                    </SvgText>
                  )}
                </G>
              );
            })}

            {highlightData && (
              <AnimatedG animatedProps={highlightProps} pointerEvents="none">
                <Polygon
                  points={highlightData.points}
                  fill={
                    favorite === highlightData.id
                      ? colors.favorite
                      : colors.discovered
                  }
                  stroke={colors.star}
                  strokeWidth={2.5}
                  strokeLinejoin="round"
                />
                <SvgText
                  x={highlightData.labelX}
                  y={highlightData.labelY + 3}
                  fill={colors.labelOnDiscovered}
                  fontSize={highlightData.small ? 11 : 14}
                  fontWeight="700"
                  textAnchor="middle"
                >
                  {highlightData.name}
                </SvgText>
              </AnimatedG>
            )}
          </Svg>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    overflow: "hidden",
  },
  fill: {
    flex: 1,
  },
});
