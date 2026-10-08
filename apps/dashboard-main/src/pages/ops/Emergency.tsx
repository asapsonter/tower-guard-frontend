import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertOctagon, Clock, Map as MapIcon, ShieldAlert, Siren, Truck, UserCheck, Users } from "lucide-react";
import { Panel, PageHeader } from "@/components/ops/Panel";
import { KpiTile } from "@/components/ops/KpiTile";
import { Pill } from "@/components/ops/Pill";
import { SEVERITY_COLOR, fmtClock, fmtTime, useNow, useOps, type ResponseTeam } from "@/lib/ops";
import { IncidentTile } from "./emergency/IncidentTile";
import { EmergencyMap } from "./emergency/EmergencyMap";
import { SLA_BAND_COLOR, byUrgency, slaBand, slaRemaining } from "./emergency/sla";

type Filter = "critical" | "critical_high";

/** Emergency Command — war-room view of every active critical (and high) incident. */
export default function Emergency() {
  const { snap } = useOps();
  const navigate = useNavigate();
  const now = useNow(1000);
  const [filter, setFilter] = useState<Filter>("critical_high");

  const base = useMemo(() => {
    if (!snap) return null;
    const active = snap.incidents.filter((i) => i.status !== "closed" && (i.severity === "critical" || i.severity === "high"));
    const teamById = new Map(snap.teams.map((t) => [t.id, t]));
    return { active, teamById };
  }, [snap]);

  const incidents = useMemo(
    () => (base ? base.active.filter((i) => filter === "critical_high" || i.severity === "critical") : []),
    [base, filter],
  );
  const teams = useMemo(
    () => (base ? incidents.map((i) => (i.teamId ? base.teamById.get(i.teamId) : undefined)).filter((t): t is ResponseTeam => !!t) : []),
    [base, incidents],
  );

  if (!snap || !base) return null;

  const sorted = [...incidents].sort(byUrgency(now));
  const remainings = sorted.map((i) => slaRemaining(i, now));
  const overdue = remainings.filter((r) => r != null && r <= 0).length;
  const awaiting = sorted.filter((i) => !i.teamId).length;
  const enRoute = sorted.filter((i) => i.teamId && !i.response.stages.arrived).length;
  const onSite = sorted.filter((i) => i.response.stages.arrived).length;
  const critical = base.active.filter((i) => i.severity === "critical").length;
  const high = base.active.length - critical;
  const nextIdx = remainings.findIndex((r) => r != null && r > 0);
  const nextDeadline = nextIdx >= 0 ? remainings[nextIdx] : null;
  const nextInc = nextIdx >= 0 ? sorted[nextIdx] : null;

  return (
    <>
      <PageHeader
        title="Emergency Command"
        subtitle="All active critical and high-severity incidents at once · sorted by least response-SLA time remaining"
        icon={Siren}
        actions={
          <>
            <span className="hud-chip"><span className="h-1.5 w-1.5 rounded-full bg-destructive animate-pulse" /> WAR ROOM · {fmtTime(new Date(now).toISOString())} WAT</span>
            <div className="flex rounded-md border border-primary/25 overflow-hidden">
              {([["critical", "Critical"], ["critical_high", "Critical + High"]] as const).map(([k, label]) => (
                <button key={k} onClick={() => setFilter(k)} className={`px-2.5 py-1 text-[10px] font-mono uppercase ${filter === k ? "bg-primary/25 text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                  {label}
                </button>
              ))}
            </div>
          </>
        }
      />

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 xl:col-span-5 grid grid-cols-2 sm:grid-cols-3 gap-2 content-start">
          <KpiTile label="Critical active" value={critical} icon={AlertOctagon} tone={critical ? "text-destructive" : "text-foreground"} hint="Severity: critical" />
          <KpiTile label="High active" value={high} icon={ShieldAlert} tone={high ? "text-warning" : "text-foreground"} hint="Severity: high" />
          <KpiTile label="SLA overdue" value={overdue} icon={Clock} tone={overdue ? "text-destructive" : "text-success"} hint="No verified arrival in 20:00" />
          <KpiTile label="Awaiting dispatch" value={awaiting} icon={UserCheck} tone={awaiting ? "text-warning" : "text-foreground"} hint="Needs human approval" onClick={() => navigate("/response")} />
          <KpiTile label="Teams en route" value={enRoute} icon={Truck} tone="text-primary" hint="Dispatched / departed" onClick={() => navigate("/response")} />
          <KpiTile label="Teams on site" value={onSite} icon={Users} tone="text-success" hint="Arrival independently verified" />
          <div className="col-span-full glass-panel px-3 py-2.5">
            <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Next SLA deadline</p>
            {nextDeadline != null && nextInc ? (
              <p className="text-2xl font-bold font-mono tabular-nums" style={{ color: SLA_BAND_COLOR[slaBand(nextDeadline, nextInc.response.slaSeconds)] }}>
                {fmtClock(nextDeadline)} <span className="text-xs font-sans text-muted-foreground font-normal">{nextInc.id} · {nextInc.state}</span>
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">No running SLA clocks</p>
            )}
            <p className="text-[10px] text-muted-foreground mt-1">ITIPS recommends response teams; dispatch is approved by an authorised operator in the incident room.</p>
          </div>
        </div>
        <Panel
          className="col-span-12 xl:col-span-7"
          icon={MapIcon}
          title="Critical incidents & team positions"
          actions={
            <div className="flex gap-1.5">
              <Pill color={SEVERITY_COLOR.critical}>{incidents.filter((i) => i.severity === "critical").length} critical</Pill>
              {filter === "critical_high" && <Pill color={SEVERITY_COLOR.high}>{incidents.filter((i) => i.severity === "high").length} high</Pill>}
              <Pill color="#06b6d4">{teams.length} teams</Pill>
            </div>
          }
          bodyClassName="p-2"
        >
          <EmergencyMap incidents={incidents} teams={teams} onIncident={(id) => navigate(`/incidents/${id}`)} height={300} />
        </Panel>
      </div>

      {sorted.length === 0 ? (
        <Panel>
          <p className="text-sm text-muted-foreground text-center py-10">No active {filter === "critical" ? "critical" : "critical or high"} incidents. The estate is stable.</p>
        </Panel>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          {sorted.map((i) => (
            <IncidentTile key={i.id} incident={i} team={i.teamId ? base.teamById.get(i.teamId) : undefined} generatedAt={snap.generatedAt} now={now} />
          ))}
        </div>
      )}
    </>
  );
}
