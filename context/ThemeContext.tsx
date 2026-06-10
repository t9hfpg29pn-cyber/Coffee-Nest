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
  const [design, setDesignState] = useState<DesignMode>("lowpoly");

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

// Material language — surfaces read as soft, layered paper rather than floating
// UI cards. Depth is expressed through quiet, warm, low-spread shadows; never
// hard drop-shadows or 3D lift. Three material levels are available:
//   • background (Ebene 1) — handled by colors.background
//   • shadow      (Ebene 2) — normal content: a single sheet resting on the base
//   • elevatedShadow (Ebene 3) — important content (e.g. shared favorite),
//     lifted by roughly one paper-thickness, still calm.
export function useCardExtras(): {
  shadow: ViewStyle;
  elevatedShadow: ViewStyle;
  topHighlight: string;
  cardRadius: number;
} {
  const { design } = useContext(ThemeContext);
  const colorScheme = useColorScheme();

  if (design === "lowpoly") {
    // Depth is carried by the paper layering itself; shadows stay barely-there.
    return {
      shadow: Platform.OS === "web"
        ? ({ boxShadow: "0 1px 1px rgba(0,0,0,0.14)" } as ViewStyle)
        : {
          shadowColor: "#000000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.12,
          shadowRadius: 4,
          elevation: 1,
        },
      elevatedShadow: Platform.OS === "web"
        ? ({ boxShadow: "0 2px 3px rgba(0,0,0,0.16)" } as ViewStyle)
        : {
          shadowColor: "#000000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.16,
          shadowRadius: 6,
          elevation: 2,
        },
      topHighlight: "rgba(225,162,74,0.30)",
      cardRadius: 10,
    };
  }

  const isDark = colorScheme === "dark";
  return {
    shadow: Platform.OS === "web"
      ? ({ boxShadow: isDark
          ? "0 1px 2px rgba(0,0,0,0.18), 0 8px 18px rgba(0,0,0,0.22)"
          : "0 1px 1px rgba(139,115,85,0.05), 0 6px 16px rgba(139,115,85,0.08)" } as ViewStyle)
      : {
        shadowColor: isDark ? "#000000" : "#8B7355",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: isDark ? 0.22 : 0.08,
        shadowRadius: 14,
        elevation: 3,
      },
    elevatedShadow: Platform.OS === "web"
      ? ({ boxShadow: isDark
          ? "0 2px 4px rgba(0,0,0,0.20), 0 14px 28px rgba(0,0,0,0.26)"
          : "0 2px 3px rgba(139,115,85,0.07), 0 12px 26px rgba(139,115,85,0.11)" } as ViewStyle)
      : {
        shadowColor: isDark ? "#000000" : "#8B7355",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: isDark ? 0.26 : 0.12,
        shadowRadius: 22,
        elevation: 7,
      },
    topHighlight: isDark ? "rgba(255,225,170,0.08)" : "rgba(255,255,255,0.65)",
    cardRadius: 16,
  };
}
