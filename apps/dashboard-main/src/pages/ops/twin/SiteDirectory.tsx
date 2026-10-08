import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Search, Siren, Building2 } from "lucide-react";
import { Panel } from "@/components/ops/Panel";
import { SITE_STATES, SITE_STATE_COLOR, SITE_STATE_LABEL, type ProtectionState, type SiteClass, type SiteState, type SiteSummary } from "@/lib/ops";
import { PROTECTION_COLOR, PROTECTION_SHORT, PROTECTION_STATES, riskBand, riskColor } from "../health/protection";

const PAGE = 15;
const CLASSES: SiteClass[] = ["Hub", "P1", "P2", "P3"];
const RISK_BANDS = ["Very high", "High", "Medium", "Low"] as const;
type SortKey = "priority" | "risk" | "protection" | "id";

const selectCls = "h-7 min-w-0 rounded-md border border-primary/20 bg-background/60 px-1.5 text-[11px] text-foreground focus:outline-none focus:border-primary/50";

/** Searchable, filterable, paginated directory of all protected sites. */
export function SiteDirectory({ sites, selectedId }: { sites: SiteSummary[]; selectedId?: string }) {
  const [q, setQ] = useState("");
  const [state, setState] = useState("all");
  const [cls, setCls] = useState<SiteClass | "all">("all");
  const [status, setStatus] = useState<SiteState | "all">("all");
  const [prot, setProt] = useState<ProtectionState | "all">("all");
  const [risk, setRisk] = useState<(typeof RISK_BANDS)[number] | "all">("all");
  const [sort, setSort] = useState<SortKey>("priority");
  const [page, setPage] = useState(0);

  const states = useMemo(() => [...new Set(sites.map((s) => s.state))].sort(), [sites]);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const out = sites.filter((s) =>
      (!needle || s.id.toLowerCase().includes(needle) || s.name.toLowerCase().includes(needle) || s.clusterId.toLowerCase().includes(needle)) &&
      (state === "all" || s.state === state) &&
      (cls === "all" || s.siteClass === cls) &&
      (status === "all" || s.status === status) &&
      (prot === "all" || s.protectionState === prot) &&
      (risk === "all" || riskBand(s.riskScore) === risk));
    const sev = (s: SiteSummary) => SITE_STATES.indexOf(s.status) + (s.activeIncidentId ? 10 : 0);
    out.sort((a, b) =>
      sort === "risk" ? b.riskScore - a.riskScore
        : sort === "protection" ? a.protectionScore - b.protectionScore
          : sort === "id" ? a.id.localeCompare(b.id)
            : sev(b) - sev(a) || b.riskScore - a.riskScore);
    return out;
  }, [sites, q, state, cls, status, prot, risk, sort]);

  useEffect(() => { setPage(0); }, [q, state, cls, status, prot, risk, sort]);
  const pages = Math.max(1, Math.ceil(rows.length / PAGE));
  const slice = rows.slice(page * PAGE, page * PAGE + PAGE);

  return (
    <Panel title="Site directory" icon={Building2} bodyClassName="p-0 flex flex-col"
      actions={<span className="font-mono text-[10px] text-muted-foreground tabular-nums">{rows.length.toLocaleString("en-GB")} / {sites.length.toLocaleString("en-GB")}</span>}>
      <div className="space-y-2 border-b border-primary/10 p-3">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Site ID, name or cluster…"
            className="h-8 w-full rounded-md border border-primary/20 bg-background/60 pl-7 pr-2 text-[12px] placeholder:text-muted-foreground focus:outline-none focus:border-primary/50" />
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          <select aria-label="State" value={state} onChange={(e) => setState(e.target.value)} className={selectCls}>
            <option value="all">All states</option>
            {states.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select aria-label="Class" value={cls} onChange={(e) => setCls(e.target.value as SiteClass | "all")} className={selectCls}>
            <option value="all">All classes</option>
            {CLASSES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value as SiteState | "all")} className={selectCls}>
            <option value="all">Any status</option>
            {SITE_STATES.map((s) => <option key={s} value={s}>{SITE_STATE_LABEL[s]}</option>)}
          </select>
          <select aria-label="Protection" value={prot} onChange={(e) => setProt(e.target.value as ProtectionState | "all")} className={selectCls}>
            <option value="all">Any protection</option>
            {PROTECTION_STATES.map((p) => <option key={p} value={p}>{PROTECTION_SHORT[p]}</option>)}
          </select>
          <select aria-label="Risk" value={risk} onChange={(e) => setRisk(e.target.value as (typeof RISK_BANDS)[number] | "all")} className={selectCls}>
            <option value="all">Any risk</option>
            {RISK_BANDS.map((r) => <option key={r} value={r}>{r} risk</option>)}
          </select>
          <select aria-label="Sort" value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className={selectCls}>
            <option value="priority">Sort: priority</option>
            <option value="risk">Sort: 72h risk</option>
            <option value="protection">Sort: weakest protection</option>
            <option value="id">Sort: site ID</option>
          </select>
        </div>
      </div>

      <ul className="flex-1 divide-y divide-primary/5 overflow-y-auto max-h-[70vh] xl:max-h-none xl:h-[calc(100vh-330px)] min-h-[300px]">
        {slice.map((s) => {
          const active = s.id === selectedId;
          return (
            <li key={s.id}>
              <Link to={`/sites/${s.id}`}
                className={`flex items-center gap-2 px-3 py-2 transition-colors ${active ? "bg-primary/15 border-l-2 border-primary" : "border-l-2 border-transparent hover:bg-primary/5"}`}>
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: SITE_STATE_COLOR[s.status], boxShadow: `0 0 6px ${SITE_STATE_COLOR[s.status]}` }} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[11px] text-primary">{s.id}</span>
                    <span className="hud-chip !px-1 !py-0 !text-[9px]">{s.siteClass}</span>
                    {s.activeIncidentId && <Siren className="h-3 w-3 text-destructive animate-pulse" />}
                  </div>
                  <p className="truncate text-[11px] text-foreground">{s.name}</p>
                  <p className="truncate text-[10px] text-muted-foreground">
                    {s.state} · <span style={{ color: PROTECTION_COLOR[s.protectionState] }}>{PROTECTION_SHORT[s.protectionState]}</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-[13px] font-bold tabular-nums" style={{ color: riskColor(s.riskScore) }}>{s.riskScore}</p>
                  <p className="text-[8px] uppercase tracking-[0.14em] text-muted-foreground">risk</p>
                </div>
              </Link>
            </li>
          );
        })}
        {!slice.length && <li className="p-6 text-center text-[12px] text-muted-foreground">No sites match these filters.</li>}
      </ul>

      <div className="flex items-center gap-2 border-t border-primary/10 px-3 py-2">
        <button disabled={page === 0} onClick={() => setPage((p) => p - 1)} className="rounded border border-primary/20 p-1 text-primary disabled:opacity-30" aria-label="Previous page">
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        <span className="font-mono text-[10px] text-muted-foreground tabular-nums">page {page + 1} / {pages}</span>
        <button disabled={page >= pages - 1} onClick={() => setPage((p) => p + 1)} className="rounded border border-primary/20 p-1 text-primary disabled:opacity-30" aria-label="Next page">
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </Panel>
  );
}
