import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  useColorScheme,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { getCoffeeById, updateCoffee, Coffee } from "@/lib/storage";
import Colors from "@/constants/colors";

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
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
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
          <Text style={{ color: color, fontFamily: "Inter_700Bold", fontSize: 26 }}>{value}</Text>
          <Text style={{ color: textColor, fontFamily: "Inter_400Regular", fontSize: 13, opacity: 0.6 }}>
            /{max}
          </Text>
        </View>
      </View>
      <View style={{ flexDirection: "row", gap: 6 }}>
        {steps.map((step) => (
          <Pressable
            key={step}
            onPress={() => {
              Haptics.selectionAsync();
              onChange(step);
            }}
            style={({ pressed }) => ({
              flex: 1,
              height: 36,
              borderRadius: 8,
              backgroundColor: step <= value ? color : surfaceColor,
              borderWidth: 1,
              borderColor: step <= value ? color : borderColor,
              justifyContent: "center",
              alignItems: "center",
              opacity: pressed ? 0.8 : 1,
              transform: [{ scale: pressed ? 0.95 : 1 }],
            })}
          >
            <Text
              style={{
                color: step <= value ? "#fff" : textColor,
                fontFamily: "Inter_600SemiBold",
                fontSize: max > 5 ? 11 : 13,
              }}
            >
              {step}
            </Text>
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
}) {
  const steps = [1, 2, 3, 4, 5];
  const labels = ["1", "2", "3", "4", "5"];

  return (
    <View style={{ gap: 10 }}>
      <Text style={{ color: textColor, fontFamily: "Inter_600SemiBold", fontSize: 15 }}>
        {label}
        {sublabel ? (
          <Text style={{ color: textColor, fontFamily: "Inter_400Regular", fontSize: 13, opacity: 0.55 }}>
            {" " + sublabel}
          </Text>
        ) : null}
      </Text>
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
              height: 52,
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
            <Text
              style={{
                color: step === value ? "#fff" : textColor,
                fontFamily: step === value ? "Inter_700Bold" : "Inter_500Medium",
                fontSize: 16,
              }}
            >
              {labels[step - 1]}
            </Text>
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

export default function CoffeeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = isDark ? Colors.dark : Colors.light;

  const [coffee, setCoffee] = useState<Coffee | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const [name, setName] = useState("");
  const [haseRating, setHaseRating] = useState(5);
  const [dodoRating, setDodoRating] = useState(5);
  const [grindLevel, setGrindLevel] = useState(3);
  const [aroma, setAroma] = useState(3);
  const [aromaDescription, setAromaDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [pricePerKg, setPricePerKg] = useState("");

  useEffect(() => {
    (async () => {
      const data = await getCoffeeById(id);
      if (data) {
        setCoffee(data);
        setName(data.name);
        setHaseRating(data.haseRating);
        setDodoRating(data.dodoRating);
        setGrindLevel(data.grindLevel);
        setAroma(data.aroma);
        setAromaDescription(data.aromaDescription);
        setNotes(data.notes);
        setPricePerKg(data.pricePerKg);
      }
      setLoading(false);
    })();
  }, [id]);

  const markChanged = () => setHasChanges(true);

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
      grindLevel,
      aroma,
      aromaDescription,
      notes,
      pricePerKg,
    });
    setSaving(false);
    setHasChanges(false);
    router.back();
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

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: bottomPad + 100, gap: 24 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.section, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
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

        <View style={[styles.section, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
          <SectionHeader title="BEWERTUNGEN" color={colors.textSecondary} />
          <View style={{ gap: 20, marginTop: 8 }}>
            <RatingSlider
              label="Hase Rating"
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
            <View style={{ height: 1, backgroundColor: colors.border }} />
            <RatingSlider
              label="Dodo Rating"
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
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
          <SectionHeader title="EIGENSCHAFTEN" color={colors.textSecondary} />
          <View style={{ gap: 20, marginTop: 8 }}>
            <ScaleSlider
              label="Mahlgrad"
              sublabel="(fein – grob)"
              value={grindLevel}
              onChange={(v) => { setGrindLevel(v); markChanged(); }}
              minLabel="fein"
              maxLabel="grob"
              color={colors.tint}
              textColor={colors.text}
              borderColor={colors.border}
              surfaceColor={colors.surface}
            />
            <View style={{ height: 1, backgroundColor: colors.border }} />
            <ScaleSlider
              label="Aroma"
              sublabel="(kräftig – fruchtig)"
              value={aroma}
              onChange={(v) => { setAroma(v); markChanged(); }}
              minLabel="kräftig"
              maxLabel="fruchtig"
              color={colors.tint}
              textColor={colors.text}
              borderColor={colors.border}
              surfaceColor={colors.surface}
            />
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
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

        <View style={[styles.section, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
          <SectionHeader title="PREIS" color={colors.textSecondary} />
          <View style={{ gap: 6, marginTop: 8 }}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary, fontFamily: "Inter_500Medium" }]}>
              Preis je Kilogramm
            </Text>
            <View style={[styles.priceInputRow, { borderColor: colors.border, backgroundColor: colors.surface }]}>
              <TextInput
                style={[
                  styles.priceInput,
                  { color: colors.text, fontFamily: "Inter_400Regular" },
                ]}
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
      </ScrollView>
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
