import { useMemo, useState, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AlertTriangle, BarChart3, ClipboardList, Gauge, ListChecks, MapPinCheck, Satellite, Timer } from "lucide-react";
import { KpiTile } from "@/components/cnii/KpiTile";
import { PageHeader, Panel } from "@/components/cnii/Panel";
import { Meter, Pill } from "@/components/cnii/Pill";
import { SlaCountdown } from "@/components/cnii/SlaCountdown";
import {
  INCIDENT_STATUS_LABEL, INCIDENT_TYPE_LABEL, SEVERITY_COLOR, fmtDuration, fmtTime, useCnii, type Incident,
} from "@/lib/cnii";
import { placeName, sortRooms } from "./incident/roomUtils";
import { ArrivalChart } from "./sla/ArrivalChart";
import { AuditTable } from "./sla/AuditTable";
import { StageTracker } from "./sla/StageTracker";
import {
  EVIDENCE_LABEL, discrepancyFor, mean, median, metricsFor, mins, unverifiedArrival, type Discrepancy,
} from "./sla/slaMetrics";

type Scope = "30d" | "active" | "all";
type ResultFilter = "all" | "breaches" | "discrepancies" | "no_evidence";

const DAY_MS = 86_400_000;

function chip(active: boolean) {
  return `rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${active ? "border-primary bg-primary/20 text-primary" : "border-primary/20 text-muted-foreground hover:text-foreground"}`;
}

function discrepancyText(d: Discrepancy) {
  return `Unit reported arrival at ${mins(d.claimedSec)} min — ${d.verifiedBy} shows ${mins(d.verifiedSec)} min`;
}

