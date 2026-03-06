import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { Platform, useColorScheme, ViewStyle } from "react-native";
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

export function useCardExtras(): { shadow: ViewStyle; topHighlight: string } {
  const { design } = useContext(ThemeContext);
  const colorScheme = useColorScheme();
  const colors = useThemeColors();

  if (design === "lowpoly") {
    return {
      shadow: Platform.OS === "web"
        ? ({ boxShadow: "0 0 18px rgba(255,179,0,0.28)" } as ViewStyle)
        : {
          shadowColor: colors.tint,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.22,
          shadowRadius: 18,
          elevation: 12,
        },
      topHighlight: colors.tint + "50",
    };
  }

  const isDark = colorScheme === "dark";
  return {
    shadow: Platform.OS === "web"
      ? ({ boxShadow: isDark ? "0 4px 12px rgba(0,0,0,0.32)" : "0 4px 12px rgba(139,115,85,0.14)" } as ViewStyle)
      : {
        shadowColor: isDark ? "#000000" : "#8B7355",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: isDark ? 0.32 : 0.12,
        shadowRadius: 12,
        elevation: 6,
      },
    topHighlight: isDark ? "rgba(255,225,170,0.10)" : "rgba(255,255,255,0.85)",
  };
}
