import { useState } from "react";
import { Layers, ChevronDown, ChevronUp } from "lucide-react";
import { LAYERS, type LayerDef, type LayerKey } from "./layers";

interface LayerPanelProps {
  enabled: Record<LayerKey, boolean>;
  counts: Record<LayerKey, number>;
  onToggle: (key: LayerKey) => void;
  onAll: (on: boolean) => void;
  unitKey: { label: string; color: string }[];
}

/** Collapsible map overlay: layer toggles with counts and a colour key. */
export function LayerPanel({ enabled, counts, onToggle, onAll, unitKey }: LayerPanelProps) {
  const [open, setOpen] = useState(true);
  const groups = ["Incidents", "Response", "Intelligence"] as const;
  return (
    <div className="absolute top-2 left-2 z-[500] w-[210px] rounded-md border border-primary/25 bg-card/90 backdrop-blur text-[11px] shadow-lg">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-1.5 px-2.5 py-1.5 text-[9px] uppercase tracking-[0.14em] text-primary">
        <Layers className="h-3.5 w-3.5" /> Map layers
        {open ? <ChevronUp className="ml-auto h-3.5 w-3.5" /> : <ChevronDown className="ml-auto h-3.5 w-3.5" />}
      </button>
      {open && (
        <div className="max-h-[400px] overflow-y-auto border-t border-primary/15 px-2.5 py-2 space-y-2">
          <div className="flex gap-2 text-[9px] uppercase tracking-wider">
            <button onClick={() => onAll(true)} className="text-muted-foreground hover:text-primary">All on</button>
            <span className="text-muted-foreground/40">·</span>
            <button onClick={() => onAll(false)} className="text-muted-foreground hover:text-primary">All off</button>
          </div>
          {groups.map((g) => (
            <div key={g}>
              <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground mb-1">{g}</p>
              {LAYERS.filter((l) => l.group === g).map((l) => (
                <div key={l.key}>
                  <label className="flex items-center gap-2 py-0.5 cursor-pointer hover:text-foreground">
                    <input type="checkbox" checked={enabled[l.key]} onChange={() => onToggle(l.key)} className="h-3 w-3 accent-[hsl(var(--primary))]" />
                    <Swatch layer={l} />
                    <span className={`truncate ${enabled[l.key] ? "text-foreground" : "text-muted-foreground"}`}>{l.label}</span>
                    <span className="ml-auto font-mono tabular-nums text-muted-foreground">{counts[l.key]}</span>
                  </label>
                  {l.key === "units" && enabled.units && (
                    <div className="ml-5 mb-1 grid grid-cols-2 gap-x-2 gap-y-0.5">
                      {unitKey.map((u) => (
                        <span key={u.label} className="flex items-center gap-1 text-[9px] text-muted-foreground truncate">
                          <span className="h-2 w-2 rounded-[2px] shrink-0" style={{ background: u.color }} />
                          {u.label}
                        </span>
                      ))}
                    </div>
                  )}
                  {l.key === "corridors" && enabled.corridors && (
                    <div className="ml-5 mb-1 flex gap-2 text-[9px] text-muted-foreground">
                      {[["#ef4444", "≥80"], ["#f97316", "65+"], ["#eab308", "50+"], ["#22c55e", "<50"]].map(([c, t]) => (
                        <span key={t} className="flex items-center gap-1"><span className="h-0.5 w-3" style={{ background: c }} />{t}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
          <p className="text-[9px] text-muted-foreground border-t border-primary/10 pt-1.5">
            Pulsing marker = critical active incident. Operator sites shown only where an incident is recorded.
          </p>
        </div>
      )}
    </div>
  );
}

function Swatch({ layer }: { layer: LayerDef }) {
  const c = layer.color;
  switch (layer.swatch) {
    case "square":
      return <span className="h-2.5 w-2.5 rounded-[2px] shrink-0" style={{ background: c }} />;
    case "diamond":
      return <span className="h-2 w-2 rotate-45 shrink-0" style={{ background: c }} />;
    case "ring":
      return <span className="h-2.5 w-2.5 rounded-full border-2 shrink-0" style={{ borderColor: c, background: `${c}33` }} />;
    case "line":
      return <span className="h-0.5 w-3 shrink-0" style={{ background: c }} />;
    default:
      return <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: c, boxShadow: `0 0 6px ${c}` }} />;
  }
}
