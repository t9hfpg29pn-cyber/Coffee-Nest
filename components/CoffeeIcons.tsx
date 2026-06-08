import React from "react";
import Svg, { Path, Circle, Line, Rect, G, Polygon, ClipPath, Defs } from "react-native-svg";

/**
 * Coffee Nest icon family.
 *
 * Shared visual language — every icon:
 *  - viewBox "0 0 28 28"
 *  - monochrome, driven by the `color` prop (no fills unless intentional)
 *  - stroke width ~2 (thin details 1.6), round caps & joins
 *  - minimalist, low-poly compatible
 *
 * Used across Aroma, Aufbereitung, Röstgrad, Entdeckungen, Kaffeeprofil and
 * future country / roastery maps.
 */

type IconProps = { size?: number; color: string };

function stroke(color: string, w = 2) {
  return {
    stroke: color,
    strokeWidth: w,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    fill: "none",
  };
}

// ─── Aroma (1–5) ─────────────────────────────────────────────────────────────
// 1 Schokoladig · 2 Nussig · 3 Klassisch (Bohne) · 4 Beerig · 5 Zitrisch
export function AromaIcon({ step, size = 26, color }: { step: number; size?: number; color: string }) {
  const p = stroke(color, 2);
  const pt = stroke(color, 1.6);
  switch (step) {
    case 1:
      return (
        <Svg width={size} height={size} viewBox="0 0 28 28">
          <G transform="rotate(-22, 14, 14)">
            <Rect x="4" y="2" width="20" height="24" rx="2.5" ry="2.5" {...p} />
            <Line x1="4" y1="14" x2="24" y2="14" {...p} />
            <Line x1="4" y1="6.7" x2="24" y2="6.7" {...pt} />
            <Line x1="4" y1="10.3" x2="24" y2="10.3" {...pt} />
            <Line x1="10.7" y1="2" x2="10.7" y2="14" {...pt} />
            <Line x1="17.3" y1="2" x2="17.3" y2="14" {...pt} />
            <Path d="M4,14 L19,26" {...pt} />
          </G>
        </Svg>
      );
    case 2:
      return (
        <Svg width={size} height={size} viewBox="0 0 28 28">
          <Path d="M14,4 C14,2 16,1 16,4" {...p} />
          <Path d="M6,13 C6,5 22,5 22,13" {...p} />
          <Line x1="4" y1="13" x2="24" y2="13" {...p} />
          <Path d="M6,13 Q5,22 14,27 Q23,22 22,13" {...p} />
        </Svg>
      );
    case 3:
      return (
        <Svg width={size} height={size} viewBox="0 0 28 28">
          <Path d="M14,4 C19,4 20,9 20,14 C20,19 19,24 14,24 C9,24 8,19 8,14 C8,9 9,4 14,4 Z" {...p} />
          <Path d="M14,7 C16,10 12,14 14,18 C15,21 14,23 14,23" {...p} />
        </Svg>
      );
    case 4:
      return (
        <Svg width={size} height={size} viewBox="0 0 28 28">
          <Path d="M14,6 L14,3" {...p} />
          <Path d="M10,4.5 C10,1.5 14,1 14,3" {...pt} />
          <Circle cx="11" cy="10" r="3.5" {...p} />
          <Circle cx="17" cy="10" r="3.5" {...p} />
          <Circle cx="8" cy="17" r="3.5" {...p} />
          <Circle cx="14" cy="17" r="3.5" {...p} />
          <Circle cx="20" cy="17" r="3.5" {...p} />
          <Circle cx="11" cy="24" r="3.5" {...p} />
          <Circle cx="17" cy="24" r="3.5" {...p} />
        </Svg>
      );
    case 5:
      return (
        <Svg width={size} height={size} viewBox="0 0 28 28">
          <Circle cx="14" cy="14" r="11.5" stroke={color} strokeWidth={2.5} fill="none" />
          <Circle cx="14" cy="14" r="8.5" {...pt} />
          <Path
            d="M14,14 L14,5.5 M14,14 L19,7.1 M14,14 L22.1,11.4 M14,14 L22.1,16.6 M14,14 L19,20.9 M14,14 L14,22.5 M14,14 L9,20.9 M14,14 L5.9,16.6 M14,14 L5.9,11.4 M14,14 L9,7.1"
            strokeWidth={1.5}
            stroke={color}
            strokeLinecap="round"
            fill="none"
          />
          <Circle cx="14" cy="14" r="1.5" stroke={color} strokeWidth={1.5} fill="none" />
        </Svg>
      );
    default:
      return null;
  }
}

// ─── Aufbereitung (processing) ───────────────────────────────────────────────
const PROCESS_STEPS: Record<string, number> = {
  washed: 1,
  natural: 2,
  honey: 3,
  anaerobic: 4,
  experimental: 5,
};

