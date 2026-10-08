import { Camera, Fingerprint, DatabaseZap, Eye, ShieldCheck, ShieldX, Upload, ArrowLeftRight, Lock } from "lucide-react";
import { fmtDate, fmtTime, type CustodyEvent } from "@/lib/cnii";

type Entry = CustodyEvent & { session?: boolean; failed?: boolean };

const ICON: Record<CustodyEvent["action"], typeof Camera> = {
  captured: Camera, hashed: Fingerprint, ingested: DatabaseZap, viewed: Eye, verified: ShieldCheck, exported: Upload, transferred: ArrowLeftRight, sealed: Lock,
};

function isGap(e: Entry): boolean {
  const n = e.note?.toLowerCase() ?? "";
  return n.includes("custody gap") || n.includes("without");
}

/** Vertical chain-of-custody trail: captured → hashed → ingested → viewed → verified → exported… */
export function CustodyTimeline({ events }: { events: Entry[] }) {
  const sorted = [...events].sort((a, b) => a.at.localeCompare(b.at));
  if (!sorted.length) return <p className="text-[11px] text-muted-foreground">No custody events recorded.</p>;
  return (
    <ol className="relative">
      {sorted.map((e, i) => {
        const gap = isGap(e);
        const bad = gap || e.failed;
        const Icon = e.failed ? ShieldX : ICON[e.action] ?? Eye;
        const last = i === sorted.length - 1;
        return (
          <li key={`${e.at}-${i}`} className="relative flex gap-3 pb-3">
            {!last && <span className={`absolute left-[11px] top-6 bottom-0 w-px ${bad ? "bg-destructive/40" : "bg-primary/20"}`} />}
            <span className={`relative z-10 h-6 w-6 shrink-0 rounded-full border flex items-center justify-center ${bad ? "border-destructive bg-destructive/15" : e.session ? "border-cyan-400 bg-cyan-400/15" : "border-primary/40 bg-card"}`}>
              <Icon className={`h-3 w-3 ${bad ? "text-destructive" : e.session ? "text-cyan-400" : "text-primary"}`} />
            </span>
            <div className="min-w-0 pt-0.5">
              <p className="text-xs">
                <span className={`font-semibold uppercase tracking-wide text-[10px] mr-2 ${bad ? "text-destructive" : "text-foreground"}`}>{e.failed ? "verify failed" : e.action}</span>
                <span className="font-mono text-[10px] text-muted-foreground">{fmtDate(e.at)} {fmtTime(e.at)}</span>
                {e.session && <span className="ml-2 text-[9px] uppercase tracking-[0.14em] text-cyan-400">this session</span>}
              </p>
              <p className="text-[11px] text-muted-foreground">{e.actor}</p>
              {e.note && <p className={`text-[10px] ${bad ? "text-destructive" : "text-muted-foreground"}`}>{e.note}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
