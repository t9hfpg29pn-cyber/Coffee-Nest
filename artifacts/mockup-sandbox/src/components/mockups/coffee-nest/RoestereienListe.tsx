import { useState } from "react";
import { Plus, Coffee, Factory, Globe, ChevronRight, ChevronUp, X } from "lucide-react";
import { PaperCard } from "../../../PaperDefs";

type Roastery = {
  name: string;
  location: string;
  count: number;
};

const ROASTERIES: Roastery[] = [
  { name: "Herr Hase", location: "Münster", count: 6 },
  { name: "Rubiac", location: "Bremen", count: 5 },
  { name: "Roestbar", location: "Münster", count: 4 },
  { name: "Küper", location: "Heiden", count: 4 },
];

const STATS = [
  { Icon: Coffee, value: 26, label: "Kaffees" },
  { Icon: Factory, value: 7, label: "Röstereien" },
  { Icon: Globe, value: 11, label: "Herkunftsländer" },
];

const LIST_SHAPES: Array<1 | 2 | 3> = [1, 2, 3];

export function RoestereienListe() {
  const [heroOpen, setHeroOpen] = useState(true);

  return (
    <div
      className="cn-app-bg"
      style={{ minHeight: "100dvh", width: "100%", padding: "26px 20px 36px" }}
    >
      {/* ---------- Seiten-Header (direkt auf cn-app-bg, kein Papier) ---------- */}
      <header
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 14,
          marginBottom: 22,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div className="cn-eyebrow">COFFEE NEST</div>
          <h1 className="cn-display" style={{ fontSize: 32, lineHeight: 1.05, margin: "6px 0 0" }}>
            Röstereien
          </h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <button
            className="paper-chip"
            style={{ height: 44, padding: "0 18px", fontSize: 14, cursor: "pointer" }}
          >
            Alle
          </button>
          <button
            className="paper-chip"
            aria-label="Rösterei hinzufügen"
            style={{
              width: 44,
              height: 44,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <Plus strokeWidth={1.75} size={22} />
          </button>
        </div>
      </header>

      {/* ---------- Hero-Karte "Heute entdeckt" (dunkel) ---------- */}
      <div style={{ position: "relative", zIndex: 0, marginBottom: -14 }}>
        <PaperCard variant="dark" shape={1} shadow={2} style={{ padding: 22, position: "relative" }}>
          <button
            aria-label="Schließen"
            style={{
              position: "absolute",
              top: 16,
              right: 16,
              width: 30,
              height: 30,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "transparent",
              border: "none",
              cursor: "pointer",
            }}
          >
            <X className="cn-icon" strokeWidth={1.75} size={20} />
          </button>

          <div className="cn-eyebrow">HEUTE ENTDECKT</div>
          <h2 className="cn-display" style={{ fontSize: 24, margin: "8px 0 0" }}>
            Guji Highland
          </h2>
          <p
            style={{
              fontSize: 14.5,
              lineHeight: 1.55,
              margin: "10px 0 0",
              color: "var(--paper-light)",
              opacity: 0.82,
              maxWidth: "92%",
            }}
          >
            Florale Süße mit Bergamotte, reifer Aprikose und einem langen Abgang von
            dunkler Schokolade — heute frisch bei Rubiac in Bremen aufgenommen.
          </p>

          {heroOpen && (
            <button
              onClick={() => setHeroOpen(false)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginTop: 16,
                background: "transparent",
                border: "none",
                padding: 0,
                cursor: "pointer",
                color: "var(--accent-100)",
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: "0.02em",
              }}
            >
              Weniger anzeigen
              <ChevronUp className="cn-icon" strokeWidth={1.75} size={16} />
            </button>
          )}
        </PaperCard>
      </div>

      {/* ---------- Statistik-Karte "Entdeckungen" (Hero-Überlapp-Muster) ---------- */}
      <div style={{ position: "relative", zIndex: 1 }}>
        <PaperCard variant="light" shape={2} shadow={2} style={{ padding: "36px 24px 24px" }}>
          <div className="cn-eyebrow" style={{ textAlign: "center" }}>
            ENTDECKUNGEN
          </div>
          <div style={{ display: "flex", marginTop: 18 }}>
            {STATS.map(({ Icon, value, label }, i) => (
              <div
                key={label}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 7,
                  padding: "0 6px",
                  borderLeft: i === 0 ? "none" : "1px solid rgba(74,38,22,0.18)",
                }}
              >
                <Icon className="cn-icon" strokeWidth={1.75} size={22} />
                <div className="cn-display" style={{ fontSize: 30, lineHeight: 1 }}>
                  {value}
                </div>
                <div style={{ fontSize: 12, color: "var(--coffee-600)", textAlign: "center" }}>
                  {label}
                </div>
              </div>
            ))}
          </div>
        </PaperCard>
      </div>

      {/* ---------- Rösterei-Liste ---------- */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 16 }}>
        {ROASTERIES.map((r, i) => (
          <PaperCard
            key={r.name}
            variant="light"
            shape={LIST_SHAPES[i % LIST_SHAPES.length]}
            shadow={1}
            style={{ padding: 20, display: "flex", alignItems: "center", gap: 16, cursor: "pointer" }}
          >
            <PaperCard variant="tile" shadow={0} style={{ width: 52, height: 52, flexShrink: 0 }}>
              <Coffee className="cn-icon" strokeWidth={1.75} size={24} />
            </PaperCard>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                className="cn-display"
                style={{
                  fontSize: 20,
                  lineHeight: 1.15,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {r.name}
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: "var(--coffee-600)",
                  marginTop: 3,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {r.location} · {r.count} {r.count === 1 ? "Kaffee" : "Kaffees"}
              </div>
            </div>

            <ChevronRight className="cn-icon" strokeWidth={1.75} size={20} style={{ flexShrink: 0 }} />
          </PaperCard>
        ))}
      </div>
    </div>
  );
}
