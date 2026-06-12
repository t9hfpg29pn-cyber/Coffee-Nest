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
import { OriginPinIcon } from "@/components/CoffeeIcons";
import {
  PaperTile,
  aromaTileSource,
  roastTileSource,
  processTileSource,
  grinderTileSource,
} from "@/components/PaperTiles";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { getCoffeeById, updateCoffee, deleteCoffee, getGrinders, Coffee, Grinder } from "@/lib/storage";
import { useUserNames } from "@/context/UserNamesContext";
import { PaperCard, COLORS, FONTS, ui } from "@/theme/paper-native";

// ─── Frameless tile picker — selection shown by scale + opacity + gold underline ──
function TileOption({
  source,
  label,
  active,
  onPress,
  width,
  tileSize = 52,
  fontSize = 12,
}: {
  source: any;
  label: string;
  active: boolean;
  onPress: () => void;
  width: number | string;
  tileSize?: number;
  fontSize?: number;
}) {
  return (
    <Pressable
      onPress={() => { Haptics.selectionAsync(); onPress(); }}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={({ pressed }) => ({ alignItems: "center", width: width as any, opacity: pressed ? 0.8 : 1 })}
    >
      <PaperTile
        source={source}
        size={tileSize}
        style={{ transform: [{ scale: active ? 1.0 : 0.84 }], opacity: active ? 1 : 0.4 }}
      />
      <View
        style={{
          height: 3,
          width: active ? 18 : 0,
          borderRadius: 2,
          backgroundColor: COLORS.accent300,
          marginTop: 6,
        }}
      />
      {label ? (
        <Text
          numberOfLines={2}
          style={{
            marginTop: 3,
            fontSize,
            textAlign: "center",
            fontFamily: active ? "Inter_600SemiBold" : "Inter_500Medium",
            color: active ? COLORS.accent400 : COLORS.coffee600,
          }}
        >
          {label}
        </Text>
      ) : null}
    </Pressable>
  );
}

function RatingSlider({
  label,
  value,
  min,
  max,
  onChange,
  minLabel,
  maxLabel,
}: {
  label: string;
  value: number | null;
  min: number;
  max: number;
  onChange: (v: number | null) => void;
  minLabel?: string;
  maxLabel?: string;
}) {
  const steps = Array.from({ length: max - min + 1 }, (_, i) => min + i);

  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={{ color: COLORS.coffee800, fontFamily: "Inter_600SemiBold", fontSize: 15 }}>{label}</Text>
        <View style={{ flexDirection: "row", alignItems: "baseline", gap: 2 }}>
          {value !== null ? (
            <>
              <Text style={{ color: COLORS.accent400, fontFamily: "Inter_700Bold", fontSize: 26 }}>{value}</Text>
              <Text style={{ color: COLORS.coffee600, fontFamily: "Inter_400Regular", fontSize: 13 }}>/{max}</Text>
            </>
          ) : (
            <Text style={{ color: COLORS.coffee600, fontFamily: "Inter_400Regular", fontSize: 20, opacity: 0.5 }}>–</Text>
          )}
        </View>
      </View>
      <View style={{ flexDirection: "row", gap: 5 }}>
        {steps.map((step) => {
          const filled = value !== null && step <= value;
          return (
            <Pressable
              key={step}
              onPress={() => { Haptics.selectionAsync(); onChange(step === value ? null : step); }}
              style={({ pressed }) => [
                ui.rate,
                filled && ui.rateActive,
                { flex: 1, minWidth: 0, opacity: pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.95 : 1 }] },
              ]}
            >
              <Text style={[ui.rateText, filled && ui.rateTextActive, { fontSize: max > 5 ? 12 : 14 }]}>{step}</Text>
            </Pressable>
          );
        })}
      </View>
      {(minLabel || maxLabel) && (
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={{ color: COLORS.coffee600, fontFamily: "Inter_400Regular", fontSize: 11 }}>{minLabel}</Text>
          <Text style={{ color: COLORS.coffee600, fontFamily: "Inter_400Regular", fontSize: 11 }}>{maxLabel}</Text>
        </View>
      )}
    </View>
  );
}

const AROMA_LABELS = ["sehr kräftig", "kräftig", "ausgewogen", "fruchtig", "sehr fruchtig"];

function AromaPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const steps = [1, 2, 3, 4, 5];
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
      {steps.map((step) => (
        <TileOption
          key={step}
          source={aromaTileSource(step)}
          label={AROMA_LABELS[step - 1]}
          active={step === value}
          onPress={() => onChange(step)}
          width="18%"
          tileSize={52}
          fontSize={11}
        />
      ))}
    </View>
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

// Displayed dark → light so it visually aligns with the Aroma scale above.
// Stored values are unchanged; only the on-screen order is reversed.
const ROAST_LEVELS = [
  { value: "dark",         label: "Dunkel"       },
  { value: "medium-dark",  label: "Mittel-\nDunkel" },
  { value: "medium",       label: "Mittel"       },
  { value: "medium-light", label: "Mittel-\nHell"   },
  { value: "light",        label: "Hell"         },
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
  visible, onSelect, onClose,
}: {
  visible: boolean;
  onSelect: (c: string) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" }}>
        <View style={{
          backgroundColor: COLORS.paperLight,
          borderTopLeftRadius: 22,
          borderTopRightRadius: 22,
          maxHeight: "70%",
        }}>
          <View style={{
            flexDirection: "row", justifyContent: "space-between", alignItems: "center",
            padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.divider,
          }}>
            <Text style={{ color: COLORS.coffee800, fontFamily: "Inter_600SemiBold", fontSize: 16 }}>
              Land auswählen
            </Text>
            <Pressable onPress={onClose} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
              <Ionicons name="close" size={22} color={COLORS.coffee600} />
            </Pressable>
          </View>
          <ScrollView bounces={false}>
            {COUNTRIES.map((c) => (
              <Pressable
                key={c}
                onPress={() => { Haptics.selectionAsync(); onSelect(c); onClose(); }}
                style={({ pressed }) => ({
                  paddingHorizontal: 20, paddingVertical: 14,
                  borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: COLORS.divider,
                  backgroundColor: pressed ? COLORS.paperDim : "transparent",
                })}
              >
                <Text style={{ color: COLORS.coffee800, fontFamily: "Inter_500Medium", fontSize: 16 }}>{c}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function OriginEditor({
  origins, onAdd, onUpdate, onRemove, openPickerKey, onOpenPicker, onClosePicker,
}: {
  origins: OriginDraft[];
  onAdd: () => void;
  onUpdate: (key: string, field: keyof OriginDraft, value: string) => void;
  onRemove: (key: string) => void;
  openPickerKey: string | null;
  onOpenPicker: (key: string) => void;
  onClosePicker: () => void;
}) {
  const br = 10;

  const multiple = origins.length > 1;
  const [expandedRegions, setExpandedRegions] = useState<Set<string>>(new Set());

  const fieldBorder = "rgba(74,38,22,0.28)";

  return (
    <View style={{ gap: 12 }}>
      {origins.map((o) => {
        const headerName = o.country === "Sonstiges" && o.customCountry
          ? o.customCountry
          : o.country;
        return (
        <View key={o.key} style={{ gap: 10 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
              <OriginPinIcon size={20} color={COLORS.accent400} />
              <Text
                numberOfLines={1}
                style={{ color: headerName ? COLORS.coffee800 : COLORS.coffee600, fontFamily: "Inter_600SemiBold", fontSize: 15, flex: 1 }}
              >
                {headerName || "Herkunft wählen"}
              </Text>
            </View>
            <Pressable onPress={() => { Haptics.selectionAsync(); onRemove(o.key); }}
              style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, paddingLeft: 8 })}>
              <Ionicons name="close-circle" size={20} color={COLORS.coffee600} />
            </Pressable>
          </View>

          <Pressable
            onPress={() => { Haptics.selectionAsync(); onOpenPicker(o.key); }}
            style={({ pressed }) => ({
              flexDirection: "row", alignItems: "center", justifyContent: "space-between",
              backgroundColor: COLORS.paperLight,
              borderWidth: 1, borderColor: fieldBorder, borderRadius: br,
              paddingHorizontal: 14, paddingVertical: 12,
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <Text style={{ color: o.country ? COLORS.coffee800 : COLORS.coffee600, fontFamily: "Inter_500Medium", fontSize: 15 }}>
              {o.country || "Land auswählen"}
            </Text>
            <Ionicons name="chevron-down" size={16} color={COLORS.coffee600} />
          </Pressable>

          <CountryPickerModal
            visible={openPickerKey === o.key}
            onSelect={(c) => { onUpdate(o.key, "country", c); if (c !== "Sonstiges") onUpdate(o.key, "customCountry", ""); }}
            onClose={onClosePicker}
          />

          {o.country === "Sonstiges" && (
            <TextInput
              style={[ui.input, { borderRadius: br }]}
              placeholder="Land eingeben"
              placeholderTextColor={COLORS.coffee600}
              value={o.customCountry}
              onChangeText={(v) => onUpdate(o.key, "customCountry", v)}
            />
          )}

          {(o.region.trim() !== "" || expandedRegions.has(o.key)) ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Text style={{ color: COLORS.coffee600, fontFamily: "Inter_500Medium", fontSize: 13, width: 56 }}>
                Region
              </Text>
              <TextInput
                style={[ui.input, { flex: 1, borderRadius: br, paddingVertical: 9, fontSize: 14 }]}
                placeholder="z. B. Yirgacheffe (optional)"
                placeholderTextColor={COLORS.coffee600}
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
              <Ionicons name="add" size={16} color={COLORS.accent400} />
              <Text style={{ color: COLORS.accent400, fontFamily: "Inter_600SemiBold", fontSize: 13 }}>
                Region ergänzen
              </Text>
            </Pressable>
          )}

          {multiple && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <TextInput
                style={[ui.input, { flex: 1, borderRadius: br }]}
                placeholder="Anteil"
                placeholderTextColor={COLORS.coffee600}
                value={o.percentageText}
                onChangeText={(v) => onUpdate(o.key, "percentageText", v.replace(/[^0-9]/g, ""))}
                keyboardType="number-pad"
                maxLength={3}
              />
              <Text style={{ color: COLORS.coffee600, fontFamily: "Inter_600SemiBold", fontSize: 15 }}>%</Text>
            </View>
          )}
        </View>
        );
      })}

      <Pressable
        onPress={() => { Haptics.selectionAsync(); onAdd(); }}
        style={({ pressed }) => ({
          flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
          paddingVertical: 12, borderRadius: 10,
          borderWidth: 1.5, borderColor: COLORS.accent300,
          borderStyle: "dashed" as const,
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <Ionicons name="add" size={18} color={COLORS.accent400} />
        <Text style={{ color: COLORS.accent400, fontFamily: "Inter_600SemiBold", fontSize: 14 }}>
          Herkunft hinzufügen
        </Text>
      </Pressable>
    </View>
  );
}

function ProcessingPicker({
  value, onChange,
}: {
  value: string; onChange: (v: string) => void;
}) {
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", rowGap: 18 }}>
      {PROCESSING_METHODS.map(({ value: v, label }) => (
        <TileOption
          key={v}
          source={processTileSource(v)}
          label={label}
          active={value === v}
          onPress={() => onChange(value === v ? "" : v)}
          width="33.33%"
          tileSize={52}
          fontSize={12}
        />
      ))}
    </View>
  );
}

function RoastLevelPicker({
  value, onChange,
}: {
  value: string; onChange: (v: string) => void;
}) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
      {ROAST_LEVELS.map(({ value: v, label }) => (
        <TileOption
          key={v}
          source={roastTileSource(v)}
          label={label}
          active={value === v}
          onPress={() => onChange(value === v ? "" : v)}
          width="18%"
          tileSize={52}
          fontSize={11}
        />
      ))}
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
}: {
  grinders: Grinder[];
  grindSettings: GrindSettingDraft[];
  onToggle: (grinder: string) => void;
  onLevelChange: (grinder: string, v: string) => void;
  onBlurLevel: (grinder: string) => void;
}) {
  return (
    <View style={{ gap: 18 }}>
      <View style={{ flexDirection: "row", flexWrap: "wrap", rowGap: 14 }}>
        {grinders.map((g) => (
          <TileOption
            key={g.name}
            source={grinderTileSource(g.design)}
            label={g.name}
            active={grindSettings.some((s) => s.grinder === g.name)}
            onPress={() => onToggle(g.name)}
            width="25%"
            tileSize={52}
            fontSize={12}
          />
        ))}
        {grinders.length === 0 && (
          <Text style={{ color: COLORS.coffee600, fontFamily: "Inter_400Regular", fontSize: 14 }}>
            Keine Mühlen konfiguriert
          </Text>
        )}
      </View>

      {grindSettings.length > 0 && (
        <View style={{ gap: 10 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={{ color: COLORS.coffee800, fontFamily: "Inter_600SemiBold", fontSize: 14 }}>
              Mahlgrad
            </Text>
            <Text style={{ color: COLORS.coffee600, fontFamily: "Inter_400Regular", fontSize: 12 }}>
              0 – 50
            </Text>
          </View>
          <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
            {grindSettings.map(({ grinder, levelText }) => (
              <View key={grinder} style={{ gap: 4, minWidth: 72, flex: 1, maxWidth: 140 }}>
                <Text
                  numberOfLines={1}
                  style={{ color: COLORS.coffee600, fontFamily: "Inter_500Medium", fontSize: 11, textAlign: "center" }}
                >
                  {grinder}
                </Text>
                <View
                  style={{
                    borderWidth: 1,
                    borderColor: "rgba(74,38,22,0.28)",
                    borderRadius: 10,
                    backgroundColor: COLORS.paperLight,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                  }}
                >
                  <TextInput
                    style={{ color: COLORS.coffee800, fontFamily: "Inter_600SemiBold", fontSize: 18, textAlign: "center" }}
                    value={levelText}
                    onChangeText={(v) => onLevelChange(grinder, v.replace(/[^0-9.,]/g, ""))}
                    onBlur={() => onBlurLevel(grinder)}
                    keyboardType="decimal-pad"
                    placeholder="0"
                    placeholderTextColor={COLORS.coffee600}
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

const CARD_SHAPES: Array<1 | 2 | 3> = [1, 2, 3];

export default function CoffeeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();

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

  const handleBack = () => {
    if (hasChanges) {
      Alert.alert("Änderungen verwerfen?", "Du hast ungespeicherte Änderungen.", [
        { text: "Weiter bearbeiten", style: "cancel" },
        { text: "Verwerfen", style: "destructive", onPress: () => router.back() },
      ]);
    } else {
      router.back();
    }
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  if (loading) {
    return (
      <View style={[ui.appBg, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator color={COLORS.accent300} />
      </View>
    );
  }

  return (
    <View style={ui.appBg}>
      {/* ---------- Header: direkt auf ui.appBg, kein Papier ---------- */}
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <View style={styles.headerTop}>
          <Pressable
            onPress={handleBack}
            hitSlop={8}
            style={({ pressed }) => [styles.backButton, { opacity: pressed ? 0.6 : 1 }]}
          >
            <Ionicons name="chevron-back" size={26} color={COLORS.coffee800} />
          </Pressable>
          <View style={styles.headerActions}>
            <Pressable
              onPress={handleDelete}
              disabled={saving}
              hitSlop={8}
              style={({ pressed }) => ({ opacity: pressed ? 0.6 : saving ? 0.4 : 1 })}
            >
              <Ionicons name="trash-outline" size={22} color={COLORS.danger} />
            </Pressable>
            <Pressable
              onPress={handleSave}
              disabled={saving}
              hitSlop={8}
              style={({ pressed }) => ({ opacity: pressed ? 0.85 : saving ? 0.6 : 1 })}
            >
              <PaperCard variant="chip" shape={2} shadow={0} style={styles.saveChip} contentStyle={styles.saveChipPad}>
                {saving ? (
                  <ActivityIndicator size="small" color={COLORS.coffee800} />
                ) : (
                  <Ionicons name="checkmark" size={24} color={COLORS.coffee800} />
                )}
              </PaperCard>
            </Pressable>
          </View>
        </View>
        <Text style={ui.eyebrow}>KAFFEE</Text>
        <TextInput
          style={styles.nameTitle}
          value={name}
          onChangeText={(v) => { setName(v); markChanged(); }}
          placeholder="Kaffeename"
          placeholderTextColor={COLORS.coffee600}
          multiline
        />
      </View>

      <KeyboardAwareScrollViewCompat
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: bottomPad + 100, gap: 16 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bottomOffset={24}
      >
        {/* ── BEWERTUNGEN ──────────────────────────────────────────────── */}
        <PaperCard variant="light" shape={CARD_SHAPES[0]} shadow={1} contentStyle={styles.cardPad}>
          <Text style={ui.eyebrow}>BEWERTUNGEN</Text>
          <View style={{ gap: 22, marginTop: 14 }}>
            <RatingSlider
              label={`${name1} Rating`}
              value={haseRating}
              min={0}
              max={10}
              onChange={(v) => { setHaseRating(v); markChanged(); }}
              minLabel="schlecht"
              maxLabel="grossartig"
            />
            {user2active && (
              <>
                <View style={ui.divider} />
                <RatingSlider
                  label={`${name2} Rating`}
                  value={dodoRating}
                  min={0}
                  max={10}
                  onChange={(v) => { setDodoRating(v); markChanged(); }}
                  minLabel="schlecht"
                  maxLabel="grossartig"
                />
              </>
            )}
          </View>
        </PaperCard>

        {/* ── MAHLGRAD ─────────────────────────────────────────────────── */}
        <PaperCard variant="light" shape={CARD_SHAPES[1]} shadow={1} contentStyle={styles.cardPad}>
          <Text style={ui.eyebrow}>MAHLGRAD</Text>
          <View style={{ marginTop: 14 }}>
            <GrinderPicker
              grinders={grinders}
              grindSettings={grindSettings}
              onToggle={toggleGrinder}
              onLevelChange={updateGrindLevel}
              onBlurLevel={normalizeGrindLevel}
            />
          </View>
        </PaperCard>

        {/* ── AROMA ────────────────────────────────────────────────────── */}
        <PaperCard variant="light" shape={CARD_SHAPES[2]} shadow={1} contentStyle={styles.cardPad}>
          <Text style={ui.eyebrow}>AROMA</Text>
          <View style={{ marginTop: 16 }}>
            <AromaPicker
              value={aroma}
              onChange={(v) => { setAroma(v); markChanged(); if (v === 1) triggerToasty(); }}
            />
          </View>
        </PaperCard>

        {/* ── RÖSTGRAD ─────────────────────────────────────────────────── */}
        <PaperCard variant="light" shape={CARD_SHAPES[0]} shadow={1} contentStyle={styles.cardPad}>
          <Text style={ui.eyebrow}>RÖSTGRAD</Text>
          <View style={{ marginTop: 16 }}>
            <RoastLevelPicker
              value={roastLevel}
              onChange={(v) => { setRoastLevel(v); markChanged(); }}
            />
          </View>
        </PaperCard>

        {/* ── HERKUNFT ─────────────────────────────────────────────────── */}
        {(() => {
          const originNameOf = (o: OriginDraft) =>
            (o.country === "Sonstiges" ? o.customCountry.trim() : o.country).trim();
          const filledOrigins = origins.filter((o) => originNameOf(o));
          const hasOrigin = filledOrigins.length > 0;
          const showEditor = originEditing || !hasOrigin;
          return (
            <PaperCard variant="light" shape={CARD_SHAPES[1]} shadow={1} contentStyle={styles.cardPad}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <Text style={ui.eyebrow}>HERKUNFT</Text>
                {hasOrigin && (
                  <Pressable
                    onPress={() => { Haptics.selectionAsync(); setOriginEditing((e) => !e); }}
                    hitSlop={10}
                    accessibilityRole="button"
                    accessibilityLabel={showEditor ? "Herkunft kompakt anzeigen" : "Herkunft bearbeiten"}
                    style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, padding: 4 })}
                  >
                    <Ionicons name={showEditor ? "checkmark" : "pencil"} size={18} color={COLORS.accent400} />
                  </Pressable>
                )}
              </View>
              {showEditor ? (
                <View style={{ marginTop: 10 }}>
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
                  />
                </View>
              ) : (
                <Text style={{ color: COLORS.coffee800, fontFamily: "Inter_500Medium", fontSize: 15, lineHeight: 24, marginTop: 10 }}>
                  {filledOrigins
                    .map((o) => {
                      const pct = o.percentageText || (filledOrigins.length === 1 ? "100" : "");
                      return originNameOf(o) + (pct ? ` ${pct}%` : "");
                    })
                    .join("   |   ")}
                </Text>
              )}
            </PaperCard>
          );
        })()}

        {/* ── AUFBEREITUNG ─────────────────────────────────────────────── */}
        <PaperCard variant="light" shape={CARD_SHAPES[2]} shadow={1} contentStyle={styles.cardPad}>
          <Text style={ui.eyebrow}>AUFBEREITUNG</Text>
          <View style={{ marginTop: 16 }}>
            <ProcessingPicker
              value={processingMethod}
              onChange={(v) => { setProcessingMethod(v); markChanged(); }}
            />
          </View>
        </PaperCard>

        {/* ── NOTIZEN ──────────────────────────────────────────────────── */}
        <PaperCard variant="light" shape={CARD_SHAPES[0]} shadow={1} contentStyle={styles.cardPad}>
          <Text style={ui.eyebrow}>NOTIZEN</Text>
          <View style={{ gap: 18, marginTop: 14 }}>
            <View style={{ gap: 8 }}>
              <Text style={ui.label}>Aroma Beschreibung</Text>
              <TextInput
                style={[ui.input, styles.textArea]}
                placeholder="z.B. Karamell, dunkle Schokolade, Nüsse..."
                placeholderTextColor={COLORS.coffee600}
                multiline
                numberOfLines={3}
                value={aromaDescription}
                onChangeText={(v) => { setAromaDescription(v); markChanged(); }}
              />
            </View>
            <View style={{ gap: 8 }}>
              <Text style={ui.label}>Sonstiges</Text>
              <TextInput
                style={[ui.input, styles.textArea]}
                placeholder="Weitere Notizen, Zubereitungshinweise..."
                placeholderTextColor={COLORS.coffee600}
                multiline
                numberOfLines={3}
                value={notes}
                onChangeText={(v) => { setNotes(v); markChanged(); }}
              />
            </View>
          </View>
        </PaperCard>

        {/* ── PREIS ────────────────────────────────────────────────────── */}
        <PaperCard variant="light" shape={CARD_SHAPES[1]} shadow={1} contentStyle={styles.cardPad}>
          <Text style={ui.eyebrow}>PREIS</Text>
          <View style={{ gap: 8, marginTop: 14 }}>
            <Text style={ui.label}>Preis je Kilogramm</Text>
            <View style={styles.priceInputRow}>
              <TextInput
                style={styles.priceInput}
                placeholder="z.B. 24,90"
                placeholderTextColor={COLORS.coffee600}
                keyboardType="decimal-pad"
                value={pricePerKg}
                onChangeText={(v) => { setPricePerKg(v); markChanged(); }}
              />
              <Text style={styles.priceSuffix}>€/kg</Text>
            </View>
          </View>
        </PaperCard>

        <Pressable
          onPress={handleSave}
          disabled={saving}
          style={({ pressed }) => [
            ui.btnPrimary,
            styles.saveButton,
            saving && ui.btnDisabled,
            { opacity: pressed && !saving ? 0.9 : 1 },
          ]}
        >
          {saving ? (
            <ActivityIndicator color={COLORS.paperLight} />
          ) : (
            <Text style={ui.btnPrimaryText}>Speichern</Text>
          )}
        </Pressable>
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
  header: {
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
  },
  backButton: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: -6,
  },
  saveChip: {
    width: 46,
    height: 46,
  },
  saveChipPad: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
  },
  nameTitle: {
    fontFamily: FONTS.display,
    fontSize: 30,
    lineHeight: 36,
    color: COLORS.coffee800,
    padding: 0,
    marginTop: 6,
  },
  cardPad: {
    padding: 20,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
    paddingTop: 12,
  },
  priceInputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.paperLight,
    borderWidth: 1,
    borderColor: "rgba(74,38,22,0.28)",
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 50,
  },
  priceInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.coffee800,
    fontFamily: "Inter_400Regular",
  },
  priceSuffix: {
    fontSize: 15,
    marginLeft: 8,
    color: COLORS.coffee600,
    fontFamily: "Inter_600SemiBold",
  },
  saveButton: {
    marginTop: 4,
  },
});
