import { Check } from "lucide-react";
import { SLA_STAGES, fmtDuration, fmtTime, secondsBetween, type Incident } from "@/lib/cnii";
import { STAGE_LABEL } from "./slaMetrics";

/** Horizontal 9-stage tracker with timestamps and elapsed time from alert. */
export function StageTracker({ inc, compact = false }: { inc: Incident; compact?: boolean }) {
  const { stages } = inc.response;
  const alert = stages.alert ?? inc.detectedAt;
  const lastDone = SLA_STAGES.reduce((acc, s, i) => (stages[s] ? i : acc), -1);

  return (
    <div className="overflow-x-auto">
      <ol className={`flex ${compact ? "min-w-[620px]" : "min-w-[760px]"}`}>
        {SLA_STAGES.map((s, i) => {
          const at = stages[s];
          const done = !!at;
          const current = !done && i === lastDone + 1 && inc.status !== "closed";
          const color = done ? "bg-primary border-primary text-primary-foreground" : current ? "border-warning text-warning animate-pulse" : "border-primary/20 text-muted-foreground";
          return (
            <li key={s} className="relative flex-1 flex flex-col items-center text-center">
              {i > 0 && <span className={`absolute top-3 right-1/2 w-full h-0.5 ${done ? "bg-primary" : "bg-primary/15"}`} />}
              <span className={`relative z-10 h-6 w-6 rounded-full border-2 flex items-center justify-center text-[9px] font-bold bg-card ${color}`}>
                {done ? <Check className="h-3 w-3" /> : i + 1}
              </span>
              <span className={`mt-1 text-[10px] font-semibold ${done ? "text-foreground" : current ? "text-warning" : "text-muted-foreground"}`}>{STAGE_LABEL[s]}</span>
              {!compact && (
                <>
                  <span className="font-mono text-[10px] text-muted-foreground tabular-nums">{at ? fmtTime(at) : current ? "pending" : "—"}</span>
                  {at && i > 0 && <span className="font-mono text-[9px] text-primary/80 tabular-nums">+{fmtDuration(secondsBetween(alert, at))}</span>}
                </>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
