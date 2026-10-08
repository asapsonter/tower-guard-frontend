import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  AlertOctagon, BadgeCheck, ClipboardList, DoorOpen, Flag, Info, KeyRound, ListFilter, Search, ShieldAlert, Users, X,
} from "lucide-react";
import { KpiTile } from "@/components/ops/KpiTile";
import { PageHeader, Panel } from "@/components/ops/Panel";
import { Pill } from "@/components/ops/Pill";
import {
  ACCESS_STATUS_COLOR, INSIDER_FLAG_LABEL, fmtDate, timeAgo, useOps, useNow,
  type AccessStatus, type AccessVisit, type InsiderFlag,
} from "@/lib/ops";
import { STATUS_LABEL, VisitFlow, hhmm, windowCheck } from "./access/VisitFlow";
import { SubjectsPanel } from "./access/SubjectsPanel";

const STATUSES: AccessStatus[] = ["AUTHORIZED", "IN_PROGRESS", "OUTSIDE_WINDOW", "NO_WORK_ORDER", "SCOPE_EXCEEDED", "INSIDER_RISK"];
const FLAGS = Object.keys(INSIDER_FLAG_LABEL) as InsiderFlag[];
const MAX_ROWS = 150;

function chip(active: boolean) {
  return `rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${active ? "border-primary bg-primary/20 text-primary" : "border-primary/20 text-muted-foreground hover:text-foreground"}`;
}

function matches(v: AccessVisit, q: string) {
  const n = q.toLowerCase();
  return [v.id, v.person, v.employer, v.vehiclePlate, v.siteId, v.siteName, v.workOrder ?? "", v.role].some((x) => x.toLowerCase().includes(n));
}

