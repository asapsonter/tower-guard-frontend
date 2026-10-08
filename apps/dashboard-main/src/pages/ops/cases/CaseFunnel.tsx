import { Filter } from "lucide-react";
import { Panel } from "@/components/ops/Panel";
import { CASE_STAGES, CASE_STAGE_LABEL, type CaseFile, type CaseStage } from "@/lib/ops";
import { stageColor } from "./caseMeta";

/** Pipeline funnel — how many case files have reached each stage. */
export function CaseFunnel({ cases, active, onStage }: { cases: CaseFile[]; active: CaseStage | null; onStage: (s: CaseStage | null) => void }) {
  const rows = CASE_STAGES.map((s) => ({
    stage: s,
    reached: cases.filter((c) => c.stageDates[s]).length,
    current: cases.filter((c) => c.stage === s).length,
  }));
  const max = Math.max(1, rows[0].reached);
  return (
    <Panel title="Prosecution pipeline" icon={Filter} actions={<span className="hud-chip">{cases.length} case files</span>}>
      <ul className="space-y-1">
        {rows.map((r, i) => {
          const conv = i === 0 ? null : rows[i - 1].reached ? Math.round((r.reached / rows[i - 1].reached) * 100) : 0;
          const on = active === r.stage;
          return (
            <li key={r.stage}>
              <button onClick={() => onStage(on ? null : r.stage)} title="Show cases currently at this stage"
                className={`w-full flex items-center gap-2 rounded px-1.5 py-0.5 text-left ${on ? "bg-primary/10" : "hover:bg-primary/5"}`}>
                <span className="w-24 shrink-0 text-[10px] text-muted-foreground truncate">{CASE_STAGE_LABEL[r.stage]}</span>
                <span className="relative flex-1 h-4">
                  <span className="absolute inset-y-0 rounded-sm" style={{ left: `${(50 - (r.reached / max) * 50).toFixed(2)}%`, width: `${((r.reached / max) * 100).toFixed(2)}%`, background: `${stageColor(r.stage)}55`, border: `1px solid ${stageColor(r.stage)}88` }} />
                </span>
                <span className="w-8 text-right font-mono text-[11px] text-foreground">{r.reached}</span>
                <span className="w-10 text-right font-mono text-[9px] text-muted-foreground">{conv == null ? "" : `${conv}%`}</span>
              </button>
            </li>
          );
        })}
      </ul>
      <p className="mt-2 text-[10px] text-muted-foreground">Bars: case files that reached each stage · % conversion from previous stage. Click a stage to filter cases currently there.</p>
    </Panel>
  );
}
