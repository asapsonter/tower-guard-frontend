import { useState } from "react";
import { Gavel } from "lucide-react";
import { fmtDate, fmtTime } from "@/lib/cnii";
import { Pill } from "@/components/cnii/Pill";
import { DECISION_COLOR, DECISION_LABEL, type Decision, type DecisionAction } from "./correlate";

/** Human decision on a referral. Nothing happens to the subject without it. */
export function DecisionPanel({ referralId, history, onDecide }: { referralId: string; history: Decision[]; onDecide: (d: Decision) => void }) {
  const [officer, setOfficer] = useState("");
  const [note, setNote] = useState("");
  const ready = officer.trim().length >= 3;

  const decide = (action: DecisionAction) => {
    if (!ready) return;
    onDecide({ referralId, action, officer: officer.trim(), note: note.trim(), at: new Date().toISOString() });
    setNote("");
  };

  return (
    <div className="space-y-3 text-[12px]">
      <p className="text-muted-foreground">
        The referral is a correlation that <span className="text-foreground">warrants review</span>. An authorised officer must record a decision; ITIPS takes no action against the subject on its own.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <label className="space-y-1">
          <span className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Reviewing officer (name & rank)</span>
          <input value={officer} onChange={(e) => setOfficer(e.target.value)} placeholder="e.g. DSC A. Bello"
            className="w-full bg-secondary/50 border border-primary/20 rounded-md px-2.5 py-1.5 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/50" />
        </label>
        <label className="space-y-1">
          <span className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Reason / note</span>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Basis for the decision"
            className="w-full bg-secondary/50 border border-primary/20 rounded-md px-2.5 py-1.5 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/50" />
        </label>
      </div>
      <div className="flex flex-wrap gap-2">
        {(Object.keys(DECISION_LABEL) as DecisionAction[]).map((a) => (
          <button key={a} disabled={!ready} onClick={() => decide(a)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-[11px] font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-125"
            style={{ borderColor: `${DECISION_COLOR[a]}88`, color: DECISION_COLOR[a], background: `${DECISION_COLOR[a]}14` }}>
            <Gavel className="h-3.5 w-3.5" /> {DECISION_LABEL[a]}
          </button>
        ))}
      </div>
      {!ready && <p className="text-[10px] text-muted-foreground">Enter the reviewing officer to enable a decision.</p>}

      <div className="space-y-1.5">
        <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Decision log (this workstation)</p>
        {history.length === 0 ? <p className="text-[11px] text-muted-foreground">No decision recorded yet — referral awaiting human review.</p> : (
          history.slice().reverse().map((d, i) => (
            <div key={i} className="rounded-md bg-secondary/40 px-2.5 py-1.5 text-[11px]">
              <div className="flex flex-wrap items-center gap-2">
                <Pill color={DECISION_COLOR[d.action]}>{DECISION_LABEL[d.action]}</Pill>
                <span className="text-foreground">{d.officer}</span>
                <span className="ml-auto font-mono text-[10px] text-muted-foreground">{fmtDate(d.at)} {fmtTime(d.at)}</span>
              </div>
              {d.note && <p className="text-muted-foreground mt-1">{d.note}</p>}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
