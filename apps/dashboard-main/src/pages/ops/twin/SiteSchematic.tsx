import { useState, type ReactNode } from "react";
import { ASSET_STATUS_COLOR, type AssetKind, type AssetStatus, type SiteAsset } from "@/lib/ops";

export const ASSET_STATUS_LABEL: Record<AssetStatus, string> = {
  healthy: "Healthy", warning: "Warning", tamper: "Tamper", offline: "Offline", intrusion: "Intrusion", maintenance: "Maintenance",
};

/** Anchor point (for the alarm ring and the hover card) per asset. */
const ANCHOR: Record<AssetKind, [number, number]> = {
  tower: [260, 140], generator: [105, 227], battery: [360, 265], diesel: [105, 282], solar: [125, 95],
  shelter: [375, 200], feeder: [305, 140], gate: [260, 312], cabinet: [450, 210], itips: [458, 70],
};

interface ShapeProps { color: string }

/** Stylised SVG drawing of each asset. */
const SHAPES: Record<AssetKind, (p: ShapeProps) => ReactNode> = {
  tower: ({ color }) => (
    <g stroke={color} strokeWidth={2} fill="none">
      <path d="M232 232 L255 44 M288 232 L265 44 M255 44 L265 44" />
      {[200, 168, 136, 104, 72].map((y, i) => {
        const half = 6 + (y - 44) * (23 / 188);
        const next = 6 + (y - 32 - 44) * (23 / 188);
        return <path key={i} d={`M${260 - half} ${y} L${260 + next} ${y - 32} M${260 + half} ${y} L${260 - next} ${y - 32} M${260 - half} ${y} L${260 + half} ${y}`} strokeWidth={1} opacity={0.75} />;
      })}
      <rect x={244} y={50} width={6} height={18} fill={color} fillOpacity={0.5} />
      <rect x={270} y={50} width={6} height={18} fill={color} fillOpacity={0.5} />
      <circle cx={260} cy={38} r={3} fill="#ef4444" stroke="none" className="animate-blink" />
      <rect x={226} y={230} width={68} height={6} fill={color} fillOpacity={0.3} />
    </g>
  ),
  generator: ({ color }) => (
    <g>
      <rect x={60} y={200} width={90} height={55} rx={4} fill={color} fillOpacity={0.18} stroke={color} strokeWidth={2} />
      {[0, 1, 2, 3, 4].map((i) => <line key={i} x1={70 + i * 8} y1={210} x2={70 + i * 8} y2={245} stroke={color} strokeOpacity={0.6} />)}
      <circle cx={125} cy={227} r={12} fill="none" stroke={color} strokeWidth={1.5} />
      <path d="M119 227 L125 220 L125 234 L131 227" stroke={color} fill="none" />
    </g>
  ),
  battery: ({ color }) => (
    <g>
      <rect x={330} y={245} width={60} height={42} rx={3} fill={color} fillOpacity={0.18} stroke={color} strokeWidth={2} />
      {[0, 1, 2, 3].map((i) => <rect key={i} x={336 + i * 13} y={252} width={9} height={28} rx={1} fill={color} fillOpacity={0.5} />)}
    </g>
  ),
  diesel: ({ color }) => (
    <g>
      <rect x={60} y={266} width={90} height={32} rx={16} fill={color} fillOpacity={0.18} stroke={color} strokeWidth={2} />
      <line x1={80} y1={266} x2={80} y2={298} stroke={color} strokeOpacity={0.5} />
      <line x1={130} y1={266} x2={130} y2={298} stroke={color} strokeOpacity={0.5} />
      <rect x={100} y={260} width={10} height={6} fill={color} />
    </g>
  ),
  solar: ({ color }) => (
    <g>
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <path d={`M${50 + i * 50} 120 L${70 + i * 50} 70 L${110 + i * 50} 70 L${90 + i * 50} 120 Z`} fill={color} fillOpacity={0.2} stroke={color} strokeWidth={1.5} />
          <path d={`M${60 + i * 50} 95 L${100 + i * 50} 95 M${80 + i * 50} 70 L${70 + i * 50} 120`} stroke={color} strokeOpacity={0.5} />
        </g>
      ))}
    </g>
  ),
  shelter: ({ color }) => (
    <g>
      <rect x={330} y={170} width={90} height={62} rx={3} fill={color} fillOpacity={0.15} stroke={color} strokeWidth={2} />
      <path d="M326 170 L375 156 L424 170" fill="none" stroke={color} strokeWidth={2} />
      <rect x={366} y={198} width={18} height={34} fill={color} fillOpacity={0.35} />
    </g>
  ),
  feeder: ({ color }) => (
    <g fill="none" stroke={color} strokeWidth={3} strokeLinecap="round">
      <path d="M340 172 C 330 120, 300 100, 272 80" />
      <path d="M350 172 C 345 115, 310 120, 272 120" strokeOpacity={0.7} strokeWidth={2} />
    </g>
  ),
  gate: ({ color }) => (
    <g stroke={color} strokeWidth={2.5}>
      <rect x={226} y={304} width={32} height={14} fill={color} fillOpacity={0.2} />
      <rect x={262} y={304} width={32} height={14} fill={color} fillOpacity={0.2} />
      {[0, 1, 2].map((i) => <line key={i} x1={234 + i * 8} y1={304} x2={234 + i * 8} y2={318} strokeWidth={1} />)}
      {[0, 1, 2].map((i) => <line key={`r${i}`} x1={270 + i * 8} y1={304} x2={270 + i * 8} y2={318} strokeWidth={1} />)}
    </g>
  ),
  cabinet: ({ color }) => (
    <g>
      <rect x={432} y={188} width={36} height={46} rx={2} fill={color} fillOpacity={0.2} stroke={color} strokeWidth={2} />
      <line x1={450} y1={190} x2={450} y2={232} stroke={color} strokeOpacity={0.6} />
      <circle cx={445} cy={211} r={2} fill={color} />
      <circle cx={455} cy={211} r={2} fill={color} />
    </g>
  ),
  itips: ({ color }) => (
    <g stroke={color} strokeWidth={2}>
      <line x1={458} y1={160} x2={458} y2={52} />
      <rect x={444} y={56} width={22} height={11} rx={2} fill={color} fillOpacity={0.4} />
      <path d="M466 61 L474 58 L474 65 Z" fill={color} />
      <path d="M447 86 A 11 11 0 0 1 469 86 Z" fill={color} fillOpacity={0.35} />
      <rect x={448} y={120} width={20} height={26} rx={2} fill={color} fillOpacity={0.25} />
      <text x={458} y={137} textAnchor="middle" fontSize={7} fill={color} stroke="none" fontFamily="monospace">AI</text>
    </g>
  ),
};

