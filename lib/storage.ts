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

export const DEFAULT_GRINDERS = ["Niche", "Commandante"];

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

export async function getGrinders(): Promise<string[]> {
  const data = await AsyncStorage.getItem(GRINDERS_KEY);
  if (!data) return [...DEFAULT_GRINDERS];
  const parsed = JSON.parse(data);
  if (!Array.isArray(parsed) || parsed.length === 0) return [...DEFAULT_GRINDERS];
  return parsed;
}

export async function saveGrinders(names: string[]): Promise<void> {
  await AsyncStorage.setItem(GRINDERS_KEY, JSON.stringify(names));
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

export interface CoffeeInsights {
  favoriteCountry: string | null;
  favoriteAroma: { value: number; label: string; emoji: string } | null;
  favoriteRoastLevel: string | null;
  favoriteGrinder: string | null;
  topCoffee: { name: string; haseRating: number | null; dodoRating: number | null } | null;
}

const AROMA_MAP: Record<number, { label: string; emoji: string }> = {
  1: { label: "Schokoladig", emoji: "🍫" },
  2: { label: "Nussig",      emoji: "🌰" },
  3: { label: "Klassisch",   emoji: "☕" },
  4: { label: "Beerig",      emoji: "🍇" },
  5: { label: "Zitrisch",    emoji: "🍊" },
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
      favoriteAroma = info ? { value: val, label: info.label, emoji: info.emoji } : null;
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
