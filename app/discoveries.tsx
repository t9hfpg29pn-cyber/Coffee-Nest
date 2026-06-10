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
  getCountryDetails,
  getCelebratedCountries,
  setCelebratedCountries,
  getFavoriteCountriesByUser,
  getTopCoffeeByUser,
  getSharedFavoriteCoffee,
  getAromaDiscoveryStats,
  getProcessingDiscoveryStats,
  DiscoveryStats,
  CountryDetails,
  FavoriteCountriesByUser,
  TopCoffeeByUser,
  SharedFavoriteCoffee,
  CategoryDiscovery,
  CategoryCoffeeRef,
} from "@/lib/storage";
import { useThemeColors, useCardExtras, useTheme } from "@/context/ThemeContext";
import { useUserNames } from "@/context/UserNamesContext";
import { PolyBackground } from "@/components/PolyBackground";
import { TornDefs, TornSheet, Grain, Hairline, IconStamp } from "@/components/TornPaper";
import { CoffeeOriginMap } from "@/components/CoffeeOriginMap";
import { COFFEE_WORLD_MAP } from "@/constants/coffeeMap";
import {
  AromaIcon,
  ProcessingIcon,
  OriginPinIcon,
  HaseIcon,
  DodoIcon,
} from "@/components/CoffeeIcons";
import Colors from "@/constants/colors";

const SERIF_BLACK = "Fraunces_700Bold";
const SERIF_BOLD = "Fraunces_600SemiBold";
const SERIF_MED = "Inter_400Regular";

const KNOWN_COUNTRIES = [
  "Äthiopien", "Brasilien", "Burundi", "Costa Rica", "El Salvador",
  "Guatemala", "Honduras", "Indien", "Indonesien", "Jemen",
  "Kenia", "Kolumbien", "Mexiko", "Nicaragua", "Panama",
  "Peru", "Ruanda", "Tansania", "Uganda", "Vietnam",
] as const;

const TOTAL_KNOWN = KNOWN_COUNTRIES.length;

// Varied torn seeds so adjacent category sheets never share a silhouette.
const CARD_SEEDS = [2, 5, 8, 12, 15, 7, 9, 13];

type ThemeColors = ReturnType<typeof useThemeColors>;

type SelectedCategory = {
  label: string;
  icon: React.ReactNode;
  count: number;
  coffees: CategoryCoffeeRef[];
} | null;

// ─── Shared inline Hase/Dodo rating display ──────────────────────────────────
function RatingInline({
  name1, name2, hase, dodo, user2active, colors, size = 11,
}: {
  name1: string;
  name2: string;
  hase: number | null;
  dodo: number | null;
  user2active: boolean;
  colors: ThemeColors;
  size?: number;
}) {
  return (
    <View style={styles.ratingInline}>
      <Text style={[styles.ratingChip, { fontSize: size, color: colors.inkSoft, fontFamily: "Inter_400Regular" }]}>
        {name1}{" "}
        <Text style={{ color: colors.gold, fontFamily: "Inter_700Bold", fontSize: size + 3 }}>{hase ?? "–"}</Text>
      </Text>
      {user2active && (
        <Text style={[styles.ratingChip, { fontSize: size, color: colors.inkSoft, fontFamily: "Inter_400Regular" }]}>
          {name2}{" "}
          <Text style={{ color: colors.gold, fontFamily: "Inter_700Bold", fontSize: size + 3 }}>{dodo ?? "–"}</Text>
        </Text>
      )}
    </View>
  );
}

// ─── Profile two-column (Hase | Dodo) block ──────────────────────────────────
function DuoColumn({
  iconNode, name, primary, roastery, secondaryNode, colors,
}: {
  iconNode: React.ReactNode;
  name: string;
  primary: string;
  roastery?: string;
  secondaryNode?: React.ReactNode;
  colors: ThemeColors;
}) {
  return (
    <View style={styles.duoCol}>
      <View style={styles.duoHead}>
        {iconNode}
        <Text style={[styles.duoName, { color: colors.inkSoft, fontFamily: "Inter_500Medium" }]} numberOfLines={1}>
          {name}
        </Text>
      </View>
      <Text style={[styles.duoPrimary, { color: colors.ink, fontFamily: "Inter_700Bold" }]} numberOfLines={1}>
        {primary}
      </Text>
      {roastery ? (
        <Text style={[styles.duoRoastery, { color: colors.inkSoft, fontFamily: "Inter_400Regular" }]} numberOfLines={1}>
          {roastery}
        </Text>
      ) : null}
      {secondaryNode}
    </View>
  );
}

