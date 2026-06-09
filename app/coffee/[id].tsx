import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Alert,
  Platform,
  ActivityIndicator,
  Animated,
  Image,
  Modal,
  ScrollView,
} from "react-native";
import Svg, { Path, Circle, Line, Rect, G, Polygon as SvgPolygon } from "react-native-svg";
import { AromaIcon, ProcessingIcon, RoastIcon, OriginPinIcon, GrinderIcon } from "@/components/CoffeeIcons";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { getCoffeeById, updateCoffee, deleteCoffee, getGrinders, Coffee, GrindSetting, CoffeeOrigin, Grinder } from "@/lib/storage";
import { useUserNames } from "@/context/UserNamesContext";
import { useThemeColors, useCardExtras, useTheme } from "@/context/ThemeContext";
import { PolyBackground, PolyCornerCut, PolyActionButton } from "@/components/PolyBackground";

function RatingSlider({
  label,
  value,
  min,
  max,
  onChange,
  minLabel,
  maxLabel,
  color,
  textColor,
  borderColor,
  surfaceColor,
}: {
  label: string;
  value: number | null;
  min: number;
  max: number;
  onChange: (v: number | null) => void;
  minLabel?: string;
  maxLabel?: string;
  color: string;
  textColor: string;
  borderColor: string;
  surfaceColor: string;
}) {
  const steps = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  const { design } = useTheme();
  const isLowpoly = design === "lowpoly";

  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={{ color: textColor, fontFamily: "Inter_600SemiBold", fontSize: 15 }}>{label}</Text>
        <View style={{ flexDirection: "row", alignItems: "baseline", gap: 2 }}>
          {value !== null ? (
            <>
              <Text style={{ color: color, fontFamily: "Inter_700Bold", fontSize: 26 }}>{value}</Text>
              <Text style={{ color: textColor, fontFamily: "Inter_400Regular", fontSize: 13, opacity: 0.6 }}>
                /{max}
              </Text>
            </>
          ) : (
            <Text style={{ color: textColor, fontFamily: "Inter_400Regular", fontSize: 20, opacity: 0.35 }}>–</Text>
          )}
        </View>
      </View>
      <View style={{ flexDirection: "row", gap: isLowpoly ? 5 : 6 }}>
        {steps.map((step) => {
          const filled = value !== null && step <= value;
          if (isLowpoly) {
            return (
              <Pressable
                key={step}
                onPress={() => { Haptics.selectionAsync(); onChange(step === value ? null : step); }}
                style={({ pressed }) => ({
                  flex: 1,
                  height: 36,
                  justifyContent: "center",
                  alignItems: "center",
                  transform: [{ scale: pressed ? 0.90 : 1 }],
                })}
              >
                <Svg
                  width="100%"
                  height="36"
                  viewBox="0 0 26 36"
                  preserveAspectRatio="none"
                  style={StyleSheet.absoluteFill}
                >
                  <SvgPolygon
                    points="5,0 21,0 26,5 26,31 21,36 5,36 0,31 0,5"
                    fill={filled ? color : surfaceColor}
                  />
                  {filled && (
                    <SvgPolygon
                      points="5,0 21,0 26,5 13,20 0,5"
                      fill="rgba(255,255,255,0.12)"
                    />
                  )}
                </Svg>
                <Text
                  style={{
                    color: filled ? "#1a0800" : textColor,
                    fontFamily: filled ? "Inter_700Bold" : "Inter_500Medium",
                    fontSize: max > 5 ? 10 : 13,
                    position: "relative",
                  }}
                >
                  {step}
                </Text>
              </Pressable>
            );
          }
          return (
            <Pressable
              key={step}
              onPress={() => {
                Haptics.selectionAsync();
                onChange(step === value ? null : step);
              }}
              style={({ pressed }) => ({
                flex: 1,
                height: 36,
                borderRadius: 8,
                backgroundColor: filled ? color : surfaceColor,
                borderWidth: 1,
                borderColor: filled ? color : borderColor,
                justifyContent: "center",
                alignItems: "center",
                opacity: pressed ? 0.8 : 1,
                transform: [{ scale: pressed ? 0.95 : 1 }],
              })}
            >
              <Text
                style={{
                  color: filled ? "#fff" : textColor,
                  fontFamily: "Inter_600SemiBold",
                  fontSize: max > 5 ? 11 : 13,
                }}
              >
                {step}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {(minLabel || maxLabel) && (
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={{ color: textColor, fontFamily: "Inter_400Regular", fontSize: 11, opacity: 0.6 }}>
            {minLabel}
          </Text>
          <Text style={{ color: textColor, fontFamily: "Inter_400Regular", fontSize: 11, opacity: 0.6 }}>
            {maxLabel}
          </Text>
        </View>
      )}
    </View>
  );
}

const AROMA_LABELS = ["sehr kräftig", "kräftig", "ausgewogen", "fruchtig", "sehr fruchtig"];

function ScaleSlider({
  label,
  sublabel,
  value,
  onChange,
  minLabel,
  maxLabel,
  color,
  textColor,
  borderColor,
  surfaceColor,
  aromaIcons,
}: {
  label: string;
  sublabel?: string;
  value: number;
  onChange: (v: number) => void;
  minLabel?: string;
  maxLabel?: string;
  color: string;
  textColor: string;
  borderColor: string;
  surfaceColor: string;
  aromaIcons?: boolean;
}) {
  const steps = [1, 2, 3, 4, 5];
  const { design } = useTheme();
  const isLowpoly = design === "lowpoly";

  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text style={{ color: textColor, fontFamily: "Inter_600SemiBold", fontSize: 15 }}>
          {label}
          {sublabel ? (
            <Text style={{ color: textColor, fontFamily: "Inter_400Regular", fontSize: 13, opacity: 0.55 }}>
              {" " + sublabel}
            </Text>
          ) : null}
        </Text>
        {aromaIcons && value >= 1 && value <= 5 ? (
          <Text style={{ color: textColor, fontFamily: "Inter_400Regular", fontSize: 12, opacity: 0.55 }}>
            {AROMA_LABELS[value - 1]}
          </Text>
        ) : null}
      </View>
      <View style={{ flexDirection: "row", gap: 8 }}>
        {steps.map((step) => {
          const active = step === value;
          if (isLowpoly) {
            return (
              <Pressable
                key={step}
                onPress={() => { Haptics.selectionAsync(); onChange(step); }}
                style={({ pressed }) => ({
                  flex: 1,
                  height: 56,
                  justifyContent: "center",
                  alignItems: "center",
                  transform: [{ scale: pressed ? 0.92 : 1 }],
                })}
              >
                <Svg
                  width="100%"
                  height="56"
                  viewBox="0 0 60 56"
                  preserveAspectRatio="none"
                  style={StyleSheet.absoluteFill}
                >
                  <SvgPolygon
                    points="9,0 51,0 60,9 60,47 51,56 9,56 0,47 0,9"
                    fill={active ? color : surfaceColor}
                  />
                  {active && (
                    <SvgPolygon
                      points="9,0 51,0 60,9 30,32 0,9"
                      fill="rgba(255,255,255,0.11)"
                    />
                  )}
                </Svg>
                <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, justifyContent: "center", alignItems: "center" }}>
                  {aromaIcons ? (
                    <AromaIcon step={step} size={26} color={active ? "#1a0800" : textColor} />
                  ) : (
                    <Text style={{ color: active ? "#1a0800" : textColor, fontFamily: active ? "Inter_700Bold" : "Inter_500Medium", fontSize: 16 }}>
                      {step}
                    </Text>
                  )}
                </View>
              </Pressable>
            );
          }
          return (
            <Pressable
              key={step}
              onPress={() => { Haptics.selectionAsync(); onChange(step); }}
              style={({ pressed }) => ({
                flex: 1,
                height: 56,
                borderRadius: 12,
                backgroundColor: active ? color : surfaceColor,
                borderWidth: 1.5,
                borderColor: active ? color : borderColor,
                justifyContent: "center",
                alignItems: "center",
                opacity: pressed ? 0.8 : 1,
                transform: [{ scale: pressed ? 0.95 : 1 }],
              })}
            >
              {aromaIcons ? (
                <AromaIcon step={step} size={26} color={active ? "#fff" : textColor} />
              ) : (
                <Text style={{ color: active ? "#fff" : textColor, fontFamily: active ? "Inter_700Bold" : "Inter_500Medium", fontSize: 16 }}>
                  {step}
                </Text>
              )}
            </Pressable>
          );
        })}
      </View>
      {(minLabel || maxLabel) && (
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={{ color: textColor, fontFamily: "Inter_400Regular", fontSize: 11, opacity: 0.6 }}>
            {minLabel}
          </Text>
          <Text style={{ color: textColor, fontFamily: "Inter_400Regular", fontSize: 11, opacity: 0.6 }}>
            {maxLabel}
          </Text>
        </View>
      )}
    </View>
  );
}

