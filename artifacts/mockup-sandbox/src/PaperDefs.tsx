/* ============================================================
   COFFEE NEST – PAPER DEFS + PAPER CARD
   Diese Datei liefert:
   1. <PaperDefs/>  – die 3 Wellenformen als unsichtbares SVG.
      MUSS GENAU EINMAL in App.tsx eingebunden werden.
   2. <PaperCard/>  – die einzige erlaubte Art, Papierkarten
      zu bauen. KEINE eigenen Karten-Stile erfinden.
   ============================================================ */

import React from "react";

/** Unsichtbare SVG-Definitionen der Wellenformen.
 *  clipPathUnits="objectBoundingBox" -> die Form skaliert
 *  automatisch auf jede Kartengröße. Einmal in App.tsx mounten. */
export function PaperDefs() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
      <defs>
        {/* Form 1 – sanfte Welle, Standard (PAPER-01) */}
        <clipPath id="paper-wave-1" clipPathUnits="objectBoundingBox">
          <path d="
            M 0.045 0.060
            C 0.020 0.018, 0.090 0.000, 0.280 0.014
            C 0.480 0.030, 0.660 0.002, 0.850 0.012
            C 0.965 0.018, 0.998 0.045, 0.992 0.160
            C 0.986 0.360, 0.999 0.560, 0.990 0.760
            C 0.985 0.915, 0.965 0.992, 0.840 0.986
            C 0.640 0.976, 0.440 0.999, 0.240 0.988
            C 0.095 0.980, 0.008 0.988, 0.012 0.845
            C 0.016 0.640, 0.001 0.440, 0.010 0.240
            C 0.014 0.115, 0.022 0.095, 0.045 0.060
            Z" />
        </clipPath>
        {/* Form 2 – versetzte Welle, für benachbarte Karten */}
        <clipPath id="paper-wave-2" clipPathUnits="objectBoundingBox">
          <path d="
            M 0.060 0.045
            C 0.110 0.000, 0.300 0.022, 0.500 0.008
            C 0.700 -0.004, 0.880 0.020, 0.945 0.030
            C 0.992 0.038, 1.000 0.110, 0.988 0.300
            C 0.978 0.500, 0.998 0.700, 0.985 0.880
            C 0.978 0.975, 0.920 0.998, 0.740 0.985
            C 0.540 0.972, 0.340 0.998, 0.160 0.986
            C 0.040 0.978, 0.002 0.940, 0.012 0.760
            C 0.020 0.560, 0.000 0.360, 0.012 0.180
            C 0.018 0.090, 0.030 0.072, 0.060 0.045
            Z" />
        </clipPath>
        {/* Form 3 – kompakte Welle, gut für Chips & kleine Flächen */}
        <clipPath id="paper-wave-3" clipPathUnits="objectBoundingBox">
          <path d="
            M 0.080 0.070
            C 0.180 -0.010, 0.420 0.030, 0.620 0.012
            C 0.820 -0.005, 0.940 0.030, 0.970 0.110
            C 0.998 0.190, 0.980 0.420, 0.992 0.620
            C 1.000 0.800, 0.970 0.950, 0.840 0.975
            C 0.640 1.010, 0.400 0.965, 0.220 0.990
            C 0.080 1.008, 0.015 0.940, 0.020 0.760
            C 0.025 0.560, 0.005 0.340, 0.018 0.200
            C 0.026 0.120, 0.040 0.100, 0.080 0.070
            Z" />
        </clipPath>
      </defs>
    </svg>
  );
}

/** Die einzige erlaubte Papierkarte.
 *  variant: light (Standard) | dark (Kaffee) | accent (fleckig) | tile (Icon-Kachel)
 *  shape:   1 | 2 | 3  (benachbarte Karten abwechseln!)
 *  shadow:  0 (keiner) | 1 subtle | 2 medium | 3 strong (selten) */
type PaperCardProps = {
  variant?: "light" | "dark" | "accent" | "tile";
  shape?: 1 | 2 | 3;
  shadow?: 0 | 1 | 2 | 3;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
  onClick?: () => void;
};

export function PaperCard({
  variant = "light",
  shape = 1,
  shadow = 1,
  className = "",
  style,
  children,
  onClick,
}: PaperCardProps) {
  const variantClass =
    variant === "dark" ? "paper--dark"
    : variant === "accent" ? "paper--accent"
    : variant === "tile" ? "paper--tile"
    : "";
  const shapeClass = shape === 2 ? "paper--shape2" : shape === 3 ? "paper--shape3" : "";
  const wrapperClass = shadow > 0 ? `paper-shadow-${shadow}` : "";

  return (
    <div className={wrapperClass}>
      <div
        className={`paper ${variantClass} ${shapeClass} ${className}`.trim()}
        style={style}
        onClick={onClick}
      >
        {children}
      </div>
    </div>
  );
}
