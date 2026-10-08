import { useMemo } from "react";
import { Marker, Tooltip } from "react-leaflet";
import { dotIcon } from "@/components/ops/OpsMap";
import { TEAM_STATUS_COLOR, TEAM_STATUS_LABEL, useNow, type Incident, type ResponseTeam } from "@/lib/ops";
import { liveTeamPosition } from "./sla";

interface TeamMarkerProps {
  team: ResponseTeam;
  inc?: Incident;
  generatedAt: string;
  selected?: boolean;
  showLabel?: boolean;
  onClick?: () => void;
}

/** Response-team marker; en-route teams advance along their approach in real time. */
export function TeamMarker({ team, inc, generatedAt, selected, showLabel, onClick }: TeamMarkerProps) {
  const moving = team.status === "en_route";
  const now = useNow(moving ? 1000 : 60_000);
  const pos = liveTeamPosition(inc, team, now, generatedAt);
  const color = TEAM_STATUS_COLOR[team.status];
  const icon = useMemo(
    () => dotIcon(color, { size: selected ? 15 : 11, shape: "square", pulse: team.status === "emergency" || selected, label: showLabel || selected ? team.callsign : undefined }),
    [color, selected, showLabel, team.status, team.callsign],
  );
  return (
    <Marker position={[pos.lat, pos.lng]} icon={icon} eventHandlers={onClick ? { click: onClick } : undefined} zIndexOffset={selected ? 1000 : team.status === "emergency" ? 500 : 0}>
      <Tooltip className="cnii-tip" direction="top" offset={[0, -6]}>
        <span className="font-semibold">{team.callsign}</span> · {TEAM_STATUS_LABEL[team.status]}
        <br />
        {team.vehicle.type} {team.vehicle.plate} · {team.crew.filter((c) => c.armed).length} armed
      </Tooltip>
    </Marker>
  );
}
