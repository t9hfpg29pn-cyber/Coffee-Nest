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
import { getRoasteries, getAllCoffees, getGrinders, saveGrinders, normalizeGrinders, DEFAULT_GRINDERS, Grinder, GrinderDesign } from "@/lib/storage";
import { PaperCard, COLORS, FONTS, ui } from "@/theme/paper-native";
import { PaperTile, grinderTileSource } from "@/components/PaperTiles";

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
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

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
    <View style={ui.appBg}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: topPad + 8,
          paddingBottom: bottomPad + 48,
          flexGrow: 1,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ---------- Seiten-Header: direkt auf ui.appBg, kein Papier ---------- */}
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          >
            <Ionicons name="chevron-back" size={26} color={COLORS.coffee800} />
          </Pressable>
          <View style={styles.headerLeft}>
            <Text style={ui.eyebrow}>COFFEE NEST</Text>
            <Text style={styles.title}>Einstellungen</Text>
          </View>
          <Pressable
            onPress={isDirty ? handleSave : undefined}
            disabled={!isDirty}
            style={({ pressed }) => ({ opacity: isDirty ? (pressed ? 0.7 : 1) : 0.3 })}
          >
            <PaperCard variant="chip" shape={2} shadow={0} style={styles.saveChip} contentStyle={styles.iconBtnPad}>
              <Ionicons name="checkmark" size={22} color={COLORS.coffee800} />
            </PaperCard>
          </Pressable>
        </View>

        {/* ---------- BENUTZER ---------- */}
        <PaperCard variant="light" shape={1} shadow={1} style={styles.firstSection} contentStyle={styles.sectionPad}>
          <Text style={ui.eyebrow}>BENUTZER</Text>
          <View style={styles.sectionBody}>
            <View style={styles.fieldRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarInitial}>{(draft1.trim()[0] ?? "?").toUpperCase()}</Text>
              </View>
              <View style={styles.fieldContent}>
                <Text style={styles.fieldHint}>Person 1</Text>
                <TextInput
                  value={draft1}
                  onChangeText={setDraft1}
                  style={ui.input}
                  placeholder="Hase"
                  placeholderTextColor={COLORS.coffee600}
                  maxLength={20}
                  returnKeyType="next"
                  autoCorrect={false}
                />
              </View>
            </View>

            {user2active ? (
              <>
                <View style={[ui.divider, styles.rowDivider]} />
                <View style={styles.fieldRow}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarInitial}>{(draft2.trim()[0] ?? "?").toUpperCase()}</Text>
                  </View>
                  <View style={styles.fieldContent}>
                    <Text style={styles.fieldHint}>Person 2</Text>
                    <TextInput
                      value={draft2}
                      onChangeText={setDraft2}
                      style={ui.input}
                      placeholder="Dodo"
                      placeholderTextColor={COLORS.coffee600}
                      maxLength={20}
                      returnKeyType="done"
                      onSubmitEditing={isDirty ? handleSave : undefined}
                      autoCorrect={false}
                    />
                  </View>
                  <Pressable onPress={handleRemoveUser2} hitSlop={8} style={styles.iconBtn}>
                    <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
                  </Pressable>
                </View>
              </>
            ) : showAddUser2 ? (
              <>
                <View style={[ui.divider, styles.rowDivider]} />
                <View style={styles.fieldRow}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarInitial}>{(newUser2Draft.trim()[0] ?? "+").toUpperCase()}</Text>
                  </View>
                  <View style={styles.fieldContent}>
                    <Text style={styles.fieldHint}>Person 2</Text>
                    <TextInput
                      value={newUser2Draft}
                      onChangeText={setNewUser2Draft}
                      style={ui.input}
                      placeholder="Name eingeben"
                      placeholderTextColor={COLORS.coffee600}
                      maxLength={20}
                      returnKeyType="done"
                      onSubmitEditing={handleAddUser2}
                      autoFocus
                      autoCorrect={false}
                    />
                  </View>
                  <Pressable onPress={handleAddUser2} hitSlop={8} style={styles.iconBtn}>
                    <Ionicons name="checkmark" size={20} color={COLORS.accent400} />
                  </Pressable>
                  <Pressable onPress={() => { setShowAddUser2(false); setNewUser2Draft(""); }} hitSlop={8} style={styles.iconBtn}>
                    <Ionicons name="close" size={18} color={COLORS.coffee600} />
                  </Pressable>
                </View>
              </>
            ) : (
              <>
                <View style={[ui.divider, styles.rowDivider]} />
                <Pressable
                  onPress={() => setShowAddUser2(true)}
                  style={({ pressed }) => [styles.addUserRow, { opacity: pressed ? 0.6 : 1 }]}
                >
                  <View style={styles.avatar}>
                    <Ionicons name="add" size={22} color={COLORS.coffee800} />
                  </View>
                  <Text style={styles.addUserText}>Person 2 hinzufügen</Text>
                </Pressable>
              </>
            )}
          </View>
        </PaperCard>

        <Text style={styles.hint}>
          Die Namen werden überall in der App verwendet und lokal gespeichert.
        </Text>

        {/* ---------- KAFFEEMÜHLEN ---------- */}
        <PaperCard variant="light" shape={2} shadow={1} style={styles.section} contentStyle={styles.sectionPad}>
          <Text style={ui.eyebrow}>KAFFEEMÜHLEN</Text>
          <View style={styles.sectionBody}>
            {grinders.map((g, idx) => (
              <View key={g.name} style={[styles.grinderRow, idx > 0 && { marginTop: 12 }]}>
                <PaperTile source={grinderTileSource(g.design)} size={42} />
                <Text style={styles.grinderName} numberOfLines={1}>
                  {g.name}
                </Text>
                <Pressable
                  onPress={() => handleRemoveGrinder(g.name)}
                  hitSlop={12}
                  style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
                >
                  <Ionicons name="close-circle" size={20} color={COLORS.coffee600} />
                </Pressable>
              </View>
            ))}

            {grinders.length < 3 && (
              <View style={{ marginTop: grinders.length > 0 ? 20 : 4, gap: 14 }}>
                {/* FRAMELESS TILE PICKER — grinder design */}
                <View style={styles.grinderPickerRow}>
                  {(["commandante", "niche"] as GrinderDesign[]).map((d) => {
                    const active = newGrinderDesign === d;
                    return (
                      <Pressable
                        key={d}
                        onPress={() => { Haptics.selectionAsync(); setNewGrinderDesign(d); }}
                        style={({ pressed }) => ({ alignItems: "center", flex: 1, opacity: pressed ? 0.8 : 1 })}
                        accessibilityRole="button"
                        accessibilityState={{ selected: active }}
                      >
                        <PaperTile
                          source={grinderTileSource(d)}
                          size={56}
                          style={{ transform: [{ scale: active ? 1.0 : 0.84 }], opacity: active ? 1 : 0.4 }}
                        />
                        <View style={{ height: 3, width: active ? 18 : 0, borderRadius: 2, backgroundColor: COLORS.accent300, marginTop: 6 }} />
                        <Text
                          style={{
                            marginTop: 3,
                            fontSize: 12,
                            textAlign: "center",
                            fontFamily: active ? "Inter_600SemiBold" : "Inter_500Medium",
                            color: active ? COLORS.accent400 : COLORS.coffee600,
                          }}
                        >
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
                    style={[ui.input, { flex: 1 }]}
                    placeholder="Neue Mühle..."
                    placeholderTextColor={COLORS.coffee600}
                    maxLength={30}
                    returnKeyType="done"
                    onSubmitEditing={handleAddGrinder}
                    autoCorrect={false}
                  />
                  <Pressable
                    onPress={handleAddGrinder}
                    disabled={!newGrinder.trim()}
                    style={({ pressed }) => ({ opacity: newGrinder.trim() ? (pressed ? 0.7 : 1) : 0.3 })}
                  >
                    <PaperCard variant="chip" shape={2} shadow={0} style={styles.addGrinderBtn} contentStyle={styles.iconBtnPad}>
                      <Ionicons name="add" size={22} color={COLORS.coffee800} />
                    </PaperCard>
                  </Pressable>
                </View>
              </View>
            )}

            {grinders.length === 3 && (
              <Text style={styles.grinderLimit}>Maximal 3 Mühlen möglich</Text>
            )}
          </View>
        </PaperCard>

        <Text style={styles.hint}>Wähle beim Kaffee die verwendete Mühle aus.</Text>

        {/* ---------- DATENSICHERUNG ---------- */}
        <PaperCard variant="light" shape={3} shadow={1} style={styles.section} contentStyle={styles.sectionPad}>
          <Text style={ui.eyebrow}>DATENSICHERUNG</Text>
          <View style={styles.sectionBody}>
            <Pressable
              onPress={handleExport}
              disabled={exporting}
              style={({ pressed }) => [styles.dataRow, { opacity: pressed || exporting ? 0.6 : 1 }]}
            >
              <Ionicons name="arrow-up-circle-outline" size={26} color={COLORS.accent400} />
              <View style={styles.dataContent}>
                <Text style={styles.dataTitle}>Daten exportieren</Text>
                <Text style={styles.dataSubtitle}>Röstereien, Kaffees und Mühlen als JSON speichern</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={COLORS.coffee600} />
            </Pressable>

            <View style={[ui.divider, styles.rowDivider]} />

            <Pressable
              onPress={handleImport}
              disabled={importing}
              style={({ pressed }) => [styles.dataRow, { opacity: pressed || importing ? 0.6 : 1 }]}
            >
              <Ionicons name="arrow-down-circle-outline" size={26} color={COLORS.danger} />
              <View style={styles.dataContent}>
                <Text style={styles.dataTitle}>Daten importieren</Text>
                <Text style={styles.dataSubtitle}>Backup laden – überschreibt alle vorhandenen Daten</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={COLORS.coffee600} />
            </Pressable>
          </View>
        </PaperCard>

        <Text style={styles.hint}>Exportiere regelmäßig ein Backup um Datenverlust zu vermeiden.</Text>

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
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  headerLeft: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontFamily: FONTS.display,
    fontSize: 30,
    lineHeight: 36,
    color: COLORS.coffee800,
    marginTop: 4,
  },
  saveChip: {
    width: 48,
    height: 44,
  },
  iconBtnPad: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
  },
  firstSection: {
    marginTop: 22,
  },
  section: {
    marginTop: 18,
  },
  sectionPad: {
    padding: 20,
  },
  sectionBody: {
    marginTop: 14,
  },
  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.accentTile,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: {
    fontFamily: FONTS.display,
    fontSize: 18,
    color: COLORS.coffee800,
  },
  fieldContent: {
    flex: 1,
    gap: 6,
  },
  fieldHint: {
    fontSize: 11,
    letterSpacing: 0.3,
    color: COLORS.coffee600,
    fontFamily: "Inter_400Regular",
  },
  rowDivider: {
    marginVertical: 14,
  },
  iconBtn: {
    padding: 6,
  },
  addUserRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  addUserText: {
    flex: 1,
    fontSize: 15,
    color: COLORS.coffee700,
    fontFamily: "Inter_500Medium",
  },
  grinderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  grinderName: {
    flex: 1,
    fontSize: 19,
    color: COLORS.coffee800,
    fontFamily: FONTS.display,
  },
  grinderPickerRow: {
    flexDirection: "row",
    gap: 8,
  },
  addGrinderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  addGrinderBtn: {
    width: 48,
    height: 48,
  },
  grinderLimit: {
    fontSize: 12,
    marginTop: 14,
    color: COLORS.coffee600,
    fontFamily: "Inter_400Regular",
  },
  dataRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  dataContent: {
    flex: 1,
    gap: 2,
  },
  dataTitle: {
    fontSize: 16,
    color: COLORS.coffee800,
    fontFamily: "Inter_600SemiBold",
  },
  dataSubtitle: {
    fontSize: 12,
    color: COLORS.coffee600,
    fontFamily: "Inter_400Regular",
  },
  hint: {
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.coffee600,
    fontFamily: "Inter_400Regular",
    marginTop: 12,
    paddingHorizontal: 6,
  },
  iconContainer: {
    height: 200,
    marginTop: 24,
    overflow: "hidden",
  },
  appIcon: {
    width: "100%",
    height: "100%",
  },
});
