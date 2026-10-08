import { fmtClock, fmtDuration, useNow } from "@/lib/cnii";

interface SlaCountdownProps {
  alertAt: string;
  slaSeconds: number;
  arrivalAt?: string | null;
  size?: "sm" | "lg";
}

/** Live "RESPONSE SLA — 08:42 REMAINING" countdown; freezes once arrival is verified. */
export function SlaCountdown({ alertAt, slaSeconds, arrivalAt, size = "sm" }: SlaCountdownProps) {
  const now = useNow();
  const start = new Date(alertAt).getTime();
  if (arrivalAt) {
    const took = (new Date(arrivalAt).getTime() - start) / 1000;
    const met = took <= slaSeconds;
    return (
      <div className={size === "lg" ? "text-center" : ""}>
        <p className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground">Response SLA</p>
        <p className={`font-mono font-bold tabular-nums ${size === "lg" ? "text-3xl" : "text-sm"} ${met ? "text-success" : "text-destructive"}`}>
          {met ? "MET" : "BREACHED"} · {fmtDuration(took)}
        </p>
      </div>
    );
  }
  const remaining = slaSeconds - (now - start) / 1000;
  const tone = remaining < 0 ? "text-destructive animate-pulse" : remaining < slaSeconds * 0.33 ? "text-warning" : "text-primary";
  return (
    <div className={size === "lg" ? "text-center" : ""}>
      <p className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground">Response SLA</p>
      <p className={`font-mono font-bold tabular-nums ${size === "lg" ? "text-4xl" : "text-sm"} ${tone}`}>
        {fmtClock(remaining)}
        <span className={`ml-2 font-sans font-semibold ${size === "lg" ? "text-xs" : "text-[9px]"}`}>{remaining < 0 ? "OVERDUE" : "REMAINING"}</span>
      </p>
    </div>
  );
}
