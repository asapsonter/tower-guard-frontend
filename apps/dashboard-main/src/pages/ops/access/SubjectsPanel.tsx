import { Link } from "react-router-dom";
import { Car, HardHat, Scale, UserSearch } from "lucide-react";
import { Panel } from "@/components/ops/Panel";
import { Meter, Pill } from "@/components/ops/Pill";
import { INSIDER_FLAG_LABEL, type AccessVisit, type InsiderSubject } from "@/lib/ops";
import { DeciderField, DecisionButtons, useDecisionLog } from "./decisions";

const scoreColor = (s: number) => (s >= 80 ? "#ef4444" : s >= 60 ? "#f97316" : s >= 40 ? "#eab308" : "#22c55e");

/** Ranked review queue — correlations that warrant review, decided by people. */
export function SubjectsPanel({ subjects, visits, onVisit }: { subjects: InsiderSubject[]; visits: Map<string, AccessVisit>; onVisit: (id: string) => void }) {
  const log = useDecisionLog("itips.access.decisions");
  return (
    <Panel title="Insider-risk review queue" icon={UserSearch} bodyClassName="p-0"
      actions={<><span className="hud-chip">{subjects.length} subjects</span><DeciderField name={log.name} setName={log.setName} /></>}>
      <p className="flex items-start gap-2 border-b border-primary/10 px-4 py-2 text-[11px] text-muted-foreground">
        <Scale className="h-3.5 w-3.5 mt-0.5 text-warning shrink-0" />
        Scores rank <span className="text-foreground">correlations that warrant review</span> — they are not findings of wrongdoing. A named reviewer decides; every decision is recorded with name and time.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-[11px]">
          <thead>
            <tr className="text-left text-[9px] uppercase tracking-[0.14em] text-muted-foreground border-b border-primary/10">
              <th className="px-3 py-2 w-8">#</th>
              <th className="px-2 py-2">Subject</th>
              <th className="px-2 py-2 w-32">Review score</th>
              <th className="px-2 py-2">Correlation flags</th>
              <th className="px-2 py-2">Linked visits / incidents</th>
              <th className="px-3 py-2">Human decision</th>
            </tr>
          </thead>
          <tbody>
            {subjects.map((s, i) => (
              <tr key={s.id} className="border-b border-primary/5 align-top hover:bg-primary/5">
                <td className="px-3 py-2 font-mono text-muted-foreground">{i + 1}</td>
                <td className="px-2 py-2">
                  <div className="flex items-center gap-1.5">
                    {s.kind === "vehicle" ? <Car className="h-3.5 w-3.5 text-primary" /> : <HardHat className="h-3.5 w-3.5 text-primary" />}
                    {s.kind === "vehicle"
                      ? <Link to={`/intelligence?vehicle=${encodeURIComponent(s.name.replace("Vehicle ", ""))}`} className="font-semibold text-foreground hover:text-primary">{s.name}</Link>
                      : <span className="font-semibold text-foreground">{s.name}</span>}
                  </div>
                  <p className="text-[10px] text-muted-foreground">{s.employer} · {s.kind}</p>
                  <p className="text-[10px] text-muted-foreground">{s.summary}</p>
                </td>
                <td className="px-2 py-2">
                  <span className="font-mono font-bold tabular-nums" style={{ color: scoreColor(s.riskScore) }}>{s.riskScore}</span>
                  <Meter value={s.riskScore} color={scoreColor(s.riskScore)} className="mt-1" />
                </td>
                <td className="px-2 py-2">
                  <div className="flex flex-wrap gap-1 max-w-[340px]">
                    {s.flags.map((f) => <Pill key={f} color="#f97316">{INSIDER_FLAG_LABEL[f]}</Pill>)}
                  </div>
                </td>
                <td className="px-2 py-2">
                  <div className="flex flex-wrap gap-1 max-w-[260px]">
                    {s.visitIds.slice(0, 6).map((id) => (
                      <button key={id} onClick={() => onVisit(id)} title={visits.get(id)?.siteName}
                        className="rounded border border-primary/20 px-1 font-mono text-[10px] text-primary hover:bg-primary/10">{id}</button>
                    ))}
                    {s.visitIds.length > 6 && <span className="text-[10px] text-muted-foreground">+{s.visitIds.length - 6}</span>}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {s.incidentIds.map((id) => (
                      <Link key={id} to={`/incidents/${id}`} className="rounded border border-destructive/30 px-1 font-mono text-[10px] text-destructive hover:bg-destructive/10">{id}</Link>
                    ))}
                  </div>
                </td>
                <td className="px-3 py-2">
                  <DecisionButtons id={s.id} decision={log.decisions[s.id]} onDecide={log.record} onUndo={log.undo}
                    options={[{ action: "Open review", tone: "warning" }, { action: "Request info", tone: "primary" }, { action: "Clear", tone: "success" }]} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
