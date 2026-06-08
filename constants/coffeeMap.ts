// Stylized low-poly map geometry for Coffee Nest.
//
// This is NOT a geographically accurate world map. It is a simplified,
// faceted arrangement of the coffee-origin countries optimized for
// tappability on a phone. Countries are grouped into four readable
// regional clusters (Südamerika, Mittelamerika, Afrika, Asien) laid out
// in a geographically intuitive way: the Americas on the left, Afrika in
// the centre-right, Asien on the right.
//
// The structure is generic so a second region map (e.g. roasteries in
// Germany / Europe) can later be added with the exact same architecture
// and rendered by the same <CoffeeOriginMap /> component.

export interface MapCountry {
  id: string;
  name: string;
  /** Region cluster this country belongs to. */
  region: string;
  /** SVG polygon points "x,y x,y ..." within the region viewBox. */
  points: string;
  /** Label anchor (centroid) within the region viewBox. */
  labelX: number;
  labelY: number;
  /** Optional smaller label font for tiny facets. */
  small?: boolean;
}

export interface MapRegion {
  id: string;
  label: string;
  labelX: number;
  labelY: number;
  /** Faint background zone that visually groups the cluster. */
  bg: { x: number; y: number; width: number; height: number };
}

export interface MapRegionData {
  /** SVG viewBox, e.g. "0 0 1000 700". */
  viewBox: string;
  width: number;
  height: number;
  regions: MapRegion[];
  countries: MapCountry[];
}

// Pointy-top hexagon facet generator.
function hex(cx: number, cy: number, r: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 180) * (60 * i - 90);
    pts.push(`${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`);
  }
  return pts.join(" ");
}

type Facet = {
  id: string;
  name: string;
  region: string;
  cx: number;
  cy: number;
  r: number;
  small?: boolean;
};

const FACETS: Facet[] = [
  // ── MITTELAMERIKA (7) — top-left ─────────────────────────────
  { id: "Mexiko",      name: "Mexiko",      region: "mittelamerika", cx: 175, cy: 120, r: 60 },
  { id: "Guatemala",   name: "Guatemala",   region: "mittelamerika", cx: 100, cy: 225, r: 46, small: true },
  { id: "Honduras",    name: "Honduras",    region: "mittelamerika", cx: 250, cy: 220, r: 48, small: true },
  { id: "El Salvador", name: "El Salvador", region: "mittelamerika", cx: 100, cy: 320, r: 44, small: true },
  { id: "Nicaragua",   name: "Nicaragua",   region: "mittelamerika", cx: 255, cy: 315, r: 48, small: true },
  { id: "Costa Rica",  name: "Costa Rica",  region: "mittelamerika", cx: 135, cy: 410, r: 46, small: true },
  { id: "Panama",      name: "Panama",      region: "mittelamerika", cx: 285, cy: 405, r: 48, small: true },

  // ── SÜDAMERIKA (3) — bottom-left ─────────────────────────────
  { id: "Kolumbien",   name: "Kolumbien",   region: "suedamerika", cx: 160, cy: 530, r: 56 },
  { id: "Peru",        name: "Peru",        region: "suedamerika", cx: 135, cy: 640, r: 52 },
  { id: "Brasilien",   name: "Brasilien",   region: "suedamerika", cx: 330, cy: 590, r: 68 },

  // ── AFRIKA (6) — centre-right ────────────────────────────────
  { id: "Äthiopien",   name: "Äthiopien",   region: "afrika", cx: 655, cy: 160, r: 58 },
  { id: "Uganda",      name: "Uganda",      region: "afrika", cx: 560, cy: 285, r: 44, small: true },
  { id: "Kenia",       name: "Kenia",       region: "afrika", cx: 690, cy: 295, r: 54 },
  { id: "Ruanda",      name: "Ruanda",      region: "afrika", cx: 555, cy: 380, r: 40, small: true },
  { id: "Burundi",     name: "Burundi",     region: "afrika", cx: 558, cy: 470, r: 40, small: true },
  { id: "Tansania",    name: "Tansania",    region: "afrika", cx: 690, cy: 440, r: 58 },

  // ── ASIEN (4) — right ────────────────────────────────────────
  { id: "Jemen",       name: "Jemen",       region: "asien", cx: 870, cy: 165, r: 46, small: true },
  { id: "Indien",      name: "Indien",      region: "asien", cx: 895, cy: 300, r: 58 },
  { id: "Vietnam",     name: "Vietnam",     region: "asien", cx: 905, cy: 430, r: 46, small: true },
  { id: "Indonesien",  name: "Indonesien",  region: "asien", cx: 890, cy: 560, r: 60 },
];

export const MAP_REGIONS: MapRegion[] = [
  { id: "mittelamerika", label: "MITTELAMERIKA", labelX: 195, labelY: 48,  bg: { x: 20,  y: 25,  width: 360, height: 450 } },
  { id: "suedamerika",   label: "SÜDAMERIKA",    labelX: 195, labelY: 505, bg: { x: 20,  y: 482, width: 360, height: 200 } },
  { id: "afrika",        label: "AFRIKA",        labelX: 625, labelY: 48,  bg: { x: 470, y: 25,  width: 300, height: 540 } },
  { id: "asien",         label: "ASIEN",         labelX: 895, labelY: 48,  bg: { x: 790, y: 25,  width: 195, height: 600 } },
];

export const COFFEE_WORLD_MAP: MapRegionData = {
  viewBox: "0 0 1000 700",
  width: 1000,
  height: 700,
  regions: MAP_REGIONS,
  countries: FACETS.map((f) => ({
    id: f.id,
    name: f.name,
    region: f.region,
    points: hex(f.cx, f.cy, f.r),
    labelX: f.cx,
    labelY: f.cy,
    small: f.small,
  })),
};
