import React, { useState, useCallback, useRef, useEffect } from "react";
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
  Animated,
  Dimensions,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Path } from "react-native-svg";
import * as Haptics from "expo-haptics";
import {
  getCoffees,
  saveCoffee,
  deleteCoffee,
  deleteRoastery,
  getRoasteries,
  updateRoastery,
  getGrinders,
  Coffee,
} from "@/lib/storage";
import { useUserNames } from "@/context/UserNamesContext";
import { PaperCard, COLORS, FONTS, ui } from "@/theme/paper-native";
import { PaperTile, navTileSource } from "@/components/PaperTiles";

const STROKE = 1.75;
const LIST_SHAPES: Array<1 | 2 | 3> = [1, 2, 3];

function CoffeeBeanIcon({ size = 18, color }: { size?: number; color: string }) {
  const h = Math.round(size * 1.2);
  return (
    <Svg width={size} height={h} viewBox="0 0 60 72">
      <Path
        d="M30 2 C46 2 58 14 58 36 C58 58 46 70 30 70 C14 70 2 58 2 36 C2 14 14 2 30 2 Z"
        fill={color}
      />
      <Path
        d="M31 8 C41 17 41 28 31 36 C21 44 21 55 31 64"
        fill="none"
        stroke="rgba(255,255,255,0.40)"
        strokeWidth="6.5"
        strokeLinecap="round"
      />
    </Svg>
  );
}

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

type ConfettiParticle = {
  x: number;
  size: number;
  delay: number;
  duration: number;
  endRotation: number;
  anim: Animated.Value;
};

