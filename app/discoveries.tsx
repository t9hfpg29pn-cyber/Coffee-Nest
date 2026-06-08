import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import {
  getDiscoveryStats,
  getCoffeeInsights,
  getCountryDetails,
  getCelebratedCountries,
  setCelebratedCountries,
  DiscoveryStats,
  CoffeeInsights,
  CountryDetails,
} from "@/lib/storage";
import { useThemeColors, useCardExtras, useTheme } from "@/context/ThemeContext";
import { PolyBackground, PolyCornerCut } from "@/components/PolyBackground";
import { CoffeeOriginMap } from "@/components/CoffeeOriginMap";
import { COFFEE_WORLD_MAP } from "@/constants/coffeeMap";
import {
  AromaIcon,
  RoastIcon,
  GlobeIcon,
  MillIcon,
  TrophyIcon,
  StarIcon,
  OriginPinIcon,
} from "@/components/CoffeeIcons";
import Colors from "@/constants/colors";

const KNOWN_COUNTRIES = [
  "Äthiopien", "Brasilien", "Burundi", "Costa Rica", "El Salvador",
  "Guatemala", "Honduras", "Indien", "Indonesien", "Jemen",
  "Kenia", "Kolumbien", "Mexiko", "Nicaragua", "Panama",
  "Peru", "Ruanda", "Tansania", "Uganda", "Vietnam",
] as const;

const TOTAL_KNOWN = KNOWN_COUNTRIES.length;


const ROAST_LEVEL_KEY: Record<string, string> = {
  "Hell": "light",
  "Mittel-Hell": "medium-light",
  "Mittel": "medium",
  "Mittel-Dunkel": "medium-dark",
  "Dunkel": "dark",
};

function InsightCard({
  icon,
  label,
  value,
  valueNode,
  colors,
  isLowpoly,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
  valueNode?: React.ReactNode;
  colors: ReturnType<typeof useThemeColors>;
  isLowpoly: boolean;
}) {
  return (
    <View
      style={[
        insightCardStyles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderRadius: isLowpoly ? 4 : 12,
        },
      ]}
    >
      <View
        style={[
          insightCardStyles.iconWrap,
          {
            backgroundColor: colors.surfaceElevated,
            borderColor: colors.border,
            borderRadius: isLowpoly ? 4 : 10,
          },
        ]}
      >
        {icon}
      </View>
      <View style={insightCardStyles.textWrap}>
        <Text style={[insightCardStyles.label, { color: colors.textSecondary, fontFamily: "Inter_500Medium" }]}>
          {label}
        </Text>
        {valueNode ?? (
          <Text style={[insightCardStyles.value, { color: colors.text, fontFamily: "Inter_600SemiBold" }]}>
            {value}
          </Text>
        )}
      </View>
    </View>
  );
}

const insightCardStyles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 14,
  },
  iconWrap: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  textWrap: { flex: 1, gap: 2 },
  label: { fontSize: 12, letterSpacing: 0.3 },
  value: { fontSize: 16 },
});

