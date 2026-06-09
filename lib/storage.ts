import AsyncStorage from "@react-native-async-storage/async-storage";

export interface Roastery {
  id: string;
  name: string;
  location?: string;
  createdAt: string;
}

export interface GrindSetting {
  grinder: string;
  level: number;
}

export interface CoffeeOrigin {
  country: string;
  region: string;
  percentage: number | null;
}

export interface Coffee {
  id: string;
  roasteryId: string;
  name: string;
  haseRating: number | null;
  dodoRating: number | null;
  grindLevel: number;
  grinderName: string;
  grindSettings?: GrindSetting[];
  aroma: number;
  aromaDescription: string;
  notes: string;
  pricePerKg: string;
  origins?: CoffeeOrigin[];
  processingMethod?: string;
  roastLevel?: string;
  createdAt: string;
  updatedAt: string;
}

const ROASTERIES_KEY = "roasteries";
const COFFEES_KEY = "coffees";
const GRINDERS_KEY = "grinders";
const CELEBRATED_COUNTRIES_KEY = "celebratedCountries";

export type GrinderDesign = "niche" | "commandante";

export interface Grinder {
  name: string;
  design: GrinderDesign;
}

export const DEFAULT_GRINDERS: Grinder[] = [
  { name: "Niche", design: "niche" },
  { name: "Commandante", design: "commandante" },
];

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

/** Accepts legacy string[] backups and new object form; returns clean Grinder[]. */
export function normalizeGrinders(arr: unknown): Grinder[] {
  if (!Array.isArray(arr)) return [];
  const out: Grinder[] = [];
  const seen = new Set<string>();
  for (const g of arr) {
    let grinder: Grinder | null = null;
    if (typeof g === "string") {
      const name = g.trim();
      if (name) grinder = { name, design: /niche/i.test(name) ? "niche" : "commandante" };
    } else if (g && typeof (g as any).name === "string") {
      const name = (g as any).name.trim();
      if (name) grinder = { name, design: (g as any).design === "niche" ? "niche" : "commandante" };
    }
    if (grinder) {
      const key = grinder.name.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        out.push(grinder);
      }
    }
  }
  return out;
}

export async function getGrinders(): Promise<Grinder[]> {
  const data = await AsyncStorage.getItem(GRINDERS_KEY);
  if (!data) return [...DEFAULT_GRINDERS];
  try {
    const normalized = normalizeGrinders(JSON.parse(data));
    return normalized.length > 0 ? normalized : [...DEFAULT_GRINDERS];
  } catch {
    return [...DEFAULT_GRINDERS];
  }
}

export async function saveGrinders(list: Grinder[]): Promise<void> {
  await AsyncStorage.setItem(GRINDERS_KEY, JSON.stringify(list));
}

/**
 * Countries the user has already "seen" discovered on the map. Used to play the
 * first-discovery highlight exactly once, deterministically across navigation.
 * Returns null when no baseline has ever been stored (first run).
 */
export async function getCelebratedCountries(): Promise<string[] | null> {
  const data = await AsyncStorage.getItem(CELEBRATED_COUNTRIES_KEY);
  if (data === null) return null;
  const parsed = JSON.parse(data);
  return Array.isArray(parsed) ? parsed : [];
}

export async function setCelebratedCountries(countries: string[]): Promise<void> {
  await AsyncStorage.setItem(
    CELEBRATED_COUNTRIES_KEY,
    JSON.stringify(countries)
  );
}

export async function getRoasteries(): Promise<Roastery[]> {
  const data = await AsyncStorage.getItem(ROASTERIES_KEY);
  if (!data) return [];
  return JSON.parse(data);
}

export async function saveRoastery(name: string, location?: string): Promise<Roastery> {
  const roasteries = await getRoasteries();
  const newRoastery: Roastery = {
    id: generateId(),
    name,
    location,
    createdAt: new Date().toISOString(),
  };
  roasteries.push(newRoastery);
  await AsyncStorage.setItem(ROASTERIES_KEY, JSON.stringify(roasteries));
  return newRoastery;
}

