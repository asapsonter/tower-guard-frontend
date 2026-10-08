import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import {
  FolderSearch, ArrowRight, Siren, CalendarClock, History, UserCheck, MessageSquareText, Building2, CheckCircle2, Circle, AlertTriangle,
  ClipboardList, StickyNote, Link2,
} from "lucide-react";
import { Panel, PageHeader } from "@/components/cnii/Panel";
import { Pill, Meter } from "@/components/cnii/Pill";
import { useCnii, useNow, fmtDate, timeAgo } from "@/lib/cnii";
import { CaseList } from "./investigations/CaseList";
import { CaseGraphPanel } from "./investigations/CaseGraphPanel";
import { CctvMetadata, EvidenceGroups, LinkedIncidents, PeoplePanel, VehiclesProperty } from "./investigations/CaseRecords";
import {
  CASE_STATUS_COLOR, CASE_STATUS_LABEL, FEATURED_CASE, caseProgress, daysSince, isStale, linkedCases,
} from "./investigations/caseModel";

export default function Investigations() {
  const { snap } = useCnii();
  const { id } = useParams();
  const now = useNow(60_000);

  const c = useMemo(() => {
    if (!snap) return undefined;
    return snap.cases.find((x) => x.id === id) ?? snap.cases.find((x) => x.id === FEATURED_CASE) ?? snap.cases[0];
  }, [snap, id]);

  if (!snap) return null;

  const openCount = snap.cases.filter((x) => x.status === "open" || x.status === "referred").length;
  const header = (
    <PageHeader
      title="Investigation Workspace"
      subtitle="Controlled incidents transition automatically from Incident Command to Investigation · case file as a connected graph, not a folder of PDFs"
      icon={FolderSearch}
      actions={<span className="hud-chip">{openCount} open / referred · {snap.cases.length} total</span>}
    />
  );

  if (!c) {
    return (
      <>
        {header}
        <Panel><p className="py-10 text-center text-xs text-muted-foreground">No investigation cases on record.</p></Panel>
      </>
    );
  }

  const evidence = snap.evidence.filter((e) => e.caseId === c.id);
  const suspects = c.suspectIds.map((sid) => snap.suspects.find((s) => s.id === sid)).filter((s): s is NonNullable<typeof s> => !!s);
  const steps = caseProgress(c, evidence, suspects);
  const pct = Math.round((steps.filter((s) => s.done).length / steps.length) * 100);
  const stale = isStale(c, now);
  const firstInc = c.incidentIds.map((x) => snap.incidents.find((i) => i.id === x)).find(Boolean);
  const notFound = id && id !== c.id;
  const related = linkedCases(c, snap.cases);
  const witnessStatements = c.witnesses.filter((w) => w.statementTaken).length;

  return (
    <>
      {header}
      {notFound && (
        <div className="glass-panel px-4 py-2 text-xs text-warning flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" /> Case <span className="font-mono">{id}</span> not found — showing {c.id}.
        </div>
      )}

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-4 2xl:col-span-3 min-w-0">
          <CaseList cases={snap.cases} selectedId={c.id} now={now} />
        </div>

        <div className="col-span-12 lg:col-span-8 2xl:col-span-9 min-w-0 space-y-4">
          {/* Case header */}
          <section className="glass-panel p-4 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm font-bold text-primary text-glow">{c.id}</span>
              <Pill color={CASE_STATUS_COLOR[c.status]} solid>{CASE_STATUS_LABEL[c.status]}</Pill>
              {stale && <Pill color="#f97316"><AlertTriangle className="h-3 w-3" /> Stale · {daysSince(c.lastActivityAt, now)}d no activity</Pill>}
              <span className="ml-auto text-[10px] text-muted-foreground">{c.state} · {c.stateCommandId}</span>
            </div>
            <h2 className="text-base font-semibold text-foreground">{c.title}</h2>

            {/* Incident Command → Investigation transition */}
            <div className="flex flex-wrap items-center gap-2 rounded-md border border-primary/15 bg-primary/5 px-3 py-2 text-[11px]">
              <span className="inline-flex items-center gap-1 text-foreground"><Siren className="h-3.5 w-3.5 text-destructive" /> Incident Command</span>
              <ArrowRight className="h-3.5 w-3.5 text-primary" />
              <span className="inline-flex items-center gap-1 text-foreground"><FolderSearch className="h-3.5 w-3.5 text-primary" /> Investigation</span>
              <span className="text-muted-foreground">
                opened automatically {fmtDate(c.openedAt)} from {firstInc ? <Link to={`/incident/${firstInc.id}`} className="font-mono text-primary hover:underline">{firstInc.id}</Link> : "the incident"}
                {firstInc && !["contained", "closed"].includes(firstInc.status)
                  ? " — opened early; the live incident remains under Incident Command until controlled"
                  : " once the incident was controlled"}
              </span>
            </div>

            {/* Activity summary */}
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
              <Stat icon={CalendarClock} label="Opened" value={fmtDate(c.openedAt)} />
              <Stat icon={History} label="Last activity" value={timeAgo(c.lastActivityAt, now)} tone={stale ? "text-warning" : undefined} />
              <Stat icon={UserCheck} label="Lead investigator" value={c.leadInvestigator} />
              <Stat icon={MessageSquareText} label="Officer statements" value={c.officerStatements} />
              <Stat icon={Building2} label="Operator statements" value={c.operatorStatements} />
              <Stat icon={ClipboardList} label="Witness statements" value={`${witnessStatements}/${c.witnesses.length}`} />
            </div>

            {/* Progress */}
            <div>
              <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                <span>Case progress</span>
                <span className="font-mono text-foreground">{pct}%</span>
              </div>
              <Meter value={pct} className="mt-1" />
              <ol className="mt-2 grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-2">
                {steps.map((s) => (
                  <li key={s.label} className="flex items-start gap-1.5 min-w-0">
                    {s.done ? <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0 mt-0.5" /> : <Circle className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />}
                    <span className="min-w-0">
                      <span className={`block text-[11px] leading-tight ${s.done ? "text-foreground" : "text-muted-foreground"}`}>{s.label}</span>
                      <span className="block text-[9px] text-muted-foreground truncate">{s.detail}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          <CaseGraphPanel key={c.id} c={c} snap={snap} />

          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12 xl:col-span-6 space-y-4 min-w-0">
              <LinkedIncidents c={c} snap={snap} />
              <PeoplePanel c={c} snap={snap} />
            </div>
            <div className="col-span-12 xl:col-span-6 space-y-4 min-w-0">
              <VehiclesProperty c={c} snap={snap} />
              <Panel title="Other cases connected" icon={Link2} bodyClassName="p-2">
                {related.length ? (
                  <ul className="space-y-1">
                    {related.slice(0, 8).map((r) => (
                      <li key={r.c.id}>
                        <Link to={`/investigations/${r.c.id}`} className="flex items-center gap-2 rounded px-1.5 py-1 hover:bg-primary/5">
                          <span className="font-mono text-xs text-primary">{r.c.id}</span>
                          <span className="text-[10px] text-muted-foreground truncate">
                            {r.sharedSuspects.length ? `${r.sharedSuspects.length} shared suspect${r.sharedSuspects.length > 1 ? "s" : ""}` : ""}
                            {r.sharedSuspects.length && r.sharedVehicles.length ? " · " : ""}
                            {r.sharedVehicles.length ? `${r.sharedVehicles.length} shared vehicle${r.sharedVehicles.length > 1 ? "s" : ""}` : ""}
                          </span>
                          <Pill color={CASE_STATUS_COLOR[r.c.status]} className="ml-auto">{CASE_STATUS_LABEL[r.c.status]}</Pill>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : <p className="py-3 text-center text-[11px] text-muted-foreground">No other case shares a suspect or vehicle.</p>}
              </Panel>
              {c.notes && (
                <Panel title="Investigator notes" icon={StickyNote}>
                  <p className="text-xs text-foreground leading-relaxed">{c.notes}</p>
                </Panel>
              )}
            </div>
          </div>

          <EvidenceGroups items={evidence} />
          <CctvMetadata items={evidence} />
        </div>
      </div>
    </>
  );
}

function Stat({ icon: Icon, label, value, tone }: { icon: typeof History; label: string; value: string | number; tone?: string }) {
  return (
    <div className="min-w-0">
      <p className="flex items-center gap-1 text-[9px] uppercase tracking-[0.14em] text-muted-foreground truncate"><Icon className="h-3 w-3 text-primary/80" />{label}</p>
      <p className={`text-xs font-mono tabular-nums truncate ${tone ?? "text-foreground"}`}>{value}</p>
    </div>
  );
}
