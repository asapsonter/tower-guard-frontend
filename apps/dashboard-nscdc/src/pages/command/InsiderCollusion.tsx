import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AlertOctagon, ClipboardList, FileSearch, Gavel, GitMerge, Info, ShieldAlert, UserSearch } from "lucide-react";
import type { Incident, InsiderReferral } from "@/lib/cnii";
import { fmtDate, timeAgo, useCnii } from "@/lib/cnii";
import { PageHeader, Panel } from "@/components/cnii/Panel";
import { KpiTile } from "@/components/cnii/KpiTile";
import { Meter, Pill } from "@/components/cnii/Pill";
import { CorrelationTimeline } from "./insider/CorrelationTimeline";
import { DecisionPanel } from "./insider/DecisionPanel";
import { VisitsLog } from "./insider/VisitsLog";
import { DECISION_COLOR, DECISION_LABEL, incidentsBySite, loadDecisions, otherSites, referralLinks, saveDecisions, type Decision } from "./insider/correlate";

const STATUS_LABEL: Record<InsiderReferral["status"], string> = {
  flagged: "Awaiting review",
  under_review: "Under review",
  referred: "Referred to investigation",
  cleared: "Cleared",
};
const STATUS_COLOR: Record<InsiderReferral["status"], string> = {
  flagged: "#f97316",
  under_review: "#eab308",
  referred: "#3b82f6",
  cleared: "#22c55e",
};
const riskColor = (s: number) => (s >= 75 ? "#ef4444" : s >= 55 ? "#f97316" : s >= 40 ? "#eab308" : "#22c55e");

