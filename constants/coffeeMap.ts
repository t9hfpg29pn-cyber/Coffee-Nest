// Stylized low-poly map geometry for Coffee Nest.
//
// This is NOT a geographically accurate world map. It is a simplified,
// faceted arrangement of the coffee-origin countries optimized for
// tappability on a phone. Countries are intentionally enlarged and
// simplified into small polygonal facets.
//
// The structure is generic so a second region map (e.g. roasteries in
// Germany / Europe) can later be added with the exact same architecture
// and rendered by the same <CoffeeOriginMap /> component.

export interface MapCountry {
  id: string;
  name: string;
  /** SVG polygon points "x,y x,y ..." within the region viewBox. */
  points: string;
  /** Label anchor (centroid) within the region viewBox. */
  labelX: number;
  labelY: number;
  /** Optional smaller label font for tiny facets. */
  small?: boolean;
}

export interface MapRegionData {
  /** SVG viewBox, e.g. "0 0 1000 660". */
  viewBox: string;
  width: number;
  height: number;
  countries: MapCountry[];
}

export const COFFEE_WORLD_MAP: MapRegionData = {
  viewBox: "0 0 1000 660",
  width: 1000,
  height: 660,
  countries: [
    // ── Americas ──────────────────────────────────────────────
    { id: "Mexiko", name: "Mexiko", labelX: 150, labelY: 110, points: "143.4,63.1 208.1,78.7 206.4,122.3 156.0,152.6 90.9,141.8 92.6,97.5" },
    { id: "Guatemala", name: "Guatemala", labelX: 132, labelY: 196, small: true, points: "134.4,172.9 160.3,186.0 156.6,211.1 129.4,220.3 103.8,205.9 108.6,181.7" },
    { id: "Honduras", name: "Honduras", labelX: 222, labelY: 190, small: true, points: "219.9,166.2 253.7,175.5 254.9,198.6 224.2,215.5 193.0,203.3 185.9,180.6" },
    { id: "El Salvador", name: "El Salvador", labelX: 140, labelY: 250, small: true, points: "141.4,230.5 163.2,242.0 164.9,262.6 138.6,270.4 117.6,257.7 118.5,239.1" },
    { id: "Nicaragua", name: "Nicaragua", labelX: 228, labelY: 256, small: true, points: "225.1,228.2 259.8,237.6 261.1,266.8 231.2,286.3 199.5,272.5 197.2,245.9" },
    { id: "Costa Rica", name: "Costa Rica", labelX: 186, labelY: 318, small: true, points: "189.4,290.2 219.8,307.7 215.2,335.5 182.5,346.1 150.8,328.7 156.1,300.1" },
    { id: "Panama", name: "Panama", labelX: 284, labelY: 332, small: true, points: "282.4,309.1 320.1,317.2 322.3,341.8 285.6,354.7 248.4,346.6 243.0,321.5" },
    { id: "Kolumbien", name: "Kolumbien", labelX: 272, labelY: 408, points: "275.8,365.1 318.1,389.6 314.6,434.4 267.8,455.4 230.6,424.6 228.6,381.1" },
    { id: "Peru", name: "Peru", labelX: 222, labelY: 510, points: "216.1,461.8 259.1,481.0 265.4,529.3 227.4,553.7 185.0,538.8 175.1,489.2" },
    { id: "Brasilien", name: "Brasilien", labelX: 404, labelY: 478, points: "411.5,406.8 465.3,454.6 463.4,516.4 397.4,540.4 335.3,504.2 338.7,435.8" },
    // ── East Africa ───────────────────────────────────────────
    { id: "Uganda", name: "Uganda", labelX: 562, labelY: 332, small: true, points: "559.5,303.1 589.6,315.6 593.9,344.0 564.5,360.5 533.7,348.8 532.4,320.8" },
    { id: "Ruanda", name: "Ruanda", labelX: 546, labelY: 384, small: true, points: "547.6,365.3 569.4,375.8 568.4,396.6 544.2,404.5 522.6,392.3 523.1,371.1" },
    { id: "Burundi", name: "Burundi", labelX: 549, labelY: 428, small: true, points: "547.5,406.1 569.9,416.7 570.4,435.9 550.3,446.5 529.7,438.4 526.2,419.5" },
    { id: "Äthiopien", name: "Äthiopien", labelX: 652, labelY: 292, points: "656.6,247.8 703.8,274.9 698.2,318.9 648.0,330.0 604.3,307.7 609.5,267.2" },
    { id: "Kenia", name: "Kenia", labelX: 648, labelY: 378, points: "644.0,339.5 680.9,355.5 687.3,394.2 651.9,414.7 615.0,400.6 608.5,361.8" },
    { id: "Tansania", name: "Tansania", labelX: 632, labelY: 464, points: "636.2,415.8 674.9,445.7 675.3,492.2 628.1,508.3 590.7,481.6 592.0,437.9" },
    // ── Arabian Peninsula ─────────────────────────────────────
    { id: "Jemen", name: "Jemen", labelX: 748, labelY: 222, small: true, points: "744.7,195.3 779.1,205.1 783.8,231.2 751.3,248.8 715.5,239.7 712.2,212.7" },
    // ── Asia ──────────────────────────────────────────────────
    { id: "Indien", name: "Indien", labelX: 802, labelY: 302, points: "806.6,249.8 856.9,278.8 851.5,334.1 797.9,349.3 753.6,322.5 760.5,275.1" },
    { id: "Vietnam", name: "Vietnam", labelX: 908, labelY: 332, small: true, points: "903.8,291.8 935.1,307.2 938.4,349.9 912.0,369.7 879.9,357.6 875.2,312.7" },
    { id: "Indonesien", name: "Indonesien", labelX: 902, labelY: 442, points: "904.4,407.6 963.1,428.7 956.9,462.3 899.9,472.3 841.5,455.2 842.6,420.0" },
  ],
};
