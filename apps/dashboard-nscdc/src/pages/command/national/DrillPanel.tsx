import type { ReactNode } from "react";
import { ChevronRight, Building2, MapPin, Shield } from "lucide-react";
import { Pill } from "@/components/cnii/Pill";
import {
  INCIDENT_STATUS_LABEL, INCIDENT_TYPE_LABEL, SEVERITY_COLOR, timeAgo,
  type CniiSnapshot, type Incident, type Zone,
} from "@/lib/cnii";
import { ZONES, bySeverityThenRecency, isActive, rollUp, slaTone, type RollUp, type Scope } from "./scope";

interface DrillPanelProps {
  snap: CniiSnapshot;
  scope: Scope;
  /** Incidents inside the current scope (any status, within the map window) */
  incidents: Incident[];
  now: number;
  onZone: (z: Zone) => void;
  onState: (scId: string) => void;
  onArea: (acId: string) => void;
  onIncident: (id: string) => void;
}

/** Breadcrumb target list for the current drill level. */
export function DrillPanel({ snap, scope, incidents, now, onZone, onState, onArea, onIncident }: DrillPanelProps) {
  if (scope.areaCommand) {
    const list = incidents.filter((i) => i.areaCommandId === scope.areaCommand!.id).sort((a, b) => Number(isActive(b)) - Number(isActive(a)) || bySeverityThenRecency(a, b));
    return (
      <div className="space-y-1.5">
        <SectionLabel>{scope.areaCommand.name} · incidents</SectionLabel>
        {list.length === 0 && <Empty>No incidents recorded for this area command in the selected window.</Empty>}
        {list.map((i) => <IncidentRow key={i.id} inc={i} now={now} onClick={() => onIncident(i.id)} />)}
      </div>
    );
  }

  if (scope.stateCommand) {
    const sc = scope.stateCommand;
    const all = rollUp(incidents);
    const units = snap.units.filter((u) => u.stateCommandId === sc.id);
    const unassignedActive = incidents.filter((i) => isActive(i) && !sc.areaCommands.some((a) => a.id === i.areaCommandId));
    return (
      <div className="space-y-2">
        <div className="rounded-md border border-primary/20 bg-primary/5 p-2.5">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            <p className="text-[12px] font-semibold">{sc.state} State Command</p>
            <span className="ml-auto font-mono text-[10px] text-muted-foreground">{sc.id}</span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5">HQ {sc.capital} · {sc.zone} · {units.length} response units ({units.filter((u) => u.status === "available" || u.status === "standby").length} available)</p>
          <Stats r={all} className="mt-1.5" />
        </div>
        <SectionLabel>Area commands</SectionLabel>
        {sc.areaCommands.map((a) => {
          const list = incidents.filter((i) => i.areaCommandId === a.id);
          const act = list.filter(isActive).sort(bySeverityThenRecency);
          return (
            <div key={a.id} className="rounded-md border border-primary/10">
              <DrillRow icon={<MapPin className="h-3.5 w-3.5 text-primary/80" />} label={a.name} r={rollUp(list)} onClick={() => onArea(a.id)} />
              {act.length > 0 && (
                <div className="px-2 pb-1.5 space-y-1">
                  {act.slice(0, 4).map((i) => <IncidentRow key={i.id} inc={i} now={now} compact onClick={() => onIncident(i.id)} />)}
                  {act.length > 4 && <p className="text-[10px] text-muted-foreground pl-1">+{act.length - 4} more active</p>}
                </div>
              )}
            </div>
          );
        })}
        {unassignedActive.length > 0 && (
          <>
            <SectionLabel>Active · other area</SectionLabel>
            {unassignedActive.map((i) => <IncidentRow key={i.id} inc={i} now={now} compact onClick={() => onIncident(i.id)} />)}
          </>
        )}
      </div>
    );
  }

  if (scope.zone) {
    const states = snap.stateCommands
      .filter((s) => s.zone === scope.zone)
      .map((s) => ({ s, r: rollUp(incidents.filter((i) => i.stateCommandId === s.id)) }))
      .sort((a, b) => b.r.active - a.r.active || b.r.critical - a.r.critical || b.r.total - a.r.total);
    return (
      <div className="space-y-1">
        <SectionLabel>{scope.zone} · state commands</SectionLabel>
        {states.map(({ s, r }) => (
          <DrillRow key={s.id} icon={<Building2 className="h-3.5 w-3.5 text-primary/80" />} label={s.state} sub={`${s.areaCommands.length} area commands`} r={r} onClick={() => onState(s.id)} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <SectionLabel>Geopolitical zones</SectionLabel>
      {ZONES.map((z) => {
        const list = incidents.filter((i) => i.zone === z);
        const states = snap.stateCommands.filter((s) => s.zone === z).length;
        return <DrillRow key={z} icon={<Shield className="h-3.5 w-3.5 text-primary/80" />} label={z} sub={`${states} states`} r={rollUp(list)} onClick={() => onZone(z)} />;
      })}
    </div>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground pt-1">{children}</p>;
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="text-[11px] text-muted-foreground py-4 text-center">{children}</p>;
}

function Stats({ r, className = "" }: { r: RollUp; className?: string }) {
  return (
    <div className={`flex items-center gap-3 font-mono tabular-nums text-[11px] ${className}`}>
      <span title="Active incidents"><span className="text-muted-foreground text-[9px] mr-1">ACT</span>{r.active}</span>
      <span title="Critical active" className={r.critical ? "text-destructive" : ""}><span className="text-muted-foreground text-[9px] mr-1">CRIT</span>{r.critical}</span>
      <span title="Response SLA met (incidents with recorded arrival)" className={slaTone(r.slaPct)}><span className="text-muted-foreground text-[9px] mr-1">SLA</span>{r.slaPct == null ? "—" : `${r.slaPct}%`}</span>
    </div>
  );
}

function DrillRow({ icon, label, sub, r, onClick }: { icon: ReactNode; label: string; sub?: string; r: RollUp; onClick: () => void }) {
  return (
    <button onClick={onClick} className="group w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-primary/10 transition-colors">
      {icon}
      <div className="min-w-0 flex-1">
        <p className="text-[12px] font-medium truncate">{label}</p>
        {sub && <p className="text-[10px] text-muted-foreground truncate">{sub}</p>}
      </div>
      <Stats r={r} />
      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary shrink-0" />
    </button>
  );
}

function IncidentRow({ inc, now, compact, onClick }: { inc: Incident; now: number; compact?: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-start gap-2 rounded-md border border-primary/10 px-2 py-1.5 text-left hover:border-primary/40 hover:bg-primary/5 transition-colors">
      <span className="mt-1 h-2 w-2 rounded-full shrink-0" style={{ background: SEVERITY_COLOR[inc.severity], boxShadow: `0 0 6px ${SEVERITY_COLOR[inc.severity]}` }} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[10px] text-primary">{inc.id}</span>
          {!compact && <Pill color={isActive(inc) ? SEVERITY_COLOR[inc.severity] : "#64748b"}>{INCIDENT_STATUS_LABEL[inc.status]}</Pill>}
          <span className="ml-auto font-mono text-[10px] text-muted-foreground shrink-0">{timeAgo(inc.detectedAt, now)}</span>
        </div>
        <p className="text-[11px] truncate">{INCIDENT_TYPE_LABEL[inc.type]} · {inc.siteName}</p>
        {!compact && <p className="text-[10px] text-muted-foreground truncate">{inc.operator} · {inc.lga}</p>}
      </div>
    </button>
  );
}
