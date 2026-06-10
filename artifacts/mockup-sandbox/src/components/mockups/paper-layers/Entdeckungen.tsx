import "./_group.css";
import { ChevronLeft, MapPin } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";

/* ── Torn-paper SVG filters ──────────────────────────────────────────── */
function TornFilters() {
  const seeds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 13, 14, 15, 16, 17];
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden>
      <defs>
        {seeds.map((s) => (
          <filter key={s} id={`torn-${s}`} x="-12%" y="-12%" width="124%" height="124%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.013 0.016"
              numOctaves={3}
              seed={s}
              result="n"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="n"
              scale={11}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        ))}
        <filter id="paper-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
      </defs>
    </svg>
  );
}

function Sheet({
  tone = "cream",
  seed = 2,
  children,
  contentClassName = "",
  style,
  peek = true,
  rotate = -0.6,
}: {
  tone?: "cream" | "espresso";
  seed?: number;
  children: ReactNode;
  contentClassName?: string;
  style?: CSSProperties;
  peek?: boolean;
  rotate?: number;
}) {
  const face = tone === "cream" ? "var(--cream)" : "var(--espresso)";
  const backing = tone === "cream" ? "var(--kraft)" : "var(--espresso-2)";
  const shadow =
    tone === "cream"
      ? "drop-shadow(0 10px 16px rgba(58,39,22,0.16))"
      : "drop-shadow(0 12px 20px rgba(74,48,24,0.24))";
  const backSeed = ((seed + 6) % 16) + 1;
  return (
    <div className="relative" style={style}>
      {peek && (
        <div
          aria-hidden
          className="absolute"
          style={{
            inset: "-7px -6px -10px -8px",
            background: backing,
            filter: `url(#torn-${backSeed})`,
            transform: `rotate(${rotate - 1}deg)`,
          }}
        />
      )}
      {tone === "espresso" && (
        <div
          aria-hidden
          className="absolute"
          style={{
            inset: "-4px -10px -7px 4px",
            background: "var(--espresso-3)",
            filter: `url(#torn-${((seed + 3) % 16) + 1})`,
            transform: `rotate(${rotate + 1.4}deg)`,
            opacity: 0.85,
          }}
        />
      )}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{ background: face, filter: `url(#torn-${seed}) ${shadow}` }}
      />
      <div className={`relative ${contentClassName}`}>{children}</div>
    </div>
  );
}

function Grain() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0"
      style={{ filter: "url(#paper-grain)", opacity: 0.05, mixBlendMode: "multiply" }}
    />
  );
}