const DRAW_ORDER: AssetKind[] = ["solar", "generator", "diesel", "tower", "feeder", "shelter", "battery", "cabinet", "itips", "gate"];

interface SiteSchematicProps {
  assets: SiteAsset[];
  selected: AssetKind | null;
  onSelect: (kind: AssetKind | null) => void;
}

/** Live site schematic: every asset coloured by its status; intrusion/tamper pulse. */
export function SiteSchematic({ assets, selected, onSelect }: SiteSchematicProps) {
  const [hover, setHover] = useState<AssetKind | null>(null);
  const byKind = new Map(assets.map((a) => [a.kind, a]));
  const focus = hover ?? selected;
  const focusAsset = focus ? byKind.get(focus) : undefined;

  return (
    <div className="relative">
      <svg viewBox="0 0 520 340" className="w-full h-auto select-none" role="img" aria-label="Site schematic">
        <defs>
          <pattern id="twin-grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M20 0 L0 0 0 20" fill="none" stroke="hsl(var(--primary))" strokeOpacity={0.07} />
          </pattern>
        </defs>
        <rect x={0} y={0} width={520} height={340} fill="url(#twin-grid)" />
        {/* perimeter fence */}
        <path d="M226 311 L20 311 L20 20 L500 20 L500 311 L294 311" fill="none" stroke="hsl(var(--primary))" strokeOpacity={0.45} strokeWidth={1.5} strokeDasharray="6 4" />
        <text x={26} y={34} fontSize={8} fill="hsl(var(--muted-foreground))" fontFamily="monospace">PERIMETER FENCE · N</text>

        {DRAW_ORDER.map((kind) => {
          const asset = byKind.get(kind);
          if (!asset) return null;
          const color = ASSET_STATUS_COLOR[asset.status];
          const alarm = asset.status === "intrusion" || asset.status === "tamper";
          const [ax, ay] = ANCHOR[kind];
          const isFocus = focus === kind;
          return (
            <g key={kind} className="cursor-pointer" onMouseEnter={() => setHover(kind)} onMouseLeave={() => setHover(null)}
              onClick={() => onSelect(selected === kind ? null : kind)}
              style={{ filter: isFocus ? `drop-shadow(0 0 6px ${color})` : alarm ? `drop-shadow(0 0 4px ${color})` : undefined }}>
              {alarm && (
                <circle cx={ax} cy={ay} r={14} fill="none" stroke={color} strokeWidth={2}>
                  <animate attributeName="r" values="12;34" dur="1.4s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.9;0" dur="1.4s" repeatCount="indefinite" />
                </circle>
              )}
              {SHAPES[kind]({ color })}
              {/* generous invisible hit area */}
              <circle cx={ax} cy={ay} r={24} fill="transparent" />
            </g>
          );
        })}

        {DRAW_ORDER.map((kind) => {
          const asset = byKind.get(kind);
          if (!asset) return null;
          const [ax, ay] = ANCHOR[kind];
          const below = kind === "gate" ? -14 : kind === "itips" ? -26 : 30;
          return (
            <text key={`l-${kind}`} x={kind === "feeder" ? ax + 18 : ax} y={kind === "feeder" ? ay - 30 : ay + below} textAnchor="middle" fontSize={8}
              fill={ASSET_STATUS_COLOR[asset.status]} fontFamily="monospace" className="pointer-events-none uppercase">
              {asset.label}
            </text>
          );
        })}
      </svg>

      {focusAsset && (
        <div className="pointer-events-none absolute left-2 bottom-2 max-w-[70%] rounded-md border bg-card/95 px-3 py-2 backdrop-blur"
          style={{ borderColor: `${ASSET_STATUS_COLOR[focusAsset.status]}88` }}>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full" style={{ background: ASSET_STATUS_COLOR[focusAsset.status] }} />
            <span className="text-[12px] font-semibold text-foreground">{focusAsset.label}</span>
            <span className="text-[10px] font-mono uppercase" style={{ color: ASSET_STATUS_COLOR[focusAsset.status] }}>{ASSET_STATUS_LABEL[focusAsset.status]}</span>
          </div>
          <p className="text-[11px] text-muted-foreground">{focusAsset.detail}</p>
          {focusAsset.lastEvent && <p className="text-[10px] font-mono text-warning">{focusAsset.lastEvent}</p>}
        </div>
      )}

      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
        {(Object.keys(ASSET_STATUS_LABEL) as AssetStatus[]).map((s) => (
          <span key={s} className="flex items-center gap-1 text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
            <span className="h-2 w-2 rounded-full" style={{ background: ASSET_STATUS_COLOR[s] }} />{ASSET_STATUS_LABEL[s]}
          </span>
        ))}
      </div>
    </div>
  );
}