export default function InsiderCollusion() {
  const { snap } = useCnii();
  const [params, setParams] = useSearchParams();
  const focus = params.get("focus");
  const [decisions, setDecisions] = useState<Decision[]>(() => loadDecisions());

  const referrals = useMemo(() => (snap ? [...snap.insiderReferrals].sort((a, b) => b.riskScore - a.riskScore) : []), [snap]);
  const selectedId = focus && referrals.some((r) => r.id === focus) ? focus : referrals[0]?.id ?? null;
  const select = (id: string) => setParams({ focus: id }, { replace: true });

  useEffect(() => {
    if (focus) document.getElementById("referral-detail")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [focus]);

  const bySite = useMemo(() => (snap ? incidentsBySite(snap) : new Map<string, Incident[]>()), [snap]);
  const ref = referrals.find((r) => r.id === selectedId) ?? null;
  const links = useMemo(() => (snap && ref ? referralLinks(ref, snap, bySite) : []), [snap, ref, bySite]);
  const others = useMemo(() => (snap && ref ? otherSites(ref, links, snap, bySite) : []), [snap, ref, links, bySite]);

  if (!snap) return null;

  const decide = (d: Decision) => setDecisions((list) => { const next = [...list, d]; saveDecisions(next); return next; });
  const lastDecision = (id: string) => decisions.filter((d) => d.referralId === id).at(-1);
  const pending = referrals.filter((r) => r.status !== "cleared" && !lastDecision(r.id)).length;
  const noWo = snap.visits.filter((v) => !v.workOrder).length;
  const obstructed = snap.visits.filter((v) => v.cameraObstructed).length;

  const derived = ref ? deriveIndicators(links) : [];
  const caseIds = ref ? [...new Set(ref.linkedIncidentIds.map((id) => snap.incidents.find((i) => i.id === id)?.caseId).filter((c): c is string => !!c))] : [];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Insider-Collusion Investigation"
        subtitle="Work order · technician · vehicle · access time · asset interaction · incident · other sites"
        icon={UserSearch}
      />

      <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 flex items-start gap-3">
        <ShieldAlert className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div className="text-[12px] space-y-1">
          <p className="font-semibold text-foreground">Insider Risk Investigation Referrals — not a finding or label of guilt</p>
          <p className="text-muted-foreground">
            ITIPS correlates operator work-order, access-control, CCTV-health and incident records and raises <span className="text-foreground">referrals that warrant review</span>.
            A referral identifies a <span className="text-foreground">subject of review</span>, never a suspect. Individuals must not be named to operators, suspended or arrested on the basis of a
            correlation; an authorised officer records a decision (open investigation, request information, or clear) and any investigation proceeds under due process.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiTile label="Referrals" value={referrals.length} icon={FileSearch} hint={`${referrals.filter((r) => r.status !== "cleared").length} open`} />
        <KpiTile label="Awaiting human decision" value={pending} icon={Gavel} tone={pending ? "text-warning" : "text-success"} hint="No local decision recorded" />
        <KpiTile label="Visits without work order" value={noWo} icon={ClipboardList} tone={noWo ? "text-destructive" : "text-foreground"} hint={`of ${snap.visits.length} logged visits`} />
        <KpiTile label="Camera obstructed during visit" value={obstructed} icon={AlertOctagon} tone={obstructed ? "text-destructive" : "text-foreground"} />
      </div>

      <div className="grid grid-cols-12 gap-4">
        <Panel title="Insider risk referrals" icon={FileSearch} className="col-span-12 xl:col-span-4" bodyClassName="p-2 space-y-1.5 max-h-[760px] overflow-y-auto">
          {referrals.length === 0 && <p className="text-xs text-muted-foreground p-2">No referrals.</p>}
          {referrals.map((r) => {
            const d = lastDecision(r.id);
            const active = r.id === selectedId;
            return (
              <button key={r.id} onClick={() => select(r.id)}
                className={`w-full text-left rounded-md border px-3 py-2.5 transition-colors ${active ? "border-primary/60 bg-primary/10" : "border-primary/10 hover:border-primary/30"}`}>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-muted-foreground">{r.id}</span>
                  <Pill color={STATUS_COLOR[r.status]}>{STATUS_LABEL[r.status]}</Pill>
                  <span className="ml-auto font-mono text-sm font-bold tabular-nums" style={{ color: riskColor(r.riskScore) }}>{r.riskScore}</span>
                </div>
                <p className="text-[12px] text-foreground mt-1">{r.pattern}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Subject of review: <span className="text-foreground">{r.subject}</span> · {r.subjectKind}</p>
                <Meter value={r.riskScore} color={riskColor(r.riskScore)} className="mt-1.5" />
                <div className="flex items-center gap-2 mt-1.5 text-[10px] text-muted-foreground">
                  <span>{r.linkedVisitIds.length} visits · {r.linkedIncidentIds.length} incidents</span>
                  <span className="ml-auto">{timeAgo(r.createdAt, new Date(snap.generatedAt).getTime())}</span>
                </div>
                {d && <div className="mt-1.5"><Pill color={DECISION_COLOR[d.action]}>{DECISION_LABEL[d.action]} · {d.officer}</Pill></div>}
              </button>
            );
          })}
        </Panel>

        <div id="referral-detail" className="col-span-12 xl:col-span-8 space-y-4 scroll-mt-4">
          {ref ? (
            <>
              <Panel title={`Insider Risk Investigation Referral · ${ref.id}`} icon={ShieldAlert}
                actions={<span className="hud-chip">AI correlation · {ref.riskScore}/100</span>}>
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4">
                  <div className="space-y-2 text-[12px] min-w-0">
                    <div>
                      <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Subject of review</p>
                      <p className="text-foreground font-semibold">{ref.subject} <span className="text-muted-foreground font-normal capitalize">· {ref.subjectKind}</span></p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Correlated pattern</p>
                      <p className="text-foreground">{ref.pattern}</p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground mb-1">Indicators that warrant review</p>
                      <ul className="space-y-1">
                        {[...ref.indicators, ...derived].map((ind, i) => (
                          <li key={i} className="flex gap-2"><Info className="h-3.5 w-3.5 text-warning shrink-0 mt-0.5" /><span>{ind}</span></li>
                        ))}
                      </ul>
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      Provenance: operator work-order system · site access-control log · CCTV health monitor · ITIPS incident records. Raised {fmtDate(ref.createdAt)}.
                    </p>
                  </div>
                  <div className="flex lg:flex-col gap-3 lg:items-end">
                    <div className="text-right">
                      <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Risk score</p>
                      <p className="font-mono text-3xl font-bold tabular-nums" style={{ color: riskColor(ref.riskScore) }}>{ref.riskScore}</p>
                    </div>
                    <Pill color={STATUS_COLOR[ref.status]}>{STATUS_LABEL[ref.status]}</Pill>
                    {caseIds.map((c) => <Link key={c} to={`/investigations/${c}`} className="hud-chip text-primary">{c}</Link>)}
                  </div>
                </div>
              </Panel>

              <Panel title="Correlation timeline · visit → incident per site" icon={GitMerge}>
                <CorrelationTimeline links={links} />
              </Panel>

              <div className="grid grid-cols-12 gap-4">
                <Panel title="Human decision required" icon={Gavel} className="col-span-12 lg:col-span-7">
                  <DecisionPanel referralId={ref.id} history={decisions.filter((d) => d.referralId === ref.id)} onDecide={decide} />
                </Panel>
                <Panel title="Other sites · same contractor, technician or vehicle" icon={FileSearch} className="col-span-12 lg:col-span-5" bodyClassName="p-3 max-h-[340px] overflow-y-auto">
                  {others.length === 0 ? <p className="text-xs text-muted-foreground">No other visits by this subject's crew, technician or vehicle.</p> : (
                    <ul className="space-y-1.5 text-[11px]">
                      {others.map(({ visit: v, incident, gapHours }) => (
                        <li key={v.id} className="rounded-md bg-secondary/30 px-2.5 py-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-foreground truncate">{v.siteName}</span>
                            <span className="text-muted-foreground">· {v.operator}</span>
                            <span className="ml-auto font-mono text-[10px] text-muted-foreground">{fmtDate(v.visitAt)}</span>
                          </div>
                          <p className="text-[10px] text-muted-foreground">{v.technician} · <span className="font-mono">{v.vehiclePlate}</span> · {v.workOrder ?? <span className="text-destructive">no work order</span>}</p>
                          {incident && gapHours != null && (
                            <Link to={`/incident/${incident.id}`} className="text-[10px] text-warning hover:underline">Incident {incident.id} followed +{Math.round(gapHours)}h</Link>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </Panel>
              </div>
            </>
          ) : (
            <Panel><p className="text-xs text-muted-foreground">Select a referral to review its correlation.</p></Panel>
          )}
        </div>
      </div>

      <Panel title="Work-order visit log" icon={ClipboardList} bodyClassName="p-0">
        <VisitsLog snap={snap} bySite={bySite} onReferral={select} />
      </Panel>
    </div>
  );
}

function deriveIndicators(links: ReturnType<typeof referralLinks>): string[] {
  const out: string[] = [];
  const gaps = links.map((l) => l.gapHours).filter((g): g is number => g != null);
  if (gaps.length) out.push(`${gaps.length} of ${links.length} visited site(s) had an incident afterwards (median gap ${Math.round(gaps.sort((a, b) => a - b)[Math.floor(gaps.length / 2)])}h)`);
  const plates = new Set(links.map((l) => l.visit.vehiclePlate));
  if (links.length > 1 && plates.size === 1) out.push(`Same vehicle ${[...plates][0]} on every linked visit`);
  const noWo = links.filter((l) => !l.visit.workOrder).length;
  if (noWo) out.push(`${noWo} visit(s) without a valid work order`);
  const cam = links.filter((l) => l.visit.cameraObstructed).length;
  if (cam) out.push(`${cam} visit(s) with camera obstruction recorded`);
  return out;
}
