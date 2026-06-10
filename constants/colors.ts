const espresso = "#2C1810";
const caramel = "#C8873A";
const cream = "#F5ECD7";
const darkRoast = "#1A0F08";
const lightCream = "#FBF6EE";
const warmGray = "#8B7355";

// Paper layers — three "soak" levels per theme. Surfaces read as stacked sheets
// of coffee-saturated paper rather than floating UI cards:
//   • background      (Ebene 1) — the table / deepest, least-soaked layer
//   • backdrop        (between) — the backing sheet that peeks out behind a card
//   • surface         (Ebene 2) — a warm mid sheet
//   • surfaceElevated (Ebene 3) — the lightest, most-saturated top sheet
export default {
  light: {
    background: "#F3E9D6",
    backdrop: "#E7D6BB",
    surface: cream,
    surfaceElevated: "#FFFDF8",
    text: espresso,
    textSecondary: warmGray,
    tint: caramel,
    accent: caramel,
    border: "#E0CDAC",
    tabIconDefault: warmGray,
    tabIconSelected: caramel,
  },
  dark: {
    background: darkRoast,
    backdrop: "#241309",
    surface: espresso,
    surfaceElevated: "#6B3A1F",
    text: cream,
    textSecondary: "#A89070",
    tint: caramel,
    accent: caramel,
    border: "#8B5228",
    tabIconDefault: "#6B5540",
    tabIconSelected: caramel,
  },
  lowpoly: {
    background: "#190b04",
    backdrop: "#37190b",
    surface: "#5e3417",
    surfaceElevated: "#8a5026",
    text: "#f4e8dc",
    textSecondary: "#caa58b",
    tint: "#e1a24a",
    accent: "#c7893e",
    border: "#a8662f",
    tabIconDefault: "#8b5a30",
    tabIconSelected: "#e1a24a",
  },
  espresso,
  caramel,
  cream,
  darkRoast,
  lightCream,
  warmGray,
};
