const espresso = "#2C1810";
const caramel = "#C8873A";
const cream = "#F5ECD7";
const darkRoast = "#1A0F08";
const lightCream = "#FBF6EE";
const warmGray = "#8B7355";

// Torn-paper material system ("Paper Layers"). Surfaces are sheets of paper torn
// and laid on a warm field — depth comes from CONTRAST + a visibly offset kraft
// backing that peeks behind each sheet, never from floating UI cards.
//   • background       (Ebene 1) — the warm paper field / table
//   • backdrop / kraft — the kraft backing sheet peeking behind a cream sheet
//   • surface / surfaceElevated (Ebene 2) — light cream paper sheets
//   • hero* / espresso* (Ebene 3) — dark espresso "feature" sheets (showpieces)
//     with their own darker backing + cream text, so they read as the top layer.
//   • ink* — text tones on cream; creamText* — text tones on espresso.
export default {
  // Klassisch — cream paper "pages" laid on a deep espresso table. The strong
  // dark-table → cream-page → espresso-note contrast is the whole point: text
  // never sits directly on `background`, always on a cream `surface` sheet.
  light: {
    background: "#241712",
    backdrop: "#1A0F0A",
    surface: "#F1E7D3",
    surfaceElevated: "#F8F1E2",
    text: "#3A2615",
    textSecondary: "#7C6548",
    tint: "#B07A2E",
    accent: "#B07A2E",
    border: "#D9C5A0",
    tabIconDefault: "#A38C70",
    tabIconSelected: "#B07A2E",
    heroSurface: "#2A1A0E",
    heroBacking: "#19100A",
    heroText: "#F4EAD6",
    heroTextSub: "#D6C3A0",
    heroBorder: "#3E2918",
    heroTint: "#DC9E4C",
    // Paper-layers tokens
    paperBg2: "#E9DCC3",
    kraft: "#C3A067",
    kraftDeep: "#A6824B",
    espresso: "#2A1A0E",
    espresso2: "#180F09",
    espresso3: "#3E2918",
    gold: "#B07A2E",
    goldLight: "#DC9E4C",
    ink: "#3A2615",
    inkSoft: "#7C6548",
    inkFaint: "#A88F6E",
    creamText: "#F4EAD6",
    creamTextSoft: "#D6C3A0",
    creamTextFaint: "#AB9067",
    hair: "rgba(58, 38, 21, 0.16)",
    hairCream: "rgba(244, 234, 214, 0.20)",
  },
  // Klassisch dark — same cream paper, but on a near-black espresso table.
  dark: {
    background: "#130B06",
    backdrop: "#0C0703",
    surface: "#ECE1CB",
    surfaceElevated: "#F4EBD8",
    text: "#33220F",
    textSecondary: "#74603F",
    tint: "#BD8436",
    accent: "#BD8436",
    border: "#D2BD96",
    tabIconDefault: "#A38C70",
    tabIconSelected: "#BD8436",
    heroSurface: "#221409",
    heroBacking: "#0E0804",
    heroText: "#F2E7D1",
    heroTextSub: "#CFBB94",
    heroBorder: "#33220F",
    heroTint: "#E3AC5E",
    paperBg2: "#E2D5BB",
    kraft: "#BC9858",
    kraftDeep: "#9C7940",
    espresso: "#221409",
    espresso2: "#0E0804",
    espresso3: "#382412",
    gold: "#BD8436",
    goldLight: "#E3AC5E",
    ink: "#33220F",
    inkSoft: "#74603F",
    inkFaint: "#9E8662",
    creamText: "#F2E7D1",
    creamTextSoft: "#CFBB94",
    creamTextFaint: "#A48A60",
    hair: "rgba(51, 34, 15, 0.16)",
    hairCream: "rgba(242, 231, 209, 0.18)",
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
    heroBacking: "#3a1d0d",
    heroText: "#f4e8dc",
    heroTextSub: "#caa58b",
    heroBorder: "#a8662f",
    heroTint: "#e1a24a",
    paperBg2: "#1d0e05",
    kraft: "#5e3417",
    kraftDeep: "#3a1d0d",
    espresso: "#5e3417",
    espresso2: "#3a1d0d",
    espresso3: "#8a5026",
    gold: "#e1a24a",
    goldLight: "#f0c074",
    ink: "#f4e8dc",
    inkSoft: "#caa58b",
    inkFaint: "#8b6a48",
    creamText: "#f4e8dc",
    creamTextSoft: "#caa58b",
    creamTextFaint: "#a07f5c",
    hair: "rgba(244, 232, 220, 0.14)",
    hairCream: "rgba(244, 232, 220, 0.18)",
  },
  espresso,
  caramel,
  cream,
  darkRoast,
  lightCream,
  warmGray,
};
