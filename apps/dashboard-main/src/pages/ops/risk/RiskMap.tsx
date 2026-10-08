import { memo } from "react";
import { CircleMarker, Tooltip } from "react-leaflet";
import { OpsMap } from "@/components/ops/OpsMap";
import type { SiteSummary } from "@/lib/ops";
import { BANDS, BAND_COLOR, BAND_RANGE, bandOf, type Band } from "./riskUtils";

interface RiskMapProps {
  sites: SiteSummary[];
  selectedId: string | null;
  hidden: Set<Band>;
  onSelect: (id: string) => void;
  onToggleBand: (b: Band) => void;
}

const Markers = memo(function Markers({ sites, hidden, onSelect }: { sites: SiteSummary[]; hidden: Set<Band>; onSelect: (id: string) => void }) {
  // Draw low bands first so critical sites sit on top
  const ordered = [...sites].sort((a, b) => a.riskScore - b.riskScore);
  return (
    <>
      {ordered.map((s) => {
        const band = bandOf(s.riskScore);
        if (hidden.has(band)) return null;
        const c = BAND_COLOR[band];
        const hot = band === "Critical" || band === "High";
        return (
          <CircleMarker key={s.id} center={[s.location.lat, s.location.lng]} radius={hot ? 5 : 3}
            pathOptions={{ color: c, fillColor: c, fillOpacity: hot ? 0.9 : 0.55, weight: hot ? 1.5 : 0.5 }}
            eventHandlers={{ click: () => onSelect(s.id) }}>
            <Tooltip className="cnii-tip">{s.id} · {s.name}<br />Risk {s.riskScore} ({band}) · {s.state}</Tooltip>
          </CircleMarker>
        );
      })}
    </>
  );
});

/** Estate risk map: every site coloured by its 72 h risk band. */
export function RiskMap({ sites, selectedId, hidden, onSelect, onToggleBand }: RiskMapProps) {
  const sel = selectedId ? sites.find((s) => s.id === selectedId) : undefined;
  return (
    <OpsMap height={460} defaultTiles="dark"
      overlay={(
        <div className="absolute bottom-2 left-2 z-[500] rounded-md border border-primary/25 bg-card/85 p-1.5 backdrop-blur">
          {BANDS.map((b) => (
            <button key={b} onClick={() => onToggleBand(b)} className={`flex w-full items-center gap-1.5 px-1 py-0.5 text-[10px] ${hidden.has(b) ? "opacity-40" : ""}`}>
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: BAND_COLOR[b] }} />
              <span className="text-foreground">{b}</span>
              <span className="ml-auto pl-2 font-mono text-muted-foreground">{BAND_RANGE[b]}</span>
            </button>
          ))}
        </div>
      )}>
      <Markers sites={sites} hidden={hidden} onSelect={onSelect} />
      {sel && (
        <CircleMarker center={[sel.location.lat, sel.location.lng]} radius={11} pathOptions={{ color: "#06b6d4", weight: 2.5, fillOpacity: 0 }} />
      )}
    </OpsMap>
  );
}
