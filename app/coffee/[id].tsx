import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Alert,
  Platform,
  ActivityIndicator,
} from "react-native";
import Svg, { Path, Circle, Line, Rect, G } from "react-native-svg";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { getCoffeeById, updateCoffee, deleteCoffee, getGrinders, Coffee, GrindSetting } from "@/lib/storage";
import { useUserNames } from "@/context/UserNamesContext";
import { useThemeColors, useCardExtras } from "@/context/ThemeContext";

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
      <View style={{ flexDirection: "row", gap: 6 }}>
        {steps.map((step) => {
          const filled = value !== null && step <= value;
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

function AromaIcon({ step, size = 26, color }: { step: number; size?: number; color: string }) {
  const p = { stroke: color, strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, fill: "none" };
  const pt = { ...p, strokeWidth: 1.6 };
  switch (step) {
    case 1:
      return (
        <Svg width={size} height={size} viewBox="0 0 28 28">
          {/* Chocolate bar: 3 cols × 2 rows */}
          <Rect x="2" y="5" width="18" height="13" rx="2" ry="2" {...p} />
          <Line x1="2"  y1="11.5" x2="20" y2="11.5" {...pt} />
          <Line x1="8"  y1="5"    x2="8"  y2="18"   {...pt} />
          <Line x1="14" y1="5"    x2="14" y2="18"   {...pt} />
          {/* Hazelnut: round nut, overlapping bottom-right of bar */}
          <Circle cx="22" cy="21" r="5" {...p} />
          {/* Hazelnut top cap (flat shell rim) */}
          <Path d="M18.5,18 C18.5,16.5 25.5,16.5 25.5,18" {...pt} />
        </Svg>
      );
    case 2:
      return (
        <Svg width={size} height={size} viewBox="0 0 28 28">
          {/* Aroma waves — rise from the top of the beans */}
          <Path d="M10,8 Q8,5.5 10,3" {...p} />
          <Path d="M14,7 Q12,4.5 14,2" {...p} />
          <Path d="M18,8 Q20,5.5 18,3" {...p} />
          {/* Left bean — tilted left ~25° */}
          <G transform="rotate(-25, 9, 18)">
            <Path d="M9,11 C13,11 13,25 9,25 C5,25 5,11 9,11 Z" {...p} />
            <Path d="M9,13 C11,16 7,20 9,23" {...p} />
          </G>
          {/* Right bean — tilted right ~25° */}
          <G transform="rotate(25, 19, 18)">
            <Path d="M19,11 C23,11 23,25 19,25 C15,25 15,11 19,11 Z" {...p} />
            <Path d="M19,13 C21,16 17,20 19,23" {...p} />
          </G>
          {/* Center bean — upright, in front */}
          <Path d="M14,10 C18,10 18,24 14,24 C10,24 10,10 14,10 Z" {...p} />
          <Path d="M14,12 C16,15 12,19 14,22" {...p} />
        </Svg>
      );
    case 3:
      return (
        <Svg width={size} height={size} viewBox="0 0 28 28">
          {/* Coffee bean (left) */}
          <Path d="M9,5 C13,5 14,9 14,14 C14,19 13,23 9,23 C5,23 4,19 4,14 C4,9 5,5 9,5 Z" {...p} />
          <Path d="M9,8 C11,11 7,14 9,17 C10,19 9,21 9,22" {...p} />
          {/* Leaf (right) */}
          <Path d="M19,6 C25,8 25,20 19,22 C14,20 14,8 19,6 Z" {...p} />
          <Path d="M19,6 L19,22" {...p} />
        </Svg>
      );
    case 4:
      return (
        <Svg width={size} height={size} viewBox="0 0 28 28">
          {/* Stem */}
          <Path d="M14,7 L14,3.5" {...p} />
          {/* Leaves */}
          <Path d="M12.5,6 C10,4 11,2 14,3.5" {...pt} />
          <Path d="M14,3.5 C17,2 18,4 15.5,6" {...pt} />
          {/* Blackberry drupelets: 3-5-5-3-2 arrangement */}
          <Circle cx="11"   cy="9"  r="2"  {...p} />
          <Circle cx="14"   cy="9"  r="2"  {...p} />
          <Circle cx="17"   cy="9"  r="2"  {...p} />
          <Circle cx="8.5"  cy="13" r="2"  {...p} />
          <Circle cx="11.5" cy="13" r="2"  {...p} />
          <Circle cx="14.5" cy="13" r="2"  {...p} />
          <Circle cx="17.5" cy="13" r="2"  {...p} />
          <Circle cx="20.5" cy="13" r="2"  {...p} />
          <Circle cx="8.5"  cy="17" r="2"  {...p} />
          <Circle cx="11.5" cy="17" r="2"  {...p} />
          <Circle cx="14.5" cy="17" r="2"  {...p} />
          <Circle cx="17.5" cy="17" r="2"  {...p} />
          <Circle cx="20.5" cy="17" r="2"  {...p} />
          <Circle cx="10"   cy="21" r="2"  {...p} />
          <Circle cx="13.5" cy="21" r="2"  {...p} />
          <Circle cx="17"   cy="21" r="2"  {...p} />
          <Circle cx="20"   cy="21" r="2"  {...p} />
          <Circle cx="11.5" cy="25" r="2"  {...p} />
          <Circle cx="15.5" cy="25" r="2"  {...p} />
        </Svg>
      );
    case 5:
      return (
        <Svg width={size} height={size} viewBox="0 0 28 28">
          {/* Outer circle — thick peel */}
          <Circle cx="14" cy="14" r="11.5" stroke={color} strokeWidth={2.5} fill="none" />
          {/* Peel inner boundary */}
          <Circle cx="14" cy="14" r="8.5" {...pt} />
          {/* 10 segment lines from center to inner circle (every 36°) */}
          <Path
            d="M14,14 L14,5.5
               M14,14 L19,7.1
               M14,14 L22.1,11.4
               M14,14 L22.1,16.6
               M14,14 L19,20.9
               M14,14 L14,22.5
               M14,14 L9,20.9
               M14,14 L5.9,16.6
               M14,14 L5.9,11.4
               M14,14 L9,7.1"
            strokeWidth={1.5} stroke={color} strokeLinecap="round" fill="none"
          />
          {/* Center pip */}
          <Circle cx="14" cy="14" r="1.5" stroke={color} strokeWidth={1.5} fill="none" />
        </Svg>
      );
    default:
      return null;
  }
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
        {steps.map((step) => (
          <Pressable
            key={step}
            onPress={() => {
              Haptics.selectionAsync();
              onChange(step);
            }}
            style={({ pressed }) => ({
              flex: 1,
              height: 56,
              borderRadius: 12,
              backgroundColor: step === value ? color : surfaceColor,
              borderWidth: 1.5,
              borderColor: step === value ? color : borderColor,
              justifyContent: "center",
              alignItems: "center",
              opacity: pressed ? 0.8 : 1,
              transform: [{ scale: pressed ? 0.95 : 1 }],
            })}
          >
            {aromaIcons ? (
              <AromaIcon step={step} size={26} color={step === value ? "#fff" : textColor} />
            ) : (
              <Text
                style={{
                  color: step === value ? "#fff" : textColor,
                  fontFamily: step === value ? "Inter_700Bold" : "Inter_500Medium",
                  fontSize: 16,
                }}
              >
                {step}
              </Text>
            )}
          </Pressable>
        ))}
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
  grinders: string[];
  grindSettings: GrindSettingDraft[];
  onToggle: (grinder: string) => void;
  onLevelChange: (grinder: string, v: string) => void;
  onBlurLevel: (grinder: string) => void;
  color: string;
  textColor: string;
  borderColor: string;
  surfaceColor: string;
}) {
  return (
    <View style={{ gap: 10 }}>
      <Text style={{ color: textColor, fontFamily: "Inter_600SemiBold", fontSize: 15 }}>
        Kaffeemühle
      </Text>
      <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
        {grinders.map((g) => {
          const active = grindSettings.some((s) => s.grinder === g);
          return (
            <Pressable
              key={g}
              onPress={() => {
                Haptics.selectionAsync();
                onToggle(g);
              }}
              style={({ pressed }) => ({
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 12,
                backgroundColor: active ? color : surfaceColor,
                borderWidth: 1.5,
                borderColor: active ? color : borderColor,
                opacity: pressed ? 0.8 : 1,
                transform: [{ scale: pressed ? 0.97 : 1 }],
              })}
            >
              <Text
                style={{
                  color: active ? "#fff" : textColor,
                  fontFamily: active ? "Inter_700Bold" : "Inter_500Medium",
                  fontSize: 15,
                }}
              >
                {g}
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
                    borderRadius: 10,
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

  const { name1, name2, user2active } = useUserNames();
  const [coffee, setCoffee] = useState<Coffee | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const [grinders, setGrinders] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [haseRating, setHaseRating] = useState<number | null>(null);
  const [dodoRating, setDodoRating] = useState<number | null>(null);
  const [grindSettings, setGrindSettings] = useState<GrindSettingDraft[]>([]);
  const [aroma, setAroma] = useState(3);
  const [aromaDescription, setAromaDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [pricePerKg, setPricePerKg] = useState("");

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
          setGrindSettings([{ grinder: grindersData[0], levelText: "0" }]);
        }
        setAroma(data.aroma);
        setAromaDescription(data.aromaDescription);
        setNotes(data.notes);
        setPricePerKg(data.pricePerKg);
      } else if (grindersData[0]) {
        setGrindSettings([{ grinder: grindersData[0], levelText: "0" }]);
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
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator color={colors.tint} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
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
            { opacity: pressed ? 0.7 : saving ? 0.4 : 1 },
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
        <View style={[styles.section, cardExtras.shadow, { backgroundColor: colors.surfaceElevated, borderColor: colors.border, borderTopColor: cardExtras.topHighlight }]}>
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

        <View style={[styles.section, cardExtras.shadow, { backgroundColor: colors.surfaceElevated, borderColor: colors.border, borderTopColor: cardExtras.topHighlight }]}>
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

        <View style={[styles.section, cardExtras.shadow, { backgroundColor: colors.surfaceElevated, borderColor: colors.border, borderTopColor: cardExtras.topHighlight }]}>
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
              onChange={(v) => { setAroma(v); markChanged(); }}
              color={colors.tint}
              textColor={colors.text}
              borderColor={colors.border}
              surfaceColor={colors.surface}
              aromaIcons
            />
          </View>
        </View>

        <View style={[styles.section, cardExtras.shadow, { backgroundColor: colors.surfaceElevated, borderColor: colors.border, borderTopColor: cardExtras.topHighlight }]}>
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

        <View style={[styles.section, cardExtras.shadow, { backgroundColor: colors.surfaceElevated, borderColor: colors.border, borderTopColor: cardExtras.topHighlight }]}>
          <SectionHeader title="PREIS" color={colors.textSecondary} />
          <View style={{ gap: 6, marginTop: 8 }}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary, fontFamily: "Inter_500Medium" }]}>
              Preis je Kilogramm
            </Text>
            <View style={[styles.priceInputRow, { borderColor: colors.border, backgroundColor: colors.surface }]}>
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

        <Pressable
          onPress={handleSave}
          disabled={saving}
          style={({ pressed }) => [
            styles.saveButton,
            {
              backgroundColor: colors.tint,
              opacity: pressed ? 0.85 : saving ? 0.6 : 1,
            },
          ]}
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
        </Pressable>
      </KeyboardAwareScrollViewCompat>
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