// ─── Aroma / Aufbereitung collection card — cream torn sheet w/ icon stamp ────
function CategoryCard({
  icon, cat, name1, name2, user2active, colors, seed, onPress,
}: {
  icon: React.ReactNode;
  cat: CategoryDiscovery;
  name1: string;
  name2: string;
  user2active: boolean;
  colors: ThemeColors;
  seed: number;
  onPress: () => void;
}) {
  return (
    <View style={styles.chipOuter}>
      <TornSheet
        tone="cream"
        variant="small"
        seed={seed}
        rotate={0}
        peek={false}
        onPress={onPress}
        contentStyle={styles.chipPad}
      >
        <IconStamp size={46} seed={9} style={styles.chipStamp}>
          {icon}
        </IconStamp>
      <Text style={[styles.chipName, { color: colors.ink, fontFamily: SERIF_BOLD }]} numberOfLines={1}>
        {cat.label}
      </Text>
      <Text style={[styles.chipCount, { color: colors.inkSoft, fontFamily: "Inter_400Regular" }]}>
        {cat.count} {cat.count === 1 ? "Kaffee" : "Kaffees"}
      </Text>
      {cat.bestCoffee ? (
        <View style={styles.chipBest}>
          <Text style={[styles.chipBestLabel, { color: colors.inkFaint, fontFamily: "Inter_600SemiBold" }]}>
            BESTER
          </Text>
          <Text style={[styles.chipBestName, { color: colors.ink, fontFamily: "Inter_500Medium" }]} numberOfLines={1}>
            {cat.bestCoffee.name}
          </Text>
          <RatingInline
            name1={name1}
            name2={name2}
            hase={cat.bestCoffee.haseRating}
            dodo={cat.bestCoffee.dodoRating}
            user2active={user2active}
            colors={colors}
          />
        </View>
      ) : (
        <Text style={[styles.chipEmpty, { color: colors.inkSoft, fontFamily: "Inter_400Regular" }]}>
          Noch nicht entdeckt
        </Text>
      )}
      </TornSheet>
    </View>
  );
}