function SectionHeader({ title, color }: { title: string; color: string }) {
  return (
    <Text
      style={{
        color,
        fontFamily: "Inter_700Bold",
        fontSize: 13,
        letterSpacing: 1.2,
        marginTop: 8,
        marginBottom: 2,
      }}
    >
      {title}
    </Text>
  );
}

// ─── Herkunft / Aufbereitung / Röstgrad ──────────────────────────────────────

const COUNTRIES = [
  "Brasilien", "Kolumbien", "Äthiopien", "Kenia", "Guatemala",
  "Costa Rica", "Panama", "Ruanda", "Burundi", "Peru",
  "Honduras", "Nicaragua", "El Salvador", "Indien", "Indonesien",
  "Vietnam", "Mexiko", "Tansania", "Uganda", "Jemen", "Sonstiges",
] as const;

const PROCESSING_METHODS = [
  { value: "washed",        label: "Washed"       },
  { value: "natural",       label: "Natural"      },
  { value: "honey",         label: "Honey"        },
  { value: "anaerobic",     label: "Anaerobic"    },
  { value: "experimental",  label: "Experimental" },
  { value: "decaf",         label: "Decaf"        },
] as const;

const ROAST_LEVELS = [
  { value: "light",        label: "Hell"         },
  { value: "medium-light", label: "Mittel-\nHell"   },
  { value: "medium",       label: "Mittel"       },
  { value: "medium-dark",  label: "Mittel-\nDunkel" },
  { value: "dark",         label: "Dunkel"       },
] as const;

const ROAST_LEVEL_LABELS: Record<string, string> = {
  light: "Hell", "medium-light": "Mittel-Hell",
  medium: "Mittel", "medium-dark": "Mittel-Dunkel", dark: "Dunkel",
};

type OriginDraft = {
  key: string;
  country: string;
  customCountry: string;
  region: string;
  percentageText: string;
};

function makeOriginKey() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 4);
}