export async function updateRoastery(id: string, name: string, location?: string): Promise<void> {
  const roasteries = await getRoasteries();
  const idx = roasteries.findIndex((r) => r.id === id);
  if (idx !== -1) {
    roasteries[idx] = { ...roasteries[idx], name, location };
    await AsyncStorage.setItem(ROASTERIES_KEY, JSON.stringify(roasteries));
  }
}

export async function deleteRoastery(id: string): Promise<void> {
  const roasteries = await getRoasteries();
  const filtered = roasteries.filter((r) => r.id !== id);
  await AsyncStorage.setItem(ROASTERIES_KEY, JSON.stringify(filtered));
  const allCoffees = await getAllCoffees();
  const remaining = allCoffees.filter((c) => c.roasteryId !== id);
  await AsyncStorage.setItem(COFFEES_KEY, JSON.stringify(remaining));
}

export async function getAllCoffees(): Promise<Coffee[]> {
  const data = await AsyncStorage.getItem(COFFEES_KEY);
  if (!data) return [];
  const coffees: Coffee[] = JSON.parse(data);
  return coffees.map((c) => ({
    origins: [],
    processingMethod: "",
    roastLevel: "",
    ...c,
  }));
}

export async function getCoffees(roasteryId: string): Promise<Coffee[]> {
  const all = await getAllCoffees();
  return all.filter((c) => c.roasteryId === roasteryId);
}

export async function getCoffeeById(id: string): Promise<Coffee | null> {
  const all = await getAllCoffees();
  return all.find((c) => c.id === id) ?? null;
}

export async function saveCoffee(data: Omit<Coffee, "id" | "createdAt" | "updatedAt">): Promise<Coffee> {
  const all = await getAllCoffees();
  const now = new Date().toISOString();
  const newCoffee: Coffee = {
    ...data,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  };
  all.push(newCoffee);
  await AsyncStorage.setItem(COFFEES_KEY, JSON.stringify(all));
  return newCoffee;
}

export async function updateCoffee(id: string, data: Partial<Omit<Coffee, "id" | "roasteryId" | "createdAt">>): Promise<void> {
  const all = await getAllCoffees();
  const idx = all.findIndex((c) => c.id === id);
  if (idx !== -1) {
    all[idx] = { ...all[idx], ...data, updatedAt: new Date().toISOString() };
    await AsyncStorage.setItem(COFFEES_KEY, JSON.stringify(all));
  }
}

export async function deleteCoffee(id: string): Promise<void> {
  const all = await getAllCoffees();
  const filtered = all.filter((c) => c.id !== id);
  await AsyncStorage.setItem(COFFEES_KEY, JSON.stringify(filtered));
}

export async function getUniqueCountries(): Promise<string[]> {
  const coffees = await getAllCoffees();
  const countries = new Set<string>();
  for (const c of coffees) {
    for (const o of c.origins ?? []) {
      if (o.country) countries.add(o.country);
    }
  }
  return Array.from(countries).sort();
}

export async function getUniqueRegions(): Promise<string[]> {
  const coffees = await getAllCoffees();
  const regions = new Set<string>();
  for (const c of coffees) {
    for (const o of c.origins ?? []) {
      if (o.region) regions.add(o.region);
    }
  }
  return Array.from(regions).sort();
}

export async function getCountryCounts(): Promise<Record<string, number>> {
  const coffees = await getAllCoffees();
  const counts: Record<string, number> = {};
  for (const c of coffees) {
    for (const o of c.origins ?? []) {
      if (o.country) counts[o.country] = (counts[o.country] ?? 0) + 1;
    }
  }
  return counts;
}

export interface DiscoveryFact {
  title: string;
  text: string;
  type: string;
}

const AFRICAN_COUNTRIES = new Set([
  "Äthiopien", "Kenia", "Ruanda", "Burundi", "Tansania", "Uganda",
]);
const SA_COUNTRIES = new Set(["Brasilien", "Kolumbien", "Peru"]);
const TOTAL_DISCOVERY_COUNTRIES = 20;

