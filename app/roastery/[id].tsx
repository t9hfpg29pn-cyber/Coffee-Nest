import React, { useState, useCallback, useRef, useEffect } from "react";
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
import { useThemeColors, useCardExtras } from "@/context/ThemeContext";

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

function RatingDots({ value, max, colors }: { value: number; max: number; colors: ReturnType<typeof useThemeColors> }) {
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
  const colors = useThemeColors();
  const cardExtras = useCardExtras();
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
    setDefaultGrinder(grinders[0] ?? "");
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
    await saveCoffee({
      roasteryId: id,
      name: newName.trim(),
      haseRating: null,
      dodoRating: null,
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
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 2800);
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
                cardExtras.shadow,
                {
                  backgroundColor: colors.surfaceElevated,
                  borderColor: colors.border,
                  borderTopColor: cardExtras.topHighlight,
                  opacity: pressed ? 0.92 : 1,
                  transform: [{ scale: pressed ? 0.985 : 1 }],
                },
              ]}
            >
              <View style={styles.cardTop}>
                <View style={[styles.cardIcon, { backgroundColor: colors.tint + "20" }]}>
                  <CoffeeBeanIcon size={18} color={colors.tint} />
                </View>
                <View style={styles.cardMain}>
                  <Text style={[styles.cardTitle, { color: colors.text, fontFamily: "Inter_600SemiBold" }]}>
                    {item.name}
                  </Text>
                  {item.aromaDescription ? (
                    <Text
                      numberOfLines={1}
                      ellipsizeMode="tail"
                      style={[styles.cardAroma, { color: colors.textSecondary, fontFamily: "Inter_400Regular" }]}
                    >
                      {item.aromaDescription}
                    </Text>
                  ) : item.pricePerKg ? (
                    <Text style={[styles.cardPrice, { color: colors.textSecondary, fontFamily: "Inter_500Medium" }]}>
                      {formatPrice(item.pricePerKg)} €/kg
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
                    {item.haseRating !== null ? (
                      <>
                        <Text style={[styles.ratingNum, { color: colors.tint, fontFamily: "Inter_700Bold" }]}>
                          {item.haseRating}
                        </Text>
                        <Text style={[styles.ratingMax, { color: colors.textSecondary, fontFamily: "Inter_400Regular" }]}>
                          /10
                        </Text>
                      </>
                    ) : (
                      <Text style={[styles.ratingNum, { color: colors.textSecondary, fontFamily: "Inter_400Regular", opacity: 0.4 }]}>–</Text>
                    )}
                  </View>
                </View>
                {user2active && (
                  <>
                    <View style={[styles.ratingDivider, { backgroundColor: colors.border }]} />
                    <View style={styles.ratingRow}>
                      <Text style={[styles.ratingLabel, { color: colors.textSecondary, fontFamily: "Inter_500Medium" }]}>
                        {name2}
                      </Text>
                      <View style={styles.ratingValue}>
                        {item.dodoRating !== null ? (
                          <>
                            <Text style={[styles.ratingNum, { color: colors.tint, fontFamily: "Inter_700Bold" }]}>
                              {item.dodoRating}
                            </Text>
                            <Text style={[styles.ratingMax, { color: colors.textSecondary, fontFamily: "Inter_400Regular" }]}>
                              /10
                            </Text>
                          </>
                        ) : (
                          <Text style={[styles.ratingNum, { color: colors.textSecondary, fontFamily: "Inter_400Regular", opacity: 0.4 }]}>–</Text>
                        )}
                      </View>
                    </View>
                  </>
                )}
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
            <Pressable
              onPress={handleDeleteRoastery}
              style={({ pressed }) => [
                styles.deleteButton,
                { borderColor: "#E05252", opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <Ionicons name="trash-outline" size={16} color="#E05252" />
              <Text style={[styles.deleteButtonText, { fontFamily: "Inter_500Medium" }]}>
                Rösterei löschen
              </Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <CoffeeBeanConfetti active={showConfetti} color={colors.tint} />
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
  cardAroma: { fontSize: 12, opacity: 0.75 },
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
  deleteButton: {
    marginTop: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  deleteButtonText: {
    color: "#E05252",
    fontSize: 15,
  },
});