function CountryPickerModal({
  visible, onSelect, onClose, colors, design,
}: {
  visible: boolean;
  onSelect: (c: string) => void;
  onClose: () => void;
  colors: ReturnType<typeof useThemeColors>;
  design: string;
}) {
  const isLowpoly = design === "lowpoly";
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" }}>
        <View style={{
          backgroundColor: colors.surface,
          borderTopLeftRadius: isLowpoly ? 4 : 20,
          borderTopRightRadius: isLowpoly ? 4 : 20,
          maxHeight: "70%",
        }}>
          <View style={{
            flexDirection: "row", justifyContent: "space-between", alignItems: "center",
            padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border,
          }}>
            <Text style={{ color: colors.text, fontFamily: "Inter_600SemiBold", fontSize: 16 }}>
              Land auswählen
            </Text>
            <Pressable onPress={onClose} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </Pressable>
          </View>
          <ScrollView bounces={false}>
            {COUNTRIES.map((c) => (
              <Pressable
                key={c}
                onPress={() => { Haptics.selectionAsync(); onSelect(c); onClose(); }}
                style={({ pressed }) => ({
                  paddingHorizontal: 20, paddingVertical: 14,
                  borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border,
                  backgroundColor: pressed ? colors.surfaceElevated : "transparent",
                })}
              >
                <Text style={{ color: colors.text, fontFamily: "Inter_500Medium", fontSize: 16 }}>{c}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function OriginEditor({
  origins, onAdd, onUpdate, onRemove, openPickerKey, onOpenPicker, onClosePicker, colors, design,
}: {
  origins: OriginDraft[];
  onAdd: () => void;
  onUpdate: (key: string, field: keyof OriginDraft, value: string) => void;
  onRemove: (key: string) => void;
  openPickerKey: string | null;
  onOpenPicker: (key: string) => void;
  onClosePicker: () => void;
  colors: ReturnType<typeof useThemeColors>;
  design: string;
}) {
  const isLowpoly = design === "lowpoly";
  const br = isLowpoly ? 4 : 10;

  const multiple = origins.length > 1;
  const [expandedRegions, setExpandedRegions] = useState<Set<string>>(new Set());

  return (
    <View style={{ gap: 12 }}>
      {origins.map((o) => {
        const headerName = o.country === "Sonstiges" && o.customCountry
          ? o.customCountry
          : o.country;
        return (
        <View key={o.key} style={{
          backgroundColor: colors.surfaceElevated,
          borderRadius: isLowpoly ? 4 : 12,
          borderWidth: 1, borderColor: colors.border,
          padding: 14, gap: 10,
        }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
              <OriginPinIcon size={20} color={colors.tint} />
              <Text
                numberOfLines={1}
                style={{ color: headerName ? colors.text : colors.textSecondary, fontFamily: "Inter_600SemiBold", fontSize: 15, flex: 1 }}
              >
                {headerName || "Herkunft wählen"}
              </Text>
            </View>
            <Pressable onPress={() => { Haptics.selectionAsync(); onRemove(o.key); }}
              style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, paddingLeft: 8 })}>
              <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
            </Pressable>
          </View>

          <Pressable
            onPress={() => { Haptics.selectionAsync(); onOpenPicker(o.key); }}
            style={({ pressed }) => ({
              flexDirection: "row", alignItems: "center", justifyContent: "space-between",
              backgroundColor: colors.surfaceElevated,
              borderWidth: 1.5, borderColor: colors.border, borderRadius: br,
              paddingHorizontal: 14, paddingVertical: 12,
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <Text style={{ color: o.country ? colors.text : colors.textSecondary, fontFamily: "Inter_500Medium", fontSize: 15 }}>
              {o.country || "Land auswählen"}
            </Text>
            <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
          </Pressable>

          <CountryPickerModal
            visible={openPickerKey === o.key}
            onSelect={(c) => { onUpdate(o.key, "country", c); if (c !== "Sonstiges") onUpdate(o.key, "customCountry", ""); }}
            onClose={onClosePicker}
            colors={colors}
            design={design}
          />

          {o.country === "Sonstiges" && (
            <TextInput
              style={{ borderWidth: 1.5, borderColor: colors.border, borderRadius: br, paddingHorizontal: 14, paddingVertical: 10, color: colors.text, fontFamily: "Inter_500Medium", fontSize: 15, backgroundColor: colors.surfaceElevated }}
              placeholder="Land eingeben"
              placeholderTextColor={colors.textSecondary}
              value={o.customCountry}
              onChangeText={(v) => onUpdate(o.key, "customCountry", v)}
            />
          )}

          {(o.region.trim() !== "" || expandedRegions.has(o.key)) ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Text style={{ color: colors.textSecondary, fontFamily: "Inter_500Medium", fontSize: 13, width: 56 }}>
                Region
              </Text>
              <TextInput
                style={{ flex: 1, borderWidth: 1.5, borderColor: colors.border, borderRadius: br, paddingHorizontal: 12, paddingVertical: 8, color: colors.text, fontFamily: "Inter_400Regular", fontSize: 14, backgroundColor: colors.surface }}
                placeholder="z. B. Yirgacheffe (optional)"
                placeholderTextColor={colors.textSecondary}
                value={o.region}
                onChangeText={(v) => onUpdate(o.key, "region", v)}
              />
            </View>
          ) : (
            <Pressable
              onPress={() => {
                Haptics.selectionAsync();
                setExpandedRegions((prev) => new Set(prev).add(o.key));
              }}
              style={({ pressed }) => ({
                flexDirection: "row", alignItems: "center", gap: 6,
                paddingVertical: 4, opacity: pressed ? 0.6 : 1,
              })}
            >
              <Ionicons name="add" size={16} color={colors.tint} />
              <Text style={{ color: colors.tint, fontFamily: "Inter_600SemiBold", fontSize: 13 }}>
                Region ergänzen
              </Text>
            </Pressable>
          )}

          {multiple && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <TextInput
                style={{ flex: 1, borderWidth: 1.5, borderColor: colors.border, borderRadius: br, paddingHorizontal: 14, paddingVertical: 10, color: colors.text, fontFamily: "Inter_400Regular", fontSize: 15, backgroundColor: colors.surface }}
                placeholder="Anteil"
                placeholderTextColor={colors.textSecondary}
                value={o.percentageText}
                onChangeText={(v) => onUpdate(o.key, "percentageText", v.replace(/[^0-9]/g, ""))}
                keyboardType="number-pad"
                maxLength={3}
              />
              <Text style={{ color: colors.textSecondary, fontFamily: "Inter_600SemiBold", fontSize: 15 }}>%</Text>
            </View>
          )}
        </View>
        );
      })}

      <Pressable
        onPress={() => { Haptics.selectionAsync(); onAdd(); }}
        style={({ pressed }) => ({
          flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
          paddingVertical: 12, borderRadius: isLowpoly ? 4 : 10,
          borderWidth: 1.5, borderColor: colors.tint,
          borderStyle: "dashed" as const,
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <Ionicons name="add" size={18} color={colors.tint} />
        <Text style={{ color: colors.tint, fontFamily: "Inter_600SemiBold", fontSize: 14 }}>
          Herkunft hinzufügen
        </Text>
      </Pressable>
    </View>
  );
}

function ProcessingPicker({
  value, onChange, color, textColor, borderColor, surfaceColor,
}: {
  value: string; onChange: (v: string) => void;
  color: string; textColor: string; borderColor: string; surfaceColor: string;
}) {
  const { design } = useTheme();
  const isLowpoly = design === "lowpoly";
  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
        {PROCESSING_METHODS.map(({ value: v, label }) => {
          const active = value === v;
          const iconColor = active ? (isLowpoly ? "#1a0800" : "#fff") : textColor;
          return (
            <Pressable
              key={v}
              onPress={() => { Haptics.selectionAsync(); onChange(active ? "" : v); }}
              style={({ pressed }) => ({
                flexDirection: "row", alignItems: "center", gap: 7,
                paddingHorizontal: 14, paddingVertical: 10,
                borderRadius: isLowpoly ? 4 : 12,
                backgroundColor: active ? color : surfaceColor,
                borderWidth: 1.5, borderColor: active ? color : borderColor,
                opacity: pressed ? 0.8 : 1,
                transform: [{ scale: pressed ? 0.97 : 1 }],
              })}
            >
              <ProcessingIcon method={v} size={20} color={iconColor} />
              <Text style={{ color: iconColor, fontFamily: active ? "Inter_700Bold" : "Inter_500Medium", fontSize: 14 }}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function RoastLevelPicker({
  value, onChange, color, textColor, borderColor, surfaceColor,
}: {
  value: string; onChange: (v: string) => void;
  color: string; textColor: string; borderColor: string; surfaceColor: string;
}) {
  const { design } = useTheme();
  const isLowpoly = design === "lowpoly";
  return (
    <View style={{ gap: 10 }}>
      {!!value && (
        <Text style={{ color: textColor, fontFamily: "Inter_400Regular", fontSize: 12, opacity: 0.55, textAlign: "right" }}>
          {ROAST_LEVEL_LABELS[value]}
        </Text>
      )}
      <View style={{ flexDirection: "row", gap: isLowpoly ? 5 : 8 }}>
        {ROAST_LEVELS.map(({ value: v, label }) => {
          const active = value === v;
          const iconColor = active ? (isLowpoly ? "#1a0800" : "#fff") : textColor;
          if (isLowpoly) {
            return (
              <Pressable
                key={v}
                onPress={() => { Haptics.selectionAsync(); onChange(active ? "" : v); }}
                style={({ pressed }) => ({
                  flex: 1, height: 52, justifyContent: "center", alignItems: "center",
                  transform: [{ scale: pressed ? 0.92 : 1 }],
                })}
              >
                <Svg width="100%" height="52" viewBox="0 0 60 52" preserveAspectRatio="none" style={StyleSheet.absoluteFill}>
                  <SvgPolygon points="9,0 51,0 60,9 60,43 51,52 9,52 0,43 0,9" fill={active ? color : surfaceColor} />
                  {active && <SvgPolygon points="9,0 51,0 60,9 30,30 0,9" fill="rgba(255,255,255,0.11)" />}
                </Svg>
                <RoastIcon level={v} size={24} color={iconColor} />
              </Pressable>
            );
          }
          return (
            <Pressable
              key={v}
              onPress={() => { Haptics.selectionAsync(); onChange(active ? "" : v); }}
              style={({ pressed }) => ({
                flex: 1, height: 52, borderRadius: 12,
                backgroundColor: active ? color : surfaceColor,
                borderWidth: 1.5, borderColor: active ? color : borderColor,
                justifyContent: "center", alignItems: "center",
                opacity: pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.95 : 1 }],
              })}
            >
              <RoastIcon level={v} size={24} color={iconColor} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// ─── GrindSettingDraft ───────────────────────────────────────────────────────
type GrindSettingDraft = { grinder: string; levelText: string };

function GrinderPicker({
  grinders,
  grindSettings,
  onToggle,
  onLevelChange,
  onBlurLevel,
  color,
  textColor,
  borderColor,
  surfaceColor,
}: {
  grinders: Grinder[];
  grindSettings: GrindSettingDraft[];
  onToggle: (grinder: string) => void;
  onLevelChange: (grinder: string, v: string) => void;
  onBlurLevel: (grinder: string) => void;
  color: string;
  textColor: string;
  borderColor: string;
  surfaceColor: string;
}) {
  const { design } = useTheme();
  const isLowpoly = design === "lowpoly";
  return (
    <View style={{ gap: 10 }}>
      <Text style={{ color: textColor, fontFamily: "Inter_600SemiBold", fontSize: 15 }}>
        Kaffeemühle
      </Text>
      <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
        {grinders.map((g) => {
          const active = grindSettings.some((s) => s.grinder === g.name);
          return (
            <Pressable
              key={g.name}
              onPress={() => {
                Haptics.selectionAsync();
                onToggle(g.name);
              }}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderRadius: 12,
                backgroundColor: active ? color : surfaceColor,
                borderWidth: 1.5,
                borderColor: active ? color : borderColor,
                opacity: pressed ? 0.8 : 1,
                transform: [{ scale: pressed ? 0.97 : 1 }],
              })}
            >
              <GrinderIcon design={g.design} size={22} color={active ? "#fff" : textColor} />
              <Text
                style={{
                  color: active ? "#fff" : textColor,
                  fontFamily: active ? "Inter_700Bold" : "Inter_500Medium",
                  fontSize: 15,
                }}
              >
                {g.name}
              </Text>
            </Pressable>
          );
        })}
        {grinders.length === 0 && (
          <Text style={{ color: textColor, fontFamily: "Inter_400Regular", fontSize: 14, opacity: 0.5 }}>
            Keine Mühlen konfiguriert
          </Text>
        )}
      </View>

      {grindSettings.length > 0 && (
        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={{ color: textColor, fontFamily: "Inter_600SemiBold", fontSize: 15 }}>
              Mahlgrad
            </Text>
            <Text style={{ color: textColor, fontFamily: "Inter_400Regular", fontSize: 12, opacity: 0.55 }}>
              0 – 50
            </Text>
          </View>
          <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
            {grindSettings.map(({ grinder, levelText }) => (
              <View key={grinder} style={{ gap: 4, minWidth: 72, flex: 1, maxWidth: 140 }}>
                <Text
                  numberOfLines={1}
                  style={{ color: textColor, fontFamily: "Inter_500Medium", fontSize: 11, opacity: 0.6, textAlign: "center" }}
                >
                  {grinder}
                </Text>
                <View
                  style={{
                    borderWidth: 1.5,
                    borderColor,
                    borderRadius: isLowpoly ? 4 : 10,
                    backgroundColor: surfaceColor,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                  }}
                >
                  <TextInput
                    style={{ color: textColor, fontFamily: "Inter_600SemiBold", fontSize: 18, textAlign: "center" }}
                    value={levelText}
                    onChangeText={(v) => onLevelChange(grinder, v.replace(/[^0-9.,]/g, ""))}
                    onBlur={() => onBlurLevel(grinder)}
                    keyboardType="decimal-pad"
                    placeholder="0"
                    placeholderTextColor={textColor + "44"}
                    selectTextOnFocus
                  />
                </View>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

export default function CoffeeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const cardExtras = useCardExtras();
  const { design } = useTheme();

  const { name1, name2, user2active } = useUserNames();
  const [coffee, setCoffee] = useState<Coffee | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const [grinders, setGrinders] = useState<Grinder[]>([]);
  const [name, setName] = useState("");
  const [haseRating, setHaseRating] = useState<number | null>(null);
  const [dodoRating, setDodoRating] = useState<number | null>(null);
  const [grindSettings, setGrindSettings] = useState<GrindSettingDraft[]>([]);
  const [aroma, setAroma] = useState(3);
  const [aromaDescription, setAromaDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [pricePerKg, setPricePerKg] = useState("");
  const [origins, setOrigins] = useState<OriginDraft[]>([]);
  const [processingMethod, setProcessingMethod] = useState("");
  const [roastLevel, setRoastLevel] = useState("");
  const [originPickerKey, setOriginPickerKey] = useState<string | null>(null);
  const [originEditing, setOriginEditing] = useState(false);

  const toastyAnim = useRef(new Animated.Value(0)).current;
  const toastyTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerToasty = () => {
    if (toastyTimeout.current) clearTimeout(toastyTimeout.current);
    toastyAnim.setValue(0);
    Animated.spring(toastyAnim, { toValue: 1, useNativeDriver: true, friction: 5, tension: 120 }).start();
    toastyTimeout.current = setTimeout(() => {
      Animated.timing(toastyAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start();
    }, 1000);
  };

  useEffect(() => {
    (async () => {
      const [data, grindersData] = await Promise.all([
        getCoffeeById(id),
        getGrinders(),
      ]);
      setGrinders(grindersData);
      if (data) {
        setCoffee(data);
        setName(data.name);
        setHaseRating(data.haseRating ?? null);
        setDodoRating(data.dodoRating ?? null);
        if (data.grindSettings && data.grindSettings.length > 0) {
          setGrindSettings(data.grindSettings.map((s) => ({
            grinder: s.grinder,
            levelText: s.level > 0 ? String(s.level) : "0",
          })));
        } else if (data.grinderName) {
          setGrindSettings([{
            grinder: data.grinderName,
            levelText: data.grindLevel > 0 ? String(data.grindLevel) : "0",
          }]);
        } else if (grindersData[0]) {
          setGrindSettings([{ grinder: grindersData[0].name, levelText: "0" }]);
        }
        setAroma(data.aroma);
        setAromaDescription(data.aromaDescription);
        setNotes(data.notes);
        setPricePerKg(data.pricePerKg);
        setProcessingMethod(data.processingMethod ?? "");
        setRoastLevel(data.roastLevel ?? "");
        setOrigins((data.origins ?? []).map((o) => ({
          key: makeOriginKey(),
          country: COUNTRIES.includes(o.country as typeof COUNTRIES[number]) ? o.country : "Sonstiges",
          customCountry: COUNTRIES.includes(o.country as typeof COUNTRIES[number]) ? "" : o.country,
          region: o.region,
          percentageText: o.percentage != null ? String(o.percentage) : "",
        })));
      } else if (grindersData[0]) {
        setGrindSettings([{ grinder: grindersData[0].name, levelText: "0" }]);
      }
      setLoading(false);
    })();
  }, [id]);

  const markChanged = () => setHasChanges(true);

  const toggleGrinder = (grinder: string) => {
    setGrindSettings((prev) => {
      const exists = prev.find((s) => s.grinder === grinder);
      if (exists) return prev.filter((s) => s.grinder !== grinder);
      return [...prev, { grinder, levelText: "0" }];
    });
    markChanged();
  };

  const updateGrindLevel = (grinder: string, v: string) => {
    setGrindSettings((prev) => prev.map((s) => s.grinder === grinder ? { ...s, levelText: v } : s));
    markChanged();
  };

  const normalizeGrindLevel = (grinder: string) => {
    setGrindSettings((prev) => prev.map((s) => {
      if (s.grinder !== grinder) return s;
      const parsed = parseFloat(s.levelText.replace(",", "."));
      const val = isNaN(parsed) ? 0 : Math.round(Math.min(50, Math.max(0, parsed)) * 10) / 10;
      return { ...s, levelText: String(val) };
    }));
  };

  const parseGrindLevel = (text: string): number => {
    const val = parseFloat(text.replace(",", "."));
    if (isNaN(val)) return 0;
    return Math.round(Math.min(50, Math.max(0, val)) * 10) / 10;
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Hinweis", "Bitte gib einen Namen ein.");
      return;
    }
    setSaving(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await updateCoffee(id, {
      name: name.trim(),
      haseRating,
      dodoRating,
      grindSettings: grindSettings.map((s) => ({ grinder: s.grinder, level: parseGrindLevel(s.levelText) })),
      grinderName: grindSettings[0]?.grinder ?? "",
      grindLevel: grindSettings[0] ? parseGrindLevel(grindSettings[0].levelText) : 0,
      aroma,
      aromaDescription,
      notes,
      pricePerKg,
      processingMethod,
      roastLevel,
      origins: origins
        .map((o) => ({
          country: o.country === "Sonstiges" ? o.customCountry.trim() : o.country,
          region: o.region.trim(),
          percentage: o.percentageText ? (parseInt(o.percentageText, 10) || null) : null,
        }))
        .filter((o) => o.country),
    });
    setSaving(false);
    setHasChanges(false);
    router.back();
  };

  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (Platform.OS === "web") {
      if ((window as any).confirm("Soll der Kaffee wirklich gelöscht werden?")) {
        deleteCoffee(id).then(() => router.back());
      }
      return;
    }
    Alert.alert(
      "Kaffee löschen",
      "Soll der Kaffee wirklich gelöscht werden?",
      [
        { text: "Abbrechen", style: "cancel" },
        {
          text: "Löschen",
          style: "destructive",
          onPress: async () => {
            await deleteCoffee(id);
            router.back();
          },
        },
      ]
    );
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 0 : insets.bottom;

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator color={colors.tint} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <PolyBackground />
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <Pressable
          onPress={() => {
            if (hasChanges) {
              Alert.alert("Änderungen verwerfen?", "Du hast ungespeicherte Änderungen.", [
                { text: "Weiter bearbeiten", style: "cancel" },
                { text: "Verwerfen", style: "destructive", onPress: () => router.back() },
              ]);
            } else {
              router.back();
            }
          }}
          style={({ pressed }) => [styles.backButton, { opacity: pressed ? 0.6 : 1 }]}
        >
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text, fontFamily: "Inter_700Bold" }]} numberOfLines={1}>
          {name || "Kaffee"}
        </Text>
        <Pressable
          onPress={handleDelete}
          disabled={saving}
          style={({ pressed }) => [
            styles.deleteHeaderButton,
            { borderRadius: design === "lowpoly" ? 6 : 18, opacity: pressed ? 0.7 : saving ? 0.4 : 1 },
          ]}
        >
          <Ionicons name="close" size={20} color="#E05252" />
        </Pressable>
        <Pressable
          onPress={handleSave}
          disabled={saving}
          style={({ pressed }) => [
            styles.saveHeaderButton,
            {
              borderRadius: design === "lowpoly" ? 6 : 18,
              backgroundColor: colors.tint,
              opacity: pressed ? 0.85 : saving ? 0.6 : 1,
            },
          ]}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="checkmark" size={20} color="#fff" />
          )}
        </Pressable>
      </View>

      <KeyboardAwareScrollViewCompat
        contentContainerStyle={{ padding: 20, paddingBottom: bottomPad + 100, gap: 24 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bottomOffset={24}
      >
        <View style={[styles.section, cardExtras.shadow, { backgroundColor: colors.surfaceElevated, borderColor: colors.border, borderTopColor: cardExtras.topHighlight, borderRadius: cardExtras.cardRadius }]}>
          <SectionHeader title="KAFFEE" color={colors.textSecondary} />
          <TextInput
            style={[
              styles.nameInput,
              { color: colors.text, fontFamily: "Inter_600SemiBold", borderBottomColor: colors.border },
            ]}
            value={name}
            onChangeText={(v) => { setName(v); markChanged(); }}
            placeholder="Kaffeename"
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <View style={[styles.section, cardExtras.shadow, { backgroundColor: colors.surfaceElevated, borderColor: colors.border, borderTopColor: cardExtras.topHighlight, borderRadius: cardExtras.cardRadius }]}>
          <SectionHeader title="BEWERTUNGEN" color={colors.textSecondary} />
          <View style={{ gap: 20, marginTop: 8 }}>
            <RatingSlider
              label={`${name1} Rating`}
              value={haseRating}
              min={0}
              max={10}
              onChange={(v) => { setHaseRating(v); markChanged(); }}
              minLabel="schlecht"
              maxLabel="grossartig"
              color={colors.tint}
              textColor={colors.text}
              borderColor={colors.border}
              surfaceColor={colors.surface}
            />
            {user2active && (
              <>
                <View style={{ height: 1, backgroundColor: colors.border }} />
                <RatingSlider
                  label={`${name2} Rating`}
                  value={dodoRating}
                  min={0}
                  max={10}
                  onChange={(v) => { setDodoRating(v); markChanged(); }}
                  minLabel="schlecht"
                  maxLabel="grossartig"
                  color={colors.tint}
                  textColor={colors.text}
                  borderColor={colors.border}
                  surfaceColor={colors.surface}
                />
              </>
            )}
          </View>
        </View>

        <View style={[styles.section, cardExtras.shadow, { backgroundColor: colors.surfaceElevated, borderColor: colors.border, borderTopColor: cardExtras.topHighlight, borderRadius: cardExtras.cardRadius }]}>
          <SectionHeader title="EIGENSCHAFTEN" color={colors.textSecondary} />
          <View style={{ gap: 20, marginTop: 8 }}>
            <GrinderPicker
              grinders={grinders}
              grindSettings={grindSettings}
              onToggle={toggleGrinder}
              onLevelChange={updateGrindLevel}
              onBlurLevel={normalizeGrindLevel}
              color={colors.tint}
              textColor={colors.text}
              borderColor={colors.border}
              surfaceColor={colors.surface}
            />
            <View style={{ height: 1, backgroundColor: colors.border }} />
            <ScaleSlider
              label="Aroma"
              value={aroma}
              onChange={(v) => { setAroma(v); markChanged(); if (v === 1) triggerToasty(); }}
              color={colors.tint}
              textColor={colors.text}
              borderColor={colors.border}
              surfaceColor={colors.surface}
              aromaIcons
            />
          </View>
        </View>

        {/* ── HERKUNFT ──────────────────────────────────────────────────── */}
        {(() => {
          const originNameOf = (o: OriginDraft) =>
            (o.country === "Sonstiges" ? o.customCountry.trim() : o.country).trim();
          const filledOrigins = origins.filter((o) => originNameOf(o));
          const hasOrigin = filledOrigins.length > 0;
          const showEditor = originEditing || !hasOrigin;
          return (
        <View style={[styles.section, cardExtras.shadow, { backgroundColor: colors.surfaceElevated, borderColor: colors.border, borderTopColor: cardExtras.topHighlight, borderRadius: cardExtras.cardRadius }]}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <SectionHeader title="HERKUNFT" color={colors.textSecondary} />
            {hasOrigin && (
              <Pressable
                onPress={() => { Haptics.selectionAsync(); setOriginEditing((e) => !e); }}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel={showEditor ? "Herkunft kompakt anzeigen" : "Herkunft bearbeiten"}
                style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, padding: 4 })}
              >
                <Ionicons name={showEditor ? "checkmark" : "pencil"} size={18} color={colors.tint} />
              </Pressable>
            )}
          </View>
          {showEditor ? (
            <View style={{ marginTop: 8 }}>
              <OriginEditor
                origins={origins}
                onAdd={() => {
                  setOrigins((prev) => [...prev, { key: makeOriginKey(), country: "", customCountry: "", region: "", percentageText: "" }]);
                  setOriginEditing(true);
                  markChanged();
                }}
                onUpdate={(key, field, value) => {
                  setOrigins((prev) => prev.map((o) => o.key === key ? { ...o, [field]: value } : o));
                  setOriginEditing(true);
                  markChanged();
                }}
                onRemove={(key) => {
                  setOrigins((prev) => prev.filter((o) => o.key !== key));
                  markChanged();
                }}
                openPickerKey={originPickerKey}
                onOpenPicker={(key) => setOriginPickerKey(key)}
                onClosePicker={() => setOriginPickerKey(null)}
                colors={colors}
                design={design}
              />
            </View>
          ) : (
            <Text style={{ color: colors.text, fontFamily: "Inter_500Medium", fontSize: 15, lineHeight: 24, marginTop: 8 }}>
              {filledOrigins
                .map((o) => {
                  const pct = o.percentageText || (filledOrigins.length === 1 ? "100" : "");
                  return originNameOf(o) + (pct ? ` ${pct}%` : "");
                })
                .join("   |   ")}
            </Text>
          )}
        </View>
          );
        })()}

        {/* ── AUFBEREITUNG ──────────────────────────────────────────────── */}
        <View style={[styles.section, cardExtras.shadow, { backgroundColor: colors.surfaceElevated, borderColor: colors.border, borderTopColor: cardExtras.topHighlight, borderRadius: cardExtras.cardRadius }]}>
          <SectionHeader title="AUFBEREITUNG" color={colors.textSecondary} />
          <View style={{ marginTop: 8 }}>
            <ProcessingPicker
              value={processingMethod}
              onChange={(v) => { setProcessingMethod(v); markChanged(); }}
              color={colors.tint}
              textColor={colors.text}
              borderColor={colors.border}
              surfaceColor={colors.surface}
            />
          </View>
        </View>

        {/* ── RÖSTGRAD ──────────────────────────────────────────────────── */}
        <View style={[styles.section, cardExtras.shadow, { backgroundColor: colors.surfaceElevated, borderColor: colors.border, borderTopColor: cardExtras.topHighlight, borderRadius: cardExtras.cardRadius }]}>
          <SectionHeader title="RÖSTGRAD" color={colors.textSecondary} />
          <View style={{ marginTop: 8 }}>
            <RoastLevelPicker
              value={roastLevel}
              onChange={(v) => { setRoastLevel(v); markChanged(); }}
              color={colors.tint}
              textColor={colors.text}
              borderColor={colors.border}
              surfaceColor={colors.surface}
            />
          </View>
        </View>

        <View style={[styles.section, cardExtras.shadow, { backgroundColor: colors.surfaceElevated, borderColor: colors.border, borderTopColor: cardExtras.topHighlight, borderRadius: cardExtras.cardRadius }]}>
          <SectionHeader title="NOTIZEN" color={colors.textSecondary} />
          <View style={{ gap: 16, marginTop: 8 }}>
            <View style={{ gap: 6 }}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary, fontFamily: "Inter_500Medium" }]}>
                Aroma Beschreibung
              </Text>
              <TextInput
                style={[
                  styles.textArea,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    color: colors.text,
                    fontFamily: "Inter_400Regular",
                    borderRadius: cardExtras.cardRadius,
                  },
                ]}
                placeholder="z.B. Karamell, dunkle Schokolade, Nüsse..."
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={3}
                value={aromaDescription}
                onChangeText={(v) => { setAromaDescription(v); markChanged(); }}
              />
            </View>
            <View style={{ gap: 6 }}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary, fontFamily: "Inter_500Medium" }]}>
                Sonstiges
              </Text>
              <TextInput
                style={[
                  styles.textArea,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    color: colors.text,
                    fontFamily: "Inter_400Regular",
                    borderRadius: cardExtras.cardRadius,
                  },
                ]}
                placeholder="Weitere Notizen, Zubereitungshinweise..."
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={3}
                value={notes}
                onChangeText={(v) => { setNotes(v); markChanged(); }}
              />
            </View>
          </View>
        </View>

        <View style={[styles.section, cardExtras.shadow, { backgroundColor: colors.surfaceElevated, borderColor: colors.border, borderTopColor: cardExtras.topHighlight, borderRadius: cardExtras.cardRadius }]}>
          <SectionHeader title="PREIS" color={colors.textSecondary} />
          <View style={{ gap: 6, marginTop: 8 }}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary, fontFamily: "Inter_500Medium" }]}>
              Preis je Kilogramm
            </Text>
            <View style={[styles.priceInputRow, { borderColor: colors.border, backgroundColor: colors.surface, borderRadius: cardExtras.cardRadius }]}>
              <TextInput
                style={[styles.priceInput, { color: colors.text, fontFamily: "Inter_400Regular" }]}
                placeholder="z.B. 24,90"
                placeholderTextColor={colors.textSecondary}
                keyboardType="decimal-pad"
                value={pricePerKg}
                onChangeText={(v) => { setPricePerKg(v); markChanged(); }}
              />
              <Text style={[styles.priceSuffix, { color: colors.textSecondary, fontFamily: "Inter_600SemiBold" }]}>
                €/kg
              </Text>
            </View>
          </View>
        </View>

        <PolyActionButton
          onPress={handleSave}
          disabled={saving}
          color={colors.tint}
          style={styles.saveButton}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={[styles.saveButtonText, { fontFamily: "Inter_600SemiBold" }]}>
                Speichern
              </Text>
            </>
          )}
        </PolyActionButton>
      </KeyboardAwareScrollViewCompat>

      {/* Easter egg: Toasty! popup on sehr kräftig aroma */}
      <Animated.View
        pointerEvents="none"
        style={{
          position: "absolute",
          bottom: bottomPad + 16,
          right: 12,
          width: 140,
          height: 140,
          opacity: toastyAnim,
          transform: [
            { scale: toastyAnim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) },
            { translateY: toastyAnim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) },
          ],
        }}
      >
        <Image
          source={require("../../assets/images/toasty.png")}
          style={{ width: 140, height: 140 }}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  backButton: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    lineHeight: 26,
  },
  deleteHeaderButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#E05252",
  },
  saveHeaderButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  section: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  nameInput: {
    fontSize: 22,
    paddingVertical: 8,
    borderBottomWidth: 1,
    marginTop: 4,
  },
  fieldLabel: {
    fontSize: 12,
    letterSpacing: 0.3,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    minHeight: 80,
    textAlignVertical: "top",
  },
  grindInputRow: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 50,
    justifyContent: "center",
  },
  grindInput: {
    fontSize: 22,
  },
  priceInputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 50,
  },
  priceInput: {
    flex: 1,
    fontSize: 16,
  },
  priceSuffix: {
    fontSize: 15,
    marginLeft: 8,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 18,
    borderRadius: 16,
    marginTop: 4,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 17,
  },
});
