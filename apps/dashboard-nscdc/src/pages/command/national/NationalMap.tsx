import { Circle, CircleMarker, Marker, Polyline, Tooltip } from "react-leaflet";
import type { DivIcon } from "leaflet";
import { CniiMap, dotIcon } from "@/components/cnii/CniiMap";
import {
  INCIDENT_STATUS_LABEL, INCIDENT_TYPE_COLOR, INCIDENT_TYPE_LABEL, SEVERITY_COLOR, UNIT_STATUS_COLOR, UNIT_STATUS_LABEL,
  fmtDuration, fmtNaira, timeAgo,
  type Corridor, type Formation, type GeoPoint, type Hotspot, type Incident, type ResponseUnit, type StolenAsset,
} from "@/lib/cnii";
import { LayerPanel } from "./LayerPanel";
import { isActive } from "./scope";
import { riskColor, type LayerKey } from "./layers";

const iconCache = new Map<string, DivIcon>();
function icon(color: string, opts: Parameters<typeof dotIcon>[1] = {}) {
  const key = `${color}|${opts.size}|${opts.pulse}|${opts.label}|${opts.shape}`;
  let i = iconCache.get(key);
  if (!i) iconCache.set(key, (i = dotIcon(color, opts)));
  return i;
}

const FORMATION_STYLE: Record<Formation["kind"], { color: string; size: number; shape: "dot" | "square" | "diamond"; label: string }> = {
  national_hq: { color: "#22c55e", size: 16, shape: "diamond", label: "National HQ" },
  zonal_command: { color: "#4ade80", size: 13, shape: "diamond", label: "Zonal command" },
  state_command: { color: "#16a34a", size: 10, shape: "square", label: "State command" },
  area_command: { color: "#15803d", size: 7, shape: "square", label: "Area command" },
  post: { color: "#a3e635", size: 7, shape: "dot", label: "CNII post" },
};

interface NationalMapProps {
  incidents: Incident[];
  units: ResponseUnit[];
  formations: Formation[];
  hotspots: Hotspot[];
  corridors: Corridor[];
  recovered: StolenAsset[];
  layers: Record<LayerKey, boolean>;
  counts: Record<LayerKey, number>;
  onToggleLayer: (k: LayerKey) => void;
  onAllLayers: (on: boolean) => void;
  fitTo: GeoPoint[];
  now: number;
  showUnitLabels: boolean;
  onIncident: (id: string) => void;
  onFormation: (f: Formation) => void;
  height?: number;
}