export default function AccessInsider() {
  const { snap } = useOps();
  const now = useNow(30_000);
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const status = (params.get("status") as AccessStatus | null) ?? null;
  const flag = (params.get("flag") as InsiderFlag | null) ?? null;

  const update = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    setParams(next, { replace: true });
  };

  const visitMap = useMemo(() => new Map((snap?.visits ?? []).map((v) => [v.id, v])), [snap]);

  const stats = useMemo(() => {
    const visits = snap?.visits ?? [];
    const byStatus = Object.fromEntries(STATUSES.map((s) => [s, visits.filter((v) => v.status === s).length])) as Record<AccessStatus, number>;
    const byFlag = FLAGS.map((f) => ({ flag: f, count: visits.filter((v) => v.flags.includes(f)).length }));
    return { byStatus, byFlag, flagged: visits.filter((v) => v.flags.length).length };
  }, [snap]);

  if (!snap) return null;

  const visits = snap.visits;
  const insiderEvents = visits.filter((v) => v.status === "INSIDER_RISK");
  const onSite = visits.filter((v) => v.status === "IN_PROGRESS");
  const searched = q ? visits.filter((v) => matches(v, q)) : visits;
  const rows = searched.filter((v) => (!status || v.status === status) && (!flag || v.flags.includes(flag)));
  const selected = visitMap.get(params.get("visit") ?? "") ?? (q ? rows[0] : undefined) ?? insiderEvents[0] ?? visits.find((v) => v.workOrder === "MTN-88433") ?? visits[0];
  const authorisedPct = visits.length ? Math.round((stats.byStatus.AUTHORIZED / visits.length) * 1000) / 10 : 0;
  const maxFlag = Math.max(1, ...stats.byFlag.map((f) => f.count));

  return (
    <>
      <PageHeader title="Authorized Access & Insider Intelligence" icon={KeyRound}
        subtitle="Was this person supposed to be here? Every site visit reconciled against employer, work order and approved window"
        actions={<span className="hud-chip !text-warning !border-warning/40"><ShieldAlert className="h-3 w-3" /> Correlations warrant review — never accusations</span>} />

      {insiderEvents.map((v) => {
        const obscured = v.activities.find((a) => /obscured/i.test(a));
        return (
          <div key={v.id} className="glass-panel border-destructive/70 bg-destructive/10 p-4 shadow-[0_0_24px_rgba(239,68,68,0.25)]">
            <div className="flex flex-wrap items-center gap-2">
              <AlertOctagon className="h-6 w-6 text-destructive animate-pulse" />
              <p className="font-display text-[15px] font-bold tracking-wide text-destructive">INSIDER-RISK EVENT</p>
              <Pill color="#ef4444" solid>{v.id}</Pill>
              <span className="text-[11px] text-muted-foreground">{fmtDate(v.arrival)} · {timeAgo(v.arrival, now)}</span>
              <div className="ml-auto flex gap-2">
                <button onClick={() => update({ visit: v.id })} className="rounded border border-destructive/50 px-2.5 py-1 text-[11px] font-semibold text-destructive hover:bg-destructive/15">Open visit flow</button>
                {v.linkedIncidentId && <Link to={`/incidents/${v.linkedIncidentId}`} className="rounded border border-destructive/50 px-2.5 py-1 text-[11px] font-semibold text-destructive hover:bg-destructive/15">Incident {v.linkedIncidentId} →</Link>}
              </div>
            </div>
            <div className="mt-2 grid grid-cols-2 md:grid-cols-5 gap-2 text-[12px]">
              <BannerFact label="Technician" value={`${v.person}`} sub={v.employer} />
              <BannerFact label="Entered" value={hhmm(v.arrival)} sub={`${v.siteId} · ${v.siteName}`} />
              <BannerFact label="Work order" value={v.workOrder ?? "NONE"} sub={v.windowStart ? `Window ${hhmm(v.windowStart)}–${hhmm(v.windowEnd)}` : "No approved window"} />
              <BannerFact label="Asset accessed" value={v.activities.find((a) => /cabinet/i.test(a)) ?? v.activities[0] ?? "—"} sub={v.flags.includes("out_of_scope_asset") ? "Outside job scope" : undefined} />
              <BannerFact label="CCTV" value={obscured ? "Camera obscured" : "No obstruction"} sub={obscured?.match(/\(([^)]+)\)/)?.[1]} />
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              ITIPS has correlated these signals for <span className="text-foreground">urgent human review</span>. This is not a determination of wrongdoing — the investigating officer decides next steps.
            </p>
          </div>
        );
      })}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        <KpiTile label="Site visits (30 d)" icon={ClipboardList} value={visits.length} onClick={() => update({ status: null, flag: null })} />
        <KpiTile label="Authorized" icon={BadgeCheck} value={`${authorisedPct}%`} tone="text-success" hint={`${stats.byStatus.AUTHORIZED} visits`} onClick={() => update({ status: "AUTHORIZED", flag: null })} />
        <KpiTile label="On site now" icon={DoorOpen} value={onSite.length} tone="text-primary" onClick={() => update({ status: "IN_PROGRESS", flag: null })} />
        <KpiTile label="Flagged visits" icon={Flag} value={stats.flagged} tone="text-warning" hint="≥ 1 correlation flag" />
        <KpiTile label="Insider-risk events" icon={AlertOctagon} value={insiderEvents.length} tone="text-destructive" onClick={() => update({ status: "INSIDER_RISK", flag: null })} />
        <KpiTile label="Subjects for review" icon={Users} value={snap.insiderSubjects.length} hint="people · vehicles" />
      </div>

      <div className="grid grid-cols-12 gap-4">
        <Panel title={selected ? `Visit ${selected.id} — access reconciliation` : "Visit"} icon={KeyRound} className="col-span-12 xl:col-span-9"
          actions={selected && <Pill color={ACCESS_STATUS_COLOR[selected.status]} solid>{STATUS_LABEL[selected.status]}</Pill>}>
          {selected ? <VisitFlow visit={selected} /> : <p className="text-xs text-muted-foreground">No visits on record.</p>}
        </Panel>

        <div className="col-span-12 xl:col-span-3 flex flex-col gap-4">
          <Panel title="On site now" icon={DoorOpen} actions={<span className="hud-chip">{onSite.length}</span>} bodyClassName="p-2">
            {onSite.length === 0 ? <p className="p-2 text-xs text-muted-foreground">No technicians on site.</p> : (
              <ul className="space-y-1">
                {onSite.map((v) => (
                  <li key={v.id}>
                    <button onClick={() => update({ visit: v.id })} className={`w-full rounded-md border px-2 py-1.5 text-left ${v.id === selected?.id ? "border-primary/60 bg-primary/10" : "border-primary/10 hover:border-primary/30"}`}>
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                        <span className="text-[12px] font-semibold text-foreground truncate">{v.person}</span>
                        <span className="ml-auto font-mono text-[10px] text-primary">{timeAgo(v.arrival, now)}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground truncate">{v.employer} · <span className="font-mono">{v.siteId}</span></p>
                      <p className="text-[10px] text-muted-foreground font-mono">WO {v.workOrder} · window {hhmm(v.windowStart)}–{hhmm(v.windowEnd)}</p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
          <Panel title="Why this matters" icon={Info} bodyClassName="p-3">
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Access control at remote telecom sites is a recognised industry weakness — the <span className="text-foreground">GSMA</span> has highlighted the limits of physical-key access for unmanned sites. ITIPS reconciles every entry against the work order, approved window and CCTV so that
              authorised access is provable and unauthorised access is visible.
            </p>
            <p className="mt-2 text-[10px] text-muted-foreground">Arrival is independently verified by gate access record, geo-tagged check-in and CCTV.</p>
          </Panel>
        </div>

        <Panel title="Site visits log" icon={ListFilter} className="col-span-12 xl:col-span-8" bodyClassName="p-0"
          actions={<span className="hud-chip">{rows.length} / {visits.length}</span>}>
          <div className="flex flex-wrap items-center gap-2 border-b border-primary/10 px-3 py-2">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input value={q} onChange={(e) => update({ q: e.target.value || null })} placeholder="Person, contractor, plate, site, WO…"
                className="w-full rounded-md border border-primary/20 bg-secondary/60 py-1 pl-7 pr-6 text-[11px] text-foreground focus:outline-none focus:border-primary/60" />
              {q && <button onClick={() => update({ q: null })} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X className="h-3 w-3" /></button>}
            </div>
            <button className={chip(!status)} onClick={() => update({ status: null })}>All</button>
            {STATUSES.map((s) => (
              <button key={s} className={chip(status === s)} onClick={() => update({ status: status === s ? null : s })}>
                <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full align-middle" style={{ background: ACCESS_STATUS_COLOR[s] }} />
                {STATUS_LABEL[s]} <span className="font-mono">{searched.filter((v) => v.status === s).length}</span>
              </button>
            ))}
            {flag && (
              <button onClick={() => update({ flag: null })} className="flex items-center gap-1 rounded-full border border-warning/50 bg-warning/10 px-2 py-0.5 text-[10px] text-warning">
                {INSIDER_FLAG_LABEL[flag]} <X className="h-3 w-3" />
              </button>
            )}
          </div>
          <div className="max-h-[460px] overflow-auto">
            <table className="w-full min-w-[820px] text-[11px]">
              <thead className="sticky top-0 bg-card/95 backdrop-blur">
                <tr className="text-left text-[9px] uppercase tracking-[0.14em] text-muted-foreground border-b border-primary/10">
                  <th className="px-3 py-2">Arrival</th>
                  <th className="px-2 py-2">Person · employer</th>
                  <th className="px-2 py-2">Work order</th>
                  <th className="px-2 py-2">Site</th>
                  <th className="px-2 py-2">Window → actual</th>
                  <th className="px-2 py-2">Status</th>
                  <th className="px-3 py-2">Flags</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, MAX_ROWS).map((v) => {
                  const w = windowCheck(v);
                  return (
                    <tr key={v.id} onClick={() => update({ visit: v.id })}
                      className={`cursor-pointer border-b border-primary/5 ${v.id === selected?.id ? "bg-primary/10" : "hover:bg-primary/5"}`}>
                      <td className="px-3 py-1.5 font-mono whitespace-nowrap"><span className="text-foreground">{hhmm(v.arrival)}</span> <span className="text-muted-foreground">{fmtDate(v.arrival).slice(0, 6)}</span></td>
                      <td className="px-2 py-1.5"><span className="text-foreground">{v.person}</span><span className="block text-[10px] text-muted-foreground">{v.employer}</span></td>
                      <td className={`px-2 py-1.5 font-mono ${v.workOrder ? "text-foreground" : "text-destructive"}`}>{v.workOrder ?? "NONE"}</td>
                      <td className="px-2 py-1.5"><Link to={`/sites/${v.siteId}`} onClick={(e) => e.stopPropagation()} className="font-mono text-primary hover:underline">{v.siteId}</Link></td>
                      <td className="px-2 py-1.5 font-mono whitespace-nowrap">
                        {v.windowStart ? `${hhmm(v.windowStart)}–${hhmm(v.windowEnd)}` : "—"}
                        <span className={`block text-[10px] ${w.ok ? "text-muted-foreground" : "text-warning"}`}>{hhmm(v.arrival)}–{v.exit ? hhmm(v.exit) : "now"}</span>
                      </td>
                      <td className="px-2 py-1.5"><Pill color={ACCESS_STATUS_COLOR[v.status]}>{STATUS_LABEL[v.status]}</Pill></td>
                      <td className="px-3 py-1.5 text-[10px] text-muted-foreground">{v.flags.length ? `${v.flags.length} · ${INSIDER_FLAG_LABEL[v.flags[0]]}` : "—"}</td>
                    </tr>
                  );
                })}
                {rows.length === 0 && <tr><td colSpan={7} className="px-3 py-6 text-center text-xs text-muted-foreground">No visits match these filters.</td></tr>}
              </tbody>
            </table>
            {rows.length > MAX_ROWS && <p className="px-3 py-2 text-[10px] text-muted-foreground">Showing {MAX_ROWS} most recent of {rows.length}. Refine the search to narrow down.</p>}
          </div>
        </Panel>

        <Panel title="Insider analytics — correlation flags" icon={Flag} className="col-span-12 xl:col-span-4"
          actions={<span className="text-[10px] text-muted-foreground">click to filter</span>}>
          <ul className="space-y-1.5">
            {stats.byFlag.map(({ flag: f, count }) => (
              <li key={f}>
                <button onClick={() => update({ flag: flag === f ? null : f, status: null })}
                  className={`w-full rounded-md border px-2 py-1 text-left ${flag === f ? "border-warning/60 bg-warning/10" : "border-transparent hover:border-primary/20"}`}>
                  <div className="flex items-center justify-between gap-2 text-[11px]">
                    <span className="text-foreground truncate">{INSIDER_FLAG_LABEL[f]}</span>
                    <span className={`font-mono tabular-nums ${count ? "text-warning" : "text-muted-foreground"}`}>{count}</span>
                  </div>
                  <div className="mt-0.5 h-1 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full rounded-full bg-warning/80" style={{ width: `${(count / maxFlag) * 100}%` }} />
                  </div>
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[10px] text-muted-foreground">Flags are statistical correlations across access records, work orders, CCTV and incident data. Each requires human review before any action.</p>
        </Panel>

        <div className="col-span-12">
          <SubjectsPanel subjects={snap.insiderSubjects} visits={visitMap} onVisit={(id) => update({ visit: id })} />
        </div>
      </div>
    </>
  );
}

function BannerFact({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-md border border-destructive/40 bg-background/40 px-2.5 py-1.5 min-w-0">
      <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className="font-mono font-bold text-destructive truncate">{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground truncate">{sub}</p>}
    </div>
  );
}
