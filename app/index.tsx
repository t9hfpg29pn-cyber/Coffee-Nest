import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  TextInput,
  Modal,
  Alert,
  useColorScheme,
  Platform,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { Ionicons, Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { getRoasteries, saveRoastery, deleteRoastery, getCoffees, Roastery } from "@/lib/storage";
import Colors from "@/constants/colors";

export default function RoasteriesScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = isDark ? Colors.dark : Colors.light;

  const [roasteries, setRoasteries] = useState<Roastery[]>([]);
  const [coffeeCounts, setCoffeeCounts] = useState<Record<string, number>>({});
  const [avgRatings, setAvgRatings] = useState<Record<string, { hase: number; dodo: number } | null>>({});
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const data = await getRoasteries();
    setRoasteries(data.reverse());
    const counts: Record<string, number> = {};
    const avgs: Record<string, { hase: number; dodo: number } | null> = {};
    for (const r of data) {
      const coffees = await getCoffees(r.id);
      counts[r.id] = coffees.length;
      if (coffees.length > 0) {
        const hase = coffees.reduce((sum, c) => sum + c.haseRating, 0) / coffees.length;
        const dodo = coffees.reduce((sum, c) => sum + c.dodoRating, 0) / coffees.length;
        avgs[r.id] = { hase: Math.round(hase * 10) / 10, dodo: Math.round(dodo * 10) / 10 };
      } else {
        avgs[r.id] = null;
      }
    }
    setCoffeeCounts(counts);
    setAvgRatings(avgs);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleAdd = async () => {
    if (!newName.trim()) return;
    await saveRoastery(newName.trim(), newLocation.trim() || undefined);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setNewName("");
    setNewLocation("");
    setShowModal(false);
    load();
  };

  const handleDelete = (item: Roastery) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      "Rösterei löschen",
      `Möchtest du "${item.name}" und alle zugehörigen Kaffees löschen?`,
      [
        { text: "Abbrechen", style: "cancel" },
        {
          text: "Löschen",
          style: "destructive",
          onPress: async () => {
            await deleteRoastery(item.id);
            load();
          },
        },
      ]
    );
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <View>
          <Text style={[styles.headerLabel, { color: colors.textSecondary, fontFamily: "Inter_500Medium" }]}>
            KAFFEE JOURNAL
          </Text>
          <Text style={[styles.headerTitle, { color: colors.text, fontFamily: "Inter_700Bold" }]}>
            Röstereien
          </Text>
        </View>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowModal(true);
          }}
          style={({ pressed }) => [
            styles.addButton,
            { backgroundColor: colors.tint, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Ionicons name="add" size={22} color="#fff" />
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.centerState}>
          <View style={[styles.skeletonCard, { backgroundColor: colors.surface }]} />
          <View style={[styles.skeletonCard, { backgroundColor: colors.surface, opacity: 0.6 }]} />
          <View style={[styles.skeletonCard, { backgroundColor: colors.surface, opacity: 0.3 }]} />
        </View>
      ) : roasteries.length === 0 ? (
        <View style={styles.centerState}>
          <Ionicons name="cafe-outline" size={52} color={colors.textSecondary} />
          <Text style={[styles.emptyTitle, { color: colors.text, fontFamily: "Inter_600SemiBold" }]}>
            Noch keine Röstereien
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary, fontFamily: "Inter_400Regular" }]}>
            Tippe auf + um deine erste Rösterei hinzuzufügen
          </Text>
        </View>
      ) : (
        <FlatList
          data={roasteries}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 20, paddingBottom: bottomPad + 20 }}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push({ pathname: "/roastery/[id]", params: { id: item.id, name: item.name } });
              }}
              onLongPress={() => handleDelete(item)}
              style={({ pressed }) => [
                styles.card,
                {
                  backgroundColor: colors.surfaceElevated,
                  borderColor: colors.border,
                  opacity: pressed ? 0.92 : 1,
                  transform: [{ scale: pressed ? 0.985 : 1 }],
                },
              ]}
            >
              <View style={[styles.cardIcon, { backgroundColor: colors.tint + "20" }]}>
                <Ionicons name="cafe" size={22} color={colors.tint} />
              </View>
              <View style={styles.cardContent}>
                <Text style={[styles.cardTitle, { color: colors.text, fontFamily: "Inter_600SemiBold" }]}>
                  {item.name}
                </Text>
                {item.location ? (
                  <Text style={[styles.cardLocation, { color: colors.textSecondary, fontFamily: "Inter_400Regular" }]}>
                    {item.location}
                  </Text>
                ) : null}
                <Text style={[styles.cardCount, { color: colors.textSecondary, fontFamily: "Inter_400Regular" }]}>
                  {coffeeCounts[item.id] ?? 0} {coffeeCounts[item.id] === 1 ? "Kaffee" : "Kaffees"}
                </Text>
                {avgRatings[item.id] ? (
                  <View style={styles.avgRow}>
                    <View style={styles.avgChip}>
                      <Text style={[styles.avgLabel, { color: colors.textSecondary, fontFamily: "Inter_500Medium" }]}>
                        Hase
                      </Text>
                      <Text style={[styles.avgValue, { color: colors.tint, fontFamily: "Inter_700Bold" }]}>
                        {avgRatings[item.id]!.hase}
                      </Text>
                    </View>
                    <View style={[styles.avgDivider, { backgroundColor: colors.border }]} />
                    <View style={styles.avgChip}>
                      <Text style={[styles.avgLabel, { color: colors.textSecondary, fontFamily: "Inter_500Medium" }]}>
                        Dodo
                      </Text>
                      <Text style={[styles.avgValue, { color: colors.tint, fontFamily: "Inter_700Bold" }]}>
                        {avgRatings[item.id]!.dodo}
                      </Text>
                    </View>
                  </View>
                ) : null}
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
            </Pressable>
          )}
        />
      )}

      <Modal visible={showModal} animationType="slide" transparent presentationStyle="overFullScreen">
        <KeyboardAvoidingView behavior="padding" style={{ flex: 1, justifyContent: "flex-end" }}>
          <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)" }} onPress={() => setShowModal(false)} />
        <View style={[styles.modalSheet, { backgroundColor: colors.surfaceElevated, paddingBottom: bottomPad + 20 }]}>
          <View style={styles.modalHandle} />
          <Text style={[styles.modalTitle, { color: colors.text, fontFamily: "Inter_700Bold" }]}>
            Neue Rösterei
          </Text>

          <Text style={[styles.inputLabel, { color: colors.textSecondary, fontFamily: "Inter_500Medium" }]}>
            Name *
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                color: colors.text,
                fontFamily: "Inter_400Regular",
              },
            ]}
            placeholder="z.B. Bonanza Coffee"
            placeholderTextColor={colors.textSecondary}
            value={newName}
            onChangeText={setNewName}
            autoFocus
          />

          <Text style={[styles.inputLabel, { color: colors.textSecondary, fontFamily: "Inter_500Medium" }]}>
            Ort (optional)
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                color: colors.text,
                fontFamily: "Inter_400Regular",
              },
            ]}
            placeholder="z.B. Berlin"
            placeholderTextColor={colors.textSecondary}
            value={newLocation}
            onChangeText={setNewLocation}
            returnKeyType="done"
            onSubmitEditing={handleAdd}
          />

          <Pressable
            onPress={handleAdd}
            style={({ pressed }) => [
              styles.saveButton,
              {
                backgroundColor: newName.trim() ? colors.tint : colors.border,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
            disabled={!newName.trim()}
          >
            <Text style={[styles.saveButtonText, { fontFamily: "Inter_600SemiBold" }]}>
              Hinzufügen
            </Text>
          </Pressable>
        </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerLabel: {
    fontSize: 11,
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 32,
    lineHeight: 38,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  centerState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    textAlign: "center",
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },
  skeletonCard: {
    width: "100%",
    height: 80,
    borderRadius: 16,
    marginHorizontal: 20,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 14,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  cardContent: { flex: 1, gap: 2 },
  cardTitle: { fontSize: 17 },
  cardLocation: { fontSize: 13 },
  cardCount: { fontSize: 13 },
  avgRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    gap: 10,
  },
  avgChip: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  avgLabel: {
    fontSize: 11,
    letterSpacing: 0.3,
  },
  avgValue: {
    fontSize: 15,
  },
  avgDivider: {
    width: 1,
    height: 12,
  },
  modalOverlay: {
    flex: 1,
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingTop: 12,
    gap: 4,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D0C4B0",
    alignSelf: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    letterSpacing: 0.5,
    marginTop: 8,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    marginBottom: 4,
  },
  saveButton: {
    marginTop: 16,
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
  },
});
