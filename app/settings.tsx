import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Image,
  useColorScheme,
  Platform,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useUserNames } from "@/context/UserNamesContext";
import Colors from "@/constants/colors";

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = isDark ? Colors.dark : Colors.light;

  const { name1, name2, setName1, setName2 } = useUserNames();
  const [draft1, setDraft1] = useState(name1);
  const [draft2, setDraft2] = useState(name2);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const isDirty = draft1.trim() !== name1 || draft2.trim() !== name2;

  const handleSave = async () => {
    if (!draft1.trim() || !draft2.trim()) {
      Alert.alert("Hinweis", "Namen dürfen nicht leer sein.");
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await setName1(draft1.trim());
    await setName2(draft2.trim());
    router.back();
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

      <View style={styles.iconContainer}>
        <Image
          source={require("../assets/images/icon.png")}
          style={styles.appIcon}
          resizeMode="contain"
        />
      </View>
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
    marginBottom: 16,
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
    flex: 1,
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  appIcon: {
    width: "100%",
    height: "100%",
  },
});