function SectionLabel({ children, sub, light }: { children: ReactNode; sub?: string; light?: boolean }) {
  return (
    <div>
      <div className="label" style={{ color: light ? "var(--cream-text-soft)" : "var(--ink-faint)" }}>
        {children}
      </div>
      {sub && (
        <div
          className="sans"
          style={{ fontSize: 12.5, color: light ? "var(--cream-text-faint)" : "var(--ink-soft)", marginTop: 5 }}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

/* ── Stylised paper map ──────────────────────────────────────────────── */
const PINS = [
  { x: 50, y: 38, on: true },
  { x: 54, y: 50, on: true },
  { x: 58, y: 44, on: true },
  { x: 30, y: 56, on: true },
  { x: 27, y: 48, on: false },
  { x: 75, y: 46, on: true },
  { x: 80, y: 52, on: false },
  { x: 47, y: 30, on: false },
];
function PaperMap() {
  return (
    <div className="relative w-full overflow-hidden" style={{ height: 220 }}>
      <div
        aria-hidden
        className="absolute inset-0"
        style={{ background: "var(--paper-bg-2)", filter: "url(#torn-9)" }}
      />
      {/* abstract landmasses */}
      <div
        aria-hidden
        className="absolute"
        style={{ left: "14%", top: "30%", width: "34%", height: "46%", background: "var(--kraft)", filter: "url(#torn-2)", opacity: 0.85 }}
      />
      <div
        aria-hidden
        className="absolute"
        style={{ left: "44%", top: "20%", width: "30%", height: "40%", background: "var(--kraft-deep)", filter: "url(#torn-7)", opacity: 0.8 }}
      />
      <div
        aria-hidden
        className="absolute"
        style={{ left: "68%", top: "30%", width: "24%", height: "38%", background: "var(--kraft)", filter: "url(#torn-12)", opacity: 0.8 }}
      />
      {/* region labels */}
      <span className="serif" style={{ position: "absolute", left: "20%", top: "62%", fontStyle: "italic", fontSize: 13, color: "var(--ink-soft)" }}>
        Südamerika
      </span>
      <span className="serif" style={{ position: "absolute", left: "47%", top: "12%", fontStyle: "italic", fontSize: 13, color: "var(--ink-soft)" }}>
        Afrika
      </span>
      <span className="serif" style={{ position: "absolute", left: "72%", top: "22%", fontStyle: "italic", fontSize: 13, color: "var(--ink-soft)" }}>
        Asien
      </span>
      {/* pins */}
      {PINS.map((p, i) => (
        <span
          key={i}
          className="absolute"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: 12,
            height: 12,
            borderRadius: 999,
            transform: "translate(-50%,-50%)",
            background: p.on ? "var(--gold)" : "transparent",
            border: p.on ? "none" : "1.5px solid var(--ink-faint)",
            boxShadow: p.on ? "0 0 0 3px rgba(188,126,44,0.22)" : "none",
          }}
        />
      ))}
    </div>
  );
}

/* ── Coffee Nest icon family (web SVG, shapes unchanged from the app) ─── */
const ico = (c: string, w = 2) => ({
  stroke: c,
  strokeWidth: w,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  fill: "none",
});

function AromaIcon({ step, size = 24, color = "currentColor" }: { step: number; size?: number; color?: string }) {
  const p = ico(color, 2);
  const pt = ico(color, 1.6);
  switch (step) {
    case 1: // Schokoladig — chocolate bar
      return (
        <svg width={size} height={size} viewBox="0 0 28 28">
          <g transform="rotate(-22 14 14)">
            <rect x="4" y="2" width="20" height="24" rx="2.5" ry="2.5" {...p} />
            <line x1="4" y1="14" x2="24" y2="14" {...p} />
            <line x1="4" y1="6.7" x2="24" y2="6.7" {...pt} />
            <line x1="4" y1="10.3" x2="24" y2="10.3" {...pt} />
            <line x1="10.7" y1="2" x2="10.7" y2="14" {...pt} />
            <line x1="17.3" y1="2" x2="17.3" y2="14" {...pt} />
            <path d="M4,14 L19,26" {...pt} />
          </g>
        </svg>
      );
    case 2: // Nussig — nut
      return (
        <svg width={size} height={size} viewBox="0 0 28 28">
          <path d="M14,4 C14,2 16,1 16,4" {...p} />
          <path d="M6,13 C6,5 22,5 22,13" {...p} />
          <line x1="4" y1="13" x2="24" y2="13" {...p} />
          <path d="M6,13 Q5,22 14,27 Q23,22 22,13" {...p} />
        </svg>
      );
    case 4: // Fruchtig/Beerig — berries
      return (
        <svg width={size} height={size} viewBox="0 0 28 28">
          <path d="M14,6 L14,3" {...p} />
          <path d="M10,4.5 C10,1.5 14,1 14,3" {...pt} />
          <circle cx="11" cy="10" r="3.5" {...p} />
          <circle cx="17" cy="10" r="3.5" {...p} />
          <circle cx="8" cy="17" r="3.5" {...p} />
          <circle cx="14" cy="17" r="3.5" {...p} />
          <circle cx="20" cy="17" r="3.5" {...p} />
          <circle cx="11" cy="24" r="3.5" {...p} />
          <circle cx="17" cy="24" r="3.5" {...p} />
        </svg>
      );
    case 5: // Blumig/Zitrisch — radial burst
      return (
        <svg width={size} height={size} viewBox="0 0 28 28">
          <circle cx="14" cy="14" r="11.5" stroke={color} strokeWidth={2.5} fill="none" />
          <circle cx="14" cy="14" r="8.5" {...pt} />
          <path
            d="M14,14 L14,5.5 M14,14 L19,7.1 M14,14 L22.1,11.4 M14,14 L22.1,16.6 M14,14 L19,20.9 M14,14 L14,22.5 M14,14 L9,20.9 M14,14 L5.9,16.6 M14,14 L5.9,11.4 M14,14 L9,7.1"
            strokeWidth={1.5}
            stroke={color}
            strokeLinecap="round"
            fill="none"
          />
          <circle cx="14" cy="14" r="1.5" stroke={color} strokeWidth={1.5} fill="none" />
        </svg>
      );
    default:
      return null;
  }
}

function ProcessingIcon({ method, size = 24, color = "currentColor" }: { method: string; size?: number; color?: string }) {
  const steps: Record<string, number> = { washed: 1, natural: 2, honey: 3 };
  const p = ico(color, 2);
  const pt = ico(color, 1.6);
  switch (steps[method]) {
    case 1: // Washed — water droplet
      return (
        <svg width={size} height={size} viewBox="0 0 28 28">
          <path d="M14,3 C14,3 22,12 22,18 A8,8 0 1 1 6,18 C6,12 14,3 14,3 Z" {...p} />
          <path d="M11,18 C11,20.5 12.5,22 14.5,22" {...pt} />
        </svg>
      );
    case 2: // Natural — coffee cherry with leaf
      return (
        <svg width={size} height={size} viewBox="0 0 28 28">
          <path d="M14,8 L14,4" {...p} />
          <path d="M14,5 C16,2 20,2.5 21,5 C19,7.5 15.5,7 14,5 Z" {...pt} />
          <circle cx="14" cy="16" r="7.5" {...p} />
          <path d="M11,12.5 C12.5,11.5 15.5,11.5 17,12.5" {...pt} />
        </svg>
      );
    case 3: // Honey — honeycomb cell
      return (
        <svg width={size} height={size} viewBox="0 0 28 28">
          <polygon points="14,3.5 22.5,8.5 22.5,18.5 14,23.5 5.5,18.5 5.5,8.5" {...p} />
          <polygon points="14,9 18,11.5 18,16.5 14,19 10,16.5 10,11.5" {...pt} />
        </svg>
      );
    default:
      return null;
  }
}

const AROMEN = [
  { label: "Schokoladig", step: 1, count: 6, best: "Brazil Daterra", h: 8.6, d: 8.1 },
  { label: "Fruchtig", step: 4, count: 5, best: "Yirgacheffe", h: 9.2, d: 8.8 },
  { label: "Nussig", step: 2, count: 4, best: "Honduras Marcala", h: 7.9, d: 7.5 },
  { label: "Blumig", step: 5, count: 3, best: "Gesha Esmeralda", h: 9.4, d: 9.0 },
];
const AUFB = [
  { label: "Washed", method: "washed", count: 11, best: "Kenia AA", h: 8.8, d: 8.3 },
  { label: "Natural", method: "natural", count: 7, best: "Yirgacheffe", h: 9.2, d: 8.8 },
  { label: "Honey", method: "honey", count: 3, best: "Costa Rica", h: 8.1, d: 7.8 },
];

function CategoryChip({
  icon,
  label,
  count,
  best,
  h,
  d,
}: {
  icon: ReactNode;
  label: string;
  count: number;
  best: string;
  h: number;
  d: number;
}) {
  return (
    <div className="relative" style={{ minWidth: 0 }}>
      <div aria-hidden className="absolute inset-0" style={{ background: "var(--cream)", filter: "url(#torn-5)" }} />
      <div className="relative px-4 py-4">
        {/* icon stamp — espresso paper backing, gold outline (design-matched) */}
        <div className="relative mb-3" style={{ width: 44, height: 44 }}>
          <div aria-hidden className="absolute inset-0" style={{ background: "var(--espresso)", filter: "url(#torn-9)" }} />
          <div
            className="relative flex h-full w-full items-center justify-center"
            style={{ color: "var(--gold-light)" }}
          >
            {icon}
          </div>
        </div>
        <div className="serif" style={{ fontSize: 17, fontWeight: 700, color: "var(--ink)" }}>
          {label}
        </div>
        <div className="sans" style={{ fontSize: 11, color: "var(--ink-soft)", marginTop: 2 }}>
          {count} Kaffees
        </div>
        <div className="mt-3 h-px w-full" style={{ background: "var(--hair)" }} />
        <div className="label" style={{ color: "var(--ink-faint)", marginTop: 10, letterSpacing: "0.2em" }}>
          Bester
        </div>
        <div className="sans" style={{ fontSize: 12.5, color: "var(--ink)", marginTop: 3, fontWeight: 500 }}>
          {best}
        </div>
        <div className="mt-1.5 flex items-baseline gap-2.5">
          <span className="sans" style={{ fontSize: 11, color: "var(--ink-soft)" }}>
            Hase <b style={{ color: "var(--gold)", fontFamily: "var(--serif)", fontSize: 14 }}>{h}</b>
          </span>
          <span className="sans" style={{ fontSize: 11, color: "var(--ink-soft)" }}>
            Dodo <b style={{ color: "var(--gold)", fontFamily: "var(--serif)", fontSize: 14 }}>{d}</b>
          </span>
        </div>
      </div>
    </div>
  );
}

export function Entdeckungen() {
  return (
    <div
      className="paper-root relative min-h-screen w-full overflow-hidden"
      style={{ background: "var(--paper-bg)", paddingBottom: 56 }}
    >
      <TornFilters />
      <Grain />

      {/* ── Header ────────────────────────────────────────────────── */}
      <header className="relative px-7" style={{ paddingTop: 64 }}>
        <div className="flex items-center gap-3">
          <ChevronLeft size={26} color="var(--ink)" />
          <div>
            <div className="label" style={{ color: "var(--ink-faint)" }}>
              Coffee Nest
            </div>
            <h1 className="serif" style={{ fontSize: 40, lineHeight: 1, fontWeight: 800, color: "var(--ink)", marginTop: 6 }}>
              Entdeckungen
            </h1>
          </div>
        </div>
        <div className="mt-6 h-px w-full" style={{ background: "var(--hair)" }} />
      </header>

      <main className="relative px-7 pt-7" style={{ display: "flex", flexDirection: "column", gap: 32 }}>
        {/* ── KAFFEEWELT ────────────────────────────────────────────── */}
        <Sheet tone="cream" seed={2} contentClassName="px-6 py-6" rotate={-0.6}>
          <SectionLabel sub="Entdecke die Herkunft deiner Kaffees">Kaffeewelt</SectionLabel>
          <div className="mt-5 flex items-baseline justify-between">
            <span className="sans" style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)" }}>
              9 von 20 Herkunftsländern entdeckt
            </span>
            <span className="serif" style={{ fontSize: 20, fontWeight: 800, color: "var(--gold)" }}>
              45&thinsp;%
            </span>
          </div>
          <div className="mt-2.5 h-1.5 w-full overflow-hidden" style={{ background: "rgba(41,25,15,0.10)" }}>
            <div style={{ width: "45%", height: "100%", background: "var(--gold)" }} />
          </div>

          <div className="mt-5">
            <PaperMap />
          </div>

          {/* legend */}
          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2.5">
            {[
              { c: "var(--gold)", t: "Entdeckt", ring: false },
              { c: "transparent", t: "Noch nicht entdeckt", ring: true },
            ].map((l) => (
              <span key={l.t} className="flex items-center gap-2">
                <span
                  className="inline-block h-3 w-3 rounded-full"
                  style={{ background: l.c, border: l.ring ? "1.5px solid var(--ink-faint)" : "none" }}
                />
                <span className="sans" style={{ fontSize: 11.5, color: "var(--ink-soft)" }}>
                  {l.t}
                </span>
              </span>
            ))}
            <span className="flex items-center gap-2">
              <MapPin size={13} color="var(--gold)" />
              <span className="sans" style={{ fontSize: 11.5, color: "var(--ink-soft)" }}>
                Hases Lieblingsland
              </span>
            </span>
          </div>

          <div className="mt-5 flex items-center gap-2 border-t pt-4" style={{ borderColor: "var(--hair)" }}>
            <MapPin size={16} color="var(--gold)" />
            <span className="sans" style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>
              Zuletzt entdeckt:
            </span>
            <span className="serif" style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)" }}>
              Äthiopien
            </span>
          </div>
        </Sheet>

        {/* ── DEIN KAFFEEPROFIL ─────────────────────────────────────── */}
        <Sheet tone="cream" seed={8} contentClassName="px-6 py-6" rotate={0.7}>
          <SectionLabel>Dein Kaffeeprofil</SectionLabel>

          {/* Gemeinsamer Favorit — espresso plane embedded */}
          <div className="mt-5">
            <Sheet tone="espresso" seed={4} contentClassName="px-6 py-6" rotate={-0.9}>
              <div className="text-center">
                <div className="label" style={{ color: "var(--gold-light)" }}>
                  Gemeinsamer Favorit
                </div>
                <div
                  className="serif"
                  style={{ fontSize: 27, fontWeight: 800, color: "var(--cream-text)", marginTop: 10, lineHeight: 1.15 }}
                >
                  Yirgacheffe Konga
                </div>
                <div className="sans" style={{ fontSize: 13, color: "var(--cream-text-soft)", marginTop: 4 }}>
                  The Barn
                </div>
                <div className="mt-5 flex items-center justify-center gap-7">
                  <span className="sans" style={{ fontSize: 13, color: "var(--cream-text-soft)" }}>
                    Hase{" "}
                    <b className="serif" style={{ color: "var(--gold-light)", fontSize: 20 }}>
                      9.2
                    </b>
                  </span>
                  <span className="h-6 w-px" style={{ background: "var(--hair-cream)" }} />
                  <span className="sans" style={{ fontSize: 13, color: "var(--cream-text-soft)" }}>
                    Dodo{" "}
                    <b className="serif" style={{ color: "var(--gold-light)", fontSize: 20 }}>
                      8.8
                    </b>
                  </span>
                </div>
              </div>
            </Sheet>
          </div>

          {/* Lieblingsländer — naked text, de-carded */}
          <div className="mt-7">
            <div className="label" style={{ color: "var(--ink-faint)" }}>
              Lieblingsländer
            </div>
            <div className="mt-3 flex items-stretch">
              <div className="flex-1">
                <div className="sans" style={{ fontSize: 11.5, color: "var(--ink-soft)", fontWeight: 500 }}>
                  Hase
                </div>
                <div className="serif" style={{ fontSize: 22, fontWeight: 700, color: "var(--ink)", marginTop: 3 }}>
                  Äthiopien
                </div>
              </div>
              <span className="w-px self-stretch" style={{ background: "var(--hair)" }} />
              <div className="flex-1 pl-5">
                <div className="sans" style={{ fontSize: 11.5, color: "var(--ink-soft)", fontWeight: 500 }}>
                  Dodo
                </div>
                <div className="serif" style={{ fontSize: 22, fontWeight: 700, color: "var(--ink)", marginTop: 3 }}>
                  Kolumbien
                </div>
              </div>
            </div>
          </div>

          {/* Spitzenreiter — naked text */}
          <div className="mt-7 border-t pt-6" style={{ borderColor: "var(--hair)" }}>
            <div className="label" style={{ color: "var(--ink-faint)" }}>
              Spitzenreiter
            </div>
            <div className="mt-3 flex items-stretch">
              <div className="flex-1 pr-4">
                <div className="sans" style={{ fontSize: 11.5, color: "var(--ink-soft)", fontWeight: 500 }}>
                  Hase
                </div>
                <div className="serif" style={{ fontSize: 19, fontWeight: 700, color: "var(--ink)", marginTop: 3, lineHeight: 1.15 }}>
                  Gesha Esmeralda
                </div>
                <div className="sans" style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 2 }}>
                  Five Elephant
                </div>
                <div className="sans" style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 4 }}>
                  Wertung{" "}
                  <b className="serif" style={{ color: "var(--gold)", fontSize: 15 }}>
                    9.4
                  </b>
                </div>
              </div>
              <span className="w-px self-stretch" style={{ background: "var(--hair)" }} />
              <div className="flex-1 pl-5">
                <div className="sans" style={{ fontSize: 11.5, color: "var(--ink-soft)", fontWeight: 500 }}>
                  Dodo
                </div>
                <div className="serif" style={{ fontSize: 19, fontWeight: 700, color: "var(--ink)", marginTop: 3, lineHeight: 1.15 }}>
                  Yirgacheffe Konga
                </div>
                <div className="sans" style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 2 }}>
                  The Barn
                </div>
                <div className="sans" style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 4 }}>
                  Wertung{" "}
                  <b className="serif" style={{ color: "var(--gold)", fontSize: 15 }}>
                    8.8
                  </b>
                </div>
              </div>
            </div>
          </div>
        </Sheet>

        {/* ── AROMEN — espresso plane ───────────────────────────────── */}
        <Sheet tone="espresso" seed={5} contentClassName="px-6 py-6" rotate={-0.7}>
          <SectionLabel light sub="Entdeckte Geschmackswelten">Aromen</SectionLabel>
          <div className="mt-5 grid grid-cols-2 gap-4">
            {AROMEN.map((a) => (
              <CategoryChip
                key={a.label}
                icon={<AromaIcon step={a.step} />}
                label={a.label}
                count={a.count}
                best={a.best}
                h={a.h}
                d={a.d}
              />
            ))}
          </div>
        </Sheet>

        {/* ── AUFBEREITUNGEN — espresso plane ───────────────────────── */}
        <Sheet tone="espresso" seed={11} contentClassName="px-6 py-6" rotate={0.7}>
          <SectionLabel light sub="Entdeckte Verarbeitungsmethoden">Aufbereitungen</SectionLabel>
          <div className="mt-5 grid grid-cols-2 gap-4">
            {AUFB.map((a) => (
              <CategoryChip
                key={a.label}
                icon={<ProcessingIcon method={a.method} />}
                label={a.label}
                count={a.count}
                best={a.best}
                h={a.h}
                d={a.d}
              />
            ))}
          </div>
        </Sheet>
      </main>
    </div>
  );
}
