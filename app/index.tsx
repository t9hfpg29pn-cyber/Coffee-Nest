import React, { useState, useCallback, useMemo, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  TextInput,
  Modal,
  Alert,
  Platform,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { Ionicons, Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getRoasteries, saveRoastery, deleteRoastery, getCoffees, Roastery, getDiscoveryStats, DiscoveryStats, getDiscoveryFact, DiscoveryFact } from "@/lib/storage";
import { useUserNames } from "@/context/UserNamesContext";
import { useThemeColors, useCardExtras } from "@/context/ThemeContext";
import { PolyBackground, PolyActionButton } from "@/components/PolyBackground";
import { TornDefs, TornSheet, TornBox, Grain, Hairline } from "@/components/TornPaper";
import { CompassIcon } from "@/components/CoffeeIcons";

const SERIF_BLACK = "PlayfairDisplay_800ExtraBold";
const SERIF_BOLD = "PlayfairDisplay_700Bold";
const SERIF_MED = "PlayfairDisplay_500Medium";

// Varied torn seeds so adjacent roastery sheets never share a silhouette.
const LIST_SEEDS = [2, 5, 8, 12, 15, 7, 9, 13, 16, 3];

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
  const [discoveryStats, setDiscoveryStats] = useState<DiscoveryStats | null>(null);
  const [discoveryFact, setDiscoveryFact] = useState<DiscoveryFact | null>(null);
  const [factCollapsed, setFactCollapsed] = useState(false);
  const [factDismissed, setFactDismissed] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem("discovery_card_collapsed").then((collapsed) => {
      if (collapsed === "true") setFactCollapsed(true);
    });
  }, []);

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
    getDiscoveryStats().then(setDiscoveryStats);
    getDiscoveryFact().then(setDiscoveryFact);
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
  const bottomPad = Platform.OS === "web" ? 0 : insets.bottom;

  const openDropdown = () => {
    filterBtnRef.current?.measureInWindow((x, y, _w, h) => {
      setDropdownPos({ top: y + h + 6, left: x });
      setShowDropdown(true);
    });
  };

  const renderScore = (avg: { hase: number | null; dodo: number | null }) => (
    <View style={styles.scoreRow}>
      <Text style={[styles.scoreLabel, { color: colors.inkFaint, fontFamily: "Inter_500Medium" }]}>
        ⌀ SCORE
      </Text>
      <View style={[styles.scoreDivider, { backgroundColor: colors.hair }]} />
      {avg.hase !== null && (
        <>
          <View style={styles.scoreChip}>
            <Text style={[styles.scoreName, { color: colors.inkSoft, fontFamily: "Inter_500Medium" }]}>
              {name1}
            </Text>
            <Text style={[styles.scoreValue, { color: colors.gold, fontFamily: SERIF_BOLD }]}>
              {avg.hase!.toFixed(1)}
            </Text>
          </View>
          {user2active && avg.dodo !== null && (
            <View style={[styles.scoreDivider, { backgroundColor: colors.hair }]} />
          )}
        </>
      )}
      {user2active && avg.dodo !== null && (
        <View style={styles.scoreChip}>
          <Text style={[styles.scoreName, { color: colors.inkSoft, fontFamily: "Inter_500Medium" }]}>
            {name2}
          </Text>
          <Text style={[styles.scoreValue, { color: colors.gold, fontFamily: SERIF_BOLD }]}>
            {avg.dodo!.toFixed(1)}
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <PolyBackground />
      <TornDefs />
      <Grain />

      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.kicker, { color: colors.inkFaint, fontFamily: "Inter_600SemiBold" }]}>
            COFFEE NEST
          </Text>
          <Text style={[styles.title, { color: colors.ink, fontFamily: SERIF_BLACK }]}>
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
                styles.filterChip,
                {
                  backgroundColor: selectedCity ? colors.gold : colors.espresso,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <Text style={[styles.filterChipText, { color: colors.creamText, fontFamily: "Inter_600SemiBold" }]}>
                {selectedCity ?? "Alle"}
              </Text>
              <Ionicons name="chevron-down" size={12} color={colors.creamText} />
            </Pressable>
          )}
        </View>
        <Pressable
          testID="add-roastery-btn"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowModal(true);
          }}
          style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
        >
          <TornBox color={colors.gold} seed={4} style={styles.addButton}>
            <Ionicons name="add" size={24} color="#fff" />
          </TornBox>
        </Pressable>
      </View>
      <View style={styles.headerRuleWrap}>
        <Hairline />
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
          <Ionicons name="cafe-outline" size={52} color={colors.inkFaint} />
          <Text style={[styles.emptyTitle, { color: colors.ink, fontFamily: SERIF_BOLD }]}>
            Noch keine Röstereien
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.inkSoft, fontFamily: "Inter_400Regular" }]}>
            Tippe auf + um deine erste Rösterei hinzuzufügen
          </Text>
        </View>
      ) : filteredRoasteries.length === 0 ? (
        <View style={styles.centerState}>
          <Ionicons name="location-outline" size={52} color={colors.inkFaint} />
          <Text style={[styles.emptyTitle, { color: colors.ink, fontFamily: SERIF_BOLD }]}>
            Keine Röstereien in {selectedCity}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredRoasteries}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: bottomPad + 40 }}
          ItemSeparatorComponent={() => <View style={{ height: 24 }} />}
          ListHeaderComponent={() => (
            <View>
              {!factDismissed && discoveryFact ? (
                <TornSheet tone="espresso" seed={3} rotate={-0.8} contentStyle={styles.sheetPad} style={{ marginBottom: 26 }}>
                  <View style={styles.todayHeaderRow}>
                    <View style={styles.todayHeaderLeft}>
                      <CompassIcon size={15} color={colors.goldLight} />
                      <Text style={[styles.sectionLabel, { color: colors.creamTextSoft, fontFamily: "Inter_600SemiBold" }]}>
                        HEUTE ENTDECKT
                      </Text>
                    </View>
                    <View style={styles.todayActions}>
                      <Pressable
                        onPress={() => {
                          const next = !factCollapsed;
                          setFactCollapsed(next);
                          AsyncStorage.setItem("discovery_card_collapsed", next ? "true" : "false");
                        }}
                        hitSlop={8}
                        style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
                      >
                        <Text style={[styles.todayToggle, { color: colors.creamTextFaint, fontFamily: "Inter_600SemiBold" }]}>
                          {factCollapsed ? "Mehr anzeigen" : "Weniger anzeigen"}
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={() => {
                          setFactDismissed(true);
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }}
                        hitSlop={8}
                        style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
                      >
                        <Feather name="x" size={14} color={colors.creamTextFaint} />
                      </Pressable>
                    </View>
                  </View>
                  {!factCollapsed && (
                    <>
                      <View style={styles.todayHair}>
                        <Hairline cream />
                      </View>
                      <Text style={[styles.todayText, { color: colors.creamText, fontFamily: SERIF_MED }]}>
                        {discoveryFact.text}
                      </Text>
                    </>
                  )}
                </TornSheet>
              ) : null}
              <TornSheet
                tone="cream"
                seed={6}
                rotate={0.7}
                contentStyle={styles.sheetPad}
                style={{ marginBottom: 26 }}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push("/discoveries");
                }}
              >
                <View style={styles.discoveryHeader}>
                  <Text style={[styles.sectionLabel, { color: colors.inkFaint, fontFamily: "Inter_600SemiBold" }]}>
                    ENTDECKUNGEN
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.inkFaint} />
                </View>
                <View style={styles.discoveryStats}>
                  {[
                    { v: discoveryStats?.coffeeCount ?? 0, l: "Kaffees" },
                    { v: discoveryStats?.roasteryCount ?? 0, l: "Röstereien" },
                    { v: discoveryStats?.countryCount ?? 0, l: "Herkunftsländer" },
                  ].map((s, i) => (
                    <View key={s.l} style={styles.discoveryStatWrap}>
                      {i > 0 && <View style={[styles.discoveryStatDivider, { backgroundColor: colors.hair }]} />}
                      <View style={styles.discoveryStat}>
                        <Text style={[styles.discoveryStatValue, { color: colors.ink, fontFamily: SERIF_BLACK }]}>
                          {s.v}
                        </Text>
                        <Text style={[styles.discoveryStatLabel, { color: colors.inkSoft, fontFamily: "Inter_400Regular" }]}>
                          {s.l}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </TornSheet>
            </View>
          )}
          renderItem={({ item, index }) => (
            <TornSheet
              tone="cream"
              seed={LIST_SEEDS[index % LIST_SEEDS.length]}
              rotate={index % 2 === 0 ? -0.7 : 0.8}
              contentStyle={styles.roasteryPad}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push({ pathname: "/roastery/[id]", params: { id: item.id, name: item.name } });
              }}
              onLongPress={() => handleDelete(item)}
            >
              <View style={styles.roasteryRow}>
                <View style={styles.roasteryContent}>
                  <Text style={[styles.roasteryName, { color: colors.ink, fontFamily: SERIF_BOLD }]}>
                    {item.name}
                  </Text>
                  <View style={styles.roasteryMeta}>
                    {item.location ? (
                      <>
                        <Text style={[styles.roasteryMetaText, { color: colors.inkSoft, fontFamily: "Inter_400Regular" }]}>
                          {item.location}
                        </Text>
                        <View style={[styles.metaDot, { backgroundColor: colors.inkFaint }]} />
                      </>
                    ) : null}
                    <Text style={[styles.roasteryMetaText, { color: colors.inkSoft, fontFamily: "Inter_400Regular" }]}>
                      {coffeeCounts[item.id] ?? 0} {coffeeCounts[item.id] === 1 ? "Kaffee" : "Kaffees"}
                    </Text>
                  </View>
                  {avgRatings[item.id] ? renderScore(avgRatings[item.id]!) : null}
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.inkFaint} style={{ marginTop: 4 }} />
              </View>
            </TornSheet>
          )}
        />
      )}

      <Modal visible={showModal} animationType="slide" transparent presentationStyle="overFullScreen">
        <KeyboardAvoidingView behavior="padding" style={{ flex: 1, justifyContent: "flex-end" }}>
          <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)" }} onPress={() => setShowModal(false)} />
        <View style={[styles.modalSheet, { backgroundColor: colors.surfaceElevated, paddingBottom: bottomPad + 20 }]}>
          <View style={styles.modalHandle} />
          <Text style={[styles.modalTitle, { color: colors.ink, fontFamily: SERIF_BOLD }]}>
            Neue Rösterei
          </Text>

          <Text style={[styles.inputLabel, { color: colors.inkSoft, fontFamily: "Inter_500Medium" }]}>
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

          <Text style={[styles.inputLabel, { color: colors.inkSoft, fontFamily: "Inter_500Medium" }]}>
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
        <Ionicons name="settings-outline" size={18} color={colors.inkSoft} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 24,
  },
  headerRuleWrap: {
    paddingHorizontal: 24,
    marginTop: 18,
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
  },
  kicker: {
    fontSize: 10,
    letterSpacing: 2.6,
  },
  title: {
    fontSize: 42,
    lineHeight: 46,
    marginTop: 8,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 14,
    alignSelf: "flex-start",
  },
  filterChipText: {
    fontSize: 10,
    letterSpacing: 1.8,
    textTransform: "uppercase",
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
    width: 48,
    height: 48,
    marginTop: 6,
  },
  centerState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
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
  sheetPad: {
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  roasteryPad: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  sectionLabel: {
    fontSize: 10,
    letterSpacing: 2.6,
    textTransform: "uppercase",
  },
  // Today / Heute entdeckt
  todayHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  todayHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  todayActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  todayToggle: {
    fontSize: 11,
  },
  todayHair: {
    marginVertical: 16,
  },
  todayText: {
    fontSize: 21,
    lineHeight: 30,
  },
  // Discoveries stat row
  discoveryHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  discoveryStats: {
    flexDirection: "row",
    alignItems: "stretch",
    marginTop: 20,
  },
  discoveryStatWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  discoveryStat: {
    flex: 1,
    alignItems: "center",
  },
  discoveryStatValue: {
    fontSize: 36,
    lineHeight: 38,
  },
  discoveryStatLabel: {
    fontSize: 11,
    textAlign: "center",
    marginTop: 6,
  },
  discoveryStatDivider: {
    width: 1,
    height: 44,
  },
  // Roastery list item
  roasteryRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
  },
  roasteryContent: {
    flex: 1,
    minWidth: 0,
  },
  roasteryName: {
    fontSize: 25,
    lineHeight: 30,
  },
  roasteryMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
  },
  roasteryMetaText: {
    fontSize: 13,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    gap: 12,
  },
  scoreLabel: {
    fontSize: 10,
    letterSpacing: 2,
  },
  scoreChip: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
  },
  scoreName: {
    fontSize: 11,
  },
  scoreValue: {
    fontSize: 17,
  },
  scoreDivider: {
    width: 1,
    height: 14,
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
    fontSize: 26,
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
