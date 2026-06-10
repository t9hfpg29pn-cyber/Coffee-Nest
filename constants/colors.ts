const espresso = "#2C1810";
const caramel = "#C8873A";
const cream = "#F5ECD7";
const darkRoast = "#1A0F08";
const lightCream = "#FBF6EE";
const warmGray = "#8B7355";

// Cut-paper material system. Surfaces are sheets of paper laid on a warm field —
// depth comes from CONTRAST + a visibly offset backing sheet, never from drop
// shadows. Four tones per theme:
//   • background      (Ebene 1) — the warm field / table
//   • backdrop        — the backing sheet that peeks out behind a light card
//   • surface / surfaceElevated (Ebene 2) — light paper sheets
//   • hero*           (Ebene 3) — dark espresso "feature" paper for showpieces,
//     with its OWN light backing + light text so it reads as a top layer.
export default {
  light: {
    background: "#E7DAC1",
    backdrop: "#CBB48C",
    surface: "#F7F0E2",
    surfaceElevated: "#FFFDF7",
    text: "#3B2517",
    textSecondary: "#8C7152",
    tint: caramel,
    accent: caramel,
    border: "#E2D0AE",
    tabIconDefault: warmGray,
    tabIconSelected: caramel,
    heroSurface: "#43291A",
    heroBacking: "#F0E4CF",
    heroText: "#F6ECD9",
    heroTextSub: "#CBB08D",
    heroBorder: "#5C3E28",
    heroTint: "#E3AC5E",
  },
  dark: {
    background: "#160C06",
    backdrop: "#3A2414",
    surface: "#33200F",
    surfaceElevated: "#43291A",
    text: cream,
    textSecondary: "#A89070",
    tint: caramel,
    accent: caramel,
    border: "#5C3D27",
    tabIconDefault: "#6B5540",
    tabIconSelected: caramel,
    heroSurface: "#0E0703",
    heroBacking: "#5A3D27",
    heroText: cream,
    heroTextSub: "#BFA078",
    heroBorder: "#6B4124",
    heroTint: "#E3AC5E",
  },
  lowpoly: {
    background: "#150a03",
    backdrop: "#3a1d0d",
    surface: "#5e3417",
    surfaceElevated: "#8a5026",
    text: "#f4e8dc",
    textSecondary: "#caa58b",
    tint: "#e1a24a",
    accent: "#c7893e",
    border: "#a8662f",
    tabIconDefault: "#8b5a30",
    tabIconSelected: "#e1a24a",
    heroSurface: "#0d0502",
    heroBacking: "#8a5026",
    heroText: "#f4e8dc",
    heroTextSub: "#caa58b",
    heroBorder: "#a8662f",
    heroTint: "#e1a24a",
  },
  espresso,
  caramel,
  cream,
  darkRoast,
  lightCream,
  warmGray,
};