export function NationalMap(p: NationalMapProps) {
  const { layers, now } = p;
  const active = p.incidents.filter(isActive);
  const historic = p.incidents.filter((i) => !isActive(i));
  const unitKey = (Object.keys(UNIT_STATUS_COLOR) as (keyof typeof UNIT_STATUS_COLOR)[]).map((s) => ({ label: UNIT_STATUS_LABEL[s], color: UNIT_STATUS_COLOR[s] }));

  return (
    <CniiMap
      height={p.height ?? 560}
      fitTo={p.fitTo}
      overlay={<LayerPanel enabled={layers} counts={p.counts} onToggle={p.onToggleLayer} onAll={p.onAllLayers} unitKey={unitKey} />}
    >
      {layers.corridors && p.corridors.map((c) => (
        <Polyline key={c.id} positions={c.path.map((g) => [g.lat, g.lng])} pathOptions={{ color: riskColor(c.risk), weight: 4, opacity: 0.75, dashArray: c.trend === "rising" ? undefined : "8 6" }}>
          <Tooltip className="cnii-tip" sticky>
            <b>{c.name}</b><br />Risk {c.risk}/100 · trend {c.trend}
          </Tooltip>
        </Polyline>
      ))}

      {layers.hotspots && p.hotspots.map((h) => (
        <Circle key={h.id} center={[h.location.lat, h.location.lng]} radius={h.radiusKm * 1000} pathOptions={{ color: INCIDENT_TYPE_COLOR[h.dominantType], weight: 1.5, fillOpacity: 0.12, dashArray: "4 4" }}>
          <Tooltip className="cnii-tip" sticky>
            <b>Hotspot · {h.name}</b><br />{h.incidents90d} incidents in 90 days · radius {h.radiusKm} km<br />Dominant: {INCIDENT_TYPE_LABEL[h.dominantType]}
          </Tooltip>
        </Circle>
      ))}

      {layers.formations && p.formations.map((f) => {
        const st = FORMATION_STYLE[f.kind];
        return (
          <Marker key={f.id} position={[f.location.lat, f.location.lng]} icon={icon(st.color, { size: st.size, shape: st.shape })} zIndexOffset={-200}
            eventHandlers={{ click: () => p.onFormation(f) }}>
            <Tooltip className="cnii-tip" direction="top" offset={[0, -6]}>
              <b>{f.name}</b><br />{st.label}{f.state ? ` · ${f.state}` : ""} · {f.zone}
            </Tooltip>
          </Marker>
        );
      })}

      {layers.recovered && p.recovered.map((a) => a.recoveryLocation && (
        <Marker key={a.id} position={[a.recoveryLocation.location.lat, a.recoveryLocation.location.lng]} icon={icon("#10b981", { size: 9, shape: "diamond" })}>
          <Tooltip className="cnii-tip" direction="top" offset={[0, -6]}>
            <b>Recovered · {a.equipmentType.replace("_", " ")}</b><br />
            {a.manufacturer} · S/N {a.serialNumber}<br />
            {fmtNaira(a.valueNaira)} · {a.operator}<br />
            Recovered at {a.recoveryLocation.name}{a.recoveredAt ? ` · ${timeAgo(a.recoveredAt, now)}` : ""}<br />
            Linked incident {a.incidentId}
          </Tooltip>
        </Marker>
      ))}

      {historic.filter((i) => layers[i.type]).map((i) => (
        <CircleMarker key={i.id} center={[i.location.lat, i.location.lng]} radius={4} pathOptions={{ color: INCIDENT_TYPE_COLOR[i.type], weight: 1, fillOpacity: 0.55 }}
          eventHandlers={{ click: () => p.onIncident(i.id) }}>
          <Tooltip className="cnii-tip">
            <b>{i.id}</b> · {INCIDENT_TYPE_LABEL[i.type]}<br />{i.siteName} · {i.operator}<br />{i.lga}, {i.state} · {timeAgo(i.detectedAt, now)}
          </Tooltip>
        </CircleMarker>
      ))}

      {layers.units && p.units.map((u) => (
        <Marker key={u.id} position={[u.location.lat, u.location.lng]} zIndexOffset={200}
          icon={icon(UNIT_STATUS_COLOR[u.status], { size: 10, shape: "square", label: p.showUnitLabels ? u.callsign : undefined })}>
          <Tooltip className="cnii-tip" direction="top" offset={[0, -6]}>
            <b>{u.callsign}</b> · {UNIT_STATUS_LABEL[u.status]}<br />
            {u.commander.rank} {u.commander.name} · {u.officers.length} officers{u.armed ? " · armed" : ""}<br />
            {u.vehicle.type} · comms {u.comms}<br />
            {u.currentAssignment ? `Assigned ${u.currentAssignment}` : "No current assignment"}
          </Tooltip>
        </Marker>
      ))}

      {layers.active && active.filter((i) => layers[i.type]).map((i) => (
        <Marker key={i.id} position={[i.location.lat, i.location.lng]} zIndexOffset={i.severity === "critical" ? 1000 : 500}
          icon={icon(SEVERITY_COLOR[i.severity], { size: i.severity === "critical" ? 15 : 12, pulse: i.severity === "critical" })}
          eventHandlers={{ click: () => p.onIncident(i.id) }}>
          <Tooltip className="cnii-tip" direction="top" offset={[0, -8]}>
            <b>{i.id}</b> · <span style={{ color: SEVERITY_COLOR[i.severity] }}>{i.severity.toUpperCase()}</span><br />
            {INCIDENT_TYPE_LABEL[i.type]} · {INCIDENT_STATUS_LABEL[i.status]}<br />
            {i.siteName} · {i.operator}<br />
            {i.lga}, {i.state} · detected {timeAgo(i.detectedAt, now)}<br />
            {i.respondingUnitId ? `Unit ${i.respondingUnitId}${i.etaSeconds ? ` · ETA ${fmtDuration(i.etaSeconds)}` : ""}` : "No unit assigned"}
            {i.weaponSuspected ? <><br /><span style={{ color: "#ef4444" }}>Weapon suspected · {i.personsDetected} persons</span></> : null}
            <br /><span style={{ opacity: 0.7 }}>Click to open incident command</span>
          </Tooltip>
        </Marker>
      ))}
    </CniiMap>
  );
}