function CoffeeBeanConfetti({ active, color }: { active: boolean; color: string }) {
  const particles = useRef<ConfettiParticle[]>(
    Array.from({ length: 14 }, (_, i) => ({
      x: (SCREEN_W / 14) * i + Math.random() * (SCREEN_W / 14) * 0.8,
      size: 10 + Math.floor(Math.random() * 8),
      delay: Math.floor(Math.random() * 600),
      duration: 1300 + Math.floor(Math.random() * 900),
      endRotation: (Math.random() > 0.5 ? 1 : -1) * (150 + Math.floor(Math.random() * 360)),
      anim: new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    if (!active) return;
    particles.forEach((p) => p.anim.setValue(0));
    const anims = particles.map((p) =>
      Animated.sequence([
        Animated.delay(p.delay),
        Animated.timing(p.anim, {
          toValue: 1,
          duration: p.duration,
          useNativeDriver: true,
        }),
      ])
    );
    Animated.parallel(anims).start();
  }, [active]);

  return (
    <View style={[StyleSheet.absoluteFillObject, { pointerEvents: "none" }]}>
      {particles.map((p, i) => {
        const translateY = p.anim.interpolate({
          inputRange: [0, 1],
          outputRange: [-40, SCREEN_H + 40],
        });
        const rotate = p.anim.interpolate({
          inputRange: [0, 1],
          outputRange: ["0deg", `${p.endRotation}deg`],
        });
        const opacity = p.anim.interpolate({
          inputRange: [0, 0.08, 0.75, 1],
          outputRange: [0, 1, 0.9, 0],
        });
        return (
          <Animated.View
            key={i}
            style={{ position: "absolute", left: p.x, top: 0, transform: [{ translateY }, { rotate }], opacity }}
          >
            <CoffeeBeanIcon size={p.size} color={color} />
          </Animated.View>
        );
      })}
    </View>
  );
}

function showAlert(title: string, message: string, buttons?: { text: string; style?: string; onPress?: () => void }[]) {
  if (Platform.OS === "web") {
    if (buttons && buttons.length > 1) {
      const confirmed = (window as any).confirm(`${title}\n\n${message}`);
      if (confirmed) buttons.find((b) => b.style !== "cancel")?.onPress?.();
    } else {
      (window as any).alert(`${title}\n\n${message}`);
      buttons?.[0]?.onPress?.();
    }
  } else {
    Alert.alert(title, message, buttons as any);
  }
}

function formatPrice(raw: string): string {
  const num = parseFloat(raw.replace(",", "."));
  if (isNaN(num)) return raw;
  return num.toFixed(2).replace(".", ",");
}

export default function RoasteryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const [showConfetti, setShowConfetti] = useState(false);

  const { name1, name2, user2active } = useUserNames();
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
    setDefaultGrinder(grinders[0]?.name ?? "");
    const roastery = roasteries.find((r) => r.id === id);
    if (roastery) {
      setRoasteryName(roastery.name);
      setRoasteryLocation(roastery.location ?? "");
    }
    setCoffees(
      data.sort((a, b) => {
        const rated = (r: number | null, d: number | null) => {
          const vals = [r, d].filter((v): v is number => v !== null);
          return vals.length > 0 ? vals.reduce((s, v) => s + v, 0) / vals.length : -1;
        };
        return rated(b.haseRating, b.dodoRating) - rated(a.haseRating, a.dodoRating);
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
    const newCoffee = await saveCoffee({
      roasteryId: id,
      name: newName.trim(),
      haseRating: null,
      dodoRating: null,
      grinderName: defaultGrinder,
      grindLevel: 0,
      grindSettings: defaultGrinder ? [{ grinder: defaultGrinder, level: 0 }] : [],
      aroma: 3,
      aromaDescription: "",
      notes: "",
      pricePerKg: "",
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setNewName("");
    setShowModal(false);
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 2800);
    load();
    router.push(`/coffee/${newCoffee.id}`);
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

  const handleDeleteRoastery = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    showAlert(
      "Rösterei löschen",
      `Möchtest du "${roasteryName}" und alle zugehörigen Kaffees unwiderruflich löschen?`,
      [
        { text: "Abbrechen", style: "cancel" },
        {
          text: "Löschen",
          style: "destructive",
          onPress: async () => {
            setShowEditRoastery(false);
            await deleteRoastery(id);
            router.back();
          },
        },
      ]
    );
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const renderScore = (item: Coffee) => {
    return (
      <View style={styles.scoreRow}>
        <Text style={styles.scoreText}>
          {name1} {item.haseRating !== null ? item.haseRating : "–"}
        </Text>
        {user2active && (
          <>
            <Text style={styles.scoreDot}>·</Text>
            <Text style={styles.scoreText}>
              {name2} {item.dodoRating !== null ? item.dodoRating : "–"}
            </Text>
          </>
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
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backButton, { opacity: pressed ? 0.6 : 1 }]}
          >
            <Ionicons name="chevron-back" size={26} color={COLORS.coffee800} />
          </Pressable>
          <Pressable
            onPress={openEditRoastery}
            style={({ pressed }) => [styles.headerCenter, { opacity: pressed ? 0.7 : 1 }]}
          >
            <Text style={ui.eyebrow}>RÖSTEREI</Text>
            <View style={styles.titleRow}>
              <Text style={styles.title} numberOfLines={2}>
                {roasteryName}
              </Text>
              <Ionicons name="pencil-outline" size={16} color={COLORS.coffee600} style={{ marginTop: 8 }} />
            </View>
          </Pressable>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowModal(true);
            }}
            style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
          >
            <PaperCard variant="chip" shape={2} shadow={0} style={styles.addOuter} contentStyle={styles.addPad}>
              <Ionicons name="add" size={24} color={COLORS.coffee800} />
            </PaperCard>
          </Pressable>
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
        ) : coffees.length === 0 ? (
          <View style={styles.centerState}>
            <PaperTile source={navTileSource("coffee")} size={64} />
            <Text style={styles.emptyTitle}>Noch keine Kaffees</Text>
            <Text style={styles.emptySubtitle}>
              Tippe auf + um einen Kaffee hinzuzufügen
            </Text>
          </View>
        ) : (
          <View style={styles.listBlock}>
            {coffees.map((item, i) => (
              <Pressable
                key={item.id}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push({ pathname: "/coffee/[id]", params: { id: item.id } });
                }}
                onLongPress={() => handleDelete(item)}
                style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
              >
                <PaperCard
                  variant="light"
                  shape={LIST_SHAPES[i % LIST_SHAPES.length]}
                  shadow={2}
                  contentStyle={styles.cardContent}
                >
                  <View style={styles.listRow}>
                    <PaperTile source={navTileSource("coffee")} size={60} />
                    <View style={styles.listText}>
                      <Text style={styles.cardName} numberOfLines={1}>
                        {item.name}
                      </Text>
                      {item.pricePerKg ? (
                        <Text style={styles.cardMeta} numberOfLines={1}>
                          {formatPrice(item.pricePerKg)} €/kg
                        </Text>
                      ) : item.aromaDescription ? (
                        <Text style={styles.cardMeta} numberOfLines={1} ellipsizeMode="tail">
                          {item.aromaDescription}
                        </Text>
                      ) : null}
                      {renderScore(item)}
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={22}
                      color={COLORS.accent300}
                      style={styles.chevron}
                    />
                  </View>
                </PaperCard>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>

      {/* ---------- Neuer Kaffee ---------- */}
      <Modal visible={showModal} animationType="slide" transparent presentationStyle="overFullScreen">
        <KeyboardAvoidingView behavior="padding" style={{ flex: 1, justifyContent: "flex-end" }}>
          <Pressable style={styles.modalScrim} onPress={() => setShowModal(false)} />
          <View style={[ui.sheet, { paddingBottom: bottomPad + 24 }]}>
            <View style={ui.sheetHandle} />
            <Text style={styles.modalTitle}>Neuer Kaffee</Text>

            <Text style={ui.label}>Name *</Text>
            <TextInput
              style={[ui.input, styles.inputSpacing]}
              placeholder="z.B. Ethiopia Yirgacheffe"
              placeholderTextColor={COLORS.coffee600}
              value={newName}
              onChangeText={setNewName}
              autoFocus
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

      {/* ---------- Rösterei bearbeiten ---------- */}
      <Modal visible={showEditRoastery} animationType="slide" transparent presentationStyle="overFullScreen">
        <KeyboardAvoidingView behavior="padding" style={{ flex: 1, justifyContent: "flex-end" }}>
          <Pressable style={styles.modalScrim} onPress={() => setShowEditRoastery(false)} />
          <View style={[ui.sheet, { paddingBottom: bottomPad + 24 }]}>
            <View style={ui.sheetHandle} />
            <Text style={styles.modalTitle}>Rösterei bearbeiten</Text>

            <Text style={ui.label}>Name *</Text>
            <TextInput
              style={[ui.input, styles.inputSpacing]}
              placeholder="Name der Rösterei"
              placeholderTextColor={COLORS.coffee600}
              value={editName}
              onChangeText={setEditName}
              autoFocus
              returnKeyType="next"
            />

            <Text style={ui.label}>Ort</Text>
            <TextInput
              style={[ui.input, styles.inputSpacing]}
              placeholder="z.B. Berlin"
              placeholderTextColor={COLORS.coffee600}
              value={editLocation}
              onChangeText={setEditLocation}
              returnKeyType="done"
              onSubmitEditing={handleSaveRoastery}
            />

            <Pressable
              onPress={handleSaveRoastery}
              disabled={!editName.trim()}
              style={({ pressed }) => [
                ui.btnPrimary,
                styles.saveButton,
                !editName.trim() && ui.btnDisabled,
                { opacity: pressed && editName.trim() ? 0.9 : 1 },
              ]}
            >
              <Text style={ui.btnPrimaryText}>Speichern</Text>
            </Pressable>

            <Pressable
              onPress={handleDeleteRoastery}
              style={({ pressed }) => [styles.deleteButton, { opacity: pressed ? 0.8 : 1 }]}
            >
              <Ionicons name="trash-outline" size={16} color={COLORS.danger} />
              <Text style={styles.deleteButtonText}>Rösterei löschen</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <CoffeeBeanConfetti active={showConfetti} color={COLORS.accent300} />
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 22,
  },
  backButton: {
    width: 32,
    height: 36,
    justifyContent: "center",
    alignItems: "flex-start",
    marginTop: 6,
    marginLeft: -6,
  },
  headerCenter: { flex: 1, minWidth: 0 },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginTop: 6,
  },
  title: {
    flexShrink: 1,
    fontFamily: FONTS.display,
    fontSize: 30,
    lineHeight: 36,
    color: COLORS.coffee800,
  },
  addOuter: { width: 44, height: 44, marginTop: 4 },
  addPad: { flex: 1, alignItems: "center", justifyContent: "center", padding: 0 },

  listBlock: { marginTop: 4, gap: 14 },
  cardContent: { paddingVertical: 18, paddingHorizontal: 20 },
  listRow: { flexDirection: "row", alignItems: "center", gap: 16 },
  listText: { flex: 1, minWidth: 0 },
  cardName: {
    fontFamily: FONTS.displayBold,
    fontSize: 22,
    lineHeight: 27,
    color: COLORS.coffee800,
  },
  cardMeta: {
    fontFamily: FONTS.display,
    fontSize: 15,
    lineHeight: 19,
    color: COLORS.coffee600,
    marginTop: 3,
  },
  scoreRow: { flexDirection: "row", alignItems: "center", gap: 7, marginTop: 5 },
  scoreText: {
    fontFamily: FONTS.display,
    fontSize: 15,
    color: COLORS.accent300,
  },
  scoreDot: { fontSize: 15, color: COLORS.accent200 },
  chevron: { marginLeft: 2 },

  centerState: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    gap: 12,
  },
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

  skeletonBlock: { marginTop: 4 },
  skeletonCard: { height: 84, marginBottom: 14 },
  skeletonPad: { flex: 1, padding: 0 },

  modalScrim: { flex: 1, backgroundColor: COLORS.coffee900, opacity: 0.45 },
  modalTitle: {
    fontFamily: FONTS.display,
    fontSize: 22,
    color: COLORS.coffee800,
    marginBottom: 18,
  },
  inputSpacing: { marginBottom: 16 },
  saveButton: { marginTop: 6 },

  deleteButton: {
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.danger,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  deleteButtonText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: COLORS.danger,
  },
});
