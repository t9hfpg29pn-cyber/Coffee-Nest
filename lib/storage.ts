import AsyncStorage from "@react-native-async-storage/async-storage";

export interface Roastery {
  id: string;
  name: string;
  location?: string;
  createdAt: string;
}

export interface Coffee {
  id: string;
  roasteryId: string;
  name: string;
  haseRating: number;
  dodoRating: number;
  grindLevel: number;
  grinderName: string;
  aroma: number;
  aromaDescription: string;
  notes: string;
  pricePerKg: string;
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
  return JSON.parse(data);
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
