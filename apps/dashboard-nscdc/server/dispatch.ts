import type { CniiSnapshot, DispatchRecommendation, ResponseUnit } from "./types.js";
import { distanceKm, routeBetween } from "./geo.js";

const ROAD_FACTOR = 1.25; // straight-line → road distance
const SPEED_KMH = 45;
const TURNOUT_SEC: Partial<Record<ResponseUnit["status"], number>> = { available: 60, standby: 180 };

function etaFor(unit: ResponseUnit, km: number) {
  return Math.round((TURNOUT_SEC[unit.status] ?? 300) + (km / SPEED_KMH) * 3600);
}

/**
 * Recommends the closest compliant team. Compliance: available/standby,
 * comms not offline, equipment ≥ 70%, and armed when a weapon is suspected.
 * This is advice only — a commander must approve the dispatch.
 */
export function recommendDispatch(snap: CniiSnapshot, incidentId: string): DispatchRecommendation | null {
  const inc = snap.incidents.find((i) => i.id === incidentId);
  if (!inc) return null;

  const scored = snap.units
    .filter((u) => u.status === "available" || u.status === "standby")
    .map((u) => {
      const km = Math.round(distanceKm(u.location, inc.location) * ROAD_FACTOR * 10) / 10;
      const problems: string[] = [];
      if (u.comms === "offline") problems.push("comms offline");
      if (u.equipmentReadiness < 70) problems.push(`equipment ${u.equipmentReadiness}%`);
      if (inc.weaponSuspected && !u.armed) problems.push("not armed for weapon threat");
      if (km > 60) problems.push("outside 60 km response radius");
      return { u, km, eta: etaFor(u, km), problems };
    })
    .sort((a, b) => a.eta - b.eta);

  const best = scored.find((s) => s.problems.length === 0);
  if (!best) return null;

  const support: string[] = [];
  if (inc.weaponSuspected) support.push("Police backup (armed)");
  if (inc.personsDetected >= 3) support.push("Second NSCDC team on standby");
  if (inc.type === "battery_generator_theft" || inc.type === "theft") support.push("Operator field engineer for asset inventory");
  if (support.length === 0) support.push("None required");

  return {
    incidentId: inc.id,
    unitId: best.u.id,
    callsign: best.u.callsign,
    distanceKm: best.km,
    etaSeconds: best.eta,
    threat: `${inc.personsDetected} person${inc.personsDetected > 1 ? "s" : ""}${inc.weaponSuspected ? " / possible weapon" : ""}`,
    recommendedSupport: support,
    rationale: [
      `Shortest ETA among compliant teams (${best.u.status}, turnout ${TURNOUT_SEC[best.u.status] ?? 300}s)`,
      `${best.u.armed ? "Armed team" : "Unarmed team"} · equipment ${best.u.equipmentReadiness}% · comms ${best.u.comms}`,
      `Crew of ${best.u.officers.length + 1} led by ${best.u.commander.rank} ${best.u.commander.name}`,
    ],
    alternatives: scored
      .filter((s) => s !== best)
      .slice(0, 4)
      .map((s) => ({
        unitId: s.u.id,
        callsign: s.u.callsign,
        distanceKm: s.km,
        etaSeconds: s.eta,
        reasonNotTop: s.problems.length ? s.problems.join(", ") : `ETA ${Math.round((s.eta - best.eta) / 60)} min longer`,
      })),
  };
}

/** Applies a commander-approved dispatch to the snapshot (returns the changed records). */
export function applyDispatch(snap: CniiSnapshot, incidentId: string, unitId: string, approvedBy: string, nowMs: number) {
  const inc = snap.incidents.find((i) => i.id === incidentId);
  const unit = snap.units.find((u) => u.id === unitId);
  if (!inc || !unit) return null;
  const at = new Date(nowMs).toISOString();
  const km = Math.round(distanceKm(unit.location, inc.location) * ROAD_FACTOR * 10) / 10;
  inc.status = "dispatched";
  inc.respondingUnitId = unit.id;
  inc.etaSeconds = etaFor(unit, km);
  inc.route = routeBetween(unit.location, inc.location, 1);
  inc.response.distanceKm = km;
  inc.response.stages.dispatch = at;
  inc.timeline.push({ at, source: "command", label: "NSCDC dispatch approved", detail: `${unit.callsign} approved by ${approvedBy}` });
  unit.status = "assigned";
  unit.currentAssignment = inc.id;
  return { incident: inc, unit };
}