type FactGenerator = (coffees: Coffee[]) => DiscoveryFact | null;

const FACT_GENERATORS: FactGenerator[] = [
  // P1: missing interesting processing methods
  (coffees) => {
    if (coffees.length < 3) return null;
    const usedProcessing = new Set(coffees.map((c) => c.processingMethod).filter(Boolean));
    const interesting = [
      { value: "honey",        label: "Honey Process" },
      { value: "anaerobic",    label: "Anaerobic" },
      { value: "experimental", label: "Experimental" },
    ];
    for (const { value, label } of interesting) {
      if (!usedProcessing.has(value)) {
        return {
          title: "Heute entdeckt",
          text: `Du hast schon ${coffees.length} Kaffees in deiner Sammlung. Ein ${label} wäre eine spannende neue Entdeckung für dich.`,
          type: "missing_processing",
        };
      }
    }
    return null;
  },

  // P2: fewer than 10 countries discovered
  (coffees) => {
    const countries = new Set<string>();
    for (const c of coffees) {
      for (const o of c.origins ?? []) { if (o.country) countries.add(o.country); }
    }
    const n = countries.size;
    if (n > 0 && n < 10) {
      return {
        title: "Heute entdeckt",
        text: `Du hast schon ${n} ${n === 1 ? "Herkunftsland" : "Herkunftsländer"} entdeckt — die Kaffeewelt hält noch viele spannende Regionen für dich bereit.`,
        type: "country_progress_low",
      };
    }
    return null;
  },

  // P3: Africa / South America insights
  (coffees) => {
    const rated = coffees
      .filter((c) => c.haseRating !== null || c.dodoRating !== null)
      .map((c) => {
        const vals = [c.haseRating, c.dodoRating].filter((v): v is number => v !== null);
        return { ...c, avgScore: vals.reduce((s, v) => s + v, 0) / vals.length };
      })
      .sort((a, b) => b.avgScore - a.avgScore);
    if (rated.length >= 3) {
      const top3Countries = rated.slice(0, 3).flatMap((c) =>
        (c.origins ?? []).map((o) => o.country).filter(Boolean)
      );
      if (top3Countries.length > 0 && top3Countries.every((c) => AFRICAN_COUNTRIES.has(c as string))) {
        return { title: "Heute entdeckt", text: "Spannend: Alle deine Top-3-Kaffees stammen aus Afrika — eine Region voller außergewöhnlicher Aromen.", type: "africa_insight" };
      }
    }
    const countryScores: Record<string, { total: number; count: number }> = {};
    for (const c of coffees) {
      const vals = [c.haseRating, c.dodoRating].filter((v): v is number => v !== null);
      if (!vals.length) continue;
      const avg = vals.reduce((s, v) => s + v, 0) / vals.length;
      for (const o of c.origins ?? []) {
        if (!o.country) continue;
        if (!countryScores[o.country]) countryScores[o.country] = { total: 0, count: 0 };
        countryScores[o.country].total += avg;
        countryScores[o.country].count += 1;
      }
    }
    const sorted = Object.entries(countryScores).sort(
      (a, b) => b[1].total / b[1].count - a[1].total / a[1].count
    );
    if (sorted.length > 0) {
      const [best] = sorted[0];
      if (AFRICAN_COUNTRIES.has(best) || SA_COUNTRIES.has(best)) {
        return { title: "Heute entdeckt", text: `${best} ist gerade dein bestbewertetes Herkunftsland — ein echtes Highlight in deiner Sammlung.`, type: "best_country" };
      }
    }
    return null;
  },

  // P4: processing recommendation
  (coffees) => {
    const usedProcessing = new Set(coffees.map((c) => c.processingMethod).filter(Boolean));
    const processingCounts: Record<string, number> = {};
    for (const c of coffees) {
      if (c.processingMethod) processingCounts[c.processingMethod] = (processingCounts[c.processingMethod] ?? 0) + 1;
    }
    const LABELS: Record<string, string> = {
      washed: "Washed", natural: "Natural", honey: "Honey",
      anaerobic: "Anaerobic", experimental: "Experimental",
    };
    const sorted = Object.entries(processingCounts).sort((a, b) => b[1] - a[1]);
    if (!sorted.length) return null;
    const [fav] = sorted[0];
    const interesting = [
      { value: "honey", label: "Honey Process" },
      { value: "anaerobic", label: "Anaerobic" },
      { value: "experimental", label: "Experimental" },
    ];
    const alt = interesting.find((p) => p.value !== fav && !usedProcessing.has(p.value));
    if (!alt) return null;
    return {
      title: "Heute entdeckt",
      text: `Du bevorzugst ${LABELS[fav] ?? fav} Coffees. Ein ${alt.label} könnte eine spannende Entdeckung sein.`,
      type: "processing_recommendation",
    };
  },

  // P5: collection progress (fewer than half)
  (coffees) => {
    const countries = new Set<string>();
    for (const c of coffees) {
      for (const o of c.origins ?? []) { if (o.country) countries.add(o.country); }
    }
    const n = countries.size;
    const half = Math.ceil(TOTAL_DISCOVERY_COUNTRIES / 2);
    if (n < half) {
      return {
        title: "Heute entdeckt",
        text: `Deine Sammlung umfasst schon ${n} ${n === 1 ? "Herkunftsland" : "Herkunftsländer"} — entdecke weiter und lass deine Kaffeewelt wachsen.`,
        type: "collection_progress",
      };
    }
    return null;
  },
];

