/**
 * Request router for the ITIPS Operator Command API (Web Request → Response),
 * shared by the Vercel Functions in api/ and the Vite dev/preview middleware.
 *
 *   GET  /api/ops?r=snapshot
 *   GET  /api/ops?r=site&id=ATC-…          Site Security Digital Twin
 *   GET  /api/ops?r=search&q=…              Search Anything
 *   GET  /api/ops?r=recommend&incident=INC-…
 *   POST /api/ops?r=dispatch   { incidentId, teamId, approvedBy }
 *   POST /api/guardian         { question }
 */
import { buildSnapshot } from "./seed.js";
import { buildSiteDetail, recommendTeam, searchAll } from "./queries.js";
import { askGuardian } from "./guardian.js";
import type { OpsSnapshot } from "./types.js";

let cache: { minute: number; snap: OpsSnapshot } | null = null;

function snapshot(nowMs: number): OpsSnapshot {
  const minute = Math.floor(nowMs / 60_000);
  if (!cache || cache.minute !== minute) cache = { minute, snap: buildSnapshot(minute * 60_000) };
  return cache.snap;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });

export async function handleOps(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const r = url.searchParams.get("r") ?? "snapshot";
  const now = Date.now();
  const snap = snapshot(now);
  if (req.method === "GET") {
    if (r === "snapshot") return json(snap);
    if (r === "site") {
      const detail = buildSiteDetail(snap, url.searchParams.get("id") ?? "", now);
      return detail ? json(detail) : json({ error: "Unknown site" }, 404);
    }
    if (r === "search") return json(searchAll(snap, url.searchParams.get("q") ?? ""));
    if (r === "recommend") {
      const rec = recommendTeam(snap, url.searchParams.get("incident") ?? "");
      return rec ? json(rec) : json({ error: "No compliant team available" }, 404);
    }
  }
  if (req.method === "POST" && r === "dispatch") {
    const body = (await req.json().catch(() => ({}))) as { incidentId?: string; teamId?: string; approvedBy?: string };
    if (!body.incidentId || !body.teamId || !body.approvedBy) return json({ error: "incidentId, teamId and approvedBy are required" }, 400);
    const copy = structuredClone(snap);
    const inc = copy.incidents.find((i) => i.id === body.incidentId);
    const team = copy.teams.find((t) => t.id === body.teamId);
    if (!inc || !team) return json({ error: "Unknown incident or team" }, 404);
    const at = new Date(now).toISOString();
    inc.status = "dispatched";
    inc.teamId = team.id;
    inc.response.stages.dispatched = at;
    inc.timeline.push({ at, source: "response", label: "Response dispatched", detail: `${team.callsign} approved by ${body.approvedBy}` });
    team.status = "assigned";
    team.currentIncidentId = inc.id;
    return json({ incident: inc, team });
  }
  return json({ error: "Not found" }, 404);
}

export async function handleGuardian(req: Request): Promise<Response> {
  if (req.method !== "POST") return json({ error: "POST a JSON body { question }" }, 405);
  const body = (await req.json().catch(() => ({}))) as { question?: string };
  const question = (body.question ?? "").trim().slice(0, 500);
  if (!question) return json({ error: "question is required" }, 400);
  const now = Date.now();
  return json(await askGuardian(snapshot(now), question, now));
}
