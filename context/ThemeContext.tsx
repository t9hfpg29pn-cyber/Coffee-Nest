import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { useColorScheme } from "react-native";
import Colors from "@/constants/colors";

export type DesignMode = "classic" | "lowpoly";

const DESIGN_KEY = "kj_designMode";

interface ThemeContextType {
  design: DesignMode;
  setDesign: (d: DesignMode) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType>({
  design: "classic",
  setDesign: async () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [design, setDesignState] = useState<DesignMode>("classic");

  useEffect(() => {
    AsyncStorage.getItem(DESIGN_KEY).then((raw) => {
      if (raw === "lowpoly" || raw === "classic") setDesignState(raw);
    });
  }, []);

  const setDesign = async (d: DesignMode) => {
    setDesignState(d);
    await AsyncStorage.setItem(DESIGN_KEY, d);
  };

  return (
    <ThemeContext.Provider value={{ design, setDesign }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

export function useThemeColors() {
  const { design } = useContext(ThemeContext);
  const colorScheme = useColorScheme();

  if (design === "lowpoly") return Colors.lowpoly;
  return colorScheme === "dark" ? Colors.dark : Colors.light;
}
