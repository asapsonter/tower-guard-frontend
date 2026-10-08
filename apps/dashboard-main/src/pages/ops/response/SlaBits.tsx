import { CheckCircle2, AlertTriangle } from "lucide-react";
import { fmtClock, fmtDuration, fmtTime, useNow, type Incident } from "@/lib/ops";
import { Pill } from "@/components/ops/Pill";
import { SLA_TONE_COLOR, SLA_TONE_LABEL, VERIFY_LABEL, VERIFY_SOURCES, claimGapMin, etaRemaining, slaState } from "./sla";

/** Compact SLA readout for lists and tables (ticks every second). */
export function SlaMini({ inc }: { inc: Incident }) {
  const now = useNow();
  const s = slaState(inc, now);
  const color = SLA_TONE_COLOR[s.tone];
  if (s.tone === "na") return <span className="font-mono text-[10px] text-muted-foreground">—</span>;
  return (
    <span className={`font-mono tabular-nums text-[11px] font-semibold ${s.tone === "breached" ? "animate-pulse" : ""}`} style={{ color }}>
      {s.frozen ? `${s.tone === "met" ? "MET" : "MISSED"} ${fmtClock(s.elapsed)}` : s.remaining < 0 ? `${fmtClock(s.remaining)} OVER` : fmtClock(s.remaining)}
    </span>
  );
}

/** Live responder ETA countdown. */
export function EtaLive({ inc, generatedAt, className = "" }: { inc: Incident; generatedAt: string; className?: string }) {
  const now = useNow();
  const eta = etaRemaining(inc, now, generatedAt);
  if (inc.response.stages.arrived) return <span className={`font-mono text-success ${className}`}>Arrived {fmtTime(inc.response.stages.arrived)}</span>;
  if (eta == null) return <span className={`font-mono text-muted-foreground ${className}`}>—</span>;
  return (
    <span className={`font-mono tabular-nums ${eta < 0 ? "text-warning" : "text-primary"} ${className}`}>
      {eta < 0 ? `overdue ${fmtClock(-eta)}` : fmtClock(eta)}
    </span>
  );
}

/**
 * The big "20:00 RESPONSE SLA → 12:42 remaining" clock. Escalates
 * Green → Amber → Red before breach; freezes when arrival is verified.
 */
export function BigSlaClock({ inc }: { inc: Incident }) {
  const now = useNow();
  const s = slaState(inc, now);
  const sla = inc.response.slaSeconds;
  const color = SLA_TONE_COLOR[s.tone];
  const used = Math.min(100, Math.max(0, (s.elapsed / sla) * 100));
  return (
    <div className="rounded-lg border p-4" style={{ borderColor: `${color}66`, background: `${color}0d`, boxShadow: s.tone === "breached" || s.tone === "red" ? `0 0 28px -8px ${color}` : undefined }}>
      <div className="flex items-baseline justify-between gap-2">
        <p className="font-mono text-sm font-bold tabular-nums text-foreground">
          {fmtClock(sla)} <span className="font-display text-[10px] tracking-[0.18em] text-muted-foreground">RESPONSE SLA</span>
        </p>
        <Pill color={color}>{SLA_TONE_LABEL[s.tone]}</Pill>
      </div>
      {s.tone === "na" ? (
        <p className="mt-2 text-sm text-muted-foreground">Closed without a response requirement (e.g. nuisance alarm).</p>
      ) : s.frozen ? (
        <p className="mt-2 font-mono text-4xl font-bold tabular-nums" style={{ color }}>
          {fmtClock(s.elapsed)}
          <span className="ml-2 font-sans text-xs font-semibold">TO VERIFIED ARRIVAL</span>
        </p>
      ) : (
        <p className={`mt-2 font-mono text-5xl font-bold tabular-nums ${s.tone === "breached" ? "animate-pulse" : ""}`} style={{ color }}>
          {s.remaining < 0 ? `+${fmtClock(-s.remaining)}` : fmtClock(s.remaining)}
          <span className="ml-2 font-sans text-xs font-semibold">{s.remaining < 0 ? "OVERDUE" : "REMAINING"}</span>
        </p>
      )}
      {/* Progress bar with Green / Amber / Red bands */}
      <div className="relative mt-3 h-2.5 rounded-full overflow-hidden flex">
        <span className="h-full bg-success/25" style={{ width: "50%" }} />
        <span className="h-full bg-warning/25" style={{ width: "25%" }} />
        <span className="h-full bg-destructive/25" style={{ width: "25%" }} />
        <span className="absolute inset-y-0 left-0 rounded-full transition-all" style={{ width: `${used}%`, background: color }} />
      </div>
      <div className="relative mt-1 h-3 font-mono text-[9px] text-muted-foreground">
        <span className="absolute left-0">00:00</span>
        <span className="absolute left-1/2 -translate-x-1/2 text-warning/80">{fmtClock(sla * 0.5)}</span>
        <span className="absolute left-3/4 -translate-x-1/2 text-destructive/80">{fmtClock(sla * 0.75)}</span>
        <span className="absolute right-0">{fmtClock(sla)}</span>
      </div>
      <p className="mt-2 text-[10px] text-muted-foreground">
        Clock runs from alert ({fmtTime(inc.response.stages.alert ?? inc.detectedAt)}) to <span className="text-foreground">independently verified</span> arrival · elapsed {fmtDuration(s.elapsed)}
      </p>
    </div>
  );
}

/** Arrival verification badges (GPS geofence / check-in / access record / CCTV). */
export function VerificationBadges({ inc, showMissing = false }: { inc: Incident; showMissing?: boolean }) {
  const r = inc.response;
  const gap = claimGapMin(r);
  if (!r.stages.arrived) return <span className="text-[10px] text-muted-foreground">Awaiting arrival</span>;
  return (
    <div className="flex flex-wrap items-center gap-1">
      {VERIFY_SOURCES.filter((v) => showMissing || r.arrivalVerifiedBy.includes(v)).map((v) => {
        const ok = r.arrivalVerifiedBy.includes(v);
        return (
          <Pill key={v} color={ok ? "#22c55e" : "#64748b"}>
            {ok ? <CheckCircle2 className="h-3 w-3" /> : null}
            {VERIFY_LABEL[v]}
          </Pill>
        );
      })}
      {gap != null && gap > 0 && (
        <Pill color="#ef4444"><AlertTriangle className="h-3 w-3" />Claimed {gap} min before verified</Pill>
      )}
    </div>
  );
}
