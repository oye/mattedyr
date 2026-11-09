/** The pet, drawn as SVG. It grows through five stages and is never sad – at most sleepy. */
import type { Mood, PetStage } from "../engine/rewards";
import type { ItemSlot } from "../shop";
import type { PetColor } from "../store";

const PALETTE: Record<PetColor, { main: string; dark: string; belly: string }> = {
  lilla: { main: "#8b6cff", dark: "#5b3fd6", belly: "#e2d9ff" },
  gronn: { main: "#4cc38a", dark: "#2b8a5e", belly: "#d3f5e3" },
  bla: { main: "#4aa8ff", dark: "#2a6fd0", belly: "#d6ebff" },
  oransje: { main: "#ff9f43", dark: "#d9741a", belly: "#ffe7cc" },
  rosa: { main: "#ff7eb6", dark: "#d94f8c", belly: "#ffdcec" },
};

export const PET_COLORS = Object.keys(PALETTE) as PetColor[];
export const PET_COLOR_HEX: Record<PetColor, string> = Object.fromEntries(
  PET_COLORS.map((c) => [c, PALETTE[c].main]),
) as Record<PetColor, string>;

const STAGE_SCALE: Record<PetStage["key"], number> = { egg: 1, baby: 0.68, barn: 0.8, ungdom: 0.9, voksen: 1 };

interface Props {
  stage: PetStage["key"];
  mood: Mood;
  color: PetColor;
  equipped?: Partial<Record<ItemSlot, string>>;
  /** 0–1: how close the egg is to hatching (cracks appear). */
  hatchProgress?: number;
  size?: number;
  className?: string;
  onClick?: () => void;
}

export function Pet({ stage, mood, color, equipped = {}, hatchProgress = 0, size = 200, className, onClick }: Props) {
  const c = PALETTE[color];
  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      className={`pet ${className ?? ""}`}
      onClick={onClick}
      role="img"
      aria-label="Kjæledyret ditt"
    >
      <ellipse cx="100" cy="190" rx={stage === "egg" ? 46 : 30 + 30 * STAGE_SCALE[stage]} ry="7" fill="rgba(0,0,0,0.18)" />
      {stage === "egg" ? (
        <Egg c={c} hatchProgress={hatchProgress} />
      ) : (
        <g transform={`translate(100 190) scale(${STAGE_SCALE[stage]}) translate(-100 -190)`}>
          <g className="pet-body">
            <Creature c={c} stage={stage} mood={mood} />
            {equipped.neck && <Accessory item={equipped.neck} />}
            {equipped.face && <Accessory item={equipped.face} />}
            {equipped.head && <Accessory item={equipped.head} />}
          </g>
        </g>
      )}
      {mood === "sovnig" && (
        <g className="pet-zzz" fill="#fff" fontWeight="800" fontFamily="inherit">
          <text x="150" y="60" fontSize="22">Z</text>
          <text x="168" y="40" fontSize="16">z</text>
          <text x="180" y="24" fontSize="12">z</text>
        </g>
      )}
    </svg>
  );
}

type Colors = (typeof PALETTE)[PetColor];

