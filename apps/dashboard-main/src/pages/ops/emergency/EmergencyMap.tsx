import { useMemo } from "react";
import { Marker, Polyline, Tooltip } from "react-leaflet";
import { OpsMap, dotIcon } from "@/components/ops/OpsMap";
import { SEVERITY_COLOR, TEAM_STATUS_COLOR, TEAM_STATUS_LABEL, type GeoPoint, type Incident, type ResponseTeam } from "@/lib/ops";

interface EmergencyMapProps {
  incidents: Incident[];
  teams: ResponseTeam[];
  onIncident: (id: string) => void;
  height?: number;
}

/** Mini map: every incident in the war room plus the teams assigned to them. */
export function EmergencyMap({ incidents, teams, onIncident, height = 300 }: EmergencyMapProps) {
  const teamById = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams]);
  const fit = useMemo<GeoPoint[]>(() => {
    const pts = [...incidents.map((i) => i.location), ...teams.map((t) => t.location)];
    if (pts.length !== 1) return pts;
    const [p] = pts;
    return [{ lat: p.lat - 0.2, lng: p.lng - 0.2 }, { lat: p.lat + 0.2, lng: p.lng + 0.2 }];
  }, [incidents, teams]);

  return (
    <OpsMap height={height} fitTo={fit} defaultTiles="dark">
      {incidents.map((i) => {
        const t = i.teamId ? teamById.get(i.teamId) : undefined;
        return t && !i.response.stages.arrived ? (
          <Polyline key={`l-${i.id}`} positions={[[t.location.lat, t.location.lng], [i.location.lat, i.location.lng]]} pathOptions={{ color: TEAM_STATUS_COLOR[t.status], weight: 1.5, dashArray: "4 4", opacity: 0.8 }} />
        ) : null;
      })}
      {teams.map((t) => (
        <Marker key={t.id} position={[t.location.lat, t.location.lng]} icon={dotIcon(TEAM_STATUS_COLOR[t.status], { size: 9, shape: "square", label: t.callsign })}>
          <Tooltip className="cnii-tip" direction="top">
            <span className="text-[11px]">{t.callsign} · {TEAM_STATUS_LABEL[t.status]}</span>
          </Tooltip>
        </Marker>
      ))}
      {incidents.map((i) => (
        <Marker
          key={i.id}
          position={[i.location.lat, i.location.lng]}
          icon={dotIcon(SEVERITY_COLOR[i.severity], { size: i.severity === "critical" ? 16 : 12, pulse: true, shape: "diamond" })}
          eventHandlers={{ click: () => onIncident(i.id) }}
          zIndexOffset={1000}
        >
          <Tooltip className="cnii-tip" direction="top">
            <div className="text-[11px]">
              <p className="font-mono font-semibold">{i.id}</p>
              <p>{i.title} · {i.state}</p>
            </div>
          </Tooltip>
        </Marker>
      ))}
    </OpsMap>
  );
}
