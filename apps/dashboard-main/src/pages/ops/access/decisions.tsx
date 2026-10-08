import { useCallback, useState } from "react";
import { UserCheck } from "lucide-react";
import { useAuth } from "@tower-guard/hooks";
import { fmtDate, fmtTime } from "@/lib/ops";

/** One human decision on an ITIPS output, recorded locally with name + time. */
export interface Decision {
  action: string;
  by: string;
  at: string;
}

function load(key: string): Record<string, Decision> {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as Record<string, Decision>) : {};
  } catch {
    return {};
  }
}

/**
 * Local decision log (per browser). ITIPS only recommends — every decision is
 * taken and signed by a named person; nothing is actioned automatically.
 */
export function useDecisionLog(storageKey: string) {
  const { user } = useAuth();
  const [decisions, setDecisions] = useState<Record<string, Decision>>(() => load(storageKey));
  const [name, setName] = useState<string>(user?.full_name ?? "");

  const record = useCallback((id: string, action: string) => {
    const by = name.trim() || user?.full_name || "NOC Operator";
    setDecisions((d) => {
      const next = { ...d, [id]: { action, by, at: new Date().toISOString() } };
      try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch { /* storage unavailable */ }
      return next;
    });
  }, [name, user, storageKey]);

  const undo = useCallback((id: string) => {
    setDecisions((d) => {
      const next = { ...d };
      delete next[id];
      try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch { /* storage unavailable */ }
      return next;
    });
  }, [storageKey]);

  return { decisions, record, undo, name, setName };
}

/** "Decision by" name field shown above decision lists. */
export function DeciderField({ name, setName }: { name: string; setName: (v: string) => void }) {
  return (
    <label className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
      <UserCheck className="h-3.5 w-3.5 text-primary" />
      <span className="uppercase tracking-[0.14em]">Decision by</span>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name"
        className="w-32 rounded border border-primary/20 bg-secondary/60 px-1.5 py-0.5 text-[11px] text-foreground focus:outline-none focus:border-primary/60" />
    </label>
  );
}

const TONE: Record<string, string> = {
  primary: "border-primary/40 text-primary hover:bg-primary/15",
  success: "border-success/40 text-success hover:bg-success/15",
  warning: "border-warning/40 text-warning hover:bg-warning/15",
  muted: "border-border text-muted-foreground hover:text-foreground hover:bg-secondary",
};

/** Row of human decision buttons; once decided shows who/when with an undo. */
export function DecisionButtons({ id, options, decision, onDecide, onUndo }: {
  id: string;
  options: { action: string; tone?: keyof typeof TONE }[];
  decision?: Decision;
  onDecide: (id: string, action: string) => void;
  onUndo: (id: string) => void;
}) {
  if (decision) {
    return (
      <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
        <span className="rounded border border-primary/30 bg-primary/10 px-1.5 py-0.5 font-semibold text-primary">{decision.action}</span>
        <span className="text-muted-foreground">by <span className="text-foreground">{decision.by}</span> · <span className="font-mono">{fmtDate(decision.at)} {fmtTime(decision.at)}</span></span>
        <button onClick={() => onUndo(id)} className="text-muted-foreground hover:text-foreground underline">undo</button>
      </div>
    );
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button key={o.action} onClick={() => onDecide(id, o.action)}
          className={`rounded border px-2 py-0.5 text-[10px] font-semibold transition-colors ${TONE[o.tone ?? "primary"]}`}>
          {o.action}
        </button>
      ))}
    </div>
  );
}