export async function getDiscoveryFact(): Promise<DiscoveryFact> {
  const coffees = await getAllCoffees();
  const fallback: DiscoveryFact = {
    title: "Heute entdeckt",
    text: "Füge weitere Kaffees hinzu und entdecke spannende neue Aromen, Aufbereitungen und Herkunftsländer.",
    type: "fallback",
  };
  if (coffees.length === 0) return fallback;
  for (const gen of FACT_GENERATORS) {
    const result = gen(coffees);
    if (result) return result;
  }
  return fallback;
}

export interface CountryDetails {
  country: string;
  coffeeCount: number;
  averageRabbitRating: number | null;
  averageDodoRating: number | null;
  regions: string[];
  coffees: { id: string; name: string }[];
}

export async function getCountryDetails(country: string): Promise<CountryDetails> {
  const all = await getAllCoffees();
  const matching = all.filter((c) =>
    (c.origins ?? []).some((o) => o.country === country)
  );
  const haseVals: number[] = [];
  const dodoVals: number[] = [];
  const regions = new Set<string>();
  for (const c of matching) {
    if (c.haseRating !== null) haseVals.push(c.haseRating);
    if (c.dodoRating !== null) dodoVals.push(c.dodoRating);
    for (const o of c.origins ?? []) {
      if (o.country === country && o.region?.trim()) regions.add(o.region.trim());
    }
  }
  const avg = (vals: number[]): number | null =>
    vals.length ? Math.round((vals.reduce((s, v) => s + v, 0) / vals.length) * 10) / 10 : null;
  return {
    country,
    coffeeCount: matching.length,
    averageRabbitRating: avg(haseVals),
    averageDodoRating: avg(dodoVals),
    regions: Array.from(regions).sort(),
    coffees: matching.map((c) => ({ id: c.id, name: c.name })),
  };
}

export interface CoffeeInsights {
  favoriteCountry: string | null;
  favoriteAroma: { value: number; label: string } | null;
  favoriteRoastLevel: string | null;
  favoriteGrinder: string | null;
  topCoffee: { name: string; haseRating: number | null; dodoRating: number | null } | null;
}

const AROMA_MAP: Record<number, { label: string }> = {
  1: { label: "Schokoladig" },
  2: { label: "Nussig" },
  3: { label: "Klassisch" },
  4: { label: "Beerig" },
  5: { label: "Zitrisch" },
};