export function ProcessingIcon({ method, size = 26, color }: { method: string; size?: number; color: string }) {
  const p = stroke(color, 2);
  const pt = stroke(color, 1.6);
  switch (PROCESS_STEPS[method]) {
    case 1: // Washed — water droplet
      return (
        <Svg width={size} height={size} viewBox="0 0 28 28">
          <Path d="M14,3 C14,3 22,12 22,18 A8,8 0 1 1 6,18 C6,12 14,3 14,3 Z" {...p} />
          <Path d="M11,18 C11,20.5 12.5,22 14.5,22" {...pt} />
        </Svg>
      );
    case 2: // Natural — coffee cherry with leaf
      return (
        <Svg width={size} height={size} viewBox="0 0 28 28">
          <Path d="M14,8 L14,4" {...p} />
          <Path d="M14,5 C16,2 20,2.5 21,5 C19,7.5 15.5,7 14,5 Z" {...pt} />
          <Circle cx="14" cy="16" r="7.5" {...p} />
          <Path d="M11,12.5 C12.5,11.5 15.5,11.5 17,12.5" {...pt} />
        </Svg>
      );
    case 3: // Honey — honeycomb cell
      return (
        <Svg width={size} height={size} viewBox="0 0 28 28">
          <Polygon points="14,3.5 22.5,8.5 22.5,18.5 14,23.5 5.5,18.5 5.5,8.5" {...p} />
          <Polygon points="14,9 18,11.5 18,16.5 14,19 10,16.5 10,11.5" {...pt} />
        </Svg>
      );
    case 4: // Anaerobic — sealed fermentation tank
      return (
        <Svg width={size} height={size} viewBox="0 0 28 28">
          <Rect x="6" y="8" width="16" height="17" rx="3" {...p} />
          <Path d="M9,8 L9,5.5 A1.5,1.5 0 0 1 10.5,4 L17.5,4 A1.5,1.5 0 0 1 19,5.5 L19,8" {...p} />
          <Line x1="14" y1="4" x2="14" y2="2" {...pt} />
          <Circle cx="14" cy="2" r="1" {...pt} />
          <Path d="M10,15 C11,13.5 12,16 13,14.5" {...pt} />
          <Path d="M15,18 C16,16.5 17,19 18,17.5" {...pt} />
        </Svg>
      );
    case 5: // Experimental — lab flask
      return (
        <Svg width={size} height={size} viewBox="0 0 28 28">
          <Path d="M11,3 L11,10 L5.5,22 A2,2 0 0 0 7.3,25 L20.7,25 A2,2 0 0 0 22.5,22 L17,10 L17,3" {...p} />
          <Line x1="9.5" y1="3" x2="18.5" y2="3" {...p} />
          <Path d="M8.2,17 L19.8,17" {...pt} />
          <Circle cx="12" cy="20.5" r="1.1" {...pt} />
          <Circle cx="16" cy="21.5" r="0.9" {...pt} />
        </Svg>
      );
    default:
      return null;
  }
}

// ─── Röstgrad (roast level) ──────────────────────────────────────────────────
// Same bean shape; fill rises with roast darkness (monochrome).
const ROAST_FILL: Record<string, number> = {
  light: 0,
  "medium-light": 0.28,
  medium: 0.52,
  "medium-dark": 0.76,
  dark: 1,
};

const BEAN_PATH = "M14,4 C19,4 20,9 20,14 C20,19 19,24 14,24 C9,24 8,19 8,14 C8,9 9,4 14,4 Z";
const BEAN_CREASE = "M14,6 C16,9.5 12,13.5 14,17.5 C15,20.5 14,22 14,22";

export function RoastIcon({ level, size = 26, color }: { level: string; size?: number; color: string }) {
  const p = stroke(color, 2);
  const pt = stroke(color, 1.6);
  const frac = ROAST_FILL[level] ?? 0;
  const top = 4;
  const bottom = 24;
  const fillTop = bottom - (bottom - top) * frac;
  const clipId = `bean-${level}`;
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28">
      <Defs>
        <ClipPath id={clipId}>
          <Path d={BEAN_PATH} />
        </ClipPath>
      </Defs>
      {frac > 0 && (
        <Rect x="6" y={fillTop} width="16" height={bottom - fillTop + 1} fill={color} clipPath={`url(#${clipId})`} />
      )}
      <Path d={BEAN_PATH} {...p} />
      {frac < 1 && <Path d={BEAN_CREASE} {...pt} />}
    </Svg>
  );
}

// ─── Stat / profile icons ────────────────────────────────────────────────────

export function CupIcon({ size = 26, color }: IconProps) {
  const p = stroke(color, 2);
  const pt = stroke(color, 1.6);
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28">
      <Path d="M5,11 L21,11 L20,21 A3,3 0 0 1 17,24 L9,24 A3,3 0 0 1 6,21 Z" {...p} />
      <Path d="M21,13 L23.5,13 A2.5,2.5 0 0 1 23.5,18 L20.5,18" {...p} />
      <Path d="M10,4 C10,6 12,6 12,8" {...pt} />
      <Path d="M15,4 C15,6 17,6 17,8" {...pt} />
    </Svg>
  );
}