function Egg({ c, hatchProgress }: { c: Colors; hatchProgress: number }) {
  return (
    <g className="pet-egg">
      <path d="M100 52 C 140 52 158 112 156 140 C 154 172 130 188 100 188 C 70 188 46 172 44 140 C 42 112 60 52 100 52 Z" fill={c.belly} />
      <path d="M100 52 C 140 52 158 112 156 140 C 154 172 130 188 100 188" fill="none" stroke={c.main} strokeOpacity="0.25" strokeWidth="10" />
      <circle cx="80" cy="100" r="9" fill={c.main} />
      <circle cx="122" cy="88" r="6" fill={c.main} />
      <circle cx="128" cy="140" r="11" fill={c.main} />
      <circle cx="72" cy="150" r="7" fill={c.main} />
      <circle cx="100" cy="124" r="5" fill={c.main} />
      <ellipse cx="78" cy="78" rx="8" ry="13" fill="#fff" opacity="0.6" transform="rotate(25 78 78)" />
      {hatchProgress > 0.35 && (
        <path d="M70 118 l10 -8 l8 10 l10 -10" fill="none" stroke={c.dark} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      )}
      {hatchProgress > 0.7 && (
        <path d="M98 110 l9 9 l9 -9 l10 8 l8 -6" fill="none" stroke={c.dark} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </g>
  );
}

function Creature({ c, stage, mood }: { c: Colors; stage: PetStage["key"]; mood: Mood }) {
  const grown = stage !== "baby";
  const teen = stage === "ungdom" || stage === "voksen";
  const adult = stage === "voksen";
  return (
    <>
      {teen && (
        <g className="pet-wings" fill={c.belly} stroke={c.main} strokeWidth="4">
          <path d={adult ? "M48 110 C 8 70 0 130 22 150 C 30 140 40 140 48 132 Z" : "M48 114 C 24 92 18 132 32 144 C 38 138 44 136 50 132 Z"} />
          <path d={adult ? "M152 110 C 192 70 200 130 178 150 C 170 140 160 140 152 132 Z" : "M152 114 C 176 92 182 132 168 144 C 162 138 156 136 150 132 Z"} />
        </g>
      )}
      {teen && <path d="M150 160 C 182 162 186 132 170 126 C 160 122 156 134 166 138" fill="none" stroke={c.main} strokeWidth="10" strokeLinecap="round" />}
      {grown && (
        <g fill={c.main}>
          <path d="M56 92 L 52 44 L 90 72 Z" />
          <path d="M144 92 L 148 44 L 110 72 Z" />
          <path d="M60 80 L 57 56 L 76 70 Z" fill={c.belly} />
          <path d="M140 80 L 143 56 L 124 70 Z" fill={c.belly} />
        </g>
      )}
      {adult && (
        <g>
          <line x1="100" y1="70" x2="100" y2="46" stroke={c.dark} strokeWidth="4" strokeLinecap="round" />
          <path d="M100 30 l4 8 l9 1 l-7 6 l2 9 l-8 -5 l-8 5 l2 -9 l-7 -6 l9 -1 Z" fill="#ffd93b" />
        </g>
      )}
      <ellipse cx="74" cy="182" rx="17" ry="9" fill={c.dark} />
      <ellipse cx="126" cy="182" rx="17" ry="9" fill={c.dark} />
      <ellipse cx="100" cy="125" rx="62" ry="58" fill={c.main} />
      <ellipse cx="100" cy="146" rx="38" ry="30" fill={c.belly} />
      <ellipse cx="42" cy="138" rx="10" ry="16" fill={c.main} transform="rotate(20 42 138)" />
      <ellipse cx="158" cy="138" rx="10" ry="16" fill={c.main} transform="rotate(-20 158 138)" />
      <ellipse cx="66" cy="128" rx="9" ry="6" fill="#ff6f91" opacity="0.45" />
      <ellipse cx="134" cy="128" rx="9" ry="6" fill="#ff6f91" opacity="0.45" />
      <Face mood={mood} />
    </>
  );
}

function Face({ mood }: { mood: Mood }) {
  const eyeStroke = { fill: "none", stroke: "#2a1e4a", strokeWidth: 5, strokeLinecap: "round" as const };
  return (
    <g>
      {mood === "glad" ? (
        <>
          <path d="M70 114 Q 80 102 90 114" {...eyeStroke} />
          <path d="M110 114 Q 120 102 130 114" {...eyeStroke} />
        </>
      ) : mood === "sovnig" ? (
        <>
          <path d="M70 110 Q 80 118 90 110" {...eyeStroke} />
          <path d="M110 110 Q 120 118 130 110" {...eyeStroke} />
        </>
      ) : (
        <g className="pet-eyes">
          <circle cx="80" cy="110" r="12" fill="#fff" />
          <circle cx="120" cy="110" r="12" fill="#fff" />
          <circle cx="82" cy="112" r="7" fill="#2a1e4a" />
          <circle cx="122" cy="112" r="7" fill="#2a1e4a" />
          <circle cx="84.5" cy="109" r="2.5" fill="#fff" />
          <circle cx="124.5" cy="109" r="2.5" fill="#fff" />
        </g>
      )}
      {mood === "glad" && (
        <g>
          <path d="M86 130 Q 100 150 114 130 Z" fill="#6b2140" />
          <path d="M93 138 Q 100 146 107 138 Q 100 134 93 138 Z" fill="#ff7a9a" />
        </g>
      )}
      {mood === "fornoyd" && <path d="M90 132 Q 100 141 110 132" fill="none" stroke="#2a1e4a" strokeWidth="4" strokeLinecap="round" />}
      {mood === "sulten" && <ellipse cx="100" cy="136" rx="6" ry="7" fill="#6b2140" />}
      {mood === "sovnig" && <path d="M94 136 Q 100 139 106 136" fill="none" stroke="#2a1e4a" strokeWidth="3.5" strokeLinecap="round" />}
    </g>
  );
}

function Accessory({ item }: { item: string }) {
  switch (item) {
    case "lue":
      return (
        <g>
          <path d="M54 84 Q 100 18 146 84 Z" fill="#e74c3c" />
          <rect x="50" y="76" width="100" height="16" rx="8" fill="#c0392b" />
          <circle cx="100" cy="40" r="11" fill="#fff" />
        </g>
      );
    case "caps":
      return (
        <g>
          <path d="M60 82 Q 100 30 140 82 Z" fill="#2f80ed" />
          <path d="M120 80 Q 160 72 178 84 Q 150 90 120 88 Z" fill="#1c5fc0" />
          <circle cx="100" cy="50" r="5" fill="#1c5fc0" />
        </g>
      );
    case "tryllehatt":
      return (
        <g>
          <ellipse cx="100" cy="74" rx="46" ry="10" fill="#2d2350" />
          <rect x="72" y="14" width="56" height="62" rx="6" fill="#2d2350" />
          <rect x="72" y="58" width="56" height="10" fill="#e74c3c" />
          <path d="M92 30 l3 6 l7 1 l-5 5 l1 7 l-6 -3 l-6 3 l1 -7 l-5 -5 l7 -1 Z" fill="#ffd93b" />
        </g>
      );
    case "krone":
      return (
        <g>
          <path d="M64 80 L 60 40 L 80 60 L 100 32 L 120 60 L 140 40 L 136 80 Z" fill="#ffd93b" stroke="#e0a800" strokeWidth="3" strokeLinejoin="round" />
          <circle cx="100" cy="66" r="6" fill="#e74c3c" />
          <circle cx="78" cy="70" r="4" fill="#2f80ed" />
          <circle cx="122" cy="70" r="4" fill="#2f80ed" />
        </g>
      );
    case "briller":
      return (
        <g fill="rgba(255,255,255,0.25)" stroke="#2a1e4a" strokeWidth="4">
          <circle cx="80" cy="111" r="16" />
          <circle cx="120" cy="111" r="16" />
          <path d="M96 109 Q 100 104 104 109" fill="none" />
        </g>
      );
    case "solbriller":
      return (
        <g>
          <rect x="62" y="100" width="34" height="22" rx="9" fill="#1d1d2b" />
          <rect x="104" y="100" width="34" height="22" rx="9" fill="#1d1d2b" />
          <rect x="94" y="106" width="12" height="4" fill="#1d1d2b" />
          <path d="M68 106 l10 0" stroke="#fff" strokeOpacity="0.6" strokeWidth="3" strokeLinecap="round" />
          <path d="M110 106 l10 0" stroke="#fff" strokeOpacity="0.6" strokeWidth="3" strokeLinecap="round" />
        </g>
      );
    case "sloyfe":
      return (
        <g>
          <path d="M100 160 L 76 148 L 76 172 Z" fill="#ff4d8d" />
          <path d="M100 160 L 124 148 L 124 172 Z" fill="#ff4d8d" />
          <circle cx="100" cy="160" r="7" fill="#d6336c" />
        </g>
      );
    case "skjerf":
      return (
        <g>
          <path d="M44 142 Q 100 168 156 142 L 154 158 Q 100 182 46 158 Z" fill="#27ae60" />
          <path d="M120 160 L 134 160 L 138 192 L 122 192 Z" fill="#1e8449" />
          <path d="M60 150 l0 12 M80 156 l0 12 M100 158 l0 12 M120 156 l0 12 M140 150 l0 12" stroke="#1e8449" strokeWidth="3" />
        </g>
      );
    default:
      return null;
  }
}
