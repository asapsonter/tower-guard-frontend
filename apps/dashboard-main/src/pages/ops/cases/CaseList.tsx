import { Link } from "react-router-dom";
import { FolderSearch, Search } from "lucide-react";
import { Panel } from "@/components/ops/Panel";
import { Pill } from "@/components/ops/Pill";
import { CASE_STAGES, CASE_STAGE_LABEL, fmtDate, type CaseFile, type CaseStage } from "@/lib/ops";
import { stageColor } from "./caseMeta";

interface CaseListProps {
  cases: CaseFile[];
  allCases: CaseFile[];
  selectedId?: string;
  query: string;
  onQuery: (q: string) => void;
  stage: CaseStage | null;
  onStage: (s: CaseStage | null) => void;
}

export function CaseList({ cases, allCases, selectedId, query, onQuery, stage, onStage }: CaseListProps) {
  return (
    <Panel title="Evidence case files" icon={FolderSearch} bodyClassName="p-0" actions={<span className="hud-chip">{cases.length}</span>}>
      <div className="p-3 space-y-2 border-b border-primary/10">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input value={query} onChange={(e) => onQuery(e.target.value)} placeholder="Case, incident, site, police ref, suspect…"
            className="h-8 w-full rounded-md border border-primary/25 bg-background/60 pl-7 pr-2 text-[12px] text-foreground outline-none focus:border-primary" />
        </div>
        <select value={stage ?? ""} onChange={(e) => onStage((e.target.value || null) as CaseStage | null)}
          className="h-8 w-full rounded-md border border-primary/25 bg-background/60 px-2 text-[12px] text-foreground outline-none focus:border-primary">
          <option value="">All stages ({allCases.length})</option>
          {CASE_STAGES.map((s) => <option key={s} value={s}>{CASE_STAGE_LABEL[s]} ({allCases.filter((c) => c.stage === s).length})</option>)}
        </select>
      </div>
      <ul className="max-h-[640px] overflow-y-auto divide-y divide-primary/10">
        {cases.map((c) => {
          const sel = c.id === selectedId;
          return (
            <li key={c.id}>
              <Link to={`/cases/${c.id}`} className={`block px-3 py-2 ${sel ? "bg-primary/10" : "hover:bg-primary/5"}`}
                style={{ boxShadow: sel ? "inset 3px 0 0 hsl(var(--primary))" : undefined }}>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] text-primary">{c.id}</span>
                  <span className="ml-auto"><Pill color={stageColor(c.stage)}>{CASE_STAGE_LABEL[c.stage]}</Pill></span>
                </div>
                <p className="mt-0.5 text-[12px] text-foreground truncate">{c.title}</p>
                <p className="text-[10px] text-muted-foreground">
                  {fmtDate(c.stageDates.incident)} · {c.evidence.length} evidence · {c.suspects.length} suspect{c.suspects.length === 1 ? "" : "s"}
                </p>
              </Link>
            </li>
          );
        })}
        {cases.length === 0 && <li className="p-4 text-xs text-muted-foreground">No case files match.</li>}
      </ul>
    </Panel>
  );
}
