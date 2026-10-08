import { Circle, CircleMarker, Marker, Polyline, Tooltip } from "react-leaflet";
import { CniiMap, dotIcon } from "@/components/cnii/CniiMap";
import {
  INCIDENT_TYPE_COLOR, INCIDENT_TYPE_LABEL, MODUS_LABEL, fmtDate,
  type Corridor, type GeoPoint, type Hotspot, type Incident, type RiskCell, type StateCommand, type ThreatPrediction,
} from "@/lib/cnii";
import { riskColor } from "../national/layers";

interface ThreatMapProps {
  riskCells: RiskCell[];
  stateCommands: StateCommand[];
  corridors: Corridor[];
  hotspots: Hotspot[];
  incidents: Incident[];
  predictions: ThreatPrediction[];
  selectedId: string | null;
  selectedState: string;
  selectedCorridor: string;
  fitTo: GeoPoint[];
  onState: (state: string) => void;
  onCorridor: (id: string) => void;
  onFocus: (id: string) => void;
}

const TREND_ARROW = { rising: "▲ rising", stable: "■ stable", falling: "▼ falling" } as const;

export function ThreatMap(p: ThreatMapProps) {
  const scLoc = new Map(p.stateCommands.map((s) => [s.state, s.location]));
  return (
    <CniiMap height={520} fitTo={p.fitTo} overlay={<RiskKey />}>
      {p.riskCells.map((c) => {
        const loc = scLoc.get(c.state);
        if (!loc) return null;
        const sel = p.selectedState === c.state;
        return (
          <Circle key={c.state} center={[loc.lat, loc.lng]} radius={12_000 + c.risk * 650}
            pathOptions={{ color: riskColor(c.risk), weight: sel ? 3 : 1, fillOpacity: 0.08 + (c.risk / 100) * 0.35, opacity: sel ? 1 : 0.7 }}
            eventHandlers={{ click: () => p.onState(sel ? "" : c.state) }}>
            <Tooltip className="cnii-tip" sticky>
              <b>{c.state}</b> · {c.zone}<br />
              Risk index <b style={{ color: riskColor(c.risk) }}>{c.risk}/100</b> · {c.incidents90d} incidents (90d)<br />
              Most affected operator: {c.topOperator}<br />
              Dominant modus: {MODUS_LABEL[c.topModus]}<br />
              <span style={{ opacity: 0.7 }}>Click to {sel ? "clear" : "filter to"} state</span>
            </Tooltip>
          </Circle>
        );
      })}

      {p.corridors.map((c) => {
        const sel = p.selectedCorridor === c.id;
        return (
          <Polyline key={c.id} positions={c.path.map((g) => [g.lat, g.lng])}
            pathOptions={{ color: riskColor(c.risk), weight: sel ? 7 : 4, opacity: sel ? 1 : 0.8, dashArray: c.trend === "rising" ? undefined : "8 6" }}
            eventHandlers={{ click: () => p.onCorridor(sel ? "" : c.id) }}>
            <Tooltip className="cnii-tip" sticky>
              <b>{c.name}</b><br />Corridor risk {c.risk}/100 · {TREND_ARROW[c.trend]}
            </Tooltip>
          </Polyline>
        );
      })}

      {p.hotspots.map((h) => {
        const sel = p.selectedId === h.id;
        return (
          <Circle key={h.id} center={[h.location.lat, h.location.lng]} radius={h.radiusKm * 1000}
            pathOptions={{ color: INCIDENT_TYPE_COLOR[h.dominantType], weight: sel ? 3 : 1.5, dashArray: "4 4", fillOpacity: sel ? 0.3 : 0.15 }}
            eventHandlers={{ click: () => p.onFocus(h.id) }}>
            <Tooltip className="cnii-tip" sticky>
              <b>Hotspot · {h.name}</b><br />{h.incidents90d} incidents (90d) · {h.radiusKm} km radius<br />Dominant: {INCIDENT_TYPE_LABEL[h.dominantType]}
            </Tooltip>
          </Circle>
        );
      })}

      {p.incidents.map((i) => (
        <CircleMarker key={i.id} center={[i.location.lat, i.location.lng]} radius={3} pathOptions={{ color: INCIDENT_TYPE_COLOR[i.type], weight: 1, fillOpacity: 0.7 }}>
          <Tooltip className="cnii-tip">
            <b>{i.id}</b> · {INCIDENT_TYPE_LABEL[i.type]}<br />{i.lga}, {i.state} · {i.operator}<br />{fmtDate(i.detectedAt)}
          </Tooltip>
        </CircleMarker>
      ))}

      {p.predictions.map((pr) => {
        const sel = p.selectedId === pr.id;
        return (
          <Marker key={pr.id} position={[pr.location.lat, pr.location.lng]} zIndexOffset={1000}
            icon={dotIcon(sel ? "#facc15" : "#e879f9", { size: sel ? 16 : 12, shape: "diamond", pulse: sel, label: pr.id })}
            eventHandlers={{ click: () => p.onFocus(pr.id) }}>
            <Tooltip className="cnii-tip" direction="top" offset={[0, -8]}>
              <b>{pr.headline}</b><br />{pr.region} · confidence {Math.round(pr.confidence * 100)}%<br />
              <span style={{ opacity: 0.7 }}>Risk-based prediction — not a determination</span>
            </Tooltip>
          </Marker>
        );
      })}
    </CniiMap>
  );
}

function RiskKey() {
  return (
    <div className="absolute bottom-2 left-2 z-[500] rounded-md border border-primary/25 bg-card/90 backdrop-blur px-2.5 py-2 text-[10px] space-y-1">
      <p className="text-[9px] uppercase tracking-[0.14em] text-primary">Threat key</p>
      <div className="flex gap-2 text-muted-foreground">
        {[["#ef4444", "≥80"], ["#f97316", "65+"], ["#eab308", "50+"], ["#22c55e", "<50"]].map(([c, t]) => (
          <span key={t} className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full" style={{ background: `${c}66`, border: `1px solid ${c}` }} />{t}</span>
        ))}
      </div>
      <p className="text-muted-foreground"><span className="inline-block h-2 w-2 rotate-45 bg-fuchsia-400 mr-1.5" />Prediction · <span className="inline-block h-0.5 w-3 bg-orange-500 align-middle mr-1" />Corridor (solid = rising)</p>
      <p className="text-muted-foreground">Circles = state risk index · dashed rings = hotspots</p>
    </div>
  );
}