const ROAST_LABELS: Record<string, string> = {
  "light":       "Hell",
  "medium-light":"Mittel-Hell",
  "medium":      "Mittel",
  "medium-dark": "Mittel-Dunkel",
  "dark":        "Dunkel",
};

export async function getCoffeeInsights(): Promise<CoffeeInsights> {
  const coffees = await getAllCoffees();
  const empty: CoffeeInsights = { favoriteCountry: null, favoriteAroma: null, favoriteRoastLevel: null, favoriteGrinder: null, topCoffee: null };
  if (coffees.length === 0) return empty;

  // favoriteCountry: country with highest avg score across coffees that include it
  const countryScores: Record<string, { total: number; count: number }> = {};
  for (const c of coffees) {
    const vals = [c.haseRating, c.dodoRating].filter((v): v is number => v !== null);
    if (vals.length === 0) continue;
    const avg = vals.reduce((s, v) => s + v, 0) / vals.length;
    for (const o of c.origins ?? []) {
      if (!o.country) continue;
      if (!countryScores[o.country]) countryScores[o.country] = { total: 0, count: 0 };
      countryScores[o.country].total += avg;
      countryScores[o.country].count += 1;
    }
  }
  let favoriteCountry: string | null = null;
  let bestCountryAvg = -1;
  for (const [country, { total, count }] of Object.entries(countryScores)) {
    const avg = total / count;
    if (avg > bestCountryAvg) { bestCountryAvg = avg; favoriteCountry = country; }
  }

  // favoriteAroma: most frequent aroma value (1–5)
  const aromaCounts: Record<number, number> = {};
  for (const c of coffees) {
    if (c.aroma >= 1 && c.aroma <= 5) aromaCounts[c.aroma] = (aromaCounts[c.aroma] ?? 0) + 1;
  }
  let favoriteAroma: CoffeeInsights["favoriteAroma"] = null;
  let bestAromaCount = -1;
  for (const [valStr, count] of Object.entries(aromaCounts)) {
    if (count > bestAromaCount) {
      bestAromaCount = count;
      const val = Number(valStr);
      const info = AROMA_MAP[val];
      favoriteAroma = info ? { value: val, label: info.label } : null;
    }
  }

  // favoriteRoastLevel: most frequent non-empty roastLevel
  const roastCounts: Record<string, number> = {};
  for (const c of coffees) {
    if (c.roastLevel) roastCounts[c.roastLevel] = (roastCounts[c.roastLevel] ?? 0) + 1;
  }
  let favoriteRoastLevel: string | null = null;
  let bestRoastCount = -1;
  for (const [level, count] of Object.entries(roastCounts)) {
    if (count > bestRoastCount) { bestRoastCount = count; favoriteRoastLevel = ROAST_LABELS[level] ?? level; }
  }

  // favoriteGrinder: most frequent grinder from grindSettings or grinderName
  const grinderCounts: Record<string, number> = {};
  for (const c of coffees) {
    if (c.grindSettings && c.grindSettings.length > 0) {
      for (const gs of c.grindSettings) {
        if (gs.grinder) grinderCounts[gs.grinder] = (grinderCounts[gs.grinder] ?? 0) + 1;
      }
    } else if (c.grinderName) {
      grinderCounts[c.grinderName] = (grinderCounts[c.grinderName] ?? 0) + 1;
    }
  }
  let favoriteGrinder: string | null = null;
  let bestGrinderCount = -1;
  for (const [grinder, count] of Object.entries(grinderCounts)) {
    if (count > bestGrinderCount) { bestGrinderCount = count; favoriteGrinder = grinder; }
  }

  // topCoffee: highest average score (avg of non-null ratings)
  let topCoffee: CoffeeInsights["topCoffee"] = null;
  let topScore = -1;
  for (const c of coffees) {
    const vals = [c.haseRating, c.dodoRating].filter((v): v is number => v !== null);
    if (vals.length === 0) continue;
    const avg = vals.reduce((s, v) => s + v, 0) / vals.length;
    if (avg > topScore) { topScore = avg; topCoffee = { name: c.name, haseRating: c.haseRating, dodoRating: c.dodoRating }; }
  }

  return { favoriteCountry, favoriteAroma, favoriteRoastLevel, favoriteGrinder, topCoffee };
}