export function RoasteryIcon({ size = 26, color }: IconProps) {
  const p = stroke(color, 2);
  const pt = stroke(color, 1.6);
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28">
      {/* factory body */}
      <Path d="M4,24 L4,13 L13,17 L13,13 L22,17 L22,24 Z" {...p} />
      {/* chimney */}
      <Path d="M19,12 L19,7 L22,7 L22,15" {...p} />
      {/* steam */}
      <Path d="M20.5,5 C20.5,3.5 18.5,3.5 18.5,2" {...pt} />
    </Svg>
  );
}

export function GlobeIcon({ size = 26, color }: IconProps) {
  const p = stroke(color, 2);
  const pt = stroke(color, 1.6);
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28">
      <Circle cx="14" cy="14" r="10.5" {...p} />
      <Line x1="3.5" y1="14" x2="24.5" y2="14" {...pt} />
      <Path d="M14,3.5 C9,8 9,20 14,24.5 C19,20 19,8 14,3.5 Z" {...pt} />
    </Svg>
  );
}

export function MillIcon({ size = 26, color }: IconProps) {
  const p = stroke(color, 2);
  const pt = stroke(color, 1.6);
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28">
      {/* crank */}
      <Path d="M14,6 L14,3 L19,3" {...p} />
      <Circle cx="14" cy="6" r="1.4" {...pt} />
      {/* hopper */}
      <Path d="M8,8 L20,8 L18,13 L10,13 Z" {...p} />
      {/* body */}
      <Rect x="9" y="13" width="10" height="11" rx="1.5" {...p} />
      {/* drawer */}
      <Line x1="9" y1="20" x2="19" y2="20" {...pt} />
      <Circle cx="14" cy="22" r="0.9" {...pt} />
    </Svg>
  );
}

export function TrophyIcon({ size = 26, color }: IconProps) {
  const p = stroke(color, 2);
  const pt = stroke(color, 1.6);
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28">
      <Path d="M8,4 L20,4 L20,10 A6,6 0 0 1 8,10 Z" {...p} />
      <Path d="M8,5 L5,5 L5,8 A3,3 0 0 0 8,11" {...pt} />
      <Path d="M20,5 L23,5 L23,8 A3,3 0 0 1 20,11" {...pt} />
      <Line x1="14" y1="15.5" x2="14" y2="19" {...p} />
      <Path d="M10,24 L18,24 L17,20 L11,20 Z" {...p} />
    </Svg>
  );
}

export function CompassIcon({ size = 26, color }: IconProps) {
  const p = stroke(color, 2);
  const pt = stroke(color, 1.6);
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28">
      <Circle cx="14" cy="14" r="10.5" {...p} />
      <Polygon points="14,7 16.5,14 14,21 11.5,14" {...pt} />
      <Circle cx="14" cy="14" r="1.3" fill={color} />
    </Svg>
  );
}

export function GemIcon({ size = 26, color }: IconProps) {
  const p = stroke(color, 2);
  const pt = stroke(color, 1.6);
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28">
      <Polygon points="14,3 24,11 14,25 4,11" {...p} />
      <Line x1="4" y1="11" x2="24" y2="11" {...pt} />
      <Line x1="14" y1="3" x2="9.5" y2="11" {...pt} />
      <Line x1="14" y1="3" x2="18.5" y2="11" {...pt} />
      <Line x1="9.5" y1="11" x2="14" y2="25" {...pt} />
      <Line x1="18.5" y1="11" x2="14" y2="25" {...pt} />
    </Svg>
  );
}

export function OriginPinIcon({ size = 26, color }: IconProps) {
  const p = stroke(color, 2);
  const pt = stroke(color, 1.6);
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28">
      <Path d="M14,3 C9,3 5.5,6.5 5.5,11.5 C5.5,17 14,25 14,25 C14,25 22.5,17 22.5,11.5 C22.5,6.5 19,3 14,3 Z" {...p} />
      {/* little bean inside */}
      <Path d="M14,8 C16.3,8 17,10 17,11.8 C17,13.6 16.3,15.5 14,15.5 C11.7,15.5 11,13.6 11,11.8 C11,10 11.7,8 14,8 Z" {...pt} />
    </Svg>
  );
}

export function StarIcon({ size = 26, color, filled = true }: IconProps & { filled?: boolean }) {
  const pts = "14,3 17.2,10.3 25,11 19,16.2 21,24 14,19.8 7,24 9,16.2 3,11 10.8,10.3";
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28">
      <Polygon
        points={pts}
        fill={filled ? color : "none"}
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
      />
    </Svg>
  );
}
