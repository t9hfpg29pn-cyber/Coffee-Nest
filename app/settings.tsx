import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Image,
  ScrollView,
  Platform,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useUserNames } from "@/context/UserNamesContext";
import { PolyBackground } from "@/components/PolyBackground";
import { TornDefs, TornSheet, TornBox, IconStamp, Grain, Hairline } from "@/components/TornPaper";
import { getRoasteries, getAllCoffees, getGrinders, saveGrinders, normalizeGrinders, DEFAULT_GRINDERS, Grinder, GrinderDesign } from "@/lib/storage";
import { useTheme, useThemeColors, useCardExtras, DesignMode } from "@/context/ThemeContext";
import { CupIcon, GemIcon, GrinderIcon } from "@/components/CoffeeIcons";

const SERIF_BLACK = "PlayfairDisplay_800ExtraBold";
const SERIF_BOLD = "PlayfairDisplay_700Bold";

const DANGER = "#E05252";

function showAlert(title: string, message: string, buttons?: { text: string; style?: string; onPress?: () => void }[]) {
  if (Platform.OS === "web") {
    if (buttons && buttons.length > 1) {
      const confirmed = (window as any).confirm(`${title}\n\n${message}`);
      if (confirmed) {
        const confirmBtn = buttons.find((b) => b.style !== "cancel");
        confirmBtn?.onPress?.();
      }
    } else {
      (window as any).alert(`${title}\n\n${message}`);
      buttons?.[0]?.onPress?.();
    }
  } else {
    Alert.alert(title, message, buttons as any);
  }
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const { design, setDesign } = useTheme();
  const cardExtras = useCardExtras();

  const { name1, name2, user2active, setName1, setName2, removeUser2 } = useUserNames();
  const [draft1, setDraft1] = useState(name1);
  const [draft2, setDraft2] = useState(name2);
  const [showAddUser2, setShowAddUser2] = useState(false);
  const [newUser2Draft, setNewUser2Draft] = useState("");
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);

  const [grinders, setGrinders] = useState<Grinder[]>([]);
  const [newGrinder, setNewGrinder] = useState("");
  const [newGrinderDesign, setNewGrinderDesign] = useState<GrinderDesign>("commandante");

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 0 : insets.bottom;

  const isDirty = draft1.trim() !== name1 || (user2active && draft2.trim() !== name2);

  useEffect(() => {
    getGrinders().then(setGrinders);
  }, []);

  const persistGrinders = async (list: Grinder[]) => {
    setGrinders(list);
    await saveGrinders(list);
  };

  const handleAddGrinder = async () => {
    const trimmed = newGrinder.trim();
    if (!trimmed) return;
    if (grinders.length >= 3) {
      showAlert("Hinweis", "Maximal 3 Mühlen können eingetragen werden.");
      return;
    }
    if (grinders.some((g) => g.name.toLowerCase() === trimmed.toLowerCase())) {
      showAlert("Hinweis", "Diese Mühle ist bereits vorhanden.");
      return;
    }
    Haptics.selectionAsync();
    await persistGrinders([...grinders, { name: trimmed, design: newGrinderDesign }]);
    setNewGrinder("");
  };

  const handleRemoveGrinder = async (name: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await persistGrinders(grinders.filter((g) => g.name !== name));
  };

  const handleSave = async () => {
    if (!draft1.trim()) {
      showAlert("Hinweis", "Person 1 muss einen Namen haben.");
      return;
    }
    if (user2active && !draft2.trim()) {
      showAlert("Hinweis", "Person 2 muss einen Namen haben oder entfernt werden.");
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await setName1(draft1.trim());
    if (user2active) await setName2(draft2.trim());
    router.back();
  };

  const handleRemoveUser2 = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    showAlert(
      "Person 2 entfernen",
      `Möchtest du "${name2}" entfernen? Die Bewertungen bleiben gespeichert.`,
      [
        { text: "Abbrechen", style: "cancel" },
        {
          text: "Entfernen",
          style: "destructive",
          onPress: async () => {
            await removeUser2();
          },
        },
      ]
    );
  };

  const handleAddUser2 = async () => {
    const trimmed = newUser2Draft.trim();
    if (!trimmed) {
      showAlert("Hinweis", "Bitte einen Namen eingeben.");
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await setName2(trimmed);
    setDraft2(trimmed);
    setNewUser2Draft("");
    setShowAddUser2(false);
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const [roasteries, coffees, grinderList] = await Promise.all([
        getRoasteries(),
        getAllCoffees(),
        getGrinders(),
      ]);
      const data = JSON.stringify({ roasteries, coffees, grinders: grinderList }, null, 2);
      const date = new Date().toISOString().split("T")[0];
      const filename = `coffee-nest-backup-${date}.json`;

      if (Platform.OS === "web") {
        const blob = new Blob([data], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const path = (FileSystem.cacheDirectory ?? "") + filename;
        await FileSystem.writeAsStringAsync(path, data);
        await Sharing.shareAsync(path, {
          mimeType: "application/json",
          dialogTitle: "Coffee Nest Backup",
          UTI: "public.json",
        });
      }
    } catch (e) {
      showAlert("Fehler", "Export fehlgeschlagen.");
    } finally {
      setExporting(false);
    }
  };

  const processImport = async (jsonText: string) => {
    try {
      const data = JSON.parse(jsonText);
      if (!Array.isArray(data.roasteries) || !Array.isArray(data.coffees)) {
        throw new Error("Ungültiges Format");
      }
      const grindersInfo = Array.isArray(data.grinders) ? ` und ${data.grinders.length} Mühlen` : "";
      showAlert(
        "Daten importieren",
        `${data.roasteries.length} Röstereien, ${data.coffees.length} Kaffees${grindersInfo} werden importiert. Alle vorhandenen Daten werden überschrieben.`,
        [
          { text: "Abbrechen", style: "cancel" },
          {
            text: "Importieren",
            style: "destructive",
            onPress: async () => {
              await AsyncStorage.setItem("roasteries", JSON.stringify(data.roasteries));
              await AsyncStorage.setItem("coffees", JSON.stringify(data.coffees));
              const normalized = normalizeGrinders(data.grinders);
              const importedGrinders = normalized.length > 0 ? normalized : [...DEFAULT_GRINDERS];
              await AsyncStorage.setItem("grinders", JSON.stringify(importedGrinders));
              setGrinders(importedGrinders);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              showAlert("Erfolg", "Daten wurden erfolgreich importiert.");
            },
          },
        ]
      );
    } catch {
      showAlert("Fehler", "Die Datei konnte nicht gelesen werden. Bitte prüfe das Format.");
    } finally {
      setImporting(false);
    }
  };

  const handleImport = async () => {
    try {
      setImporting(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      if (Platform.OS === "web") {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".json,application/json";
        input.onchange = async (e: any) => {
          const file = e.target?.files?.[0];
          if (!file) { setImporting(false); return; }
          const text = await file.text();
          await processImport(text);
        };
        input.oncancel = () => setImporting(false);
        input.click();
      } else {
        const result = await DocumentPicker.getDocumentAsync({
          type: ["application/json", "public.json"],
          copyToCacheDirectory: true,
        });
        if (result.canceled) { setImporting(false); return; }
        const response = await fetch(result.assets[0].uri);
        const text = await response.text();
        await processImport(text);
      }
    } catch {
      showAlert("Fehler", "Import fehlgeschlagen.");
      setImporting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <PolyBackground />
      <TornDefs />
      <Grain />

      {/* Masthead — a cream page bleeding under the status bar */}
      <TornSheet
        tone="cream"
        seed={6}
        rotate={0.4}
        peek={false}
        style={styles.masthead}
        contentStyle={[styles.mastheadPad, { paddingTop: topPad + 18 }]}
      >
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.6 : 1 }]}
            hitSlop={12}
          >
            <Ionicons name="chevron-back" size={26} color={colors.ink} />
          </Pressable>
          <View style={styles.headerLeft}>
            <Text style={[styles.kicker, { color: colors.inkFaint, fontFamily: "Inter_600SemiBold" }]}>
              COFFEE NEST
            </Text>
            <Text style={[styles.title, { color: colors.ink, fontFamily: SERIF_BLACK }]}>
              Einstellungen
            </Text>
          </View>
          <Pressable
            onPress={isDirty ? handleSave : undefined}
            style={({ pressed }) => ({ opacity: isDirty ? (pressed ? 0.7 : 1) : 0.3 })}
            disabled={!isDirty}
          >
            <TornBox color={colors.gold} seed={4} style={styles.saveBtn}>
              <Text style={[styles.saveBtnText, { fontFamily: "Inter_600SemiBold" }]}>
                Speichern
              </Text>
            </TornBox>
          </Pressable>
        </View>
      </TornSheet>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: 26, paddingBottom: bottomPad + 24 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* DESIGN */}
        <TornSheet tone="cream" seed={13} rotate={-0.7} contentStyle={styles.sectionPad} style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.inkFaint, fontFamily: "Inter_600SemiBold" }]}>
            DESIGN
          </Text>
          <View style={styles.designRow}>
            {(["classic", "lowpoly"] as DesignMode[]).map((mode) => {
              const active = design === mode;
              const label = mode === "classic" ? "Klassisch" : "Low-Poly";
              return (
                <Pressable
                  key={mode}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setDesign(mode);
                  }}
                  style={({ pressed }) => [
                    styles.designOption,
                    {
                      backgroundColor: active ? colors.gold : colors.paperBg2,
                      borderColor: active ? colors.gold : colors.border,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                >
                  {mode === "classic" ? (
                    <CupIcon size={18} color={active ? colors.creamText : colors.ink} />
                  ) : (
                    <GemIcon size={18} color={active ? colors.creamText : colors.ink} />
                  )}
                  <Text
                    style={[
                      styles.designLabel,
                      {
                        color: active ? colors.creamText : colors.ink,
                        fontFamily: active ? "Inter_700Bold" : "Inter_500Medium",
                      },
                    ]}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={[styles.designHint, { color: colors.inkSoft, fontFamily: "Inter_400Regular" }]}>
            {design === "lowpoly"
              ? "Warm · geometrisch · facettiert"
              : "Warm · klassisch · Kaffeefarben"}
          </Text>
        </TornSheet>

        <Text style={[styles.hint, { color: colors.inkSoft, fontFamily: "Inter_400Regular" }]}>
          Das Design wird sofort überall in der App angewendet.
        </Text>

        {/* BENUTZER */}
        <TornSheet tone="cream" seed={12} rotate={0.8} contentStyle={styles.sectionPad} style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.inkFaint, fontFamily: "Inter_600SemiBold" }]}>
            BENUTZER
          </Text>

          <View style={styles.fieldRow}>
            <IconStamp size={44} seed={3} tone="kraft" style={styles.fieldStamp}>
              <Text style={[styles.stampInitial, { color: colors.espresso, fontFamily: SERIF_BOLD }]}>
                {(draft1.trim()[0] ?? "?").toUpperCase()}
              </Text>
            </IconStamp>
            <View style={styles.fieldContent}>
              <Text style={[styles.fieldHint, { color: colors.inkFaint, fontFamily: "Inter_400Regular" }]}>
                Person 1
              </Text>
              <TextInput
                value={draft1}
                onChangeText={setDraft1}
                style={[styles.input, { color: colors.ink, fontFamily: "Inter_500Medium", borderRadius: cardExtras.cardRadius }]}
                placeholder="Hase"
                placeholderTextColor={colors.inkFaint}
                maxLength={20}
                returnKeyType="next"
                autoCorrect={false}
              />
            </View>
          </View>

          {user2active ? (
            <>
              <View style={styles.rowDivider}>
                <Hairline />
              </View>
              <View style={styles.fieldRow}>
                <IconStamp size={44} seed={5} tone="kraft" style={styles.fieldStamp}>
                  <Text style={[styles.stampInitial, { color: colors.espresso, fontFamily: SERIF_BOLD }]}>
                    {(draft2.trim()[0] ?? "?").toUpperCase()}
                  </Text>
                </IconStamp>
                <View style={styles.fieldContent}>
                  <Text style={[styles.fieldHint, { color: colors.inkFaint, fontFamily: "Inter_400Regular" }]}>
                    Person 2
                  </Text>
                  <TextInput
                    value={draft2}
                    onChangeText={setDraft2}
                    style={[styles.input, { color: colors.ink, fontFamily: "Inter_500Medium", borderRadius: cardExtras.cardRadius }]}
                    placeholder="Dodo"
                    placeholderTextColor={colors.inkFaint}
                    maxLength={20}
                    returnKeyType="done"
                    onSubmitEditing={isDirty ? handleSave : undefined}
                    autoCorrect={false}
                  />
                </View>
                <Pressable
                  onPress={handleRemoveUser2}
                  hitSlop={8}
                  style={{ padding: 6, marginLeft: 4 }}
                >
                  <Ionicons name="trash-outline" size={18} color={DANGER} />
                </Pressable>
              </View>
            </>
          ) : showAddUser2 ? (
            <>
              <View style={styles.rowDivider}>
                <Hairline />
              </View>
              <View style={styles.fieldRow}>
                <IconStamp size={44} seed={7} tone="kraft" style={styles.fieldStamp}>
                  <Text style={[styles.stampInitial, { color: colors.espresso, fontFamily: SERIF_BOLD }]}>
                    {(newUser2Draft.trim()[0] ?? "+").toUpperCase()}
                  </Text>
                </IconStamp>
                <View style={styles.fieldContent}>
                  <Text style={[styles.fieldHint, { color: colors.inkFaint, fontFamily: "Inter_400Regular" }]}>
                    Person 2
                  </Text>
                  <TextInput
                    value={newUser2Draft}
                    onChangeText={setNewUser2Draft}
                    style={[styles.input, { color: colors.ink, fontFamily: "Inter_500Medium", borderRadius: cardExtras.cardRadius }]}
                    placeholder="Name eingeben"
                    placeholderTextColor={colors.inkFaint}
                    maxLength={20}
                    returnKeyType="done"
                    onSubmitEditing={handleAddUser2}
                    autoFocus
                    autoCorrect={false}
                  />
                </View>
                <Pressable onPress={handleAddUser2} hitSlop={8} style={{ padding: 6, marginLeft: 4 }}>
                  <Ionicons name="checkmark" size={20} color={colors.gold} />
                </Pressable>
                <Pressable onPress={() => { setShowAddUser2(false); setNewUser2Draft(""); }} hitSlop={8} style={{ padding: 6 }}>
                  <Ionicons name="close" size={18} color={colors.inkFaint} />
                </Pressable>
              </View>
            </>
          ) : (
            <>
              <View style={styles.rowDivider}>
                <Hairline />
              </View>
              <Pressable
                onPress={() => setShowAddUser2(true)}
                style={({ pressed }) => [styles.addUserRow, { opacity: pressed ? 0.6 : 1 }]}
              >
                <IconStamp size={44} seed={9} tone="kraft" style={styles.fieldStamp}>
                  <Ionicons name="add" size={20} color={colors.espresso} />
                </IconStamp>
                <Text style={[styles.addUserText, { color: colors.inkSoft, fontFamily: "Inter_500Medium" }]}>
                  Person 2 hinzufügen
                </Text>
              </Pressable>
            </>
          )}
        </TornSheet>

        <Text style={[styles.hint, { color: colors.inkSoft, fontFamily: "Inter_400Regular" }]}>
          Die Namen werden überall in der App verwendet und lokal gespeichert.
        </Text>

        {/* KAFFEEMÜHLEN */}
        <TornSheet tone="cream" seed={8} rotate={-0.8} contentStyle={styles.sectionPad} style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.inkFaint, fontFamily: "Inter_600SemiBold" }]}>
            KAFFEEMÜHLEN
          </Text>

          {grinders.map((g, idx) => (
            <View key={g.name} style={[styles.grinderRow, idx > 0 && { marginTop: 4 }]}>
              <IconStamp size={42} seed={(idx % 5) + 11} tone="kraft" style={styles.fieldStamp}>
                <GrinderIcon design={g.design} size={22} color={colors.espresso} />
              </IconStamp>
              <Text style={[styles.grinderName, { color: colors.ink, fontFamily: SERIF_BOLD }]}>
                {g.name}
              </Text>
              <Pressable
                onPress={() => handleRemoveGrinder(g.name)}
                hitSlop={12}
                style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
              >
                <Ionicons name="close-circle" size={20} color={colors.inkFaint} />
              </Pressable>
            </View>
          ))}

          {grinders.length < 3 && (
            <View style={{ marginTop: grinders.length > 0 ? 16 : 4, gap: 10 }}>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {(["commandante", "niche"] as GrinderDesign[]).map((d) => {
                  const active = newGrinderDesign === d;
                  return (
                    <Pressable
                      key={d}
                      onPress={() => { Haptics.selectionAsync(); setNewGrinderDesign(d); }}
                      style={({ pressed }) => ({
                        flex: 1,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                        paddingVertical: 9,
                        borderRadius: design === "lowpoly" ? 5 : 10,
                        backgroundColor: active ? colors.gold : colors.paperBg2,
                        borderWidth: 1.5,
                        borderColor: active ? colors.gold : colors.border,
                        opacity: pressed ? 0.8 : 1,
                      })}
                    >
                      <GrinderIcon design={d} size={20} color={active ? colors.creamText : colors.ink} />
                      <Text style={{ color: active ? colors.creamText : colors.ink, fontFamily: active ? "Inter_600SemiBold" : "Inter_500Medium", fontSize: 13 }}>
                        {d === "niche" ? "Niche" : "Commandante"}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <View style={styles.addGrinderRow}>
                <TextInput
                  value={newGrinder}
                  onChangeText={setNewGrinder}
                  style={[styles.grinderInput, { color: colors.ink, fontFamily: "Inter_400Regular" }]}
                  placeholder="Neue Mühle..."
                  placeholderTextColor={colors.inkFaint}
                  maxLength={30}
                  returnKeyType="done"
                  onSubmitEditing={handleAddGrinder}
                  autoCorrect={false}
                />
                <Pressable
                  onPress={handleAddGrinder}
                  disabled={!newGrinder.trim()}
                  style={({ pressed }) => ({
                    opacity: newGrinder.trim() ? (pressed ? 0.7 : 1) : 0.3,
                  })}
                >
                  <TornBox color={colors.gold} seed={11} style={styles.addGrinderBtn}>
                    <Ionicons name="add" size={18} color={colors.creamText} />
                  </TornBox>
                </Pressable>
              </View>
            </View>
          )}

          {grinders.length === 3 && (
            <Text style={[styles.grinderLimit, { color: colors.inkSoft, fontFamily: "Inter_400Regular" }]}>
              Maximal 3 Mühlen möglich
            </Text>
          )}
        </TornSheet>

        <Text style={[styles.hint, { color: colors.inkSoft, fontFamily: "Inter_400Regular" }]}>
          Wähle beim Kaffee die verwendete Mühle aus.
        </Text>

        {/* DATENSICHERUNG */}
        <TornSheet tone="cream" seed={15} rotate={0.7} contentStyle={styles.sectionPad} style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.inkFaint, fontFamily: "Inter_600SemiBold" }]}>
            DATENSICHERUNG
          </Text>

          <Pressable
            onPress={handleExport}
            disabled={exporting}
            style={({ pressed }) => [styles.dataRow, { opacity: pressed || exporting ? 0.6 : 1 }]}
          >
            <IconStamp size={42} seed={14} tone="kraft" style={styles.fieldStamp}>
              <Ionicons name="arrow-up-circle-outline" size={22} color={colors.gold} />
            </IconStamp>
            <View style={styles.fieldContent}>
              <Text style={[styles.dataTitle, { color: colors.ink, fontFamily: "Inter_600SemiBold" }]}>
                Daten exportieren
              </Text>
              <Text style={[styles.dataSubtitle, { color: colors.inkSoft, fontFamily: "Inter_400Regular" }]}>
                Röstereien, Kaffees und Mühlen als JSON speichern
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.inkFaint} />
          </Pressable>

          <View style={styles.rowDivider}>
            <Hairline />
          </View>

          <Pressable
            onPress={handleImport}
            disabled={importing}
            style={({ pressed }) => [styles.dataRow, { opacity: pressed || importing ? 0.6 : 1 }]}
          >
            <IconStamp size={42} seed={16} tone="kraft" style={styles.fieldStamp}>
              <Ionicons name="arrow-down-circle-outline" size={22} color={DANGER} />
            </IconStamp>
            <View style={styles.fieldContent}>
              <Text style={[styles.dataTitle, { color: colors.ink, fontFamily: "Inter_600SemiBold" }]}>
                Daten importieren
              </Text>
              <Text style={[styles.dataSubtitle, { color: colors.inkSoft, fontFamily: "Inter_400Regular" }]}>
                Backup laden – überschreibt alle vorhandenen Daten
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.inkFaint} />
          </Pressable>
        </TornSheet>

        <Text style={[styles.hint, { color: colors.inkSoft, fontFamily: "Inter_400Regular", marginTop: 8 }]}>
          Exportiere regelmäßig ein Backup um Datenverlust zu vermeiden.
        </Text>

        <View style={styles.iconContainer}>
          <Image
            source={require("../assets/images/icon.png")}
            style={styles.appIcon}
            resizeMode="contain"
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  masthead: {
    marginTop: -48,
  },
  mastheadPad: {
    paddingHorizontal: 22,
    paddingBottom: 26,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  backBtn: {
    marginRight: 2,
  },
  headerLeft: {
    flex: 1,
  },
  kicker: {
    fontSize: 11,
    letterSpacing: 3,
    marginBottom: 4,
  },
  title: {
    fontSize: 34,
    lineHeight: 40,
  },
  saveBtn: {
    width: 112,
    height: 40,
  },
  saveBtnText: {
    color: "#FFF8EC",
    fontSize: 14,
  },
  section: {
    marginHorizontal: 22,
  },
  sectionPad: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 20,
  },
  sectionLabel: {
    fontSize: 10,
    letterSpacing: 2.6,
    textTransform: "uppercase",
    marginBottom: 16,
  },
  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  fieldStamp: {
    marginRight: 0,
  },
  stampInitial: {
    fontSize: 18,
  },
  rowDivider: {
    marginVertical: 14,
  },
  grinderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  grinderName: {
    flex: 1,
    fontSize: 20,
  },
  addUserRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  addUserText: {
    flex: 1,
    fontSize: 15,
  },
  addGrinderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 2,
  },
  grinderInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 6,
  },
  addGrinderBtn: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  grinderLimit: {
    fontSize: 12,
    marginTop: 14,
  },
  dataRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  dataTitle: {
    fontSize: 16,
  },
  dataSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  fieldContent: {
    flex: 1,
    gap: 2,
  },
  fieldHint: {
    fontSize: 11,
  },
  input: {
    fontSize: 18,
    paddingVertical: 0,
  },
  hint: {
    fontSize: 12,
    marginHorizontal: 26,
    lineHeight: 18,
    marginTop: 12,
    marginBottom: 18,
  },
  designRow: {
    flexDirection: "row",
    gap: 10,
  },
  designOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  designLabel: {
    fontSize: 15,
  },
  designHint: {
    fontSize: 11,
    marginTop: 14,
    letterSpacing: 0.3,
  },
  iconContainer: {
    height: 200,
    marginTop: 16,
    overflow: "hidden",
  },
  appIcon: {
    width: "100%",
    height: "100%",
  },
});
