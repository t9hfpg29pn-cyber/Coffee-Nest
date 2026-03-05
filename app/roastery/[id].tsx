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
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import {
  getCoffees,
  saveCoffee,
  deleteCoffee,
  getRoasteries,
  updateRoastery,
  getGrinders,
  Coffee,
} from "@/lib/storage";
import Colors from "@/constants/colors";
import { useUserNames } from "@/context/UserNamesContext";

function RatingDots({ value, max }: { value: number; max: number }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = isDark ? Colors.dark : Colors.light;
  return (
    <View style={{ flexDirection: "row", gap: 3 }}>
      {Array.from({ length: max }).map((_, i) => (
        <View
          key={i}
          style={{
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: i < value ? colors.tint : colors.border,
          }}
        />
      ))}
    </View>
  );
}

export default function RoasteryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = isDark ? Colors.dark : Colors.light;

  const { name1, name2 } = useUserNames();
  const [coffees, setCoffees] = useState<Coffee[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showEditRoastery, setShowEditRoastery] = useState(false);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(true);

  const [roasteryName, setRoasteryName] = useState("");
  const [roasteryLocation, setRoasteryLocation] = useState("");
  const [editName, setEditName] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [defaultGrinder, setDefaultGrinder] = useState("");

  const load = useCallback(async () => {
    const [data, roasteries, grinders] = await Promise.all([
      getCoffees(id),
      getRoasteries(),
      getGrinders(),
    ]);
    setDefaultGrinder(grinders[0] ?? "");
    const roastery = roasteries.find((r) => r.id === id);
    if (roastery) {
      setRoasteryName(roastery.name);
      setRoasteryLocation(roastery.location ?? "");
    }
    setCoffees(
      data.sort((a, b) => {
        const avgA = (a.haseRating + a.dodoRating) / 2;
        const avgB = (b.haseRating + b.dodoRating) / 2;
        return avgB - avgA;
      })
    );
    setLoading(false);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleAdd = async () => {
    if (!newName.trim()) return;
    await saveCoffee({
      roasteryId: id,
      name: newName.trim(),
      haseRating: 5,
      dodoRating: 5,
      grinderName: defaultGrinder,
      grindLevel: 0,
      aroma: 3,
      aromaDescription: "",
      notes: "",
      pricePerKg: "",
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setNewName("");
    setShowModal(false);
    load();
  };

  const handleDelete = (item: Coffee) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert("Kaffee löschen", `Möchtest du "${item.name}" löschen?`, [
      { text: "Abbrechen", style: "cancel" },
      {
        text: "Löschen",
        style: "destructive",
        onPress: async () => {
          await deleteCoffee(item.id);
          load();
        },
      },
    ]);
  };

  const openEditRoastery = () => {
    setEditName(roasteryName);
    setEditLocation(roasteryLocation);
    setShowEditRoastery(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSaveRoastery = async () => {
    if (!editName.trim()) return;
    await updateRoastery(id, editName.trim(), editLocation.trim() || undefined);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setRoasteryName(editName.trim());
    setRoasteryLocation(editLocation.trim());
    setShowEditRoastery(false);
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backButton, { opacity: pressed ? 0.6 : 1 }]}
        >
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </Pressable>
        <Pressable
          onPress={openEditRoastery}
          style={({ pressed }) => [styles.headerCenter, { opacity: pressed ? 0.7 : 1 }]}
        >
          <Text style={[styles.headerLabel, { color: colors.textSecondary, fontFamily: "Inter_500Medium" }]}>
            RÖSTEREI
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Text
              style={[styles.headerTitle, { color: colors.text, fontFamily: "Inter_700Bold" }]}
              numberOfLines={1}
            >
              {roasteryName}
            </Text>
            <Ionicons name="pencil-outline" size={16} color={colors.textSecondary} style={{ marginBottom: 2 }} />
          </View>
        </Pressable>
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
        </View>
      ) : coffees.length === 0 ? (
        <View style={styles.centerState}>
          <Ionicons name="leaf-outline" size={52} color={colors.textSecondary} />
          <Text style={[styles.emptyTitle, { color: colors.text, fontFamily: "Inter_600SemiBold" }]}>
            Noch keine Kaffees
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary, fontFamily: "Inter_400Regular" }]}>
            Tippe auf + um einen Kaffee hinzuzufügen
          </Text>
        </View>
      ) : (
        <FlatList
          data={coffees}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 20, paddingBottom: bottomPad + 20 }}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push({
                  pathname: "/coffee/[id]",
                  params: { id: item.id },
                });
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
              <View style={styles.cardTop}>
                <View style={[styles.cardIcon, { backgroundColor: colors.tint + "20" }]}>
                  <Ionicons name="leaf" size={20} color={colors.tint} />
                </View>
                <View style={styles.cardMain}>
                  <Text style={[styles.cardTitle, { color: colors.text, fontFamily: "Inter_600SemiBold" }]}>
                    {item.name}
                  </Text>
                  {item.pricePerKg ? (
                    <Text style={[styles.cardPrice, { color: colors.textSecondary, fontFamily: "Inter_500Medium" }]}>
                      {item.pricePerKg} €/kg
                    </Text>
                  ) : null}
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
              </View>
              <View style={[styles.cardDivider, { backgroundColor: colors.border }]} />
              <View style={styles.cardRatings}>
                <View style={styles.ratingRow}>
                  <Text style={[styles.ratingLabel, { color: colors.textSecondary, fontFamily: "Inter_500Medium" }]}>
                    {name1}
                  </Text>
                  <View style={styles.ratingValue}>
                    <Text style={[styles.ratingNum, { color: colors.tint, fontFamily: "Inter_700Bold" }]}>
                      {item.haseRating}
                    </Text>
                    <Text style={[styles.ratingMax, { color: colors.textSecondary, fontFamily: "Inter_400Regular" }]}>
                      /10
                    </Text>
                  </View>
                </View>
                <View style={[styles.ratingDivider, { backgroundColor: colors.border }]} />
                <View style={styles.ratingRow}>
                  <Text style={[styles.ratingLabel, { color: colors.textSecondary, fontFamily: "Inter_500Medium" }]}>
                    {name2}
                  </Text>
                  <View style={styles.ratingValue}>
                    <Text style={[styles.ratingNum, { color: colors.tint, fontFamily: "Inter_700Bold" }]}>
                      {item.dodoRating}
                    </Text>
                    <Text style={[styles.ratingMax, { color: colors.textSecondary, fontFamily: "Inter_400Regular" }]}>
                      /10
                    </Text>
                  </View>
                </View>
              </View>
            </Pressable>
          )}
        />
      )}

      {/* Modal: Neuer Kaffee */}
      <Modal visible={showModal} animationType="slide" transparent presentationStyle="overFullScreen">
        <KeyboardAvoidingView behavior="padding" style={{ flex: 1, justifyContent: "flex-end" }}>
          <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)" }} onPress={() => setShowModal(false)} />
          <View style={[styles.modalSheet, { backgroundColor: colors.surfaceElevated, paddingBottom: bottomPad + 20 }]}>
            <View style={styles.modalHandle} />
            <Text style={[styles.modalTitle, { color: colors.text, fontFamily: "Inter_700Bold" }]}>
              Neuer Kaffee
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
              placeholder="z.B. Ethiopia Yirgacheffe"
              placeholderTextColor={colors.textSecondary}
              value={newName}
              onChangeText={setNewName}
              autoFocus
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

      {/* Modal: Rösterei bearbeiten */}
      <Modal visible={showEditRoastery} animationType="slide" transparent presentationStyle="overFullScreen">
        <KeyboardAvoidingView behavior="padding" style={{ flex: 1, justifyContent: "flex-end" }}>
          <Pressable
            style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)" }}
            onPress={() => setShowEditRoastery(false)}
          />
          <View style={[styles.modalSheet, { backgroundColor: colors.surfaceElevated, paddingBottom: bottomPad + 20 }]}>
            <View style={styles.modalHandle} />
            <Text style={[styles.modalTitle, { color: colors.text, fontFamily: "Inter_700Bold" }]}>
              Rösterei bearbeiten
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
              placeholder="Name der Rösterei"
              placeholderTextColor={colors.textSecondary}
              value={editName}
              onChangeText={setEditName}
              autoFocus
              returnKeyType="next"
            />
            <Text style={[styles.inputLabel, { color: colors.textSecondary, fontFamily: "Inter_500Medium" }]}>
              Ort
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
              value={editLocation}
              onChangeText={setEditLocation}
              returnKeyType="done"
              onSubmitEditing={handleSaveRoastery}
            />
            <Pressable
              onPress={handleSaveRoastery}
              style={({ pressed }) => [
                styles.saveButton,
                {
                  backgroundColor: editName.trim() ? colors.tint : colors.border,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
              disabled={!editName.trim()}
            >
              <Text style={[styles.saveButtonText, { fontFamily: "Inter_600SemiBold" }]}>
                Speichern
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
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  backButton: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 2,
  },
  headerCenter: { flex: 1 },
  headerLabel: {
    fontSize: 11,
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 28,
    lineHeight: 34,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 2,
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
    height: 100,
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 12,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  cardMain: { flex: 1, gap: 2 },
  cardTitle: { fontSize: 16 },
  cardPrice: { fontSize: 13 },
  cardDivider: { height: 1, marginHorizontal: 16 },
  cardRatings: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 0,
  },
  ratingRow: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  ratingLabel: {
    fontSize: 11,
    letterSpacing: 0.5,
  },
  ratingValue: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  ratingNum: {
    fontSize: 22,
  },
  ratingMax: {
    fontSize: 13,
  },
  ratingDivider: {
    width: 1,
    marginVertical: 4,
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
