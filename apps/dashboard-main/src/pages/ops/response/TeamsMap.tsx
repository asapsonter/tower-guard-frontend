import { useMemo } from "react";
import { Marker, Polyline, Tooltip } from "react-leaflet";
import { OpsMap, dotIcon } from "@/components/ops/OpsMap";
import {
  INCIDENT_STATUS_LABEL, SEVERITY_COLOR, TEAM_STATUS_COLOR, TEAM_STATUS_LABEL, type GeoPoint, type Incident, type ResponseTeam, type TeamStatus,
} from "@/lib/ops";
import { TeamMarker } from "./TeamMarker";

interface TeamsMapProps {
  teams: ResponseTeam[];
  incidents: Incident[];
  generatedAt: string;
  selectedIncident?: Incident;
  selectedTeam?: ResponseTeam;
  onTeam: (t: ResponseTeam) => void;
  onIncident: (i: Incident) => void;
}

function IncidentMarker({ inc, selected, onClick }: { inc: Incident; selected: boolean; onClick: () => void }) {
  const icon = useMemo(
    () => dotIcon(SEVERITY_COLOR[inc.severity], { size: selected ? 18 : 13, shape: "diamond", pulse: selected || inc.severity === "critical", label: selected ? inc.id : undefined }),
    [inc.severity, inc.id, selected],
  );
  return (
    <Marker position={[inc.location.lat, inc.location.lng]} icon={icon} eventHandlers={{ click: onClick }} zIndexOffset={selected ? 1200 : 300}>
      <Tooltip className="cnii-tip" direction="top" offset={[0, -6]}>
        <span className="font-semibold">{inc.id}</span> · {inc.title}<br />{inc.siteName} · {INCIDENT_STATUS_LABEL[inc.status]}
      </Tooltip>
    </Marker>
  );
}

/** National response picture: every team by status, active incidents and GPS tracks. */
export function TeamsMap({ teams, incidents, generatedAt, selectedIncident, selectedTeam, onTeam, onIncident }: TeamsMapProps) {
  const byId = useMemo(() => new Map(incidents.map((i) => [i.id, i])), [incidents]);
  const fit = useMemo<GeoPoint[] | undefined>(() => {
    if (selectedIncident) {
      const t = teams.find((x) => x.id === selectedIncident.teamId);
      return [selectedIncident.location, ...(t ? [t.location] : []), ...selectedIncident.response.gpsTrack];
    }
    if (selectedTeam) return [selectedTeam.location];
    return undefined;
  }, [selectedIncident, selectedTeam, teams]);

  return (
    <OpsMap height={520} fitTo={fit} defaultTiles="dark"
      overlay={
        <div className="absolute bottom-2 left-2 z-[500] rounded-md border border-primary/25 bg-card/85 backdrop-blur px-2 py-1.5 grid grid-cols-2 gap-x-3 gap-y-0.5 text-[10px] text-muted-foreground">
          {(Object.keys(TEAM_STATUS_LABEL) as TeamStatus[]).map((s) => (
            <p key={s} className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm" style={{ background: TEAM_STATUS_COLOR[s] }} />{TEAM_STATUS_LABEL[s]}</p>
          ))}
          <p className="flex items-center gap-1.5"><span className="h-2 w-2 rotate-45 bg-destructive" />Incident</p>
          <p className="flex items-center gap-1.5"><span className="w-3 border-t-2 border-cyan-400" />GPS track</p>
        </div>
      }>
      {incidents.filter((i) => i.response.gpsTrack.length > 1).map((i) => {
        const sel = i.id === selectedIncident?.id;
        return (
          <Polyline key={`trk-${i.id}`} positions={i.response.gpsTrack.map((p) => [p.lat, p.lng] as [number, number])}
            pathOptions={{ color: "#22d3ee", weight: sel ? 4 : 2, opacity: sel ? 0.95 : 0.5, dashArray: i.response.stages.arrived ? undefined : "6 5" }} />
        );
      })}
      {incidents.map((i) => <IncidentMarker key={i.id} inc={i} selected={i.id === selectedIncident?.id} onClick={() => onIncident(i)} />)}
      {teams.map((t) => (
        <TeamMarker key={t.id} team={t} inc={t.currentIncidentId ? byId.get(t.currentIncidentId) : undefined} generatedAt={generatedAt}
          selected={t.id === selectedTeam?.id || (!!selectedIncident && t.id === selectedIncident.teamId)}
          showLabel={t.status === "emergency"} onClick={() => onTeam(t)} />
      ))}
    </OpsMap>
  );
}
