import { fmtDuration, fmtNaira, fmtNum, type Incident, type Kpi, type MonthlyImpact } from "@/lib/ops";

export function fmtKpi(k: Pick<Kpi, "unit">, v: number): string {
  switch (k.unit) {
    case "%": return `${Number.isInteger(v) ? v : v.toFixed(v >= 99.9 ? 2 : 1)}%`;
    case "count": return fmtNum(v);
    case "seconds": return fmtDuration(v);
    case "naira": return fmtNaira(v);
    case "hours": return `${v} h`;
    case "minutes": return `${v} min`;
  }
}

/** good = moving in the direction the KPI wants. */
export function deltaTone(k: Kpi): "good" | "bad" | "flat" {
  if (k.delta == null || k.delta === 0) return "flat";
  return (k.delta > 0) === (k.betterWhen === "higher") ? "good" : "bad";
}

export const TONE_CLASS = { good: "text-success", bad: "text-destructive", flat: "text-muted-foreground" } as const;

export function meetsTarget(k: Kpi): boolean | null {
  if (k.target == null) return null;
  return k.betterWhen === "higher" ? k.value >= k.target : k.value <= k.target;
}

export function targetLabel(k: Kpi): string | null {
  if (k.target == null) return null;
  return `${k.betterWhen === "higher" ? "≥" : "≤"} ${fmtKpi(k, k.target)}`;
}

export type ContractStatus = "MET" | "AT RISK" | "BREACH";
export const CONTRACT_STATUS_COLOR: Record<ContractStatus, string> = { MET: "#22c55e", "AT RISK": "#eab308", BREACH: "#ef4444" };

/**
 * SOW status: missing the target is a BREACH; meeting it with thin headroom
 * (less than half the remaining gap to 100%, or within 15% of a "lower is
 * better" ceiling) is AT RISK.
 */
export function contractStatus(k: Kpi): ContractStatus {
  if (k.target == null) return "MET";
  if (k.betterWhen === "higher") {
    if (k.value < k.target) return "BREACH";
    const headroom = k.unit === "%" ? (100 - k.target) * 0.5 : k.target * 0.05;
    return k.value - k.target < headroom ? "AT RISK" : "MET";
  }
  if (k.value > k.target) return "BREACH";
  return k.value > k.target * 0.85 ? "AT RISK" : "MET";
}

/** "+0.4 pp headroom" / "2m 10s short" — distance to the contractual target. */
export function headroomText(k: Kpi): string | null {
  if (k.target == null) return null;
  const diff = k.betterWhen === "higher" ? k.value - k.target : k.target - k.value;
  const mag = Math.abs(diff);
  const amount = k.unit === "%" ? `${mag.toFixed(mag < 0.1 ? 2 : 1)} pp` : fmtKpi(k, Math.round(mag * 10) / 10);
  return diff >= 0 ? `${amount} headroom` : `${amount} short`;
}

export interface TrendPoint {
  month: string;
  label: string;
  meanResponseMin: number | null;
  slaPct: number | null;
  disruptionPct: number | null;
  verifiedAttacks: number;
}

/** 6-month contract trend from snap.impact + incident response records. */
export function contractTrend(impact: MonthlyImpact[], incidents: Incident[]): TrendPoint[] {
  return impact.map((m) => {
    const list = incidents.filter((i) => i.detectedAt.startsWith(m.month) && i.outcome !== "false_alarm");
    const arrived = list.filter((i) => i.response.stages.arrived);
    const secs = arrived.map((i) => (new Date(i.response.stages.arrived!).getTime() - new Date(i.response.stages.alert ?? i.detectedAt).getTime()) / 1000);
    const measured = list.filter((i) => i.response.stages.arrived || i.response.breached);
    const label = new Date(`${m.month}-01T00:00:00Z`).toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" });
    return {
      month: m.month,
      label,
      meanResponseMin: secs.length ? Math.round((secs.reduce((a, b) => a + b, 0) / secs.length / 60) * 10) / 10 : null,
      slaPct: measured.length ? Math.round((measured.filter((i) => !i.response.breached).length / measured.length) * 1000) / 10 : null,
      disruptionPct: m.verifiedAttacks ? Math.round((m.attacksDisrupted / m.verifiedAttacks) * 1000) / 10 : null,
      verifiedAttacks: m.verifiedAttacks,
    };
  });
}