export default function DiscoveriesScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const cardExtras = useCardExtras();
  const { design } = useTheme();
  const isLowpoly = design === "lowpoly";
  const { name1, name2, user2active } = useUserNames();

  const [stats, setStats] = useState<DiscoveryStats | null>(null);
  const [favCountries, setFavCountries] = useState<FavoriteCountriesByUser | null>(null);
  const [topByUser, setTopByUser] = useState<TopCoffeeByUser | null>(null);
  const [sharedFav, setSharedFav] = useState<SharedFavoriteCoffee | null>(null);
  const [aromaStats, setAromaStats] = useState<CategoryDiscovery[]>([]);
  const [processingStats, setProcessingStats] = useState<CategoryDiscovery[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [countryDetails, setCountryDetails] = useState<CountryDetails | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<SelectedCategory>(null);
  const [highlightCountry, setHighlightCountry] = useState<string | null>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 0 : insets.bottom;

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

      getFavoriteCountriesByUser().then((f) => { if (active) setFavCountries(f); });
      getTopCoffeeByUser().then((t) => { if (active) setTopByUser(t); });
      getSharedFavoriteCoffee().then((sf) => { if (active) setSharedFav(sf); });
      getAromaDiscoveryStats().then((a) => { if (active) setAromaStats(a); });
      getProcessingDiscoveryStats().then((p) => { if (active) setProcessingStats(p); });

      return () => { active = false; };
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

  const openCategory = useCallback((label: string, icon: React.ReactNode, cat: CategoryDiscovery) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setSelectedCategory({ label, icon, count: cat.count, coffees: cat.coffees });
  }, []);

  const closeCategory = useCallback(() => setSelectedCategory(null), []);

  const discoveredCountries = (stats?.countries ?? []).slice().sort();
  const knownDiscovered = discoveredCountries.filter(
    (c) => KNOWN_COUNTRIES.includes(c as typeof KNOWN_COUNTRIES[number])
  );
  const lastDiscovered =
    stats?.lastDiscoveredCountry ??
    (discoveredCountries.length > 0
      ? discoveredCountries[discoveredCountries.length - 1]
      : null);

  const discoveredSet = new Set(discoveredCountries);
  const mapDiscoveredCount = knownDiscovered.length;
  const mapProgress = Math.min(mapDiscoveredCount / TOTAL_KNOWN, 1);

  const mapColors = {
    discovered: colors.tint,
    undiscovered: colors.surface,
    stroke: colors.background,
    labelOnDiscovered: Colors.espresso,
    labelOnUndiscovered: colors.text,
    marker: Colors.espresso,
    regionBg: isLowpoly ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
    regionLabel: colors.textSecondary,
  };

  const hasProfile = !!(
    favCountries?.hase ||
    topByUser?.hase ||
    (user2active && (favCountries?.dodo || topByUser?.dodo || sharedFav))
  );

  // Smart per-user comparisons: collapse identical Hase/Dodo results into a
  // single shared insight, otherwise show both side by side.
  const haseCountry = favCountries?.hase ?? null;
  const dodoCountry = user2active ? (favCountries?.dodo ?? null) : null;
  const sameCountry = !!(user2active && haseCountry && dodoCountry && haseCountry === dodoCountry);

  const haseTop = topByUser?.hase ?? null;
  const dodoTop = user2active ? (topByUser?.dodo ?? null) : null;
  const sameTop = !!(
    user2active && haseTop && dodoTop &&
    haseTop.name === dodoTop.name && haseTop.roasteryName === dodoTop.roasteryName
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <PolyBackground />
      <TornDefs />
      <Grain />

      {/* Masthead — a large cream page bleeding to the top & side edges */}
      <TornSheet
        tone="cream"
        seed={6}
        rotate={0.4}
        peek={false}
        style={styles.masthead}
        contentStyle={[styles.mastheadPad, { paddingTop: topPad + 18 }]}
      >
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.6 : 1 }]}
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={26} color={colors.ink} />
        </Pressable>
        <Text style={[styles.kicker, { color: colors.inkFaint, fontFamily: "Inter_500Medium" }]}>
          COFFEE NEST
        </Text>
        <Text style={[styles.title, { color: colors.ink, fontFamily: SERIF_BLACK }]}>
          Entdeckungen
        </Text>
      </TornSheet>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 26, paddingBottom: bottomPad + 40, gap: 28 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── KAFFEEWELT ────────────────────────────────────────────── */}
        <TornSheet tone="cream" seed={2} rotate={-0.6} contentStyle={styles.sheetPad}>
          <Text style={[styles.sectionLabel, { color: colors.inkFaint, fontFamily: "Inter_600SemiBold" }]}>
            KAFFEEWELT
          </Text>
          <Text style={[styles.sectionSubtitle, { color: colors.inkSoft, fontFamily: "Inter_400Regular" }]}>
            Entdecke die Herkunft deiner Kaffees
          </Text>

          <View style={styles.mapProgressRow}>
            <Text style={[styles.mapProgressText, { color: colors.ink, fontFamily: "Inter_500Medium" }]}>
              {mapDiscoveredCount} von {TOTAL_KNOWN} Herkunftsländern entdeckt
            </Text>
            <Text style={[styles.mapProgressPct, { color: colors.gold, fontFamily: "Inter_700Bold" }]}>
              {Math.round(mapProgress * 100)} %
            </Text>
          </View>
          <View style={styles.mapProgressTrackWrap}>
            <View style={[styles.progressTrack, { backgroundColor: colors.hair }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.round(mapProgress * 100)}%` as any,
                    backgroundColor: colors.gold,
                    borderRadius: isLowpoly ? 1 : 3,
                  },
                ]}
              />
            </View>
          </View>

          <View style={[styles.mapWrap, { backgroundColor: colors.background }]}>
            <CoffeeOriginMap
              data={COFFEE_WORLD_MAP}
              discovered={discoveredSet}
              favoriteHase={favCountries?.hase ?? null}
              favoriteDodo={user2active ? (favCountries?.dodo ?? null) : null}
              onSelectCountry={openCountry}
              colors={mapColors}
              height={360}
              highlightCountry={highlightCountry}
              onHighlightComplete={() => setHighlightCountry(null)}
            />
          </View>

          {mapDiscoveredCount === 0 && (
            <Text style={[styles.mapHint, { color: colors.inkSoft, fontFamily: "Inter_400Regular" }]}>
              Füge deinen ersten Kaffee mit Herkunftsland hinzu.
            </Text>
          )}

          {/* Legend */}
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendSwatch, { backgroundColor: colors.gold, borderRadius: isLowpoly ? 1 : 6 }]} />
              <Text style={[styles.legendText, { color: colors.inkSoft, fontFamily: "Inter_400Regular" }]}>
                Entdeckt
              </Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendSwatch, { backgroundColor: colors.surface, borderColor: colors.inkFaint, borderWidth: 1.5, borderRadius: isLowpoly ? 1 : 6 }]} />
              <Text style={[styles.legendText, { color: colors.inkSoft, fontFamily: "Inter_400Regular" }]}>
                Noch nicht entdeckt
              </Text>
            </View>
            <View style={styles.legendItem}>
              <HaseIcon size={16} color={colors.gold} />
              <Text style={[styles.legendText, { color: colors.inkSoft, fontFamily: "Inter_400Regular" }]}>
                {name1}s Lieblingsland
              </Text>
            </View>
            {user2active && (
              <View style={styles.legendItem}>
                <DodoIcon size={16} color={colors.gold} />
                <Text style={[styles.legendText, { color: colors.inkSoft, fontFamily: "Inter_400Regular" }]}>
                  {name2}s Lieblingsland
                </Text>
              </View>
            )}
          </View>

          {lastDiscovered ? (
            <>
              <View style={styles.lastDiscoveredHair}>
                <Hairline />
              </View>
              <View style={styles.lastDiscoveredRow}>
                <OriginPinIcon size={18} color={colors.gold} />
                <Text style={[styles.lastDiscoveredLabel, { color: colors.inkSoft, fontFamily: "Inter_500Medium" }]}>
                  Zuletzt entdeckt:
                </Text>
                <Text style={[styles.lastDiscoveredValue, { color: colors.ink, fontFamily: "Inter_600SemiBold" }]}>
                  {lastDiscovered}
                </Text>
              </View>
            </>
          ) : null}
        </TornSheet>

        {/* ── DEIN KAFFEEPROFIL ─────────────────────────────────────── */}
        <TornSheet tone="cream" seed={8} rotate={0.7} contentStyle={styles.sheetPad}>
          <Text style={[styles.sectionLabel, { color: colors.inkFaint, fontFamily: "Inter_600SemiBold" }]}>
            DEIN KAFFEEPROFIL
          </Text>

          {!hasProfile ? (
            <View style={styles.emptyRow}>
              <Text style={[styles.emptyText, { color: colors.inkSoft, fontFamily: "Inter_400Regular", textAlign: "center" }]}>
                Mehr Kaffees bewerten, um euer Profil zu füllen.
              </Text>
            </View>
          ) : (
            <View>
              {/* GEMEINSAMER FAVORIT — espresso feature plane */}
              {user2active && sharedFav && (
                <View style={styles.heroWrap}>
                  <TornSheet tone="espresso" seed={4} rotate={-0.9} contentStyle={styles.heroCard}>
                    <Text style={[styles.heroLabel, { color: colors.gold, fontFamily: "Inter_600SemiBold" }]}>
                      GEMEINSAMER FAVORIT
                    </Text>
                    <Text style={[styles.heroName, { color: colors.ink, fontFamily: SERIF_BOLD }]} numberOfLines={2}>
                      {sharedFav.name}
                    </Text>
                    {sharedFav.roasteryName ? (
                      <Text style={[styles.heroRoastery, { color: colors.inkSoft, fontFamily: "Inter_400Regular" }]} numberOfLines={1}>
                        {sharedFav.roasteryName}
                      </Text>
                    ) : null}
                    <View style={styles.heroRatings}>
                      <View style={styles.heroRatingItem}>
                        <HaseIcon size={18} color={colors.gold} />
                        <Text style={[styles.heroRatingText, { color: colors.inkSoft, fontFamily: "Inter_400Regular" }]}>
                          {name1}{" "}
                          <Text style={{ color: colors.gold, fontFamily: "Inter_700Bold", fontSize: 20 }}>{sharedFav.haseRating}</Text>
                        </Text>
                      </View>
                      <View style={[styles.heroDivider, { backgroundColor: colors.hair }]} />
                      <View style={styles.heroRatingItem}>
                        <DodoIcon size={18} color={colors.gold} />
                        <Text style={[styles.heroRatingText, { color: colors.inkSoft, fontFamily: "Inter_400Regular" }]}>
                          {name2}{" "}
                          <Text style={{ color: colors.gold, fontFamily: "Inter_700Bold", fontSize: 20 }}>{sharedFav.dodoRating}</Text>
                        </Text>
                      </View>
                    </View>
                  </TornSheet>
                </View>
              )}

              {/* LIEBLINGSLAND / LIEBLINGSLÄNDER */}
              <View style={styles.profileBlock}>
                {sameCountry ? (
                  <View style={styles.centerInsight}>
                    <Text style={[styles.blockLabelCenter, { color: colors.inkFaint, fontFamily: "Inter_600SemiBold" }]}>
                      GEMEINSAMES LIEBLINGSLAND
                    </Text>
                    <View style={styles.centerIcons}>
                      <HaseIcon size={18} color={colors.gold} />
                      <DodoIcon size={18} color={colors.gold} />
                    </View>
                    <Text style={[styles.centerPrimary, { color: colors.ink, fontFamily: "Inter_700Bold" }]} numberOfLines={1}>
                      {haseCountry}
                    </Text>
                  </View>
                ) : !user2active ? (
                  <View style={styles.centerInsight}>
                    <Text style={[styles.blockLabelCenter, { color: colors.inkFaint, fontFamily: "Inter_600SemiBold" }]}>
                      LIEBLINGSLAND
                    </Text>
                    <Text style={[styles.centerPrimary, { color: colors.ink, fontFamily: "Inter_700Bold" }]} numberOfLines={1}>
                      {haseCountry ?? "—"}
                    </Text>
                  </View>
                ) : (
                  <>
                    <Text style={[styles.blockLabel, { color: colors.inkFaint, fontFamily: "Inter_600SemiBold" }]}>
                      LIEBLINGSLÄNDER
                    </Text>
                    <View style={styles.duoRow}>
                      <DuoColumn
                        iconNode={<HaseIcon size={18} color={colors.gold} />}
                        name={name1}
                        primary={haseCountry ?? "—"}
                        colors={colors}
                      />
                      <View style={[styles.duoDivider, { backgroundColor: colors.hair }]} />
                      <DuoColumn
                        iconNode={<DodoIcon size={18} color={colors.gold} />}
                        name={name2}
                        primary={dodoCountry ?? "—"}
                        colors={colors}
                      />
                    </View>
                  </>
                )}
              </View>

              {/* SPITZENREITER */}
              <View style={styles.profileHair}>
                <Hairline />
              </View>
              <View style={styles.profileBlock}>
                {sameTop && haseTop && dodoTop ? (
                  <View style={styles.centerInsight}>
                    <Text style={[styles.blockLabelCenter, { color: colors.inkFaint, fontFamily: "Inter_600SemiBold" }]}>
                      GEMEINSAMER SPITZENREITER
                    </Text>
                    <Text style={[styles.centerPrimary, { color: colors.ink, fontFamily: "Inter_700Bold" }]} numberOfLines={2}>
                      {haseTop.name}
                    </Text>
                    {haseTop.roasteryName ? (
                      <Text style={[styles.centerRoastery, { color: colors.inkSoft, fontFamily: "Inter_400Regular" }]} numberOfLines={1}>
                        {haseTop.roasteryName}
                      </Text>
                    ) : null}
                    <View style={styles.centerRatings}>
                      <Text style={[styles.heroRatingText, { color: colors.inkSoft, fontFamily: "Inter_400Regular" }]}>
                        {name1}{" "}
                        <Text style={{ color: colors.gold, fontFamily: "Inter_700Bold", fontSize: 16 }}>{haseTop.rating}</Text>
                      </Text>
                      <Text style={[styles.heroRatingText, { color: colors.inkSoft, fontFamily: "Inter_400Regular" }]}>
                        {name2}{" "}
                        <Text style={{ color: colors.gold, fontFamily: "Inter_700Bold", fontSize: 16 }}>{dodoTop.rating}</Text>
                      </Text>
                    </View>
                  </View>
                ) : !user2active ? (
                  <View style={styles.centerInsight}>
                    <Text style={[styles.blockLabelCenter, { color: colors.inkFaint, fontFamily: "Inter_600SemiBold" }]}>
                      SPITZENREITER
                    </Text>
                    <Text style={[styles.centerPrimary, { color: colors.ink, fontFamily: "Inter_700Bold" }]} numberOfLines={2}>
                      {haseTop?.name ?? "—"}
                    </Text>
                    {haseTop?.roasteryName ? (
                      <Text style={[styles.centerRoastery, { color: colors.inkSoft, fontFamily: "Inter_400Regular" }]} numberOfLines={1}>
                        {haseTop.roasteryName}
                      </Text>
                    ) : null}
                    {haseTop ? (
                      <Text style={[styles.centerSecondary, { color: colors.inkSoft, fontFamily: "Inter_400Regular" }]}>
                        Wertung{" "}
                        <Text style={{ color: colors.gold, fontFamily: "Inter_700Bold", fontSize: 15 }}>{haseTop.rating}</Text>
                      </Text>
                    ) : null}
                  </View>
                ) : (
                  <>
                    <Text style={[styles.blockLabel, { color: colors.inkFaint, fontFamily: "Inter_600SemiBold" }]}>
                      SPITZENREITER
                    </Text>
                    <View style={styles.duoRow}>
                      <DuoColumn
                        iconNode={<HaseIcon size={18} color={colors.gold} />}
                        name={name1}
                        primary={haseTop?.name ?? "—"}
                        roastery={haseTop?.roasteryName}
                        colors={colors}
                        secondaryNode={
                          haseTop ? (
                            <Text style={[styles.duoSecondary, { color: colors.inkSoft, fontFamily: "Inter_400Regular" }]}>
                              Wertung{" "}
                              <Text style={{ color: colors.gold, fontFamily: "Inter_700Bold", fontSize: 14 }}>{haseTop.rating}</Text>
                            </Text>
                          ) : undefined
                        }
                      />
                      <View style={[styles.duoDivider, { backgroundColor: colors.hair }]} />
                      <DuoColumn
                        iconNode={<DodoIcon size={18} color={colors.gold} />}
                        name={name2}
                        primary={dodoTop?.name ?? "—"}
                        roastery={dodoTop?.roasteryName}
                        colors={colors}
                        secondaryNode={
                          dodoTop ? (
                            <Text style={[styles.duoSecondary, { color: colors.inkSoft, fontFamily: "Inter_400Regular" }]}>
                              Wertung{" "}
                              <Text style={{ color: colors.gold, fontFamily: "Inter_700Bold", fontSize: 14 }}>{dodoTop.rating}</Text>
                            </Text>
                          ) : undefined
                        }
                      />
                    </View>
                  </>
                )}
              </View>
            </View>
          )}
        </TornSheet>

        {/* ── AROMEN — cream collectible chips ──────────────────────── */}
        <TornSheet tone="espresso" seed={5} rotate={-0.7} contentStyle={styles.sheetPad}>
          <Text style={[styles.sectionLabel, { color: colors.inkFaint, fontFamily: "Inter_600SemiBold" }]}>
            AROMEN
          </Text>
          <Text style={[styles.sectionSubtitle, { color: colors.inkSoft, fontFamily: "Inter_400Regular" }]}>
            Entdeckte Geschmackswelten
          </Text>
          <View style={styles.categoryGrid}>
            {aromaStats.map((cat, i) => (
              <CategoryCard
                key={cat.key}
                icon={<AromaIcon step={Number(cat.key)} size={26} color={colors.gold} />}
                cat={cat}
                name1={name1}
                name2={name2}
                user2active={user2active}
                colors={colors}
                seed={CARD_SEEDS[i % CARD_SEEDS.length]}
                onPress={() =>
                  openCategory(cat.label, <AromaIcon step={Number(cat.key)} size={30} color={colors.tint} />, cat)
                }
              />
            ))}
          </View>
        </TornSheet>

        {/* ── AUFBEREITUNGEN — cream collectible chips ──────────────── */}
        <TornSheet tone="espresso" seed={11} rotate={0.7} contentStyle={styles.sheetPad}>
          <Text style={[styles.sectionLabel, { color: colors.inkFaint, fontFamily: "Inter_600SemiBold" }]}>
            AUFBEREITUNGEN
          </Text>
          <Text style={[styles.sectionSubtitle, { color: colors.inkSoft, fontFamily: "Inter_400Regular" }]}>
            Entdeckte Verarbeitungsmethoden
          </Text>
          <View style={styles.categoryGrid}>
            {processingStats.map((cat, i) => (
              <CategoryCard
                key={cat.key}
                icon={<ProcessingIcon method={cat.key} size={26} color={colors.gold} />}
                cat={cat}
                name1={name1}
                name2={name2}
                user2active={user2active}
                colors={colors}
                seed={CARD_SEEDS[(i + 3) % CARD_SEEDS.length]}
                onPress={() =>
                  openCategory(cat.label, <ProcessingIcon method={cat.key} size={30} color={colors.tint} />, cat)
                }
              />
            ))}
          </View>
        </TornSheet>
      </ScrollView>

      {/* ── Country detail sheet ──────────────────────────────────────── */}
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
                      Ø {name1}
                    </Text>
                    <Text style={[styles.sheetRatingValue, { color: colors.tint, fontFamily: "Inter_700Bold" }]}>
                      {countryDetails.averageRabbitRating ?? "–"}
                    </Text>
                  </View>
                  {user2active && (
                    <>
                      <View style={[styles.sheetRatingDivider, { backgroundColor: colors.border }]} />
                      <View style={styles.sheetRatingBox}>
                        <Text style={[styles.sheetRatingLabel, { color: colors.textSecondary, fontFamily: "Inter_500Medium" }]}>
                          Ø {name2}
                        </Text>
                        <Text style={[styles.sheetRatingValue, { color: colors.tint, fontFamily: "Inter_700Bold" }]}>
                          {countryDetails.averageDodoRating ?? "–"}
                        </Text>
                      </View>
                    </>
                  )}
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

      {/* ── Aroma / Aufbereitung detail sheet ─────────────────────────── */}
      <Modal
        visible={selectedCategory !== null}
        transparent
        animationType="fade"
        presentationStyle="overFullScreen"
        onRequestClose={closeCategory}
      >
        <Pressable style={styles.sheetBackdrop} onPress={closeCategory}>
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
              <View style={styles.sheetIcon}>{selectedCategory?.icon}</View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.sheetTitle, { color: colors.text, fontFamily: "Inter_700Bold" }]}>
                  {selectedCategory?.label.toUpperCase()}
                </Text>
                <Text style={[styles.sheetCount, { color: colors.textSecondary, fontFamily: "Inter_400Regular" }]}>
                  {(selectedCategory?.count ?? 0) === 0
                    ? "Noch nicht entdeckt"
                    : `${selectedCategory?.count} ${selectedCategory?.count === 1 ? "Kaffee" : "Kaffees"} entdeckt`}
                </Text>
              </View>
              <Pressable onPress={closeCategory} hitSlop={10} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </Pressable>
            </View>

            {(selectedCategory?.coffees.length ?? 0) === 0 ? (
              <View style={[styles.sheetEmpty, { borderTopColor: colors.border }]}>
                <Text style={[styles.sheetEmptyText, { color: colors.textSecondary, fontFamily: "Inter_400Regular", textAlign: "center" }]}>
                  Noch keinen Kaffee in dieser Kategorie eingetragen.
                </Text>
              </View>
            ) : (
              <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
                <View style={[styles.sheetBlock, { borderTopColor: colors.border }]}>
                  <Text style={[styles.sheetBlockLabel, { color: colors.textSecondary, fontFamily: "Inter_600SemiBold" }]}>
                    KAFFEES
                  </Text>
                  {selectedCategory?.coffees.map((cf) => (
                    <Pressable
                      key={cf.id}
                      onPress={() => {
                        closeCategory();
                        router.push(`/coffee/${cf.id}`);
                      }}
                      style={({ pressed }) => [styles.sheetCategoryRow, { opacity: pressed ? 0.6 : 1 }]}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.sheetListItem, { color: colors.text, fontFamily: "Inter_500Medium" }]} numberOfLines={1}>
                          {cf.name}
                        </Text>
                        <RatingInline
                          name1={name1}
                          name2={name2}
                          hase={cf.haseRating}
                          dodo={cf.dodoRating}
                          user2active={user2active}
                          colors={colors}
                          size={12}
                        />
                      </View>
                      <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  masthead: { marginTop: -48 },
  mastheadPad: { paddingHorizontal: 24, paddingBottom: 24 },
  backBtn: { marginLeft: -4, marginBottom: 10, alignSelf: "flex-start" },
  kicker: { fontSize: 11, letterSpacing: 3, textTransform: "uppercase", marginBottom: 4 },
  title: { fontSize: 40, lineHeight: 46 },

  sheetPad: { paddingHorizontal: 22, paddingVertical: 24 },
  sectionLabel: { fontSize: 10, letterSpacing: 2.6, textTransform: "uppercase" },
  sectionSubtitle: { fontSize: 12.5, marginTop: 5 },

  // KAFFEEWELT map
  mapProgressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginTop: 20,
    gap: 12,
  },
  mapProgressText: { fontSize: 13, flex: 1 },
  mapProgressPct: { fontSize: 22 },
  mapProgressTrackWrap: { marginTop: 10 },
  progressTrack: { height: 6, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%" },
  mapWrap: {
    marginTop: 20,
    borderRadius: 8,
    overflow: "hidden",
  },
  mapHint: {
    fontSize: 13,
    textAlign: "center",
    paddingTop: 14,
  },
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 20,
    gap: 16,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 7 },
  legendSwatch: { width: 13, height: 13 },
  legendText: { fontSize: 11.5 },
  lastDiscoveredHair: { marginTop: 20 },
  lastDiscoveredRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 16,
    gap: 8,
  },
  lastDiscoveredLabel: { fontSize: 12.5 },
  lastDiscoveredValue: { fontSize: 15, flex: 1 },

  // KAFFEEPROFIL
  emptyRow: {
    paddingVertical: 24,
    alignItems: "center",
  },
  emptyText: { fontSize: 14 },
  profileBlock: { marginTop: 26 },
  profileHair: { marginTop: 26 },
  blockLabel: { fontSize: 10, letterSpacing: 2.6, textTransform: "uppercase", marginBottom: 14 },
  duoRow: { flexDirection: "row", alignItems: "stretch" },
  duoCol: { flex: 1, gap: 3 },
  duoHead: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 },
  duoName: { fontSize: 12, letterSpacing: 0.3, flexShrink: 1 },
  duoPrimary: { fontSize: 20, lineHeight: 25 },
  duoSecondary: { fontSize: 12, marginTop: 3 },
  duoRoastery: { fontSize: 12, marginTop: 1 },
  duoDivider: { width: 1, marginHorizontal: 16 },

  // Gemeinsamer Favorit — espresso hero plane
  heroWrap: { marginTop: 22 },
  heroCard: {
    alignItems: "center",
    paddingVertical: 28,
    paddingHorizontal: 22,
    gap: 6,
  },
  heroLabel: { fontSize: 10, letterSpacing: 2.6, textTransform: "uppercase", textAlign: "center", marginBottom: 4 },
  heroName: { fontSize: 28, lineHeight: 33, textAlign: "center" },
  heroRoastery: { fontSize: 14, textAlign: "center" },
  heroRatings: { flexDirection: "row", alignItems: "center", gap: 22, marginTop: 16 },
  heroRatingItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  heroRatingText: { fontSize: 14 },
  heroDivider: { width: 1, height: 24 },

  // Merged / single insight (centered)
  centerInsight: { alignItems: "center", gap: 5 },
  blockLabelCenter: { fontSize: 10, letterSpacing: 2.6, textTransform: "uppercase", textAlign: "center", marginBottom: 2 },
  centerIcons: { flexDirection: "row", alignItems: "center", gap: 8 },
  centerPrimary: { fontSize: 22, lineHeight: 27, textAlign: "center" },
  centerRoastery: { fontSize: 13, textAlign: "center" },
  centerSecondary: { fontSize: 13, textAlign: "center", marginTop: 2 },
  centerRatings: { flexDirection: "row", alignItems: "center", gap: 20, marginTop: 4 },

  // AROMEN / AUFBEREITUNGEN — collectible chips laid directly on the cream page
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 24,
    columnGap: 18,
    rowGap: 28,
  },
  chipOuter: {
    flexBasis: "44%",
    flexGrow: 1,
  },
  chipPad: { paddingHorizontal: 20, paddingVertical: 20 },
  chipStamp: { marginBottom: 12 },
  chipName: { fontSize: 18, lineHeight: 22 },
  chipCount: { fontSize: 11.5, marginTop: 2 },
  chipBest: {
    marginTop: 12,
    gap: 3,
  },
  chipBestLabel: { fontSize: 9.5, letterSpacing: 2 },
  chipBestName: { fontSize: 13 },
  chipEmpty: { fontSize: 12, marginTop: 12 },
  ratingInline: { flexDirection: "row", flexWrap: "wrap", alignItems: "baseline", gap: 10, marginTop: 2 },
  ratingChip: {},

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
  sheetCategoryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
    gap: 8,
  },
});
