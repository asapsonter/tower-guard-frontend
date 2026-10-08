import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  BarChart3, ChevronRight, Scale, Radar as RadarIcon, Flag, Timer, ShieldCheck, FileCheck2, Target, Users, Gauge, ListChecks, Info,
} from "lucide-react";
import { Panel, PageHeader } from "@/components/cnii/Panel";
import { KpiTile } from "@/components/cnii/KpiTile";
import { Pill } from "@/components/cnii/Pill";
import { useCnii, fmtDuration, fmtNaira } from "@/lib/cnii";
import { ScorecardTable } from "./performance/ScorecardTable";
import { PillarRadar, WeightingExplainer } from "./performance/PillarPanels";
import { LEVEL_LABEL, NATIONAL_ID, buildTree, compositeColor, teamOf, type FormationRow } from "./performance/scorecards";

const CHILD_LABEL: Record<FormationRow["level"], string> = {
  national: "Zonal Commands",
  zone: "State Commands",
  state: "Area Commands",
  area: "Response Units",
  unit: "Team",
};

export default function Performance() {
  const { snap } = useCnii();
  const [params, setParams] = useSearchParams();
  const tree = useMemo(() => (snap ? buildTree(snap.scorecards) : null), [snap]);

  if (!snap || !tree) return null;

  const focusId = params.get("focus");
  const selected = (focusId && tree.byId.get(focusId)) || tree.byId.get(NATIONAL_ID)!;
  const path = tree.path(selected.id);
  const parent = path.length > 1 ? path[path.length - 2] : undefined;
  const children = tree.children(selected.id);
  const flagged = tree.unitsUnder(selected.id).filter((u) => u.conductFlags > 0).sort((a, b) => b.conductFlags - a.conductFlags);
  const team = selected.level === "unit" ? teamOf(snap.units, selected.id) : undefined;
  const rankAmongPeers = parent
    ? [...tree.children(parent.id)].sort((a, b) => b.composite - a.composite).findIndex((r) => r.id === selected.id) + 1
    : null;

  const open = (id: string) => setParams(id === NATIONAL_ID ? {} : { focus: id });

  return (
    <>
      <PageHeader
        title="Officer & Formation Performance"
        subtitle="National → Zone → State Command → Area Command → Unit → Team · ranked by weighted composite, not arrest counts"
        icon={BarChart3}
        actions={<span className="hud-chip"><Scale className="h-3 w-3" /> Response 30 · Prevention 20 · Conduct 15 · Evidence 20 · Outcomes 15</span>}
      />

      {/* Breadcrumb */}
      <nav className="glass-panel px-3 py-2 flex flex-wrap items-center gap-1 text-xs" aria-label="Formation hierarchy">
        {path.map((r, i) => {
          const last = i === path.length - 1;
          return (
            <span key={r.id} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
              <button
                onClick={() => open(r.id)}
                disabled={last}
                className={`px-1.5 py-0.5 rounded ${last ? "text-primary font-semibold bg-primary/10" : "text-muted-foreground hover:text-foreground"}`}
              >
                <span className="text-[9px] uppercase tracking-[0.14em] mr-1 opacity-70">{LEVEL_LABEL[r.level]}</span>
                {r.name}
              </button>
            </span>
          );
        })}
        {selected.level === "unit" && (
          <span className="flex items-center gap-1 text-muted-foreground"><ChevronRight className="h-3 w-3" /><span className="text-[9px] uppercase tracking-[0.14em]">Team</span></span>
        )}
      </nav>

      {/* Headline tiles — composite first; arrests deliberately not a headline tile */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        <KpiTile label="Composite score" value={selected.composite} icon={Gauge} tone={selected.composite >= 70 ? "text-success" : selected.composite >= 60 ? "text-warning" : "text-destructive"}
          hint={rankAmongPeers && parent ? `Rank ${rankAmongPeers} of ${tree.children(parent.id).length} in ${parent.name}` : "National roll-up"} />
        <KpiTile label="SLA compliance" value={`${selected.slaCompliance}%`} icon={Timer} hint={`Avg response ${fmtDuration(selected.responseSeconds)}`} />
        <KpiTile label="Evidence completeness" value={`${selected.evidenceCompleteness}%`} icon={FileCheck2} hint={`Report completion ${selected.reportCompletion}%`} />
        <KpiTile label="Successful interventions" value={selected.successfulInterventions} icon={Target} hint={`${selected.incidentsAssigned} incidents assigned`} />
        <KpiTile label="Repeat incidents" value={selected.repeatIncidents} icon={ShieldCheck} hint={`${selected.falseDispatches} false dispatches`} />
        <KpiTile label="Conduct flags" value={selected.conductFlags} icon={Flag} tone={selected.conductFlags ? "text-destructive" : "text-success"} hint={selected.conductFlags ? "Requires supervisory review" : "No open flags"} />
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 xl:col-span-8 space-y-4 min-w-0">
          {selected.level !== "unit" ? (
            <Panel
              title={`${CHILD_LABEL[selected.level]} under ${selected.name}`}
              icon={ListChecks}
              actions={<span className="text-[10px] text-muted-foreground">{children.length} formations · click to drill down</span>}
              bodyClassName="p-2"
            >
              <ScorecardTable rows={children} onOpen={(r) => open(r.id)} />
            </Panel>
          ) : (
            <Panel title={`Team — ${selected.name}`} icon={Users} actions={team && <Pill color={team.comms === "online" ? "#22c55e" : "#f97316"}>Comms {team.comms}</Pill>}>
              {team ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <Field label="Commander" value={`${team.commander.rank} ${team.commander.name}`} />
                    <Field label="Vehicle" value={`${team.vehicle.type} · ${team.vehicle.plate}`} />
                    <Field label="Equipment readiness" value={`${team.equipmentReadiness}%`} />
                    <Field label="Armed" value={team.armed ? "Yes" : "No"} />
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="text-[9px] uppercase tracking-[0.1em] text-muted-foreground border-b border-primary/15">
                        <tr><th className="px-2 py-1.5 text-left">Officer</th><th className="px-2 py-1.5 text-left">Rank</th><th className="px-2 py-1.5 text-left">Service no.</th><th className="px-2 py-1.5 text-left">Role</th></tr>
                      </thead>
                      <tbody>
                        {[team.commander, ...team.officers.filter((o) => o.id !== team.commander.id)].map((o, i) => (
                          <tr key={o.id} className="border-b border-border/30">
                            <td className="px-2 py-1.5 text-foreground">{o.name}</td>
                            <td className="px-2 py-1.5">{o.rank}</td>
                            <td className="px-2 py-1.5 font-mono">{o.serviceNumber}</td>
                            <td className="px-2 py-1.5 text-muted-foreground">{i === 0 ? "Team commander" : "Team member"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Individual officer scores are derived from the team record; conduct flags are reviewed by the supervising Area Commander before attribution to an individual.
                  </p>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No roster on file for this unit.</p>
              )}
            </Panel>
          )}

          <Panel title={`All KPIs — ${selected.name}`} icon={Info}>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-3 text-xs">
              <Field label="Incidents assigned" value={selected.incidentsAssigned} />
              <Field label="Acknowledgement time" value={fmtDuration(selected.ackSeconds)} />
              <Field label="Mobilisation time" value={fmtDuration(selected.mobilisationSeconds)} />
              <Field label="Response time" value={fmtDuration(selected.responseSeconds)} />
              <Field label="SLA compliance" value={`${selected.slaCompliance}%`} />
              <Field label="Successful interventions" value={selected.successfulInterventions} />
              <Field label="Recoveries" value={fmtNaira(selected.recoveriesNaira)} />
              <Field label="False dispatches" value={selected.falseDispatches} />
              <Field label="Evidence completeness" value={`${selected.evidenceCompleteness}%`} />
              <Field label="Report completion" value={`${selected.reportCompletion}%`} />
              <Field label="Repeat incidents" value={selected.repeatIncidents} />
              <Field label="Arrests (secondary)" value={selected.arrests} muted />
            </div>
            <p className="mt-3 text-[10px] text-muted-foreground">
              Arrests are recorded as a secondary indicator. They feed the Case Outcomes pillar only in capped form, alongside cases opened and successful
              interventions, so a formation cannot raise its score by arrest volume alone.
            </p>
          </Panel>
        </div>

        <div className="col-span-12 xl:col-span-4 space-y-4 min-w-0">
          <Panel title="Five-pillar profile" icon={RadarIcon} actions={parent && <span className="text-[10px] text-muted-foreground">vs {parent.name}</span>}>
            <PillarRadar row={selected} benchmark={parent} />
          </Panel>
          <Panel title="How the composite is weighted" icon={Scale}>
            <WeightingExplainer row={selected} />
          </Panel>
          <Panel title="Conduct flags" icon={Flag} actions={<span className="text-[10px] text-muted-foreground">{flagged.length} units</span>} bodyClassName="p-2">
            {flagged.length ? (
              <ul className="max-h-[260px] overflow-y-auto divide-y divide-border/30">
                {flagged.map((u) => {
                  const area = u.parentId ? tree.byId.get(u.parentId) : undefined;
                  return (
                    <li key={u.id}>
                      <button onClick={() => open(u.id)} className="w-full flex items-center gap-2 px-2 py-1.5 text-left hover:bg-primary/5 rounded">
                        <Flag className="h-3.5 w-3.5 text-destructive shrink-0" />
                        <span className="min-w-0 flex-1">
                          <span className="block text-xs text-foreground font-mono">{u.name}</span>
                          <span className="block text-[10px] text-muted-foreground truncate">{area?.name ?? "—"}</span>
                        </span>
                        <Pill color="#ef4444">{u.conductFlags} flag{u.conductFlags > 1 ? "s" : ""}</Pill>
                        <span className="font-mono text-xs w-6 text-right" style={{ color: compositeColor(u.composite) }}>{u.composite}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="p-4 text-center text-xs text-muted-foreground">No conduct flags in this formation.</p>
            )}
            <p className="px-2 pt-2 text-[10px] text-muted-foreground">Flags are referrals for supervisory review (complaints, use-of-force reports, unauthorised evidence access) — not findings.</p>
          </Panel>
        </div>
      </div>
    </>
  );
}

function Field({ label, value, muted = false }: { label: string; value: string | number; muted?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground truncate">{label}</p>
      <p className={`font-mono tabular-nums truncate ${muted ? "text-muted-foreground" : "text-foreground"}`}>{value}</p>
    </div>
  );
}
