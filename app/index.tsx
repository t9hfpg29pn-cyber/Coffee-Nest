import React, { useState, useCallback, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  TextInput,
  Modal,
  Alert,
  Image,
  Platform,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { Ionicons, Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { getRoasteries, saveRoastery, deleteRoastery, getCoffees, Roastery } from "@/lib/storage";
import { useUserNames } from "@/context/UserNamesContext";
import { useThemeColors, useCardExtras } from "@/context/ThemeContext";
import { PolyBackground, PolyCornerCut, PolyActionButton } from "@/components/PolyBackground";

export default function RoasteriesScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const cardExtras = useCardExtras();

  const { name1, name2, user2active } = useUserNames();
  const [roasteries, setRoasteries] = useState<Roastery[]>([]);
  const [coffeeCounts, setCoffeeCounts] = useState<Record<string, number>>({});
  const [avgRatings, setAvgRatings] = useState<Record<string, { hase: number | null; dodo: number | null } | null>>({});
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const filterBtnRef = useRef<View>(null);
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [loading, setLoading] = useState(true);

  const cities = useMemo(() => {
    const seen = new Set<string>();
    for (const r of roasteries) {
      if (r.location?.trim()) seen.add(r.location.trim());
    }
    return Array.from(seen).sort();
  }, [roasteries]);

  const filteredRoasteries = useMemo(() => {
    if (!selectedCity) return roasteries;
    return roasteries.filter((r) => r.location?.trim() === selectedCity);
  }, [roasteries, selectedCity]);

  const load = useCallback(async () => {
    const data = await getRoasteries();
    const counts: Record<string, number> = {};
    const avgs: Record<string, { hase: number | null; dodo: number | null } | null> = {};
    for (const r of data) {
      const coffees = await getCoffees(r.id);
      counts[r.id] = coffees.length;
      if (coffees.length > 0) {
        const haseVals = coffees.map((c) => c.haseRating).filter((v): v is number => v !== null);
        const dodoVals = coffees.map((c) => c.dodoRating).filter((v): v is number => v !== null);
        const hase = haseVals.length > 0 ? Math.round((haseVals.reduce((s, v) => s + v, 0) / haseVals.length) * 10) / 10 : null;
        const dodo = dodoVals.length > 0 ? Math.round((dodoVals.reduce((s, v) => s + v, 0) / dodoVals.length) * 10) / 10 : null;
        avgs[r.id] = hase !== null || dodo !== null ? { hase, dodo } : null;
      } else {
        avgs[r.id] = null;
      }
    }
    data.sort((a, b) => (counts[b.id] ?? 0) - (counts[a.id] ?? 0));
    setRoasteries(data);
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

  const openDropdown = () => {
    filterBtnRef.current?.measureInWindow((x, y, _w, h) => {
      setDropdownPos({ top: y + h + 6, left: x });
      setShowDropdown(true);
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <PolyBackground />
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <View style={styles.headerLeft}>
          <Image
            source={require("../assets/images/icon.png")}
            style={styles.headerLogo}
          />
          <View style={styles.headerTextBlock}>
          <Text style={[styles.headerLabel, { color: colors.textSecondary, fontFamily: "Inter_500Medium" }]}>
            COFFEE NEST
          </Text>
          <View style={styles.headerTitleRow}>
            <Text style={[styles.headerTitle, { color: colors.text, fontFamily: "Inter_700Bold" }]}>
              Röstereien
            </Text>
            {!loading && cities.length >= 2 && (
              <Pressable
                ref={filterBtnRef}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  openDropdown();
                }}
                style={({ pressed }) => [
                  styles.filterButton,
                  {
                    backgroundColor: selectedCity ? colors.tint : colors.surfaceElevated,
                    borderColor: selectedCity ? colors.tint : colors.border,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    {
                      color: selectedCity ? "#fff" : colors.textSecondary,
                      fontFamily: "Inter_500Medium",
                    },
                  ]}
                >
                  {selectedCity ?? "Alle"}
                </Text>
                <Ionicons
                  name="chevron-down"
                  size={13}
                  color={selectedCity ? "#fff" : colors.textSecondary}
                />
              </Pressable>
            )}
          </View>
          </View>
        </View>
        <Pressable
          testID="add-roastery-btn"
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

      {/* Dropdown Modal */}
      <Modal visible={showDropdown} transparent animationType="fade">
        <Pressable style={styles.dropdownOverlay} onPress={() => setShowDropdown(false)}>
          <View
            style={[
              styles.dropdownMenu,
              {
                top: dropdownPos.top,
                left: dropdownPos.left,
                backgroundColor: colors.surfaceElevated,
                borderColor: colors.border,
              },
            ]}
          >
            <Pressable
              onPress={() => {
                Haptics.selectionAsync();
                setSelectedCity(null);
                setShowDropdown(false);
              }}
              style={({ pressed }) => [
                styles.dropdownItem,
                {
                  backgroundColor: !selectedCity
                    ? colors.tint + "18"
                    : pressed
                    ? colors.surface
                    : "transparent",
                },
              ]}
            >
              <Text
                style={[
                  styles.dropdownItemText,
                  {
                    color: !selectedCity ? colors.tint : colors.text,
                    fontFamily: !selectedCity ? "Inter_600SemiBold" : "Inter_400Regular",
                  },
                ]}
              >
                Alle
              </Text>
              {!selectedCity && (
                <Ionicons name="checkmark" size={15} color={colors.tint} />
              )}
            </Pressable>
            {cities.map((city, idx) => (
              <Pressable
                key={city}
                onPress={() => {
                  Haptics.selectionAsync();
                  setSelectedCity(city);
                  setShowDropdown(false);
                }}
                style={({ pressed }) => [
                  styles.dropdownItem,
                  idx < cities.length - 1 && styles.dropdownItemBorder,
                  {
                    backgroundColor:
                      selectedCity === city
                        ? colors.tint + "18"
                        : pressed
                        ? colors.surface
                        : "transparent",
                    borderTopColor: colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.dropdownItemText,
                    {
                      color: selectedCity === city ? colors.tint : colors.text,
                      fontFamily: selectedCity === city ? "Inter_600SemiBold" : "Inter_400Regular",
                    },
                  ]}
                >
                  {city}
                </Text>
                {selectedCity === city && (
                  <Ionicons name="checkmark" size={15} color={colors.tint} />
                )}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>

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
      ) : filteredRoasteries.length === 0 ? (
        <View style={styles.centerState}>
          <Ionicons name="location-outline" size={52} color={colors.textSecondary} />
          <Text style={[styles.emptyTitle, { color: colors.text, fontFamily: "Inter_600SemiBold" }]}>
            Keine Röstereien in {selectedCity}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredRoasteries}
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
                cardExtras.shadow,
                {
                  backgroundColor: colors.surfaceElevated,
                  borderColor: colors.border,
                  borderTopColor: cardExtras.topHighlight,
                  borderRadius: cardExtras.cardRadius,
                  overflow: "hidden" as const,
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
                    <Text style={[styles.avgScoreLabel, { color: colors.textSecondary, fontFamily: "Inter_500Medium" }]}>
                      ⌀ Score
                    </Text>
                    <View style={[styles.avgDivider, { backgroundColor: colors.border }]} />
                    {avgRatings[item.id]!.hase !== null && (
                      <>
                        <View style={styles.avgChip}>
                          <Text style={[styles.avgLabel, { color: colors.textSecondary, fontFamily: "Inter_500Medium" }]}>
                            {name1}
                          </Text>
                          <Text style={[styles.avgValue, { color: colors.tint, fontFamily: "Inter_700Bold" }]}>
                            {avgRatings[item.id]!.hase}
                          </Text>
                        </View>
                        {user2active && avgRatings[item.id]!.dodo !== null && (
                          <View style={[styles.avgDivider, { backgroundColor: colors.border }]} />
                        )}
                      </>
                    )}
                    {user2active && avgRatings[item.id]!.dodo !== null && (
                      <View style={styles.avgChip}>
                        <Text style={[styles.avgLabel, { color: colors.textSecondary, fontFamily: "Inter_500Medium" }]}>
                          {name2}
                        </Text>
                        <Text style={[styles.avgValue, { color: colors.tint, fontFamily: "Inter_700Bold" }]}>
                          {avgRatings[item.id]!.dodo}
                        </Text>
                      </View>
                    )}
                  </View>
                ) : null}
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
              <PolyCornerCut />
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
                borderRadius: cardExtras.cardRadius,
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
                borderRadius: cardExtras.cardRadius,
              },
            ]}
            placeholder="z.B. Berlin"
            placeholderTextColor={colors.textSecondary}
            value={newLocation}
            onChangeText={setNewLocation}
            returnKeyType="done"
            onSubmitEditing={handleAdd}
          />

          <PolyActionButton
            onPress={handleAdd}
            disabled={!newName.trim()}
            color={newName.trim() ? colors.tint : colors.border}
            style={styles.saveButton}
          >
            <Text style={[styles.saveButtonText, { fontFamily: "Inter_600SemiBold" }]}>
              Hinzufügen
            </Text>
          </PolyActionButton>
        </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Floating settings button */}
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push("/settings");
        }}
        style={({ pressed }) => [
          styles.fabSettings,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            bottom: bottomPad + 20,
            opacity: pressed ? 0.7 : 1,
          },
        ]}
        hitSlop={8}
      >
        <Ionicons name="settings-outline" size={18} color={colors.textSecondary} />
      </Pressable>
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
  fabSettings: {
    position: "absolute",
    right: 20,
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  headerLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 12,
  },
  headerLogo: {
    width: 44,
    height: 44,
    borderRadius: 10,
    marginBottom: 4,
  },
  headerTextBlock: {
    flex: 1,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
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
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1.5,
    marginBottom: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  filterButtonText: {
    fontSize: 13,
  },
  dropdownOverlay: {
    flex: 1,
  },
  dropdownMenu: {
    position: "absolute",
    minWidth: 140,
    borderRadius: 12,
    borderWidth: 1.5,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 12,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  dropdownItemBorder: {
    borderTopWidth: 1,
  },
  dropdownItemText: {
    fontSize: 14,
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
  avgScoreLabel: {
    fontSize: 11,
    letterSpacing: 0.3,
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
