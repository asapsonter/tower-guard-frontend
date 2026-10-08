import type { Incident } from "@/lib/ops";

export const alertAt = (i: Incident) => i.response.stages.alert ?? i.detectedAt;
export const arrivedAt = (i: Incident) => i.response.stages.arrived ?? null;

/** Seconds left on the response SLA (negative once overdue); null once arrival is verified. */
export function slaRemaining(i: Incident, now: number): number | null {
  if (arrivedAt(i)) return null;
  return i.response.slaSeconds - (now - new Date(alertAt(i)).getTime()) / 1000;
}

export type SlaBand = "green" | "amber" | "red";
export const SLA_BAND_COLOR: Record<SlaBand, string> = { green: "#22c55e", amber: "#f59e0b", red: "#ef4444" };

export function slaBand(remaining: number, sla: number): SlaBand {
  if (remaining <= 0) return "red";
  if (remaining < sla * 0.25) return "red";
  if (remaining < sla * 0.5) return "amber";
  return "green";
}

/** Least SLA time remaining first; arrived incidents last (critical before high). */
export function byUrgency(now: number) {
  const sev = { critical: 0, high: 1, medium: 2, low: 3 } as const;
  return (a: Incident, b: Incident) => {
    const ra = slaRemaining(a, now) ?? Number.POSITIVE_INFINITY;
    const rb = slaRemaining(b, now) ?? Number.POSITIVE_INFINITY;
    if (ra !== rb) return ra - rb;
    return sev[a.severity] - sev[b.severity] || b.detectedAt.localeCompare(a.detectedAt);
  };
}

/** Remaining team ETA, counted down from snapshot generation. */
export function etaRemaining(i: Incident, generatedAt: string, now: number): number | null {
  if (i.response.predictedEtaSec == null || arrivedAt(i)) return null;
  return i.response.predictedEtaSec - (now - new Date(generatedAt).getTime()) / 1000;
}
