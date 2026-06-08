import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { getDiscoveryStats, getCoffeeInsights, DiscoveryStats, CoffeeInsights } from "@/lib/storage";
import { useThemeColors, useCardExtras, useTheme } from "@/context/ThemeContext";
import { PolyBackground, PolyCornerCut } from "@/components/PolyBackground";

const KNOWN_COUNTRIES = [
  "Äthiopien", "Brasilien", "Burundi", "Costa Rica", "El Salvador",
  "Guatemala", "Honduras", "Indien", "Indonesien", "Jemen",
  "Kenia", "Kolumbien", "Mexiko", "Nicaragua", "Panama",
  "Peru", "Ruanda", "Tansania", "Uganda", "Vietnam",
] as const;

const TOTAL_KNOWN = KNOWN_COUNTRIES.length;

const COUNTRY_FLAGS: Record<string, string> = {
  "Äthiopien": "🇪🇹", "Brasilien": "🇧🇷", "Burundi": "🇧🇮",
  "Costa Rica": "🇨🇷", "El Salvador": "🇸🇻", "Guatemala": "🇬🇹",
  "Honduras": "🇭🇳", "Indien": "🇮🇳", "Indonesien": "🇮🇩",
  "Jemen": "🇾🇪", "Kenia": "🇰🇪", "Kolumbien": "🇨🇴",
  "Mexiko": "🇲🇽", "Nicaragua": "🇳🇮", "Panama": "🇵🇦",
  "Peru": "🇵🇪", "Ruanda": "🇷🇼", "Tansania": "🇹🇿",
  "Uganda": "🇺🇬", "Vietnam": "🇻🇳",
};

function getFlag(country: string): string {
  return COUNTRY_FLAGS[country] ?? "🌍";
}

function InsightRow({
  label,
  value,
  colors,
}: {
  label: string;
  value: string;
  colors: ReturnType<typeof useThemeColors>;
}) {
  return (
    <View style={[insightRowStyles.row, { borderTopColor: colors.border }]}>
      <Text style={[insightRowStyles.label, { color: colors.textSecondary, fontFamily: "Inter_400Regular" }]}>
        {label}
      </Text>
      <Text style={[insightRowStyles.value, { color: colors.text, fontFamily: "Inter_600SemiBold" }]}>
        {value}
      </Text>
    </View>
  );
}

const insightRowStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 13,
    gap: 12,
  },
  label: { fontSize: 13 },
  value: { fontSize: 14, textAlign: "right", flex: 1 },
});

export default function DiscoveriesScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const cardExtras = useCardExtras();
  const { design } = useTheme();
  const isLowpoly = design === "lowpoly";

  const [stats, setStats] = useState<DiscoveryStats | null>(null);
  const [insights, setInsights] = useState<CoffeeInsights | null>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  useFocusEffect(
    useCallback(() => {
      getDiscoveryStats().then(setStats);
      getCoffeeInsights().then(setInsights);
    }, [])
  );

  const discoveredCountries = (stats?.countries ?? []).slice().sort();
  const knownDiscovered = discoveredCountries.filter(
    (c) => KNOWN_COUNTRIES.includes(c as typeof KNOWN_COUNTRIES[number])
  );
  const unknownDiscovered = discoveredCountries.filter(
    (c) => !KNOWN_COUNTRIES.includes(c as typeof KNOWN_COUNTRIES[number])
  );
  const allSorted = [...knownDiscovered, ...unknownDiscovered];
  const totalDiscovered = discoveredCountries.length;
  const progress = Math.min(totalDiscovered / TOTAL_KNOWN, 1);

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

          {allSorted.length === 0 ? (
            <View style={[styles.emptyRow, { borderTopColor: colors.border }]}>
              <Text style={[styles.emptyText, { color: colors.textSecondary, fontFamily: "Inter_400Regular" }]}>
                Noch keine Herkünfte eingetragen
              </Text>
            </View>
          ) : (
            allSorted.map((country) => (
              <View
                key={country}
                style={[styles.countryRow, { borderTopColor: colors.border }]}
              >
                <Text style={styles.countryFlag}>{getFlag(country)}</Text>
                <Text style={[styles.countryName, { color: colors.text, fontFamily: "Inter_500Medium" }]}>
                  {country}
                </Text>
              </View>
            ))
          )}
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
            <>
              <InsightRow
                label="Lieblingsherkunft"
                value={
                  insights?.favoriteCountry
                    ? `${getFlag(insights.favoriteCountry)}  ${insights.favoriteCountry}`
                    : "–"
                }
                colors={colors}
              />
              <InsightRow
                label="Lieblingsaroma"
                value={
                  insights?.favoriteAroma
                    ? `${insights.favoriteAroma.emoji}  ${insights.favoriteAroma.label}`
                    : "–"
                }
                colors={colors}
              />
              <InsightRow
                label="Lieblingsröstgrad"
                value={insights?.favoriteRoastLevel ?? "–"}
                colors={colors}
              />
              <InsightRow
                label="Lieblingsmühle"
                value={insights?.favoriteGrinder ?? "–"}
                colors={colors}
              />
              {insights?.topCoffee ? (
                <View style={[insightRowStyles.row, { borderTopColor: colors.border }]}>
                  <Text style={[insightRowStyles.label, { color: colors.textSecondary, fontFamily: "Inter_400Regular" }]}>
                    Spitzenreiter
                  </Text>
                  <View style={styles.topCoffeeRight}>
                    <Text style={[styles.topCoffeeName, { color: colors.text, fontFamily: "Inter_600SemiBold" }]}>
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
                  </View>
                </View>
              ) : (
                <InsightRow label="Spitzenreiter" value="–" colors={colors} />
              )}
            </>
          )}
        </View>
      </ScrollView>
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
  countryRow: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  countryFlag: { fontSize: 22, lineHeight: 28, width: 30, textAlign: "center" },
  countryName: { fontSize: 16, flex: 1 },
  topCoffeeRight: { flex: 1, alignItems: "flex-end", gap: 2 },
  topCoffeeName: { fontSize: 14, textAlign: "right" },
  topCoffeeRatings: { flexDirection: "row", alignItems: "center" },
  topCoffeeRating: { fontSize: 12 },
});
