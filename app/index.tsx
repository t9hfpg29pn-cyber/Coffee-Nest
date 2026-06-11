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
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Plus,
  Coffee,
  Factory,
  Globe,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  X,
  Check,
  Settings as SettingsIcon,
} from "lucide-react-native";
import {
  getRoasteries,
  saveRoastery,
  deleteRoastery,
  getCoffees,
  Roastery,
  getDiscoveryStats,
  DiscoveryStats,
  getDiscoveryFact,
  DiscoveryFact,
} from "@/lib/storage";
import { useUserNames } from "@/context/UserNamesContext";
import { PaperCard, COLORS, FONTS, ui } from "@/theme/paper-native";

const STROKE = 1.75;
const LIST_SHAPES: Array<1 | 2 | 3> = [1, 2, 3];

export default function RoasteriesScreen() {
  const insets = useSafeAreaInsets();

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
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const openDropdown = () => {
    filterBtnRef.current?.measureInWindow((x, y, _w, h) => {
      setDropdownPos({ top: y + h + 6, left: x });
      setShowDropdown(true);
    });
  };

  const heroShown = !factDismissed && !!discoveryFact;

  const renderScore = (avg: { hase: number | null; dodo: number | null }) => {
    const showHase = avg.hase !== null;
    const showDodo = user2active && avg.dodo !== null;
    if (!showHase && !showDodo) return null;
    return (
      <View style={styles.scoreRow}>
        {showHase && (
          <Text style={styles.scoreText}>
            {name1} {avg.hase!.toFixed(1)}
          </Text>
        )}
        {showHase && showDodo && <Text style={styles.scoreDot}>·</Text>}
        {showDodo && (
          <Text style={styles.scoreText}>
            {name2} {avg.dodo!.toFixed(1)}
          </Text>
        )}
      </View>
    );
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
      >
        {/* ---------- Seiten-Header: direkt auf ui.appBg, kein Papier ---------- */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text style={ui.eyebrow}>COFFEE NEST</Text>
            <Text style={styles.title}>Röstereien</Text>
          </View>
          <View style={styles.headerActions}>
            {!loading && cities.length >= 2 && (
              <Pressable
                ref={filterBtnRef}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  openDropdown();
                }}
                style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
              >
                <PaperCard variant="chip" shape={3} shadow={0} contentStyle={styles.chipPad}>
                  <View style={styles.chipInner}>
                    <Text style={styles.chipText}>{selectedCity ?? "Alle"}</Text>
                    <ChevronDown size={14} color={COLORS.coffee800} strokeWidth={STROKE} />
                  </View>
                </PaperCard>
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
              <PaperCard variant="chip" shape={2} shadow={0} style={styles.plusOuter} contentStyle={styles.plusPad}>
                <Plus size={22} color={COLORS.coffee800} strokeWidth={STROKE} />
              </PaperCard>
            </Pressable>
          </View>
        </View>

        {loading ? (
          <View style={styles.skeletonBlock}>
            {[0, 1, 2].map((i) => (
              <PaperCard
                key={i}
                variant="light"
                shape={LIST_SHAPES[i % LIST_SHAPES.length]}
                shadow={1}
                style={[styles.skeletonCard, { opacity: 1 - i * 0.3 }]}
                contentStyle={styles.skeletonPad}
              />
            ))}
          </View>
        ) : roasteries.length === 0 ? (
          <View style={styles.centerState}>
            <Coffee size={52} color={COLORS.accent300} strokeWidth={STROKE} />
            <Text style={styles.emptyTitle}>Noch keine Röstereien</Text>
            <Text style={styles.emptySubtitle}>
              Tippe auf + um deine erste Rösterei hinzuzufügen
            </Text>
          </View>
        ) : filteredRoasteries.length === 0 ? (
          <View style={styles.centerState}>
            <Globe size={52} color={COLORS.accent300} strokeWidth={STROKE} />
            <Text style={styles.emptyTitle}>Keine Röstereien in {selectedCity}</Text>
          </View>
        ) : (
          <View style={styles.body}>
            {/* ---------- Hero-Karte "Heute entdeckt" (dunkel) ---------- */}
            {heroShown && (
              <View style={styles.heroWrap}>
                <PaperCard variant="dark" shape={1} shadow={2}>
                  <View style={styles.heroHeader}>
                    <Text style={[ui.eyebrow, ui.eyebrowOnDark]}>HEUTE ENTDECKT</Text>
                    <Pressable
                      onPress={() => {
                        setFactDismissed(true);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                      hitSlop={10}
                      style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
                    >
                      <X size={20} color={COLORS.accent100} strokeWidth={STROKE} />
                    </Pressable>
                  </View>

                  {!factCollapsed && discoveryFact && (
                    <Text style={styles.heroText}>{discoveryFact.text}</Text>
                  )}

                  <Pressable
                    onPress={() => {
                      const next = !factCollapsed;
                      setFactCollapsed(next);
                      AsyncStorage.setItem("discovery_card_collapsed", next ? "true" : "false");
                    }}
                    hitSlop={8}
                    style={({ pressed }) => [styles.heroToggleRow, { opacity: pressed ? 0.6 : 1 }]}
                  >
                    <Text style={styles.heroToggle}>
                      {factCollapsed ? "Mehr anzeigen" : "Weniger anzeigen"}
                    </Text>
                    {factCollapsed ? (
                      <ChevronDown size={15} color={COLORS.accent100} strokeWidth={STROKE} />
                    ) : (
                      <ChevronUp size={15} color={COLORS.accent100} strokeWidth={STROKE} />
                    )}
                  </Pressable>
                </PaperCard>
              </View>
            )}

            {/* ---------- Statistik-Karte "Entdeckungen" (Hero-Überlapp) ---------- */}
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/discoveries");
              }}
              style={({ pressed }) => [styles.statsWrap, { opacity: pressed ? 0.95 : 1 }]}
            >
              <PaperCard
                variant="light"
                shape={2}
                shadow={2}
                contentStyle={{ padding: 20, paddingTop: heroShown ? 34 : 22 }}
              >
                <Text style={[ui.eyebrow, styles.statsEyebrow]}>ENTDECKUNGEN</Text>
                <View style={styles.statsRow}>
                  {[
                    { v: discoveryStats?.coffeeCount ?? 0, l: "Kaffees", Icon: Coffee },
                    { v: discoveryStats?.roasteryCount ?? 0, l: "Röstereien", Icon: Factory },
                    { v: discoveryStats?.countryCount ?? 0, l: "Herkunftsländer", Icon: Globe },
                  ].map((s, i) => (
                    <View
                      key={s.l}
                      style={[
                        styles.statCol,
                        i > 0 && { borderLeftWidth: 1, borderLeftColor: COLORS.dividerSoft },
                      ]}
                    >
                      <s.Icon size={22} color={COLORS.accent300} strokeWidth={STROKE} />
                      <Text style={styles.statValue}>{s.v}</Text>
                      <Text style={styles.statLabel}>{s.l}</Text>
                    </View>
                  ))}
                </View>
              </PaperCard>
            </Pressable>

            {/* ---------- Rösterei-Liste ---------- */}
            <View style={styles.listBlock}>
              {filteredRoasteries.map((item, i) => {
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
                    style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
                  >
                    <PaperCard
                      variant="light"
                      shape={LIST_SHAPES[i % LIST_SHAPES.length]}
                      shadow={1}
                      contentStyle={styles.listPad}
                    >
                      <View style={styles.listRow}>
                        <PaperCard
                          variant="tile"
                          shape={2}
                          shadow={0}
                          style={styles.tileOuter}
                          contentStyle={styles.tilePad}
                        >
                          <Coffee size={24} color={COLORS.accent400} strokeWidth={STROKE} />
                        </PaperCard>
                        <View style={styles.listText}>
                          <Text style={styles.cardName} numberOfLines={1}>
                            {item.name}
                          </Text>
                          <Text style={styles.cardMeta} numberOfLines={1}>
                            {item.location ? `${item.location} · ` : ""}
                            {count} {count === 1 ? "Kaffee" : "Kaffees"}
                          </Text>
                          {avg ? renderScore(avg) : null}
                        </View>
                        <ChevronRight size={20} color={COLORS.accent300} strokeWidth={STROKE} />
                      </View>
                    </PaperCard>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>

      {/* ---------- Stadt-Filter Dropdown ---------- */}
      <Modal visible={showDropdown} transparent animationType="fade">
        <Pressable style={styles.dropdownOverlay} onPress={() => setShowDropdown(false)}>
          <PaperCard
            variant="light"
            shape={2}
            shadow={2}
            style={[styles.dropdownMenu, { top: dropdownPos.top, left: dropdownPos.left }]}
            contentStyle={styles.dropdownContent}
          >
            <Pressable
              onPress={() => {
                Haptics.selectionAsync();
                setSelectedCity(null);
                setShowDropdown(false);
              }}
              style={({ pressed }) => [
                styles.dropdownItem,
                { backgroundColor: pressed ? COLORS.paperDim : "transparent" },
              ]}
            >
              <Text style={[styles.dropdownItemText, !selectedCity && styles.dropdownItemTextActive]}>
                Alle
              </Text>
              {!selectedCity && <Check size={15} color={COLORS.accent400} strokeWidth={STROKE} />}
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
                  { backgroundColor: pressed ? COLORS.paperDim : "transparent" },
                ]}
              >
                <Text style={[styles.dropdownItemText, selectedCity === city && styles.dropdownItemTextActive]}>
                  {city}
                </Text>
                {selectedCity === city && <Check size={15} color={COLORS.accent400} strokeWidth={STROKE} />}
              </Pressable>
            ))}
          </PaperCard>
        </Pressable>
      </Modal>

      {/* ---------- Neue Rösterei ---------- */}
      <Modal visible={showModal} animationType="slide" transparent presentationStyle="overFullScreen">
        <KeyboardAvoidingView behavior="padding" style={{ flex: 1, justifyContent: "flex-end" }}>
          <Pressable style={styles.modalScrim} onPress={() => setShowModal(false)} />
          <View style={[ui.sheet, { paddingBottom: bottomPad + 24 }]}>
            <View style={ui.sheetHandle} />
            <Text style={styles.modalTitle}>Neue Rösterei</Text>

            <Text style={ui.label}>Name *</Text>
            <TextInput
              style={[ui.input, styles.inputSpacing]}
              placeholder="z.B. Bonanza Coffee"
              placeholderTextColor={COLORS.coffee600}
              value={newName}
              onChangeText={setNewName}
              autoFocus
            />

            <Text style={ui.label}>Ort (optional)</Text>
            <TextInput
              style={[ui.input, styles.inputSpacing]}
              placeholder="z.B. Berlin"
              placeholderTextColor={COLORS.coffee600}
              value={newLocation}
              onChangeText={setNewLocation}
              returnKeyType="done"
              onSubmitEditing={handleAdd}
            />

            <Pressable
              onPress={handleAdd}
              disabled={!newName.trim()}
              style={({ pressed }) => [
                ui.btnPrimary,
                styles.saveButton,
                !newName.trim() && ui.btnDisabled,
                { opacity: pressed && newName.trim() ? 0.9 : 1 },
              ]}
            >
              <Text style={ui.btnPrimaryText}>Hinzufügen</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ---------- Einstellungen ---------- */}
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push("/settings");
        }}
        style={({ pressed }) => [
          styles.fabSettings,
          { bottom: bottomPad + 20, opacity: pressed ? 0.8 : 1 },
        ]}
        hitSlop={8}
      >
        <PaperCard variant="dark" shape={1} shadow={2} style={styles.fabCard} contentStyle={styles.fabPad}>
          <SettingsIcon size={20} color={COLORS.accent100} strokeWidth={STROKE} />
        </PaperCard>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 22,
  },
  headerLeft: { flex: 1, minWidth: 0 },
  title: {
    fontFamily: FONTS.display,
    fontSize: 32,
    lineHeight: 36,
    color: COLORS.coffee800,
    marginTop: 6,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 4,
    flexShrink: 0,
  },

  chipPad: { paddingVertical: 8, paddingHorizontal: 16 },
  chipInner: { flexDirection: "row", alignItems: "center", gap: 6 },
  chipText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: COLORS.coffee800,
  },
  plusOuter: { width: 44, height: 44 },
  plusPad: { flex: 1, alignItems: "center", justifyContent: "center", padding: 0 },

  body: {},

  heroWrap: { marginBottom: -14, zIndex: 0 },
  heroHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heroText: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    lineHeight: 23,
    color: COLORS.paperLight,
    marginTop: 10,
  },
  heroToggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 14,
  },
  heroToggle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: COLORS.accent100,
  },

  statsWrap: { zIndex: 1 },
  statsEyebrow: { textAlign: "center" },
  statsRow: { flexDirection: "row", marginTop: 18 },
  statCol: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingHorizontal: 6,
  },
  statValue: {
    fontFamily: FONTS.displayBold,
    fontSize: 28,
    lineHeight: 30,
    color: COLORS.coffee800,
  },
  statLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: COLORS.coffee600,
    textAlign: "center",
  },

  listBlock: { marginTop: 16, gap: 14 },
  listPad: { padding: 20 },
  listRow: { flexDirection: "row", alignItems: "center", gap: 16 },
  tileOuter: { width: 52, height: 52 },
  tilePad: { flex: 1, alignItems: "center", justifyContent: "center", padding: 0 },
  listText: { flex: 1, minWidth: 0 },
  cardName: {
    fontFamily: FONTS.display,
    fontSize: 19,
    lineHeight: 23,
    color: COLORS.coffee800,
  },
  cardMeta: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: COLORS.coffee600,
    marginTop: 3,
  },
  scoreRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 },
  scoreText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12.5,
    color: COLORS.accent400,
  },
  scoreDot: { fontSize: 12.5, color: COLORS.dividerSoft },

  centerState: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    gap: 12,
  },
  skeletonBlock: { marginTop: 4 },
  skeletonCard: { height: 84, marginBottom: 14 },
  skeletonPad: { flex: 1, padding: 0 },
  emptyTitle: {
    fontFamily: FONTS.display,
    fontSize: 20,
    color: COLORS.coffee800,
    marginTop: 4,
  },
  emptySubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: COLORS.coffee600,
    textAlign: "center",
    maxWidth: 260,
  },

  dropdownOverlay: { flex: 1 },
  dropdownMenu: {
    position: "absolute",
    minWidth: 170,
  },
  dropdownContent: { padding: 8 },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    paddingVertical: 11,
    paddingHorizontal: 16,
  },
  dropdownItemBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.dividerSoft },
  dropdownItemText: { fontFamily: "Inter_400Regular", fontSize: 15, color: COLORS.coffee700 },
  dropdownItemTextActive: { fontFamily: "Inter_600SemiBold", color: COLORS.accent400 },

  modalScrim: { flex: 1, backgroundColor: COLORS.coffee900, opacity: 0.45 },
  modalTitle: {
    fontFamily: FONTS.display,
    fontSize: 22,
    color: COLORS.coffee800,
    marginBottom: 18,
  },
  inputSpacing: { marginBottom: 16 },
  saveButton: { marginTop: 6 },

  fabSettings: {
    position: "absolute",
    right: 20,
  },
  fabCard: { width: 48, height: 48 },
  fabPad: { flex: 1, alignItems: "center", justifyContent: "center", padding: 0 },
});
