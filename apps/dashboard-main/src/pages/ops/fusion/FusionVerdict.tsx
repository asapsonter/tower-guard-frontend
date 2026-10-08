import { ArrowDown, ArrowRight, BellRing, Cctv, KeyRound, Lightbulb, Radio, UserCheck } from "lucide-react";
import { fmtTime, type FusionAssessment, type FusionSignal } from "@/lib/ops";

export const VERDICT_COLOR: Record<FusionAssessment["verdict"], string> = {
  "Probable intrusion": "#ef4444",
  "Possible intrusion": "#f97316",
  "Authorised activity": "#38bdf8",
  "Likely nuisance alarm": "#94a3b8",
};

const KIND_ICON: Record<FusionSignal["kind"], typeof Cctv> = { video: Cctv, sensor: Radio, access: KeyRound, context: Lightbulb };

/** Semicircular 0–100 confidence gauge. */
export function ConfidenceGauge({ value, color, label }: { value: number; color: string; label: string }) {
  const r = 80;
  const len = Math.PI * r;
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 116" className="w-full max-w-[260px]">
        <path d="M20 100 A80 80 0 0 1 180 100" fill="none" stroke="hsl(var(--secondary))" strokeWidth={14} strokeLinecap="round" />
        <path d="M20 100 A80 80 0 0 1 180 100" fill="none" stroke={color} strokeWidth={14} strokeLinecap="round"
          strokeDasharray={`${(v / 100) * len} ${len}`} style={{ filter: `drop-shadow(0 0 6px ${color})`, transition: "stroke-dasharray .6s ease" }} />
        {[0, 60, 85, 100].map((tick) => {
          const a = Math.PI * (1 - tick / 100);
          return <line key={tick} x1={100 + Math.cos(a) * 66} y1={100 - Math.sin(a) * 66} x2={100 + Math.cos(a) * 72} y2={100 - Math.sin(a) * 72} stroke="hsl(var(--muted-foreground))" strokeWidth={1} />;
        })}
        <text x={100} y={86} textAnchor="middle" fontSize={34} fontWeight={700} fill={color} fontFamily="monospace">{v}%</text>
        <text x={100} y={106} textAnchor="middle" fontSize={8} letterSpacing={2} fill="hsl(var(--muted-foreground))">THREAT CONFIDENCE</text>
      </svg>
      <span className="mt-1 rounded-md border px-3 py-1 text-[13px] font-bold uppercase tracking-wide" style={{ color, borderColor: `${color}80`, background: `${color}1a` }}>{label}</span>
    </div>
  );
}

/** Stacked evidence list: each fused signal and the points it contributed. */
export function EvidenceStack({ fusion }: { fusion: FusionAssessment }) {
  const max = Math.max(...fusion.signals.map((s) => Math.abs(s.weight)), 1);
  let running = 0;
  return (
    <ol className="space-y-1">
      {fusion.signals.map((s, i) => {
        running += s.weight;
        const Icon = KIND_ICON[s.kind];
        const pos = s.weight > 0;
        const color = s.weight === 0 ? "#94a3b8" : pos ? "#ef4444" : "#22c55e";
        return (
          <li key={`${s.source}-${i}`} className="rounded-md border border-primary/10 bg-background/30 px-2.5 py-1.5">
            <div className="flex items-center gap-2">
              <Icon className="h-3.5 w-3.5 shrink-0 text-primary" />
              <span className="text-[12px] text-foreground"><span className="font-semibold">{s.source}</span> · {s.finding}</span>
              <span className="ml-auto font-mono text-[12px] font-bold tabular-nums" style={{ color }}>{pos ? "+" : s.weight < 0 ? "−" : "±"}{Math.abs(s.weight)}</span>
            </div>
            <div className="mt-1 flex items-center gap-2">
              <div className="relative h-1.5 flex-1 rounded-full bg-secondary overflow-hidden">
                <div className="absolute inset-y-0 rounded-full" style={{ width: `${(Math.abs(s.weight) / max) * 100}%`, background: color, left: 0 }} />
              </div>
              <span className="w-14 text-right font-mono text-[9px] text-muted-foreground">{s.at ? fmtTime(s.at) : "state"}</span>
              <span className="w-12 text-right font-mono text-[9px] text-muted-foreground tabular-nums">Σ {Math.max(0, Math.min(99, running))}</span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/** "N raw alarms → 1 fused verdict": why fusion beats independent alarms. */
export function RawVsFused({ fusion }: { fusion: FusionAssessment }) {
  const color = VERDICT_COLOR[fusion.verdict];
  const n = fusion.signals.length;
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <div className="space-y-1">
          <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Ordinary VMS / alarm panel</p>
          {fusion.signals.map((s, i) => (
            <div key={i} className="flex items-center gap-1.5 rounded border border-warning/30 bg-warning/5 px-1.5 py-0.5">
              <BellRing className="h-3 w-3 shrink-0 text-warning" />
              <span className="truncate text-[10px] text-foreground">ALARM · {s.source}</span>
            </div>
          ))}
          <p className="text-[10px] text-muted-foreground">{n} tickets, no context, operator must correlate by hand</p>
        </div>
        <ArrowRight className="hidden sm:block h-5 w-5 text-primary" />
        <ArrowDown className="sm:hidden h-5 w-5 text-primary" />
        <div className="space-y-1">
          <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground">ITIPS sensor fusion</p>
          <div className="rounded-md border-2 px-2.5 py-3 text-center" style={{ borderColor: color, background: `${color}14` }}>
            <p className="font-mono text-2xl font-bold tabular-nums" style={{ color }}>{fusion.confidence}%</p>
            <p className="text-[11px] font-bold uppercase" style={{ color }}>{fusion.verdict}</p>
            <p className="mt-1 text-[10px] text-muted-foreground">1 verdict · {n} reasons shown</p>
          </div>
        </div>
      </div>
      <div className="rounded-md border border-primary/25 bg-primary/5 px-3 py-2 text-center">
        <p className="font-display text-[13px] font-bold text-primary uppercase">{n} raw alarms → 1 fused verdict</p>
        <p className="text-[10px] text-muted-foreground">One explained decision is worth more than {n} independent alarms: fewer false dispatches, faster verified response.</p>
      </div>
      <p className="flex items-start gap-1.5 text-[10px] text-muted-foreground">
        <UserCheck className="h-3.5 w-3.5 shrink-0 text-primary" />ITIPS recommends; the NOC operator confirms the verdict and approves any dispatch.
      </p>
    </div>
  );
}
