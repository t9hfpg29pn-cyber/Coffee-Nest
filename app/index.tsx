import React, { useState, useCallback, useMemo, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  Alert,
  Platform,
  Image,
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
import { TornDefs, TornSheet, TornBox, Grain } from "@/components/TornPaper";
import { CupIcon, RoasteryIcon, GlobeIcon, CompassIcon } from "@/components/CoffeeIcons";
import { paper02CardTexture } from "@/assets/textures";

const SERIF_BLACK = "Fraunces_700Bold";
const SERIF_BOLD = "Fraunces_600SemiBold";
const SERIF_MED = "Inter_400Regular";

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

  const renderScore = (avg: { hase: number | null; dodo: number | null }) => {
    const showHase = avg.hase !== null;
    const showDodo = user2active && avg.dodo !== null;
    if (!showHase && !showDodo) return null;
    return (
      <View style={styles.scoreRow}>
        {showHase && (
          <Text style={[styles.scoreText, { color: colors.gold, fontFamily: "Inter_500Medium" }]}>
            {name1} {avg.hase!.toFixed(1)}
          </Text>
        )}
        {showHase && showDodo && (
          <Text style={[styles.scoreDivider, { color: colors.inkFaint, fontFamily: "Inter_400Regular" }]}>|</Text>
        )}
        {showDodo && (
          <Text style={[styles.scoreText, { color: colors.gold, fontFamily: "Inter_500Medium" }]}>
            {name2} {avg.dodo!.toFixed(1)}
          </Text>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <PolyBackground />
      <TornDefs />
      <Grain />

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 0, paddingBottom: bottomPad + 48, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        {/* The page itself IS the paper surface — ONE large cream sheet that
            carries the masthead, the highlight planes and the roastery list.
            Hierarchy comes from type + hairline rules, never stacked cards. */}
        <TornSheet
          tone="cream"
          variant="main"
          seed={6}
          peek={false}
          flat
          contentStyle={[styles.pagePad, { paddingTop: topPad + 20 }]}
        >
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <Text style={[styles.kicker, { color: colors.inkFaint, fontFamily: "Inter_500Medium" }]}>
                COFFEE NEST
              </Text>
              <Text style={[styles.title, { color: colors.ink, fontFamily: SERIF_BLACK }]}>
                Röstereien
              </Text>
            </View>
            <View style={styles.headerActions}>
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
                      backgroundColor: selectedCity ? colors.gold : colors.paperBg2,
                      opacity: pressed ? 0.85 : 1,
                    },
                  ]}
                >
                  <Text style={[styles.filterChipText, { color: selectedCity ? colors.creamText : colors.ink, fontFamily: "Inter_600SemiBold" }]}>
                    {selectedCity ?? "Alle"}
                  </Text>
                  <Ionicons name="chevron-down" size={12} color={selectedCity ? colors.creamText : colors.inkSoft} />
                </Pressable>
              )}
              <Pressable
                testID="add-roastery-btn"
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowModal(true);
                }}
                style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
              >
                <TornBox color={colors.gold} seed={4} style={styles.addButton}>
                  <Ionicons name="add" size={26} color={colors.espresso} />
                </TornBox>
              </Pressable>
            </View>
          </View>

          <View style={[styles.headerRule, { backgroundColor: colors.hair }]} />

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
        <View style={styles.body}>
          {!factDismissed && discoveryFact ? (
            <TornSheet tone="espresso" seed={3} rotate={-0.8} contentStyle={styles.notePad} style={styles.noteSheet}>
              <View style={[styles.noteMotif, { pointerEvents: "none" }]}>
                <CompassIcon size={92} color={colors.gold} />
              </View>
              <View style={styles.todayHeaderRow}>
                <Text style={[styles.sectionLabel, { color: colors.inkFaint, fontFamily: "Inter_600SemiBold" }]}>
                  HEUTE ENTDECKT
                </Text>
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
                    <Text style={[styles.todayToggle, { color: colors.inkSoft, fontFamily: "Inter_600SemiBold" }]}>
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
                    <Feather name="x" size={15} color={colors.inkFaint} />
                  </Pressable>
                </View>
              </View>
              {!factCollapsed && (
                <Text style={[styles.todayText, { color: colors.ink, fontFamily: SERIF_MED }]}>
                  {discoveryFact.text}
                </Text>
              )}
            </TornSheet>
          ) : null}

          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/discoveries");
            }}
            style={({ pressed }) => ({ opacity: pressed ? 0.95 : 1 })}
          >
            <TornSheet tone="cream" variant="wide" seed={11} rotate={0.6} contentStyle={styles.statsPad} style={styles.statsSheet}>
              <View style={styles.discoveryHeader}>
                <Text style={[styles.sectionLabel, { color: colors.inkFaint, fontFamily: "Inter_600SemiBold" }]}>
                  ENTDECKUNGEN
                </Text>
                <Ionicons name="chevron-forward" size={16} color={colors.inkFaint} />
              </View>
              <View style={styles.discoveryStats}>
                {[
                  { v: discoveryStats?.coffeeCount ?? 0, l: "Kaffees", Icon: CupIcon },
                  { v: discoveryStats?.roasteryCount ?? 0, l: "Röstereien", Icon: RoasteryIcon },
                  { v: discoveryStats?.countryCount ?? 0, l: "Herkunftsländer", Icon: GlobeIcon },
                ].map((s) => (
                  <View key={s.l} style={styles.discoveryStat}>
                    <s.Icon size={26} color={colors.gold} />
                    <Text style={[styles.discoveryStatValue, { color: colors.ink, fontFamily: "Inter_700Bold" }]}>
                      {s.v}
                    </Text>
                    <Text style={[styles.discoveryStatLabel, { color: colors.inkSoft, fontFamily: "Inter_400Regular" }]}>
                      {s.l}
                    </Text>
                  </View>
                ))}
              </View>
            </TornSheet>
          </Pressable>

          {/* Röstereien — each entry is a standalone, clean index card */}
          <View style={styles.listBlock}>
            {filteredRoasteries.map((item) => {
              const avg = avgRatings[item.id];
              const count = coffeeCounts[item.id] ?? 0;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push({ pathname: "/roastery/[id]", params: { id: item.id, name: item.name } });
                  }}
                  onLongPress={() => handleDelete(item)}
                  style={({ pressed }) => [
                    styles.roasteryCard,
                    {
                      backgroundColor: colors.surfaceElevated,
                      opacity: pressed ? 0.9 : 1,
                    },
                  ]}
                >
                  <View style={styles.cardSurface}>
                    <Image
                      source={paper02CardTexture}
                      resizeMode="stretch"
                      style={styles.cardTextureFill}
                    />
                    <View style={[styles.cardIcon, { backgroundColor: colors.gold + "1F" }]}>
                      <RoasteryIcon size={28} color={colors.gold} />
                    </View>
                    <View style={styles.cardContent}>
                      <Text style={[styles.cardName, { color: colors.ink, fontFamily: SERIF_BOLD }]} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={[styles.cardMeta, { color: colors.inkSoft, fontFamily: "Inter_400Regular" }]} numberOfLines={1}>
                        {item.location ? `${item.location} · ` : ""}{count} {count === 1 ? "Kaffee" : "Kaffees"}
                      </Text>
                      {avg ? renderScore(avg) : null}
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.inkFaint} />
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
          )}
        </TornSheet>
      </ScrollView>

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

      <Modal visible={showModal} animationType="slide" transparent presentationStyle="overFullScreen">
        <KeyboardAvoidingView behavior="padding" style={{ flex: 1, justifyContent: "flex-end" }}>
          <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)" }} onPress={() => setShowModal(false)} />
        <View style={[styles.modalSheet, { backgroundColor: colors.surfaceElevated, paddingBottom: bottomPad + 20 }]}>
          <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />
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
            backgroundColor: colors.espresso,
            bottom: bottomPad + 20,
            opacity: pressed ? 0.8 : 1,
          },
        ]}
        hitSlop={8}
      >
        <Ionicons name="settings-outline" size={20} color={colors.goldLight} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  pagePad: {
    paddingHorizontal: 24,
    paddingBottom: 10,
  },
  headerRule: {
    height: StyleSheet.hairlineWidth,
    marginTop: 22,
  },
  body: {
    paddingTop: 24,
  },
  listBlock: {
    marginTop: 4,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerLeft: {
    flex: 1,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 6,
  },
  kicker: {
    fontSize: 11,
    letterSpacing: 3,
    marginBottom: 4,
  },
  title: {
    fontSize: 40,
    lineHeight: 46,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 18,
  },
  filterChipText: {
    fontSize: 13,
  },
  addButton: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  fabSettings: {
    position: "absolute",
    right: 20,
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },

  // Heute entdeckt note
  noteSheet: {
    marginBottom: 26,
  },
  notePad: {
    paddingHorizontal: 22,
    paddingVertical: 22,
    overflow: "hidden",
  },
  noteMotif: {
    position: "absolute",
    right: -14,
    bottom: -18,
    opacity: 0.5,
  },
  sectionLabel: {
    fontSize: 10,
    letterSpacing: 2.6,
  },
  todayHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  todayActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  todayToggle: {
    fontSize: 11,
  },
  todayText: {
    fontSize: 19,
    lineHeight: 28,
    marginTop: 14,
    maxWidth: "82%",
  },

  // Entdeckungen stats sheet
  statsSheet: {
    marginBottom: 30,
  },
  statsPad: {
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 24,
  },
  discoveryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  discoveryStats: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  discoveryStat: {
    flex: 1,
    alignItems: "center",
    gap: 6,
  },
  discoveryStatValue: {
    fontSize: 34,
    lineHeight: 38,
  },
  discoveryStatLabel: {
    fontSize: 12,
  },

  // Röstereien — standalone cards printed on the real PAPER-02 sheet texture
  roasteryCard: {
    borderRadius: 20,
    marginBottom: 14,
    shadowColor: "#2C1810",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 2,
  },
  cardSurface: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingVertical: 20,
    paddingHorizontal: 18,
    borderRadius: 20,
    overflow: "hidden",
  },
  cardTextureFill: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  cardIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  cardContent: {
    flex: 1,
  },
  cardName: {
    fontSize: 22,
    lineHeight: 27,
  },
  cardMeta: {
    fontSize: 13,
    marginTop: 3,
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  scoreText: {
    fontSize: 14,
  },
  scoreDivider: {
    fontSize: 14,
    opacity: 0.7,
  },

  // States
  centerState: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 72,
    gap: 12,
  },
  skeletonCard: {
    width: "86%",
    height: 96,
    borderRadius: 16,
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: 24,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },

  // Dropdown
  dropdownOverlay: {
    flex: 1,
  },
  dropdownMenu: {
    position: "absolute",
    minWidth: 180,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  dropdownItemBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  dropdownItemText: {
    fontSize: 15,
  },

  // Modal
  modalSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 13,
    marginBottom: 8,
    marginTop: 4,
  },
  input: {
    height: 50,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 16,
  },
  saveButton: {
    marginTop: 8,
    marginBottom: 8,
  },
  saveButtonText: {
    color: "#FFF8EC",
    fontSize: 16,
  },
});