export default function SlaAccountability() {
  const { snap } = useCnii();
  const [params, setParams] = useSearchParams();
  const [scope, setScope] = useState<Scope>("30d");
  const [filter, setFilter] = useState<ResultFilter>("all");

  const active = useMemo(() => (snap ? sortRooms(snap.incidents, Date.now()) : []), [snap]);
  const last30 = useMemo(() => {
    if (!snap) return [];
    const from = new Date(snap.generatedAt).getTime() - 30 * DAY_MS;
    return snap.incidents.filter((i) => new Date(i.detectedAt).getTime() >= from);
  }, [snap]);

  const stats = useMemo(() => {
    const m = last30.map(metricsFor);
    const pick = (k: keyof ReturnType<typeof metricsFor>) => m.map((x) => x[k]).filter((v): v is number => v != null);
    const decided = last30.filter((i) => i.response.verifiedArrival || i.response.breached);
    const reasons = new Map<string, number>();
    last30.forEach((i) => { if (i.response.breached && i.response.breachReason) reasons.set(i.response.breachReason, (reasons.get(i.response.breachReason) ?? 0) + 1); });
    return {
      compliance: decided.length ? (decided.filter((i) => !i.response.breached).length / decided.length) * 100 : null,
      breaches: last30.filter((i) => i.response.breached).length,
      medianArrival: median(pick("arrival")),
      dispatchLatency: mean(pick("dispatchLatency")),
      turnout: mean(pick("turnout")),
      travel: mean(pick("travel")),
      intervention: mean(pick("intervention")),
      total: mean(pick("total")),
      discrepancies: last30.filter((i) => discrepancyFor(i)).length,
      unverified: last30.filter(unverifiedArrival).length,
      reasons: [...reasons.entries()].sort((a, b) => b[1] - a[1]),
    };
  }, [last30]);

  if (!snap) return null;

  const focusId = params.get("focus") ?? undefined;
  const selected = (focusId && snap.incidents.find((i) => i.id === focusId)) || active[0];
  const select = (id: string) => setParams({ focus: id }, { replace: true });

  const discrepancies = snap.incidents
    .map((inc) => ({ inc, d: discrepancyFor(inc) }))
    .filter((x): x is { inc: Incident; d: Discrepancy } => !!x.d)
    .sort((a, b) => Number(b.inc.status !== "closed") - Number(a.inc.status !== "closed") || b.d.gapSec - a.d.gapSec);

  const base = scope === "active" ? active : scope === "30d" ? last30 : snap.incidents;
  const tableRows = base.filter((i) =>
    filter === "breaches" ? i.response.breached
      : filter === "discrepancies" ? !!discrepancyFor(i)
        : filter === "no_evidence" ? unverifiedArrival(i)
          : true);

  return (
    <>
      <PageHeader title="Response SLA & Accountability" icon={Timer}
        subtitle="Every response is digitally auditable — nine timestamped stages, independent arrival evidence, discrepancy detection"
        actions={<span className="hud-chip"><Satellite className="h-3 w-3" /> Arrival verified by GPS · check-in · access · CCTV</span>} />

      {discrepancies.length > 0 && (
        <div className="glass-panel border-warning/60 bg-warning/5 p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            <p className="text-[13px] font-bold text-foreground uppercase tracking-wide">Claimed vs verified arrival</p>
            <span className="hud-chip !text-warning !border-warning/40">{discrepancies.length} discrepanc{discrepancies.length === 1 ? "y" : "ies"}</span>
            <button onClick={() => { setFilter("discrepancies"); setScope("all"); }} className="ml-auto text-[11px] text-warning hover:underline">Show in audit →</button>
          </div>
          <ul className="mt-2 space-y-1">
            {discrepancies.slice(0, 4).map(({ inc, d }) => (
              <li key={inc.id}>
                <button onClick={() => select(inc.id)} className="flex flex-wrap items-center gap-x-2 text-left text-[12px] hover:underline">
                  <span className="font-mono text-primary">{inc.id}</span>
                  <span className="font-mono text-muted-foreground">{inc.respondingUnitId ?? "—"}</span>
                  <span className="text-foreground">{discrepancyText(d)}</span>
                  <span className="font-mono text-warning">(+{mins(d.gapSec)} min unaccounted)</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <p className="mb-1.5 text-[9px] uppercase tracking-[0.18em] text-muted-foreground">Last 30 days · {last30.length} incidents</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 2xl:grid-cols-10 gap-2">
          <KpiTile label="SLA compliance" icon={Gauge} value={stats.compliance == null ? "—" : `${stats.compliance.toFixed(1)}%`}
            tone={stats.compliance != null && stats.compliance >= 90 ? "text-success" : "text-warning"} />
          <KpiTile label="SLA breaches" icon={AlertTriangle} value={stats.breaches} tone="text-destructive" onClick={() => { setFilter("breaches"); setScope("30d"); }} />
          <KpiTile label="Median arrival" icon={Timer} value={fmtDuration(stats.medianArrival)} hint="alert → verified arrival" />
          <KpiTile label="Dispatch latency" value={fmtDuration(stats.dispatchLatency)} hint="alert → dispatch (avg)" />
          <KpiTile label="Turnout time" value={fmtDuration(stats.turnout)} hint="dispatch → departure" />
          <KpiTile label="Travel time" value={fmtDuration(stats.travel)} hint="departure → arrival" />
          <KpiTile label="Intervention" value={fmtDuration(stats.intervention)} hint="arrival → intervention" />
          <KpiTile label="Total response" value={fmtDuration(stats.total)} hint="alert → closure" />
          <KpiTile label="Discrepancies" icon={MapPinCheck} value={stats.discrepancies} tone={stats.discrepancies ? "text-warning" : "text-success"}
            onClick={() => { setFilter("discrepancies"); setScope("30d"); }} hint="claimed ≠ verified" />
          <KpiTile label="No evidence" value={stats.unverified} tone={stats.unverified ? "text-destructive" : "text-success"}
            onClick={() => { setFilter("no_evidence"); setScope("30d"); }} hint="arrival unverified" />
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <Panel title="Active response clocks" icon={Timer} className="col-span-12 lg:col-span-4 xl:col-span-3"
          actions={<span className="hud-chip">{active.length}</span>} bodyClassName="p-2">
          {active.length === 0 ? <p className="p-3 text-xs text-muted-foreground">No active incidents.</p> : (
            <ul className="space-y-1 max-h-[440px] overflow-y-auto pr-1">
              {active.map((inc) => (
                <li key={inc.id}>
                  <button onClick={() => select(inc.id)}
                    className={`w-full flex items-center gap-2 rounded-md border px-2 py-1.5 text-left ${inc.id === selected?.id ? "border-primary/60 bg-primary/10" : "border-primary/10 hover:border-primary/30"}`}
                    style={{ boxShadow: `inset 3px 0 0 ${SEVERITY_COLOR[inc.severity]}` }}>
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-[11px] text-primary">{inc.id}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{placeName(inc)} · {inc.respondingUnitId ?? "unassigned"}</p>
                    </div>
                    <SlaCountdown alertAt={inc.response.stages.alert ?? inc.detectedAt} slaSeconds={inc.response.slaSeconds} arrivalAt={inc.response.verifiedArrival} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <div className="col-span-12 lg:col-span-8 xl:col-span-9">
          {selected ? <SelectedResponse inc={selected} /> : <div className="glass-panel p-6 text-sm text-muted-foreground">Select an incident.</div>}
        </div>

        <Panel title="Arrival time distribution vs SLA (last 30 days)" icon={BarChart3} className="col-span-12 xl:col-span-7">
          <ArrivalChart incidents={last30} />
        </Panel>

        <Panel title="SLA breach reasons (last 30 days)" icon={ListChecks} className="col-span-12 xl:col-span-5">
          {stats.reasons.length === 0 ? <p className="text-xs text-muted-foreground">No SLA breaches recorded.</p> : (
            <ul className="space-y-2">
              {stats.reasons.map(([reason, n]) => (
                <li key={reason}>
                  <div className="flex items-baseline justify-between gap-2 text-[11px]">
                    <span className="text-foreground">{reason}</span>
                    <span className="font-mono text-muted-foreground">{n}</span>
                  </div>
                  <Meter value={(n / stats.reasons[0][1]) * 100} color="#ef4444" className="mt-0.5" />
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Response audit trail" icon={ClipboardList} className="col-span-12" bodyClassName="p-0"
          actions={
            <div className="flex flex-wrap items-center gap-1.5">
              {([["30d", "Last 30 days"], ["active", "Active"], ["all", "All"]] as const).map(([k, l]) => (
                <button key={k} onClick={() => setScope(k)} className={chip(scope === k)}>{l}</button>
              ))}
              <span className="mx-1 h-4 w-px bg-primary/20" />
              {([["all", "All results"], ["breaches", "Breaches"], ["discrepancies", "Discrepancies only"], ["no_evidence", "No evidence"]] as const).map(([k, l]) => (
                <button key={k} onClick={() => setFilter(k)} className={chip(filter === k)}>{l}</button>
              ))}
              <span className="font-mono text-[10px] text-muted-foreground">{tableRows.length}</span>
            </div>
          }>
          <AuditTable incidents={tableRows} selectedId={selected?.id} onSelect={select} />
        </Panel>
      </div>
    </>
  );
}

function Metric({ label, value, hint, tone = "text-foreground" }: { label: string; value: ReactNode; hint: string; tone?: string }) {
  return (
    <div className="rounded-md border border-primary/10 px-2.5 py-2">
      <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className={`font-mono text-[15px] font-bold tabular-nums ${tone}`}>{value}</p>
      <p className="text-[9px] text-muted-foreground">{hint}</p>
    </div>
  );
}

/** Large countdown, stage tracker, measured intervals and arrival evidence for one incident. */
function SelectedResponse({ inc }: { inc: Incident }) {
  const m = metricsFor(inc);
  const d = discrepancyFor(inc);
  const { response } = inc;
  const noEvidence = unverifiedArrival(inc);

  return (
    <Panel title={<span className="font-mono">{inc.id}</span>} icon={Timer}
      actions={<Link to={`/incident/${inc.id}`} className="text-[11px] text-primary hover:underline">Open incident room →</Link>}>
      <div className="flex flex-wrap items-center gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-foreground">{INCIDENT_TYPE_LABEL[inc.type]} · {placeName(inc)}</p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            <Pill color={SEVERITY_COLOR[inc.severity]} className="uppercase">{inc.threatLevel}</Pill>
            <span className="hud-chip">{INCIDENT_STATUS_LABEL[inc.status]}</span>
            <span className="hud-chip">Unit {inc.respondingUnitId ?? "—"}</span>
            <span className="hud-chip">Target {Math.round(response.slaSeconds / 60)} min · {response.distanceKm} km</span>
          </div>
        </div>
        <div className="rounded-lg border border-primary/20 bg-background/40 px-5 py-2">
          <SlaCountdown size="lg" alertAt={response.stages.alert ?? inc.detectedAt} slaSeconds={response.slaSeconds} arrivalAt={response.verifiedArrival} />
        </div>
      </div>

      {d && (
        <div className="mt-3 rounded-md border-2 border-warning/70 bg-warning/10 p-3 flex items-start gap-2">
          <AlertTriangle className="h-5 w-5 text-warning shrink-0" />
          <div className="text-[12px]">
            <p className="font-bold uppercase tracking-wide text-warning">Claimed vs verified arrival</p>
            <p className="text-foreground">{discrepancyText(d)}.</p>
            <p className="text-muted-foreground">
              Claimed {fmtTime(response.claimedArrival)} · verified {fmtTime(response.verifiedArrival)} — {mins(d.gapSec)} min unaccounted. The verified time is used for SLA measurement; refer to the formation commander for review.
            </p>
          </div>
        </div>
      )}

      <div className="mt-4"><StageTracker inc={inc} /></div>

      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2">
        <Metric label="Dispatch latency" value={fmtDuration(m.dispatchLatency)} hint="alert → dispatch" />
        <Metric label="Turnout" value={fmtDuration(m.turnout)} hint="dispatch → departure" />
        <Metric label="Travel" value={fmtDuration(m.travel)} hint="departure → arrival" />
        <Metric label="Arrival" value={fmtDuration(m.arrival)} hint="alert → arrival"
          tone={m.arrival != null && m.arrival > response.slaSeconds ? "text-destructive" : m.arrival != null ? "text-success" : "text-foreground"} />
        <Metric label="Intervention" value={fmtDuration(m.intervention)} hint="arrival → intervention" />
        <Metric label="Total response" value={fmtDuration(m.total)} hint="alert → closure" />
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div>
          <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground mb-1">Independent arrival evidence</p>
          {!m.arrival ? (
            <p className="text-[11px] text-muted-foreground">Arrival not yet recorded.</p>
          ) : noEvidence ? (
            <Pill color="#ef4444"><AlertTriangle className="h-3 w-3" /> Arrival has no independent evidence — not accepted for SLA</Pill>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {response.arrivalEvidence.map((e) => <Pill key={e} color="#22c55e">✓ {EVIDENCE_LABEL[e]}</Pill>)}
            </div>
          )}
        </div>
        <div>
          <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground mb-1">SLA outcome</p>
          {response.breached ? (
            <p className="text-[12px] text-destructive"><span className="font-semibold">Breached</span> — {response.breachReason ?? "reason not recorded"}</p>
          ) : response.verifiedArrival ? (
            <p className="text-[12px] text-success font-semibold">Met</p>
          ) : (
            <p className="text-[12px] text-muted-foreground">In progress</p>
          )}
        </div>
      </div>
    </Panel>
  );
}
