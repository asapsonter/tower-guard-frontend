import { useMemo } from "react";
import { Marker, Polyline, Tooltip } from "react-leaflet";
import { OpsMap, dotIcon } from "@/components/ops/OpsMap";
import { SEVERITY_COLOR, TEAM_STATUS_COLOR, type Incident, type ResponseTeam } from "@/lib/ops";
import { TeamMarker } from "../response/TeamMarker";
import { EtaLive } from "../response/SlaBits";

/** Incident mini-map: site, response team (live), GPS track and remaining approach. */
export function IncidentMap({ inc, team, generatedAt, height = 280 }: { inc: Incident; team?: ResponseTeam; generatedAt: string; height?: number }) {
  const track = inc.response.gpsTrack;
  const fit = useMemo(() => [inc.location, ...(team ? [team.location] : []), ...track], [inc.location, team, track]);
  const siteIcon = useMemo(() => dotIcon(SEVERITY_COLOR[inc.severity], { size: 16, pulse: inc.status !== "closed", label: inc.siteId }), [inc.severity, inc.status, inc.siteId]);
  const approach = team && !inc.response.stages.arrived && team.status !== "on_site";

  return (
    <OpsMap center={inc.location} zoom={13} height={height} fitTo={fit}
      overlay={
        <div className="absolute bottom-2 left-2 z-[500] rounded-md border border-primary/25 bg-card/85 backdrop-blur px-2 py-1.5 space-y-0.5 text-[10px] text-muted-foreground">
          <p className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: SEVERITY_COLOR[inc.severity] }} /> {inc.siteName}</p>
          {team && <p className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm" style={{ background: TEAM_STATUS_COLOR[team.status] }} /> {team.callsign}</p>}
          {track.length > 1 && <p className="flex items-center gap-1.5"><span className="w-4 border-t-2 border-cyan-400" /> GPS track</p>}
          {team && <p className="flex items-center gap-1.5">ETA <EtaLive inc={inc} generatedAt={generatedAt} className="text-[10px]" /></p>}
        </div>
      }>
      {track.length > 1 && <Polyline positions={track.map((p) => [p.lat, p.lng] as [number, number])} pathOptions={{ color: "#22d3ee", weight: 3, opacity: 0.9 }} />}
      {approach && team && (
        <Polyline positions={[[team.location.lat, team.location.lng], [inc.location.lat, inc.location.lng]]} pathOptions={{ color: "#22d3ee", weight: 2, dashArray: "6 6", opacity: 0.6 }} />
      )}
      <Marker position={[inc.location.lat, inc.location.lng]} icon={siteIcon}>
        <Tooltip className="cnii-tip" direction="top">{inc.id} · {inc.siteName}</Tooltip>
      </Marker>
      {team && <TeamMarker team={team} inc={inc} generatedAt={generatedAt} showLabel />}
    </OpsMap>
  );
}
