/**
 * Request router for the NSCDC CNII API. Web-standard Request → Response so
 * the same code runs as Vercel Functions (api/*.ts) and in the Vite dev
 * server (server/devApi.ts).
 *
 *   GET  /api/cnii?r=snapshot
 *   GET  /api/cnii?r=recommend&incident=INC-…
 *   POST /api/cnii?r=dispatch   { incidentId, unitId, approvedBy }
 *   POST /api/guardian          { question }
 */
import { buildSnapshot } from "./seed.js";
import { applyDispatch, recommendDispatch } from "./dispatch.js";
import { askGuardian } from "./guardian.js";
import type { CniiSnapshot } from "./types.js";

let cache: { minute: number; snap: CniiSnapshot } | null = null;

/** Snapshot anchored to the current minute, regenerated at most once a minute. */
function snapshot(nowMs: number): CniiSnapshot {
  const minute = Math.floor(nowMs / 60_000);
  if (!cache || cache.minute !== minute) cache = { minute, snap: buildSnapshot(minute * 60_000) };
  return cache.snap;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });

export async function handleCnii(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const r = url.searchParams.get("r") ?? "snapshot";
  const now = Date.now();
  if (req.method === "GET" && r === "snapshot") return json(snapshot(now));
  if (req.method === "GET" && r === "recommend") {
    const rec = recommendDispatch(snapshot(now), url.searchParams.get("incident") ?? "");
    return rec ? json(rec) : json({ error: "No compliant unit available" }, 404);
  }
  if (req.method === "POST" && r === "dispatch") {
    const body = (await req.json().catch(() => ({}))) as { incidentId?: string; unitId?: string; approvedBy?: string };
    if (!body.incidentId || !body.unitId || !body.approvedBy) return json({ error: "incidentId, unitId and approvedBy are required" }, 400);
    // Stateless demo backend: apply to a copy and return the changed records
    const copy = structuredClone(snapshot(now));
    const changed = applyDispatch(copy, body.incidentId, body.unitId, body.approvedBy, now);
    return changed ? json(changed) : json({ error: "Unknown incident or unit" }, 404);
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