// ─── Per-user discovery analytics (Hase / Dodo) ──────────────────────────────
// These keep the two raters strictly separate — no shared averaging — except for
// getSharedFavoriteCoffee(), which is the single intentional combined metric.

export interface FavoriteCountriesByUser {
  hase: string | null;
  dodo: string | null;
}

/** Country with the highest average Hase-score / Dodo-score, computed per user. */
export async function getFavoriteCountriesByUser(): Promise<FavoriteCountriesByUser> {
  const coffees = await getAllCoffees();
  const haseScores: Record<string, { total: number; count: number }> = {};
  const dodoScores: Record<string, { total: number; count: number }> = {};
  for (const c of coffees) {
    for (const o of c.origins ?? []) {
      if (!o.country) continue;
      if (c.haseRating !== null) {
        if (!haseScores[o.country]) haseScores[o.country] = { total: 0, count: 0 };
        haseScores[o.country].total += c.haseRating;
        haseScores[o.country].count += 1;
      }
      if (c.dodoRating !== null) {
        if (!dodoScores[o.country]) dodoScores[o.country] = { total: 0, count: 0 };
        dodoScores[o.country].total += c.dodoRating;
        dodoScores[o.country].count += 1;
      }
    }
  }
  const best = (scores: Record<string, { total: number; count: number }>): string | null => {
    let bestCountry: string | null = null;
    let bestAvg = -1;
    for (const [country, { total, count }] of Object.entries(scores)) {
      const avg = total / count;
      if (avg > bestAvg) { bestAvg = avg; bestCountry = country; }
    }
    return bestCountry;
  };
  return { hase: best(haseScores), dodo: best(dodoScores) };
}

export interface TopCoffeeByUser {
  hase: { name: string; roasteryName: string; rating: number } | null;
  dodo: { name: string; roasteryName: string; rating: number } | null;
}

/** Single highest-rated coffee for each user, computed independently. */
export async function getTopCoffeeByUser(): Promise<TopCoffeeByUser> {
  const [coffees, roasteries] = await Promise.all([getAllCoffees(), getRoasteries()]);
  const roMap = new Map(roasteries.map((r) => [r.id, r.name]));
  let haseC: Coffee | null = null;
  let dodoC: Coffee | null = null;
  for (const c of coffees) {
    if (c.haseRating !== null && (haseC === null || c.haseRating > (haseC.haseRating ?? -1))) {
      haseC = c;
    }
    if (c.dodoRating !== null && (dodoC === null || c.dodoRating > (dodoC.dodoRating ?? -1))) {
      dodoC = c;
    }
  }
  return {
    hase: haseC
      ? { name: haseC.name, roasteryName: roMap.get(haseC.roasteryId) ?? "", rating: haseC.haseRating as number }
      : null,
    dodo: dodoC
      ? { name: dodoC.name, roasteryName: roMap.get(dodoC.roasteryId) ?? "", rating: dodoC.dodoRating as number }
      : null,
  };
}

export interface SharedFavoriteCoffee {
  name: string;
  roasteryName: string;
  haseRating: number;
  dodoRating: number;
}

/** The only combined metric: coffee with the highest (Hase + Dodo) / 2. */
export async function getSharedFavoriteCoffee(): Promise<SharedFavoriteCoffee | null> {
  const [coffees, roasteries] = await Promise.all([getAllCoffees(), getRoasteries()]);
  const roMap = new Map(roasteries.map((r) => [r.id, r.name]));
  let best: Coffee | null = null;
  let bestAvg = -1;
  for (const c of coffees) {
    if (c.haseRating === null || c.dodoRating === null) continue;
    const avg = (c.haseRating + c.dodoRating) / 2;
    if (avg > bestAvg) {
      bestAvg = avg;
      best = c;
    }
  }
  return best
    ? {
        name: best.name,
        roasteryName: roMap.get(best.roasteryId) ?? "",
        haseRating: best.haseRating as number,
        dodoRating: best.dodoRating as number,
      }
    : null;
}