export default function DiscoveriesScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const cardExtras = useCardExtras();
  const { design } = useTheme();
  const isLowpoly = design === "lowpoly";

  const [stats, setStats] = useState<DiscoveryStats | null>(null);
  const [insights, setInsights] = useState<CoffeeInsights | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [countryDetails, setCountryDetails] = useState<CountryDetails | null>(null);
  const [highlightCountry, setHighlightCountry] = useState<string | null>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        const s = await getDiscoveryStats();
        if (!active) return;
        setStats(s);

        // First-discovery highlight: compare against the persisted baseline of
        // countries the user has already seen on the map, then animate the
        // newest one exactly once.
        const onMap = (s.countries ?? []).filter((c) =>
          KNOWN_COUNTRIES.includes(c as typeof KNOWN_COUNTRIES[number])
        );
        const baseline = await getCelebratedCountries();
        if (!active) return;
        if (baseline !== null) {
          const seen = new Set(baseline);
          const fresh = onMap.filter((c) => !seen.has(c));
          if (fresh.length > 0) setHighlightCountry(fresh[fresh.length - 1]);
        }
        await setCelebratedCountries(onMap);
      })();
      getCoffeeInsights().then((i) => {
        if (active) setInsights(i);
      });
      return () => {
        active = false;
      };
    }, [])
  );

  const openCountry = useCallback((country: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setSelectedCountry(country);
    setCountryDetails(null);
    getCountryDetails(country).then(setCountryDetails);
  }, []);

  const closeCountry = useCallback(() => {
    setSelectedCountry(null);
    setCountryDetails(null);
  }, []);

  const discoveredCountries = (stats?.countries ?? []).slice().sort();
  const knownDiscovered = discoveredCountries.filter(
    (c) => KNOWN_COUNTRIES.includes(c as typeof KNOWN_COUNTRIES[number])
  );
  const totalDiscovered = discoveredCountries.length;
  const progress = Math.min(totalDiscovered / TOTAL_KNOWN, 1);
  const lastDiscovered =
    stats?.lastDiscoveredCountry ??
    (discoveredCountries.length > 0
      ? discoveredCountries[discoveredCountries.length - 1]
      : null);

  const discoveredSet = new Set(discoveredCountries);
  const mapDiscoveredCount = knownDiscovered.length;
  const mapProgress = Math.min(mapDiscoveredCount / TOTAL_KNOWN, 1);
  const favoriteCountry = insights?.favoriteCountry ?? null;

  const mapColors = {
    discovered: colors.tint,
    undiscovered: colors.surface,
    favorite: colors.tint,
    stroke: colors.background,
    labelOnDiscovered: Colors.espresso,
    labelOnUndiscovered: colors.text,
    star: colors.tint,
    regionBg: isLowpoly ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
    regionLabel: colors.textSecondary,
  };

  const hasInsights =
    insights !== null &&
    (insights.favoriteCountry !== null ||
      insights.topCoffee !== null ||
      insights.favoriteAroma !== null ||
      insights.favoriteRoastLevel !== null ||
      insights.favoriteGrinder !== null);

  const cardStyle = [
    styles.section,
    cardExtras.shadow,
    {
      backgroundColor: colors.surfaceElevated,
      borderColor: colors.border,
      borderTopColor: cardExtras.topHighlight,
      borderRadius: cardExtras.cardRadius,
      overflow: "hidden" as const,
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <PolyBackground />

      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.6 : 1 }]}
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <View style={styles.headerTextBlock}>
          <Text style={[styles.headerLabel, { color: colors.textSecondary, fontFamily: "Inter_500Medium" }]}>
            COFFEE NEST
          </Text>
          <Text style={[styles.headerTitle, { color: colors.text, fontFamily: "Inter_700Bold" }]}>
            Entdeckungen
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: bottomPad + 32, gap: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── HERKUNFTSLÄNDER ───────────────────────────────────────── */}
        <View style={cardStyle}>
          <PolyCornerCut />
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary, fontFamily: "Inter_600SemiBold" }]}>
              HERKUNFTSLÄNDER
            </Text>
            <Text style={[styles.sectionCount, { color: colors.tint, fontFamily: "Inter_700Bold" }]}>
              {totalDiscovered} {totalDiscovered === 1 ? "Land" : "Länder"} entdeckt
            </Text>
          </View>

          <View style={[styles.progressSection, { borderTopColor: colors.border }]}>
            <View style={styles.progressHeader}>
              <Text style={[styles.progressLabel, { color: colors.textSecondary, fontFamily: "Inter_500Medium" }]}>
                Fortschritt
              </Text>
              <Text style={[styles.progressValue, { color: colors.text, fontFamily: "Inter_600SemiBold" }]}>
                {totalDiscovered} von {TOTAL_KNOWN} Ländern
              </Text>
            </View>
            <View style={[styles.progressTrack, { backgroundColor: colors.surface }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.round(progress * 100)}%` as any,
                    backgroundColor: colors.tint,
                    borderRadius: isLowpoly ? 2 : 4,
                  },
                ]}
              />
            </View>
            <Text style={[styles.progressPct, { color: colors.textSecondary, fontFamily: "Inter_400Regular" }]}>
              {Math.round(progress * 100)} %
            </Text>
          </View>

          {totalDiscovered === 0 ? (
            <View style={[styles.emptyRow, { borderTopColor: colors.border }]}>
              <Text style={[styles.emptyText, { color: colors.textSecondary, fontFamily: "Inter_400Regular" }]}>
                Noch keine Herkünfte eingetragen
              </Text>
            </View>
          ) : lastDiscovered ? (
            <View style={[styles.lastDiscoveredRow, { borderTopColor: colors.border }]}>
              <OriginPinIcon size={18} color={colors.tint} />
              <Text style={[styles.lastDiscoveredLabel, { color: colors.textSecondary, fontFamily: "Inter_500Medium" }]}>
                Zuletzt entdeckt:
              </Text>
              <Text style={[styles.lastDiscoveredValue, { color: colors.text, fontFamily: "Inter_600SemiBold" }]}>
                {lastDiscovered}
              </Text>
            </View>
          ) : null}
        </View>

        {/* ── KAFFEEWELT ────────────────────────────────────────────── */}
        <View style={cardStyle}>
          <PolyCornerCut />
          <View style={styles.sectionHeader}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary, fontFamily: "Inter_600SemiBold" }]}>
                KAFFEEWELT
              </Text>
              <Text style={[styles.sectionSubtitle, { color: colors.textSecondary, fontFamily: "Inter_400Regular" }]}>
                Entdecke die Herkunft deiner Kaffees
              </Text>
            </View>
          </View>

          <View style={[styles.mapProgressRow, { borderTopColor: colors.border }]}>
            <Text style={[styles.mapProgressText, { color: colors.text, fontFamily: "Inter_600SemiBold" }]}>
              {mapDiscoveredCount} von {TOTAL_KNOWN} Herkunftsländern entdeckt
            </Text>
            <Text style={[styles.mapProgressPct, { color: colors.tint, fontFamily: "Inter_700Bold" }]}>
              {Math.round(mapProgress * 100)} %
            </Text>
          </View>
          <View style={styles.mapProgressTrackWrap}>
            <View style={[styles.progressTrack, { backgroundColor: colors.surface }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.round(mapProgress * 100)}%` as any,
                    backgroundColor: colors.tint,
                    borderRadius: isLowpoly ? 2 : 4,
                  },
                ]}
              />
            </View>
          </View>

          <View style={[styles.mapWrap, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <CoffeeOriginMap
              data={COFFEE_WORLD_MAP}
              discovered={discoveredSet}
              favorite={favoriteCountry}
              onSelectCountry={openCountry}
              colors={mapColors}
              height={300}
              highlightCountry={highlightCountry}
              onHighlightComplete={() => setHighlightCountry(null)}
            />
          </View>

          {mapDiscoveredCount === 0 && (
            <Text style={[styles.mapHint, { color: colors.textSecondary, fontFamily: "Inter_400Regular" }]}>
              Füge deinen ersten Kaffee mit Herkunftsland hinzu.
            </Text>
          )}

          {/* Legend */}
          <View style={[styles.legend, { borderTopColor: colors.border }]}>
            <View style={styles.legendItem}>
              <View style={[styles.legendSwatch, { backgroundColor: colors.tint, borderRadius: isLowpoly ? 1 : 4 }]} />
              <Text style={[styles.legendText, { color: colors.textSecondary, fontFamily: "Inter_400Regular" }]}>
                Entdeckt
              </Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendSwatch, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: isLowpoly ? 1 : 4 }]} />
              <Text style={[styles.legendText, { color: colors.textSecondary, fontFamily: "Inter_400Regular" }]}>
                Noch nicht entdeckt
              </Text>
            </View>
            <View style={styles.legendItem}>
              <StarIcon size={15} color={colors.tint} />
              <Text style={[styles.legendText, { color: colors.textSecondary, fontFamily: "Inter_400Regular" }]}>
                Lieblingsland
              </Text>
            </View>
          </View>
        </View>

        {/* ── DEIN KAFFEEPROFIL ─────────────────────────────────────── */}
        <View style={cardStyle}>
          <PolyCornerCut />
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary, fontFamily: "Inter_600SemiBold" }]}>
              DEIN KAFFEEPROFIL
            </Text>
          </View>

          {!hasInsights ? (
            <View style={[styles.emptyRow, { borderTopColor: colors.border }]}>
              <Text style={[styles.emptyText, { color: colors.textSecondary, fontFamily: "Inter_400Regular", textAlign: "center" }]}>
                Mehr Kaffees entdecken, um Erkenntnisse zu erhalten.
              </Text>
            </View>
          ) : (
            <View style={[styles.profileCards, { borderTopColor: colors.border }]}>
              {insights?.favoriteCountry && (
                <InsightCard
                  icon={<GlobeIcon size={24} color={colors.tint} />}
                  label="Lieblingsherkunft"
                  value={insights.favoriteCountry}
                  colors={colors}
                  isLowpoly={isLowpoly}
                />
              )}
              {insights?.favoriteAroma && (
                <InsightCard
                  icon={<AromaIcon step={insights.favoriteAroma.value} size={24} color={colors.tint} />}
                  label="Lieblingsaroma"
                  value={insights.favoriteAroma.label}
                  colors={colors}
                  isLowpoly={isLowpoly}
                />
              )}
              {insights?.favoriteRoastLevel && (
                <InsightCard
                  icon={
                    <RoastIcon
                      level={ROAST_LEVEL_KEY[insights.favoriteRoastLevel] ?? "medium"}
                      size={24}
                      color={colors.tint}
                    />
                  }
                  label="Lieblingsröstgrad"
                  value={insights.favoriteRoastLevel}
                  colors={colors}
                  isLowpoly={isLowpoly}
                />
              )}
              {insights?.favoriteGrinder && (
                <InsightCard
                  icon={<MillIcon size={24} color={colors.tint} />}
                  label="Lieblingsmühle"
                  value={insights.favoriteGrinder}
                  colors={colors}
                  isLowpoly={isLowpoly}
                />
              )}
              {insights?.topCoffee && (
                <InsightCard
                  icon={<TrophyIcon size={24} color={colors.tint} />}
                  label="Spitzenreiter"
                  colors={colors}
                  isLowpoly={isLowpoly}
                  valueNode={
                    <>
                      <Text style={[insightCardStyles.value, { color: colors.text, fontFamily: "Inter_600SemiBold" }]}>
                        {insights.topCoffee.name}
                      </Text>
                      <View style={styles.topCoffeeRatings}>
                        {insights.topCoffee.haseRating !== null && (
                          <Text style={[styles.topCoffeeRating, { color: colors.textSecondary, fontFamily: "Inter_400Regular" }]}>
                            Hase{" "}
                            <Text style={{ color: colors.tint, fontFamily: "Inter_700Bold" }}>
                              {insights.topCoffee.haseRating}
                            </Text>
                          </Text>
                        )}
                        {insights.topCoffee.haseRating !== null && insights.topCoffee.dodoRating !== null && (
                          <Text style={[styles.topCoffeeRating, { color: colors.border, fontFamily: "Inter_400Regular" }]}>
                            {" "}|{" "}
                          </Text>
                        )}
                        {insights.topCoffee.dodoRating !== null && (
                          <Text style={[styles.topCoffeeRating, { color: colors.textSecondary, fontFamily: "Inter_400Regular" }]}>
                            Dodo{" "}
                            <Text style={{ color: colors.tint, fontFamily: "Inter_700Bold" }}>
                              {insights.topCoffee.dodoRating}
                            </Text>
                          </Text>
                        )}
                      </View>
                    </>
                  }
                />
              )}
            </View>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={selectedCountry !== null}
        transparent
        animationType="fade"
        presentationStyle="overFullScreen"
        onRequestClose={closeCountry}
      >
        <Pressable style={styles.sheetBackdrop} onPress={closeCountry}>
          <Pressable
            style={[
              styles.sheet,
              cardExtras.shadow,
              {
                backgroundColor: colors.surfaceElevated,
                borderColor: colors.border,
                borderTopColor: cardExtras.topHighlight,
                borderRadius: cardExtras.cardRadius,
                paddingBottom: bottomPad + 20,
              },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />

            <View style={styles.sheetHeader}>
              <View style={styles.sheetIcon}>
                <OriginPinIcon size={30} color={colors.tint} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.sheetTitle, { color: colors.text, fontFamily: "Inter_700Bold" }]}>
                  {selectedCountry?.toUpperCase()}
                </Text>
                <Text style={[styles.sheetCount, { color: colors.textSecondary, fontFamily: "Inter_400Regular" }]}>
                  {(countryDetails?.coffeeCount ?? 0) === 0
                    ? "Noch nicht entdeckt"
                    : `${countryDetails?.coffeeCount} ${countryDetails?.coffeeCount === 1 ? "Kaffee" : "Kaffees"} entdeckt`}
                </Text>
              </View>
              <Pressable onPress={closeCountry} hitSlop={10} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </Pressable>
            </View>

            {countryDetails === null ? (
              <View style={[styles.sheetEmpty, { borderTopColor: colors.border }]}>
                <Text style={[styles.sheetEmptyText, { color: colors.textSecondary, fontFamily: "Inter_400Regular" }]}>
                  Lädt …
                </Text>
              </View>
            ) : countryDetails.coffeeCount === 0 ? (
              <View style={[styles.sheetEmpty, { borderTopColor: colors.border }]}>
                <Text style={[styles.sheetEmptyText, { color: colors.textSecondary, fontFamily: "Inter_400Regular", textAlign: "center" }]}>
                  Du hast noch keinen Kaffee aus {selectedCountry} eingetragen.
                </Text>
              </View>
            ) : (
              <>
                <View style={[styles.sheetRatings, { borderTopColor: colors.border }]}>
                  <View style={styles.sheetRatingBox}>
                    <Text style={[styles.sheetRatingLabel, { color: colors.textSecondary, fontFamily: "Inter_500Medium" }]}>
                      Ø Hase
                    </Text>
                    <Text style={[styles.sheetRatingValue, { color: colors.tint, fontFamily: "Inter_700Bold" }]}>
                      {countryDetails.averageRabbitRating ?? "–"}
                    </Text>
                  </View>
                  <View style={[styles.sheetRatingDivider, { backgroundColor: colors.border }]} />
                  <View style={styles.sheetRatingBox}>
                    <Text style={[styles.sheetRatingLabel, { color: colors.textSecondary, fontFamily: "Inter_500Medium" }]}>
                      Ø Dodo
                    </Text>
                    <Text style={[styles.sheetRatingValue, { color: colors.tint, fontFamily: "Inter_700Bold" }]}>
                      {countryDetails.averageDodoRating ?? "–"}
                    </Text>
                  </View>
                </View>

                {countryDetails.regions.length > 0 && (
                  <View style={[styles.sheetBlock, { borderTopColor: colors.border }]}>
                    <Text style={[styles.sheetBlockLabel, { color: colors.textSecondary, fontFamily: "Inter_600SemiBold" }]}>
                      REGIONEN
                    </Text>
                    {countryDetails.regions.map((r) => (
                      <Text key={r} style={[styles.sheetListItem, { color: colors.text, fontFamily: "Inter_400Regular" }]}>
                        •  {r}
                      </Text>
                    ))}
                  </View>
                )}

                <View style={[styles.sheetBlock, { borderTopColor: colors.border }]}>
                  <Text style={[styles.sheetBlockLabel, { color: colors.textSecondary, fontFamily: "Inter_600SemiBold" }]}>
                    KAFFEES
                  </Text>
                  {countryDetails.coffees.map((cf) => (
                    <Pressable
                      key={cf.id}
                      onPress={() => {
                        closeCountry();
                        router.push(`/coffee/${cf.id}`);
                      }}
                      style={({ pressed }) => [styles.sheetCoffeeRow, { opacity: pressed ? 0.6 : 1 }]}
                    >
                      <Text style={[styles.sheetListItem, { color: colors.text, fontFamily: "Inter_500Medium" }]}>
                        •  {cf.name}
                      </Text>
                      <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
                    </Pressable>
                  ))}
                </View>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 12,
  },
  backBtn: { marginBottom: 4 },
  headerTextBlock: { flex: 1 },
  headerLabel: { fontSize: 11, letterSpacing: 1.5, marginBottom: 2 },
  headerTitle: { fontSize: 32, lineHeight: 38 },
  section: { borderWidth: 1, borderTopWidth: 2 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  sectionLabel: { fontSize: 11, letterSpacing: 1.5 },
  sectionCount: { fontSize: 15 },
  progressSection: {
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
    gap: 8,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressLabel: { fontSize: 12, letterSpacing: 0.4 },
  progressValue: { fontSize: 13 },
  progressTrack: { height: 8, borderRadius: 4, overflow: "hidden" },
  progressFill: { height: "100%" },
  progressPct: { fontSize: 12, textAlign: "right" },
  emptyRow: {
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 20,
    alignItems: "center",
  },
  emptyText: { fontSize: 14 },
  lastDiscoveredRow: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 8,
  },
  lastDiscoveredLabel: { fontSize: 13 },
  lastDiscoveredValue: { fontSize: 15, flex: 1 },
  profileCards: {
    borderTopWidth: 1,
    padding: 16,
    gap: 10,
  },
  topCoffeeRatings: { flexDirection: "row", alignItems: "center", marginTop: 2 },
  topCoffeeRating: { fontSize: 12 },

  // KAFFEEWELT
  sectionSubtitle: { fontSize: 13, marginTop: 3 },
  mapProgressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
    gap: 12,
  },
  mapProgressText: { fontSize: 13, flex: 1 },
  mapProgressPct: { fontSize: 14 },
  mapProgressTrackWrap: { paddingHorizontal: 16, paddingBottom: 14 },
  mapWrap: {
    marginHorizontal: 12,
    borderWidth: 1,
    borderRadius: 8,
    overflow: "hidden",
  },
  mapHint: {
    fontSize: 13,
    textAlign: "center",
    paddingHorizontal: 24,
    paddingTop: 14,
  },
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    borderTopWidth: 1,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 16,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendSwatch: { width: 14, height: 14 },
  legendText: { fontSize: 12 },

  // Bottom sheet
  sheetBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderWidth: 1,
    borderTopWidth: 2,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 14,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingBottom: 16,
  },
  sheetIcon: { width: 34, alignItems: "center" },
  sheetTitle: { fontSize: 20, letterSpacing: 0.5 },
  sheetCount: { fontSize: 13, marginTop: 2 },
  sheetEmpty: { borderTopWidth: 1, paddingVertical: 24 },
  sheetEmptyText: { fontSize: 14 },
  sheetRatings: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    paddingVertical: 16,
  },
  sheetRatingBox: { flex: 1, alignItems: "center", gap: 4 },
  sheetRatingDivider: { width: 1, alignSelf: "stretch", marginVertical: 4 },
  sheetRatingLabel: { fontSize: 12, letterSpacing: 0.4 },
  sheetRatingValue: { fontSize: 26 },
  sheetBlock: { borderTopWidth: 1, paddingVertical: 14, gap: 8 },
  sheetBlockLabel: { fontSize: 11, letterSpacing: 1.5 },
  sheetListItem: { fontSize: 15, lineHeight: 22 },
  sheetCoffeeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});
