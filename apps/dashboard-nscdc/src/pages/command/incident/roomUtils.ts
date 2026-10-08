import type { Incident, Severity } from "@/lib/cnii";

export const SEVERITY_RANK: Record<Severity, number> = { critical: 0, high: 1, medium: 2, low: 3 };

export const AWAITING_DISPATCH = (inc: Incident) => inc.status === "detected" || inc.status === "verified";

export const isActive = (inc: Incident) => inc.status !== "closed";

/** Seconds of SLA left (negative = overdue); null once arrival is verified. */
export function slaRemaining(inc: Incident, now: number): number | null {
  if (inc.response.verifiedArrival) return null;
  const start = new Date(inc.response.stages.alert ?? inc.detectedAt).getTime();
  return inc.response.slaSeconds - (now - start) / 1000;
}

/** Active incident rooms, most critical first (severity, then least SLA time left). */
export function sortRooms(incidents: Incident[], now: number): Incident[] {
  return incidents
    .filter(isActive)
    .sort((a, b) => {
      const s = SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity];
      if (s !== 0) return s;
      return (slaRemaining(a, now) ?? Infinity) - (slaRemaining(b, now) ?? Infinity);
    });
}

/**
 * Live ETA in seconds. `etaSeconds` is computed when the snapshot is generated
 * (or when a dispatch is approved), so count down from the later of the two.
 */
export function etaRemaining(inc: Incident, generatedAt: string, now: number): number | null {
  if (inc.etaSeconds == null || inc.status === "on_site" || inc.status === "contained" || inc.status === "closed") return null;
  const ref = Math.max(
    new Date(generatedAt).getTime(),
    inc.response.stages.dispatch ? new Date(inc.response.stages.dispatch).getTime() : 0,
  );
  return inc.etaSeconds - (now - ref) / 1000;
}

/** "Kubwa, Abuja" — taken from the threat summary, falling back to LGA/state. */
export function placeName(inc: Incident): string {
  const parts = inc.threatSummary.split(" — ");
  return parts.length > 1 ? parts[parts.length - 1] : `${inc.lga}, ${inc.state === "FCT" ? "Abuja" : inc.state}`;
}

/** Camera id named in the timeline, else a site-derived id. */
export function cameraId(inc: Incident): string {
  for (const e of inc.timeline) {
    const m = `${e.label} ${e.detail ?? ""}`.match(/CAM-[A-Z0-9-]+/);
    if (m) return m[0];
  }
  return `CAM-${inc.siteId}`;
}