export interface CategoryCoffeeRef {
  id: string;
  name: string;
  haseRating: number | null;
  dodoRating: number | null;
}

export interface CategoryDiscovery {
  key: string;
  label: string;
  count: number;
  bestCoffee: CategoryCoffeeRef | null;
  coffees: CategoryCoffeeRef[];
}

const AROMA_CATEGORIES: { value: number; label: string }[] = [
  { value: 1, label: "Schokoladig" },
  { value: 2, label: "Nussig" },
  { value: 3, label: "Klassisch" },
  { value: 4, label: "Beerig" },
  { value: 5, label: "Zitrisch" },
];

const PROCESSING_CATEGORIES: { value: string; label: string }[] = [
  { value: "washed",       label: "Washed" },
  { value: "natural",      label: "Natural" },
  { value: "honey",        label: "Honey" },
  { value: "anaerobic",    label: "Anaerobic" },
  { value: "experimental", label: "Experimental" },
];

// "Best" is ranked by the single highest individual rating (max of Hase/Dodo),
// never a combined average — (Hase + Dodo) / 2 lives only in
// getSharedFavoriteCoffee().
function buildCategoryDiscovery(key: string, label: string, matching: Coffee[]): CategoryDiscovery {
  const scored = matching.map((c) => {
    const vals = [c.haseRating, c.dodoRating].filter((v): v is number => v !== null);
    const score = vals.length ? Math.max(...vals) : -1;
    const ref: CategoryCoffeeRef = {
      id: c.id, name: c.name, haseRating: c.haseRating, dodoRating: c.dodoRating,
    };
    return { ref, score };
  });
  scored.sort((a, b) => b.score - a.score);
  const bestCoffee = scored.length > 0 && scored[0].score >= 0 ? scored[0].ref : null;
  return { key, label, count: matching.length, bestCoffee, coffees: scored.map((s) => s.ref) };
}

/** Discovery stats for each of the five aroma categories (always all five). */
export async function getAromaDiscoveryStats(): Promise<CategoryDiscovery[]> {
  const coffees = await getAllCoffees();
  return AROMA_CATEGORIES.map(({ value, label }) =>
    buildCategoryDiscovery(String(value), label, coffees.filter((c) => c.aroma === value))
  );
}

/** Discovery stats for each of the five processing categories (always all five). */
export async function getProcessingDiscoveryStats(): Promise<CategoryDiscovery[]> {
  const coffees = await getAllCoffees();
  return PROCESSING_CATEGORIES.map(({ value, label }) =>
    buildCategoryDiscovery(value, label, coffees.filter((c) => c.processingMethod === value))
  );
}

export interface DiscoveryStats {
  coffeeCount: number;
  roasteryCount: number;
  countryCount: number;
  countries: string[];
  lastDiscoveredCountry: string | null;
}

export async function getDiscoveryStats(): Promise<DiscoveryStats> {
  const [coffees, roasteries] = await Promise.all([getAllCoffees(), getRoasteries()]);
  const countryFirstSeen: Record<string, string> = {};
  for (const c of coffees) {
    for (const o of c.origins ?? []) {
      if (o.country) {
        const current = countryFirstSeen[o.country];
        if (!current || c.createdAt < current) {
          countryFirstSeen[o.country] = c.createdAt;
        }
      }
    }
  }
  const countries = Object.keys(countryFirstSeen).sort();
  const sorted = Object.entries(countryFirstSeen).sort((a, b) => b[1].localeCompare(a[1]));
  const lastDiscoveredCountry = sorted.length > 0 ? sorted[0][0] : null;
  return {
    coffeeCount: coffees.length,
    roasteryCount: roasteries.length,
    countryCount: countries.length,
    countries,
    lastDiscoveredCountry,
  };
}
