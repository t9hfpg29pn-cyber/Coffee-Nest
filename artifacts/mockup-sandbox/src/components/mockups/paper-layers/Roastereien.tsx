import "./_group.css";
import { Plus, ChevronRight, ChevronDown, Compass, X } from "lucide-react";
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

/* ── A torn paper sheet with a kraft backing peeking behind ──────────── */
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
      ? "drop-shadow(0 10px 16px rgba(40,24,12,0.20))"
      : "drop-shadow(0 14px 22px rgba(15,8,4,0.42))";
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

/* ── Score chip group (naked, no container) ──────────────────────────── */
function Score({ hase, dodo }: { hase: number; dodo?: number }) {
  return (
    <div className="flex items-baseline gap-3 mt-2.5">
      <span className="label" style={{ color: "var(--ink-faint)", letterSpacing: "0.2em" }}>
        ⌀ Score
      </span>
      <span className="h-3 w-px" style={{ background: "var(--hair)" }} />
      <span className="flex items-baseline gap-1.5">
        <span className="sans" style={{ fontSize: 11, color: "var(--ink-soft)", fontWeight: 500 }}>
          Hase
        </span>
        <span className="serif" style={{ fontSize: 17, fontWeight: 700, color: "var(--gold)" }}>
          {hase.toFixed(1)}
        </span>
      </span>
      {dodo !== undefined && (
        <>
          <span className="h-3 w-px" style={{ background: "var(--hair)" }} />
          <span className="flex items-baseline gap-1.5">
            <span className="sans" style={{ fontSize: 11, color: "var(--ink-soft)", fontWeight: 500 }}>
              Dodo
            </span>
            <span className="serif" style={{ fontSize: 17, fontWeight: 700, color: "var(--gold)" }}>
              {dodo.toFixed(1)}
            </span>
          </span>
        </>
      )}
    </div>
  );
}

const ROASTERIES = [
  { name: "Bonanza Coffee", location: "Berlin", count: 7, hase: 8.4, dodo: 7.9, seed: 2 },
  { name: "The Barn", location: "Berlin", count: 5, hase: 9.1, dodo: 8.6, seed: 5 },
  { name: "Five Elephant", location: "Berlin", count: 4, hase: 7.8, dodo: 8.2, seed: 8 },
  { name: "Elbgold", location: "Hamburg", count: 3, hase: 8.0, dodo: 7.4, seed: 12 },
  { name: "Röststätte", location: "Berlin", count: 2, hase: 7.2, dodo: 6.9, seed: 15 },
];

export function Roastereien() {
  return (
    <div
      className="paper-root relative min-h-screen w-full overflow-hidden"
      style={{ background: "var(--paper-bg)", paddingBottom: 56 }}
    >
      <TornFilters />
      <Grain />

      {/* ── Header ────────────────────────────────────────────────── */}
      <header className="relative px-7" style={{ paddingTop: 64 }}>
        <div className="flex items-start justify-between">
          <div>
            <div className="label" style={{ color: "var(--ink-faint)" }}>
              Coffee Nest
            </div>
            <h1
              className="serif"
              style={{ fontSize: 46, lineHeight: 1, fontWeight: 800, color: "var(--ink)", marginTop: 8 }}
            >
              Röstereien
            </h1>
            <div className="mt-3 flex items-center gap-1.5">
              <span
                className="label flex items-center gap-1 px-3 py-1.5"
                style={{ color: "var(--cream-text)", background: "var(--espresso)", letterSpacing: "0.18em" }}
              >
                Alle
                <ChevronDown size={12} strokeWidth={2.5} />
              </span>
            </div>
          </div>
          <button
            className="flex h-12 w-12 items-center justify-center"
            style={{ background: "var(--gold)", filter: "url(#torn-4)", color: "#fff", marginTop: 6 }}
          >
            <Plus size={24} strokeWidth={2.5} />
          </button>
        </div>
        {/* hairline rule below header */}
        <div className="mt-6 h-px w-full" style={{ background: "var(--hair)" }} />
      </header>

      <main className="relative px-7 pt-7" style={{ display: "flex", flexDirection: "column", gap: 30 }}>
        {/* ── HEUTE ENTDECKT — espresso feature plane ───────────────── */}
        <Sheet tone="espresso" seed={3} contentClassName="px-6 py-6" rotate={-0.8}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Compass size={15} color="var(--gold-light)" strokeWidth={2} />
              <span className="label" style={{ color: "var(--cream-text-soft)" }}>
                Heute entdeckt
              </span>
            </div>
            <X size={14} color="var(--cream-text-faint)" />
          </div>
          <div className="mt-4 h-px w-full" style={{ background: "var(--hair-cream)" }} />
          <p
            className="serif"
            style={{ fontSize: 21, lineHeight: 1.4, color: "var(--cream-text)", marginTop: 16, fontWeight: 500 }}
          >
            Äthiopien gilt als die Wiege des Kaffees — wilde Arabica-Sträucher
            wachsen dort bis heute in den Hochlandwäldern von Kaffa.
          </p>
        </Sheet>

        {/* ── ENTDECKUNGEN — stat row, de-carded ────────────────────── */}
        <Sheet tone="cream" seed={6} contentClassName="px-6 py-6" rotate={0.7}>
          <div className="flex items-center justify-between">
            <span className="label" style={{ color: "var(--ink-faint)" }}>
              Entdeckungen
            </span>
            <ChevronRight size={16} color="var(--ink-faint)" />
          </div>
          <div className="mt-5 flex items-stretch">
            {[
              { v: 21, l: "Kaffees" },
              { v: 5, l: "Röstereien" },
              { v: 9, l: "Herkunftsländer" },
            ].map((s, i) => (
              <div key={s.l} className="flex flex-1 items-center">
                {i > 0 && <span className="h-12 w-px" style={{ background: "var(--hair)" }} />}
                <div className="flex-1 text-center">
                  <div
                    className="serif"
                    style={{ fontSize: 36, fontWeight: 800, color: "var(--ink)", lineHeight: 1 }}
                  >
                    {s.v}
                  </div>
                  <div
                    className="sans"
                    style={{ fontSize: 11, color: "var(--ink-soft)", marginTop: 6, letterSpacing: "0.02em" }}
                  >
                    {s.l}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Sheet>

        {/* ── Roastery list — torn cream blatts ─────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
          {ROASTERIES.map((r, i) => (
            <Sheet
              key={r.name}
              tone="cream"
              seed={r.seed}
              contentClassName="px-6 py-5"
              rotate={i % 2 === 0 ? -0.7 : 0.8}
            >
              <div className="flex items-start gap-4">
                <div className="min-w-0 flex-1">
                  <h2
                    className="serif"
                    style={{ fontSize: 25, fontWeight: 700, color: "var(--ink)", lineHeight: 1.1 }}
                  >
                    {r.name}
                  </h2>
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="sans" style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>
                      {r.location}
                    </span>
                    <span className="h-1 w-1 rounded-full" style={{ background: "var(--ink-faint)" }} />
                    <span className="sans" style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>
                      {r.count} {r.count === 1 ? "Kaffee" : "Kaffees"}
                    </span>
                  </div>
                  <Score hase={r.hase} dodo={r.dodo} />
                </div>
                <ChevronRight size={20} color="var(--ink-faint)" style={{ marginTop: 6 }} />
              </div>
            </Sheet>
          ))}
        </div>
      </main>
    </div>
  );
}
