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
          {/* Tilted chocolate bar (~-22°) with 3×3 grid + wrapper */}
          <G transform="rotate(-22, 14, 14)">
            {/* Outer bar */}
            <Rect x="4" y="2" width="20" height="24" rx="2.5" ry="2.5" {...p} />
            {/* Separator: grid top / wrapper bottom */}
            <Line x1="4" y1="14" x2="24" y2="14" {...p} />
            {/* 3×3 grid in upper half */}
            <Line x1="4"  y1="6.7"  x2="24" y2="6.7"  {...pt} />
            <Line x1="4"  y1="10.3" x2="24" y2="10.3" {...pt} />
            <Line x1="10.7" y1="2" x2="10.7" y2="14"  {...pt} />
            <Line x1="17.3" y1="2" x2="17.3" y2="14"  {...pt} />
            {/* Wrapper diagonal fold crease */}
            <Path d="M4,14 L19,26" {...pt} />
          </G>
        </Svg>
      );
    case 2:
      return (
        <Svg width={size} height={size} viewBox="0 0 28 28">
          {/* Stem — small curved hook */}
          <Path d="M14,4 C14,2 16,1 16,4" {...p} />
          {/* Cap — dome arc */}
          <Path d="M6,13 C6,5 22,5 22,13" {...p} />
          {/* Divider — slightly wider for ledge effect */}
          <Line x1="4" y1="13" x2="24" y2="13" {...p} />
          {/* Body — tapers to a point at bottom (hazelnut shape) */}
          <Path d="M6,13 Q5,22 14,27 Q23,22 22,13" {...p} />
        </Svg>
      );
    case 3:
      return (
        <Svg width={size} height={size} viewBox="0 0 28 28">
          {/* Simple centered coffee bean */}
          <Path d="M14,4 C19,4 20,9 20,14 C20,19 19,24 14,24 C9,24 8,19 8,14 C8,9 9,4 14,4 Z" {...p} />
          {/* Bean crease — S-curve */}
          <Path d="M14,7 C16,10 12,14 14,18 C15,21 14,23 14,23" {...p} />
        </Svg>
      );
    case 4:
      return (
        <Svg width={size} height={size} viewBox="0 0 28 28">
          {/* Stem */}
          <Path d="M14,6 L14,3" {...p} />
          {/* Small leaf */}
          <Path d="M10,4.5 C10,1.5 14,1 14,3" {...pt} />
          {/* Grape cluster: 2-3-3 arrangement, r=3.5 */}
          <Circle cx="11" cy="10" r="3.5" {...p} />
          <Circle cx="17" cy="10" r="3.5" {...p} />
          <Circle cx="8"  cy="17" r="3.5" {...p} />
          <Circle cx="14" cy="17" r="3.5" {...p} />
          <Circle cx="20" cy="17" r="3.5" {...p} />
          <Circle cx="11" cy="24" r="3.5" {...p} />
          <Circle cx="17" cy="24" r="3.5" {...p} />
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
