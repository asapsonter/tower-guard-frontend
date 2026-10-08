import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, FolderSearch, Search } from "lucide-react";
import { Panel } from "@/components/cnii/Panel";
import { Pill } from "@/components/cnii/Pill";
import { timeAgo, type InvestigationCase } from "@/lib/cnii";
import { CASE_STATUS_COLOR, CASE_STATUS_LABEL, isStale } from "./caseModel";

const FIELD = "h-8 rounded-md border border-primary/20 bg-background/60 px-2 text-xs text-foreground focus:outline-none focus:border-primary/50";

export function CaseList({ cases, selectedId, now }: { cases: InvestigationCase[]; selectedId: string; now: number }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | InvestigationCase["status"]>("all");
  const [state, setState] = useState("all");
  const [staleOnly, setStaleOnly] = useState(false);

  const states = useMemo(() => [...new Set(cases.map((c) => c.state))].sort(), [cases]);
  const staleCount = useMemo(() => cases.filter((c) => isStale(c, now)).length, [cases, now]);
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return cases
      .filter((c) => status === "all" || c.status === status)
      .filter((c) => state === "all" || c.state === state)
      .filter((c) => !staleOnly || isStale(c, now))
      .filter((c) => !needle || [c.id, c.title, c.leadInvestigator, c.state, c.notes, ...c.incidentIds].some((s) => s.toLowerCase().includes(needle)))
      .sort((a, b) => b.lastActivityAt.localeCompare(a.lastActivityAt));
  }, [cases, q, status, state, staleOnly, now]);

  return (
    <Panel title="Cases" icon={FolderSearch} actions={<span className="text-[10px] text-muted-foreground font-mono">{filtered.length}/{cases.length}</span>} bodyClassName="p-3 flex flex-col gap-2">
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Case ID, incident, investigator, site…" className={`${FIELD} w-full pl-7`} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className={FIELD} aria-label="Filter by status">
          <option value="all">All statuses</option>
          {(Object.keys(CASE_STATUS_LABEL) as InvestigationCase["status"][]).map((s) => <option key={s} value={s}>{CASE_STATUS_LABEL[s]}</option>)}
        </select>
        <select value={state} onChange={(e) => setState(e.target.value)} className={FIELD} aria-label="Filter by state">
          <option value="all">All states</option>
          {states.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <button
        onClick={() => setStaleOnly((v) => !v)}
        className={`flex items-center gap-1.5 rounded-md border px-2 py-1.5 text-[11px] ${staleOnly ? "border-warning/60 bg-warning/15 text-warning" : "border-warning/25 text-warning/80 hover:bg-warning/10"}`}
      >
        <AlertTriangle className="h-3.5 w-3.5" />
        {staleCount} stale cases (no activity 30+ days){staleOnly ? " · showing only stale" : ""}
      </button>
      <ul className="max-h-[640px] overflow-y-auto -mx-1 pr-1 space-y-1">
        {filtered.map((c) => {
          const stale = isStale(c, now);
          const sel = c.id === selectedId;
          return (
            <li key={c.id}>
              <Link
                to={`/investigations/${c.id}`}
                className={`block rounded-md border px-2.5 py-2 transition-colors ${sel ? "border-primary/60 bg-primary/10" : stale ? "border-warning/30 bg-warning/5 hover:bg-warning/10" : "border-transparent hover:bg-primary/5"}`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] text-primary truncate">{c.id}</span>
                  <Pill color={CASE_STATUS_COLOR[c.status]} className="ml-auto">{CASE_STATUS_LABEL[c.status]}</Pill>
                </div>
                <p className="text-xs text-foreground truncate">{c.title}</p>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  <span className="truncate">{c.state} · {c.leadInvestigator}</span>
                  <span className={`ml-auto shrink-0 font-mono ${stale ? "text-warning" : ""}`}>
                    {stale && <AlertTriangle className="inline h-3 w-3 mr-0.5 -mt-0.5" />}
                    {timeAgo(c.lastActivityAt, now)}
                  </span>
                </div>
              </Link>
            </li>
          );
        })}
        {!filtered.length && <li className="py-8 text-center text-xs text-muted-foreground">No cases match these filters.</li>}
      </ul>
    </Panel>
  );
}
