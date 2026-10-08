import { Link } from "react-router-dom";
import { ListChecks } from "lucide-react";
import { Panel } from "@/components/ops/Panel";
import { Pill } from "@/components/ops/Pill";
import { INCIDENT_STATUS_LABEL, SEVERITY_COLOR, TEAM_STATUS_COLOR, fmtTime, type Incident, type ResponseTeam } from "@/lib/ops";
import { EtaLive, SlaMini, VerificationBadges } from "./SlaBits";

interface ActiveTableProps {
  incidents: Incident[];
  teams: Map<string, ResponseTeam>;
  generatedAt: string;
  selectedId?: string;
  onSelect: (i: Incident) => void;
}

/** Every active incident's response record in one table. */
export function ActiveTable({ incidents, teams, generatedAt, selectedId, onSelect }: ActiveTableProps) {
  return (
    <Panel title="Active incident responses" icon={ListChecks} bodyClassName="p-0" actions={<span className="hud-chip">{incidents.length} active</span>}>
      <div className="overflow-x-auto">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="text-left text-[9px] uppercase tracking-[0.14em] text-muted-foreground border-b border-primary/10 whitespace-nowrap">
              {["Incident", "Site", "Status", "Team", "Vehicle", "Crew / armed", "Dispatched", "Distance", "ETA", "Arrival", "Verification", "SLA"].map((h) => (
                <th key={h} className="px-3 py-2 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-primary/5">
            {incidents.map((i) => {
              const t = i.teamId ? teams.get(i.teamId) : undefined;
              const sel = i.id === selectedId;
              return (
                <tr key={i.id} onClick={() => onSelect(i)} className={`cursor-pointer whitespace-nowrap ${sel ? "bg-primary/10" : "hover:bg-primary/5"}`}>
                  <td className="px-3 py-1.5" style={{ boxShadow: `inset 3px 0 0 ${SEVERITY_COLOR[i.severity]}` }}>
                    <span className="font-mono text-primary">{i.id}</span>
                    <p className="text-[10px] text-muted-foreground">{i.title}</p>
                  </td>
                  <td className="px-3 py-1.5">
                    <Link to={`/sites/${i.siteId}`} onClick={(e) => e.stopPropagation()} className="hover:text-primary">{i.siteName}</Link>
                    <p className="text-[10px] text-muted-foreground">{i.state}</p>
                  </td>
                  <td className="px-3 py-1.5"><Pill color="#06b6d4">{INCIDENT_STATUS_LABEL[i.status]}</Pill></td>
                  <td className="px-3 py-1.5">
                    {t ? <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm" style={{ background: TEAM_STATUS_COLOR[t.status] }} />{t.callsign}</span>
                      : <span className="text-warning">Awaiting dispatch</span>}
                  </td>
                  <td className="px-3 py-1.5 font-mono">{t?.vehicle.plate ?? "—"}</td>
                  <td className="px-3 py-1.5 font-mono">{t ? <>{t.crew.length} / <span className="text-warning">{t.crew.filter((c) => c.armed).length}</span></> : "—"}</td>
                  <td className="px-3 py-1.5 font-mono">{fmtTime(i.response.stages.dispatched)}</td>
                  <td className="px-3 py-1.5 font-mono">{i.response.distanceKm ? `${i.response.distanceKm} km` : "—"}</td>
                  <td className="px-3 py-1.5"><EtaLive inc={i} generatedAt={generatedAt} /></td>
                  <td className="px-3 py-1.5 font-mono">{fmtTime(i.response.stages.arrived)}</td>
                  <td className="px-3 py-1.5"><VerificationBadges inc={i} /></td>
                  <td className="px-3 py-1.5"><SlaMini inc={i} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
