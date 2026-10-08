import { Marker, Polyline, Tooltip } from "react-leaflet";
import { CniiMap, dotIcon } from "@/components/cnii/CniiMap";
import {
  INCIDENT_TYPE_LABEL, SEVERITY_COLOR, UNIT_STATUS_COLOR, UNIT_STATUS_LABEL, fmtDuration, type Incident, type ResponseUnit,
} from "@/lib/cnii";
import { UNIT_STATUS_ORDER, etaFor, roadKm } from "./dispatchUtils";

interface DispatchMapProps {
  units: ResponseUnit[];
  queue: Incident[];
  selected?: Incident;
  recommendedId?: string;
  focusId?: string;
  onSelectIncident: (id: string) => void;
  onSelectUnit: (id: string) => void;
}

export function DispatchMap({ units, queue, selected, recommendedId, focusId, onSelectIncident, onSelectUnit }: DispatchMapProps) {
  const rec = recommendedId ? units.find((u) => u.id === recommendedId) : undefined;
  const focus = focusId ? units.find((u) => u.id === focusId) : undefined;
  const fit = selected
    ? [selected.location, ...(rec ? [rec.location] : []), ...(focus ? [focus.location] : [])]
    : focus ? [focus.location] : undefined;

  return (
    <CniiMap height={460} fitTo={fit}
      overlay={
        <div className="absolute bottom-2 left-2 z-[500] rounded-md border border-primary/25 bg-card/85 backdrop-blur px-2 py-1.5 grid grid-cols-2 gap-x-3 gap-y-0.5">
          {UNIT_STATUS_ORDER.map((s) => (
            <span key={s} className="flex items-center gap-1.5 text-[9px] text-muted-foreground">
              <span className="h-2 w-2 rounded-full" style={{ background: UNIT_STATUS_COLOR[s] }} />{UNIT_STATUS_LABEL[s]}
            </span>
          ))}
          <span className="flex items-center gap-1.5 text-[9px] text-muted-foreground"><span className="h-2 w-2 rotate-45 bg-destructive" />Awaiting dispatch</span>
        </div>
      }>
      {rec && selected && (
        <Polyline positions={[[rec.location.lat, rec.location.lng], [selected.location.lat, selected.location.lng]]}
          pathOptions={{ color: "#22c55e", weight: 2.5, dashArray: "8 6" }} />
      )}
      {units.map((u) => {
        const highlight = u.id === recommendedId || u.id === focusId;
        const km = selected ? roadKm(u.location, selected.location) : null;
        return (
          <Marker key={u.id} position={[u.location.lat, u.location.lng]} zIndexOffset={highlight ? 1000 : 0}
            icon={dotIcon(UNIT_STATUS_COLOR[u.status], { size: highlight ? 16 : 10, pulse: highlight, label: highlight || (km != null && km < 25) ? u.callsign : undefined })}
            eventHandlers={{ click: () => onSelectUnit(u.id) }}>
            <Tooltip className="cnii-tip" direction="top">
              <div className="space-y-0.5">
                <p className="font-mono font-bold">{u.callsign} · {UNIT_STATUS_LABEL[u.status]}{u.id === recommendedId ? " · ITIPS recommended" : ""}</p>
                <p>{u.commander.rank} {u.commander.name} · crew {u.officers.length + 1}</p>
                <p>{u.vehicle.type} · {u.vehicle.plate}</p>
                <p>Equipment {u.equipmentReadiness}% · comms {u.comms}{u.armed ? " · armed" : ""}</p>
                {km != null && <p>{km} km to {selected!.id} · ETA {fmtDuration(etaFor(u, km))}</p>}
                {u.currentAssignment && <p>Assigned: {u.currentAssignment}</p>}
              </div>
            </Tooltip>
          </Marker>
        );
      })}
      {queue.map((inc) => {
        const sel = inc.id === selected?.id;
        return (
          <Marker key={inc.id} position={[inc.location.lat, inc.location.lng]} zIndexOffset={sel ? 2000 : 500}
            icon={dotIcon(SEVERITY_COLOR[inc.severity], { size: sel ? 18 : 12, pulse: sel, shape: "diamond", label: sel ? inc.id : undefined })}
            eventHandlers={{ click: () => onSelectIncident(inc.id) }}>
            <Tooltip className="cnii-tip" direction="top">{inc.id} · {INCIDENT_TYPE_LABEL[inc.type]} · {inc.threatSummary}</Tooltip>
          </Marker>
        );
      })}
      {selected && !queue.some((q) => q.id === selected.id) && (
        <Marker position={[selected.location.lat, selected.location.lng]} zIndexOffset={2000}
          icon={dotIcon(SEVERITY_COLOR[selected.severity], { size: 18, pulse: true, shape: "diamond", label: selected.id })} />
      )}
    </CniiMap>
  );
}
