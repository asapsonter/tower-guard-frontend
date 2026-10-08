import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Map as MapIcon, Truck } from "lucide-react";
import { Panel, PageHeader } from "@/components/ops/Panel";
import { TEAM_STATUS_COLOR, TEAM_STATUS_LABEL, useOps, type Incident, type ResponseTeam, type TeamStatus } from "@/lib/ops";
import { ActiveTable } from "./response/ActiveTable";
import { ResponseDetail } from "./response/ResponseDetail";
import { SlaPerformance } from "./response/SlaPerformance";
import { SmartDispatch, type DispatchApproval } from "./response/SmartDispatch";
import { TeamCard } from "./response/TeamCard";
import { TeamsMap } from "./response/TeamsMap";
import { awaitingDispatch, isActive, sortActive } from "./response/sla";

const LIVE_DEMO = "INC-2026-10491";
const STATUSES = Object.keys(TEAM_STATUS_LABEL) as TeamStatus[];

export default function ResponseSla() {
  const { snap } = useOps();
  const [params, setParams] = useSearchParams();
  const [filter, setFilter] = useState<TeamStatus | null>(null);
  const [approvals, setApprovals] = useState<DispatchApproval[]>([]);

  const active = useMemo(() => (snap ? sortActive(snap.incidents.filter(isActive)) : []), [snap]);
  const teamMap = useMemo(() => new Map((snap?.teams ?? []).map((t) => [t.id, t])), [snap]);
  if (!snap) return null;

  const counts = STATUSES.reduce((m, s) => ({ ...m, [s]: snap.teams.filter((t) => t.status === s).length }), {} as Record<TeamStatus, number>);
  const teams = filter ? snap.teams.filter((t) => t.status === filter) : snap.teams;
  const awaiting = active.filter(awaitingDispatch);

  const teamParam = params.get("team");
  const selectedTeam = teamParam ? teamMap.get(teamParam) : undefined;
  const incParam = params.get("incident") ?? selectedTeam?.currentIncidentId ?? null;
  const selectedInc = (incParam ? snap.incidents.find((i) => i.id === incParam) : undefined)
    ?? (teamParam ? undefined : active.find((i) => i.id === LIVE_DEMO) ?? active[0]);

  const selectIncident = (i: Incident) => setParams({ incident: i.id });
  const selectTeam = (t: ResponseTeam) => setParams(t.currentIncidentId ? { team: t.id, incident: t.currentIncidentId } : { team: t.id });

  return (
    <div className="space-y-4">
      <PageHeader title="Response Command & SLA" icon={Truck}
        subtitle="Every armed response team, every active incident and the 20:00 response SLA — arrival independently verified" />

      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => setFilter(null)}
          className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${filter === null ? "border-primary bg-primary/15 text-primary" : "border-primary/20 text-muted-foreground hover:text-foreground"}`}>
          All teams <span className="font-mono">{snap.teams.length}</span>
        </button>
        {STATUSES.map((s) => {
          const on = filter === s;
          const color = TEAM_STATUS_COLOR[s];
          return (
            <button key={s} onClick={() => setFilter(on ? null : s)}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold ${s === "emergency" && counts[s] > 0 ? "animate-pulse" : ""}`}
              style={{ borderColor: on ? color : `${color}55`, background: on ? `${color}26` : "transparent", color: on ? color : undefined }}>
              <span className="h-2 w-2 rounded-sm" style={{ background: color }} />
              {TEAM_STATUS_LABEL[s]} <span className="font-mono">{counts[s]}</span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-12 gap-4">
        <Panel title="National response picture" icon={MapIcon} className="col-span-12 xl:col-span-8" bodyClassName="p-2"
          actions={<span className="hud-chip">{teams.length} teams · {active.length} incidents</span>}>
          <TeamsMap teams={teams} incidents={active} generatedAt={snap.generatedAt} selectedIncident={selectedInc} selectedTeam={selectedTeam}
            onTeam={selectTeam} onIncident={selectIncident} />
        </Panel>
        <div className="col-span-12 xl:col-span-4 space-y-4 min-w-0">
          {selectedTeam && <TeamCard team={selectedTeam} onClose={() => setParams(selectedInc ? { incident: selectedInc.id } : {})} />}
          {selectedInc ? (
            <ResponseDetail key={selectedInc.id} inc={selectedInc} team={selectedInc.teamId ? teamMap.get(selectedInc.teamId) : undefined} generatedAt={snap.generatedAt} />
          ) : !selectedTeam && (
            <div className="glass-panel p-4 text-xs text-muted-foreground">Select an incident on the map or in the table.</div>
          )}
        </div>

        <div className="col-span-12 min-w-0">
          <ActiveTable incidents={active} teams={teamMap} generatedAt={snap.generatedAt} selectedId={selectedInc?.id} onSelect={selectIncident} />
        </div>

        <div id="dispatch" className="col-span-12 xl:col-span-5 min-w-0 scroll-mt-4">
          <SmartDispatch awaiting={awaiting} preferredId={selectedInc && awaitingDispatch(selectedInc) ? selectedInc.id : undefined}
            approvals={approvals} onApproved={(a) => setApprovals((x) => [a, ...x])} />
        </div>
        <div className="col-span-12 xl:col-span-7 min-w-0">
          <SlaPerformance incidents={snap.incidents} teams={teamMap} generatedAt={snap.generatedAt} />
        </div>
      </div>
    </div>
  );
}
