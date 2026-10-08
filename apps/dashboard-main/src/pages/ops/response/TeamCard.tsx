import { Link } from "react-router-dom";
import { Crosshair, Truck, User, X } from "lucide-react";
import { Panel } from "@/components/ops/Panel";
import { Pill } from "@/components/ops/Pill";
import { TEAM_STATUS_COLOR, TEAM_STATUS_LABEL, fmtTime, timeAgo, type ResponseTeam } from "@/lib/ops";

/** Response team profile (selected from the map or ?team=). */
export function TeamCard({ team, onClose }: { team: ResponseTeam; onClose: () => void }) {
  const color = TEAM_STATUS_COLOR[team.status];
  return (
    <Panel title={team.callsign} icon={Truck}
      actions={<>
        <Pill color={color} className={team.status === "emergency" ? "animate-pulse" : ""}>{TEAM_STATUS_LABEL[team.status]}</Pill>
        <button onClick={onClose} className="p-0.5 rounded hover:bg-secondary" aria-label="Close team"><X className="h-3.5 w-3.5 text-muted-foreground" /></button>
      </>}>
      <div className="grid grid-cols-2 gap-2 text-[12px]">
        <div><p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Team ID</p><p className="font-mono">{team.id}</p></div>
        <div><p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Provider</p><p className="truncate">{team.provider}</p></div>
        <div><p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Vehicle</p><p><span className="font-mono">{team.vehicle.plate}</span> · {team.vehicle.type}</p></div>
        <div><p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Cluster</p><p className="font-mono">{team.clusterId} · {team.state}</p></div>
        <div><p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Last GPS fix</p><p className="font-mono">{fmtTime(team.lastGpsFix)} <span className="text-muted-foreground">({timeAgo(team.lastGpsFix)})</span></p></div>
        <div><p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Assignment</p>
          {team.currentIncidentId ? <Link to={`/incidents/${team.currentIncidentId}`} className="font-mono text-primary hover:underline">{team.currentIncidentId}</Link> : <p className="text-muted-foreground">None</p>}
        </div>
      </div>
      <ul className="mt-3 space-y-0.5">
        {team.crew.map((c) => (
          <li key={c.name} className="flex items-center gap-1.5 text-[11px]">
            {c.armed ? <Crosshair className="h-3 w-3 text-warning" /> : <User className="h-3 w-3 text-muted-foreground" />}
            <span className="text-foreground">{c.name}</span><span className="text-muted-foreground">· {c.role}{c.armed ? " · armed" : ""}</span>
          </li>
        ))}
      </ul>
      {team.status === "emergency" && (
        <p className="mt-3 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-[11px] text-destructive">
          Team has raised an emergency — unavailable for dispatch. Escalate to cluster security manager.
        </p>
      )}
    </Panel>
  );
}
