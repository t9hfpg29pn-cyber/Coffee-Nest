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
  // Klassisch — Paper Layers V3. A LIGHT, airy warm-beige "table" (paper-bg)
  // with cream paper sheets resting on it; depth comes from a kraft backing
  // peeking behind each torn sheet + soft drop-shadow, NOT from a dark table.
  // Espresso is a warm milk-chocolate brown used ONLY for feature planes.
  // Tokens mirror artifacts/mockup-sandbox/.../paper-layers/_group.css exactly.
  light: {
    background: "#E9DDC9",
    backdrop: "#E2D4BC",
    surface: "#F4EAD5",
    surfaceElevated: "#FAF3E5",
    text: "#3A2716",
    textSecondary: "#7A6447",
    tint: "#B07526",
    accent: "#B07526",
    border: "#D8C4A0",
    tabIconDefault: "#A38C70",
    tabIconSelected: "#B07526",
    heroSurface: "#6E4A2A",
    heroBacking: "#5A3B20",
    heroText: "#F6EEDD",
    heroTextSub: "#E2D1B2",
    heroBorder: "#815A36",
    heroTint: "#E0A646",
    // Paper-layers tokens
    paperBg2: "#E2D4BC",
    kraft: "#CBAB7B",
    kraftDeep: "#B68F58",
    espresso: "#6E4A2A",
    espresso2: "#5A3B20",
    espresso3: "#815A36",
    gold: "#B07526",
    goldLight: "#E0A646",
    ink: "#3A2716",
    inkSoft: "#7A6447",
    inkFaint: "#A38C70",
    creamText: "#F6EEDD",
    creamTextSoft: "#E2D1B2",
    creamTextFaint: "#C6AF8C",
    hair: "rgba(58, 39, 22, 0.14)",
    hairCream: "rgba(246, 238, 221, 0.22)",
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
