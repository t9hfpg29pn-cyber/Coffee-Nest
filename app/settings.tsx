import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Image,
  ScrollView,
  useColorScheme,
  Platform,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useUserNames } from "@/context/UserNamesContext";
import { getRoasteries, getAllCoffees } from "@/lib/storage";
import Colors from "@/constants/colors";

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
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = isDark ? Colors.dark : Colors.light;

  const { name1, name2, setName1, setName2 } = useUserNames();
  const [draft1, setDraft1] = useState(name1);
  const [draft2, setDraft2] = useState(name2);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<any>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const isDirty = draft1.trim() !== name1 || draft2.trim() !== name2;

  const handleSave = async () => {
    if (!draft1.trim() || !draft2.trim()) {
      showAlert("Hinweis", "Namen dürfen nicht leer sein.");
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await setName1(draft1.trim());
    await setName2(draft2.trim());
    router.back();
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const roasteries = await getRoasteries();
      const coffees = await getAllCoffees();
      const data = JSON.stringify({ roasteries, coffees }, null, 2);
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
      showAlert(
        "Daten importieren",
        `${data.roasteries.length} Röstereien und ${data.coffees.length} Kaffees werden importiert. Alle vorhandenen Daten werden überschrieben.`,
        [
          { text: "Abbrechen", style: "cancel" },
          {
            text: "Importieren",
            style: "destructive",
            onPress: async () => {
              await AsyncStorage.setItem("roasteries", JSON.stringify(data.roasteries));
              await AsyncStorage.setItem("coffees", JSON.stringify(data.coffees));
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
        const text = await FileSystem.readAsStringAsync(result.assets[0].uri);
        await processImport(text);
      }
    } catch {
      showAlert("Fehler", "Import fehlgeschlagen.");
      setImporting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.6 : 1 }]}
          hitSlop={12}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text, fontFamily: "Inter_700Bold" }]}>
          Einstellungen
        </Text>
        <Pressable
          onPress={isDirty ? handleSave : undefined}
          style={({ pressed }) => [
            styles.saveBtn,
            {
              opacity: isDirty ? (pressed ? 0.7 : 1) : 0.3,
              backgroundColor: colors.tint,
            },
          ]}
          disabled={!isDirty}
        >
          <Text style={[styles.saveBtnText, { fontFamily: "Inter_600SemiBold" }]}>
            Speichern
          </Text>
        </Pressable>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: bottomPad + 20 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.section, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary, fontFamily: "Inter_500Medium" }]}>
            NAMEN DER BENUTZER
          </Text>

          <View style={[styles.fieldRow, { borderBottomColor: colors.border }]}>
            <View style={[styles.avatar, { backgroundColor: colors.tint + "22" }]}>
              <Text style={[styles.avatarText, { color: colors.tint, fontFamily: "Inter_700Bold" }]}>
                {(draft1.trim()[0] ?? "?").toUpperCase()}
              </Text>
            </View>
            <View style={styles.fieldContent}>
              <Text style={[styles.fieldHint, { color: colors.textSecondary, fontFamily: "Inter_400Regular" }]}>
                Person 1
              </Text>
              <TextInput
                value={draft1}
                onChangeText={setDraft1}
                style={[styles.input, { color: colors.text, fontFamily: "Inter_500Medium" }]}
                placeholder="Hase"
                placeholderTextColor={colors.textSecondary}
                maxLength={20}
                returnKeyType="next"
                autoCorrect={false}
              />
            </View>
          </View>

          <View style={[styles.fieldRow, { borderBottomColor: "transparent" }]}>
            <View style={[styles.avatar, { backgroundColor: colors.tint + "22" }]}>
              <Text style={[styles.avatarText, { color: colors.tint, fontFamily: "Inter_700Bold" }]}>
                {(draft2.trim()[0] ?? "?").toUpperCase()}
              </Text>
            </View>
            <View style={styles.fieldContent}>
              <Text style={[styles.fieldHint, { color: colors.textSecondary, fontFamily: "Inter_400Regular" }]}>
                Person 2
              </Text>
              <TextInput
                value={draft2}
                onChangeText={setDraft2}
                style={[styles.input, { color: colors.text, fontFamily: "Inter_500Medium" }]}
                placeholder="Dodo"
                placeholderTextColor={colors.textSecondary}
                maxLength={20}
                returnKeyType="done"
                onSubmitEditing={isDirty ? handleSave : undefined}
                autoCorrect={false}
              />
            </View>
          </View>
        </View>

        <Text style={[styles.hint, { color: colors.textSecondary, fontFamily: "Inter_400Regular" }]}>
          Die Namen werden überall in der App verwendet und lokal gespeichert.
        </Text>

        <View style={[styles.section, { backgroundColor: colors.surfaceElevated, borderColor: colors.border, marginTop: 24 }]}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary, fontFamily: "Inter_500Medium" }]}>
            DATENSICHERUNG
          </Text>

          <Pressable
            onPress={handleExport}
            disabled={exporting}
            style={({ pressed }) => [
              styles.dataRow,
              { borderBottomColor: colors.border, opacity: pressed || exporting ? 0.6 : 1 },
            ]}
          >
            <View style={[styles.dataIcon, { backgroundColor: colors.tint + "20" }]}>
              <Ionicons name="arrow-up-circle-outline" size={22} color={colors.tint} />
            </View>
            <View style={styles.fieldContent}>
              <Text style={[styles.dataTitle, { color: colors.text, fontFamily: "Inter_600SemiBold" }]}>
                Daten exportieren
              </Text>
              <Text style={[styles.dataSubtitle, { color: colors.textSecondary, fontFamily: "Inter_400Regular" }]}>
                Alle Röstereien und Kaffees als JSON speichern
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
          </Pressable>

          <Pressable
            onPress={handleImport}
            disabled={importing}
            style={({ pressed }) => [
              styles.dataRow,
              { borderBottomColor: "transparent", opacity: pressed || importing ? 0.6 : 1 },
            ]}
          >
            <View style={[styles.dataIcon, { backgroundColor: "#E05252" + "20" }]}>
              <Ionicons name="arrow-down-circle-outline" size={22} color="#E05252" />
            </View>
            <View style={styles.fieldContent}>
              <Text style={[styles.dataTitle, { color: colors.text, fontFamily: "Inter_600SemiBold" }]}>
                Daten importieren
              </Text>
              <Text style={[styles.dataSubtitle, { color: colors.textSecondary, fontFamily: "Inter_400Regular" }]}>
                Backup laden – überschreibt alle vorhandenen Daten
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
          </Pressable>
        </View>

        <Text style={[styles.hint, { color: colors.textSecondary, fontFamily: "Inter_400Regular", marginTop: 8 }]}>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  backBtn: {
    marginRight: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 22,
  },
  saveBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  saveBtnText: {
    color: "#fff",
    fontSize: 14,
  },
  section: {
    marginHorizontal: 20,
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 11,
    letterSpacing: 1.5,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
  },
  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  dataRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  dataIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  dataTitle: {
    fontSize: 15,
  },
  dataSubtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 16,
  },
  fieldContent: {
    flex: 1,
    gap: 2,
  },
  fieldHint: {
    fontSize: 11,
  },
  input: {
    fontSize: 17,
    paddingVertical: 0,
  },
  hint: {
    fontSize: 12,
    marginHorizontal: 20,
    lineHeight: 18,
    marginBottom: 8,
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
