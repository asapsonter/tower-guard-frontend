/**
 * Guardian AI — operational intelligence across sites, sensors, video
 * metadata, incidents, access, maintenance, response and cases.
 *
 * Every answer is assembled from dataset queries so each result links to a
 * record. Guardian advises; it never takes consequential actions.
 *  - "claude" engine when ANTHROPIC_API_KEY is set (Claude chooses queries and writes the answer)
 *  - "built-in" keyword routing otherwise
 */
import Anthropic from "@anthropic-ai/sdk";
import type { GuardianAnswer, IncidentType, OpsSnapshot } from "./types.js";
import { STATES } from "./geo.js";

type Result = GuardianAnswer["results"][number];
interface QueryOutput { summary: string; results: Result[]; provenance: string[]; confidence: number }

const DAY = 86400_000;
const TYPE_WORDS: [RegExp, IncidentType][] = [
  [/battery|batteries/i, "battery_theft"], [/generator/i, "generator_theft"], [/diesel|fuel/i, "diesel_theft"],
  [/cable|feeder/i, "cable_theft"], [/solar/i, "solar_theft"], [/sabotage/i, "sabotage"], [/vandal/i, "vandalism"],
];
const watHour = (iso: string) => (new Date(iso).getUTCHours() + 1) % 24;

export function makeQueries(snap: OpsSnapshot, nowMs: number) {
  const findState = (q: string) => STATES.map((s) => s.state).find((s) => new RegExp(`\\b${s === "FCT" ? "(FCT|Abuja)" : s}\\b`, "i").test(q)) ?? null;
  const monthKey = (offset: number) => { const d = new Date(nowMs); return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - offset, 1)).toISOString().slice(0, 7); };

  return {
    state_trend(args: { state: string; type?: IncidentType | null }): QueryOutput {
      const inState = snap.incidents.filter((i) => i.state.toLowerCase() === args.state.toLowerCase() && (!args.type || args.type === "vandalism" ? i.outcome !== "false_alarm" : i.type === args.type));
      const cur = inState.filter((i) => i.detectedAt.startsWith(monthKey(0)));
      const prev = inState.filter((i) => i.detectedAt.startsWith(monthKey(1)));
      const share = (xs: typeof cur, f: (i: (typeof cur)[number]) => boolean) => xs.length ? Math.round((xs.filter(f).length / xs.length) * 100) : 0;
      const campaigns = snap.campaigns.filter((c) => c.incidentIds.some((id) => cur.some((i) => i.id === id)));
      const insider = cur.filter((i) => i.insiderRisk).length;
      const byType = new Map<string, number>();
      cur.forEach((i) => byType.set(i.type, (byType.get(i.type) ?? 0) + 1));
      const drivers = [
        campaigns.length ? `${campaigns.map((c) => c.id).join(", ")} active — ${campaigns[0].summary}` : null,
        `${share(cur, (i) => { const h = watHour(i.detectedAt); return h >= 1 && h < 4; })}% of this month's incidents fell between 01:00 and 04:00 (last month ${share(prev, (i) => { const h = watHour(i.detectedAt); return h >= 1 && h < 4; })}%).`,
        `Top types this month: ${[...byType].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, v]) => `${k.replace(/_/g, " ")} ${v}`).join(", ") || "none"}.`,
        insider ? `${insider} incident(s) followed flagged contractor access.` : null,
      ].filter(Boolean) as string[];
      return {
        summary: `${args.state}: ${cur.length} incident(s) this month vs ${prev.length} last month (${prev.length ? `${cur.length >= prev.length ? "+" : ""}${Math.round(((cur.length - prev.length) / prev.length) * 100)}%` : "n/a"}). Likely drivers: ${drivers.join(" ")}`,
        results: cur.slice(0, 20).map((i) => ({ id: i.id, kind: "incident", label: `${i.id} · ${i.title}`, detail: `${i.siteName} · ${i.detectedAt.slice(0, 10)} · ${i.outcome.replace(/_/g, " ")}`, link: `/incidents/${i.id}` })),
        provenance: ["ITIPS incident register", "Campaign clustering", "Access-control records"],
        confidence: 0.78,
      };
    },

    contractor_visits_before_theft(args: { hours?: number }): QueryOutput {
      const hours = args.hours ?? 48;
      const thefts = snap.incidents.filter((i) => /theft/.test(i.type) && i.outcome !== "false_alarm");
      const rows = snap.visits.flatMap((v) => {
        const after = thefts.filter((i) => i.siteId === v.siteId && new Date(i.detectedAt).getTime() > new Date(v.arrival).getTime() && new Date(i.detectedAt).getTime() - new Date(v.arrival).getTime() <= hours * 3600_000);
        return after.map((i) => ({ v, i, gapH: Math.round((new Date(i.detectedAt).getTime() - new Date(v.arrival).getTime()) / 3600_000) }));
      });
      return {
        summary: `${rows.length} contractor visit(s) were followed by a battery/generator/diesel/cable/solar theft at the same site within ${hours} h, involving ${new Set(rows.map((x) => x.v.employer)).size} contractor(s). Correlation only — each warrants review, not a finding.`,
        results: rows.map(({ v, i, gapH }) => ({ id: `${v.id}-${i.id}`, kind: "visit", label: `${v.person} (${v.employer}) → ${i.id}`, detail: `${v.siteName} · visit ${v.arrival.slice(0, 16).replace("T", " ")} · theft +${gapH} h · ${v.workOrder ?? "NO WORK ORDER"}`, link: `/access?visit=${v.id}` })),
        provenance: ["Access-control & work-order records", "ITIPS incident register"],
        confidence: 0.84,
      };
    },

    top_risk_sites(args: { count?: number }): QueryOutput {
      const n = Math.max(1, Math.min(50, args.count ?? 20));
      const rows = snap.forecasts.slice(0, n);
      return {
        summary: `Top ${rows.length} sites by 72-hour vandalism risk estimate (${rows.filter((r) => r.band === "Critical").length} critical). These are risk estimates, not predictions of a specific attack.`,
        results: rows.map((f) => ({ id: f.siteId, kind: "site", label: `${f.siteId} · ${f.siteName}`, detail: `Risk ${f.score} (${f.band}) · ${f.factors.slice(0, 2).map((x) => x.label).join(", ")} · ${f.recommendations[0] ?? ""}`, link: `/risk?site=${f.siteId}` })),
        provenance: ["Risk model: incident history, neighbouring incidents, asset attractiveness, response distance, access anomalies, campaign proximity"],
        confidence: 0.7,
      };
    },

    teams_missing_sla(args: { minBreaches?: number }): QueryOutput {
      const min = args.minBreaches ?? 2;
      const byTeam = new Map<string, { breaches: number; total: number }>();
      for (const i of snap.incidents) {
        if (!i.teamId || !i.response.stages.arrived) continue;
        const e = byTeam.get(i.teamId) ?? { breaches: 0, total: 0 };
        e.total++; if (i.response.breached) e.breaches++;
        byTeam.set(i.teamId, e);
      }
      const rows = [...byTeam].filter(([, e]) => e.breaches >= min).sort((a, b) => b[1].breaches / b[1].total - a[1].breaches / a[1].total);
      return {
        summary: `${rows.length} response team(s) missed the 20-minute SLA ${min} or more times in the last 180 days.`,
        results: rows.map(([id, e]) => { const t = snap.teams.find((x) => x.id === id)!; return { id, kind: "team", label: `${t.callsign} · ${t.provider}`, detail: `${e.breaches}/${e.total} responses breached (${Math.round((e.breaches / e.total) * 100)}%) · ${t.state}`, link: `/response?team=${id}` }; }),
        provenance: ["Response records with GPS-geofence verified arrival"],
        confidence: 0.9,
      };
    },

    vehicle_incidents(): QueryOutput {
      const map = new Map<string, string[]>();
      snap.incidents.forEach((i) => i.vehiclePlates.forEach((p) => map.set(p, [...(map.get(p) ?? []), i.id])));
      snap.visits.forEach((v) => { if (v.linkedIncidentId) map.set(v.vehiclePlate, [...new Set([...(map.get(v.vehiclePlate) ?? []), v.linkedIncidentId])]); });
      const rows = [...map].filter(([, ids]) => ids.length > 1).sort((a, b) => b[1].length - a[1].length);
      return {
        summary: `${rows.length} vehicle(s) are associated with more than one incident.`,
        results: rows.map(([p, ids]) => ({ id: p, kind: "vehicle", label: p, detail: `${ids.length} incidents: ${ids.slice(0, 5).join(", ")}${ids.length > 5 ? "…" : ""}`, link: `/intelligence?vehicle=${encodeURIComponent(p)}` })),
        provenance: ["ANPR / site CCTV plate reads", "Access-control vehicle logs"],
        confidence: 0.83,
      };
    },

    camera_offline_high_eta(args: { etaMin?: number }): QueryOutput {
      const eta = args.etaMin ?? 15;
      const rows = snap.sites.filter((s) => !s.cctvOnline && s.nearestTeamEtaMin > eta).sort((a, b) => b.nearestTeamEtaMin - a.nearestTeamEtaMin);
      return {
        summary: `${rows.length} site(s) have at least one camera offline and a nearest-team ETA above ${eta} minutes — these are the most exposed sites right now.`,
        results: rows.map((s) => ({ id: s.id, kind: "site", label: `${s.id} · ${s.name}`, detail: `${s.state} · ETA ${s.nearestTeamEtaMin} min · ${s.protectionState} · backhaul ${s.backhaul}`, link: `/health?site=${s.id}` })),
        provenance: ["ITIPS health telemetry", "Response-team positions"],
        confidence: 0.95,
      };
    },

    incidents_query(args: { state?: string | null; type?: IncidentType | null; days?: number }): QueryOutput {
      const days = args.days ?? 30;
      const rows = snap.incidents.filter((i) => (!args.state || i.state.toLowerCase() === args.state.toLowerCase()) && (!args.type || i.type === args.type) && nowMs - new Date(i.detectedAt).getTime() <= days * DAY);
      return {
        summary: `${rows.length} incident(s)${args.state ? ` in ${args.state}` : ""}${args.type ? ` (${args.type.replace(/_/g, " ")})` : ""} in the last ${days} days.`,
        results: rows.slice(0, 25).map((i) => ({ id: i.id, kind: "incident", label: `${i.id} · ${i.title}`, detail: `${i.siteName} · ${i.detectedAt.slice(0, 10)} · ${i.status}`, link: `/incidents/${i.id}` })),
        provenance: ["ITIPS incident register"],
        confidence: 0.96,
      };
    },

    _findState: findState,
  };
}

type Queries = ReturnType<typeof makeQueries>;

function builtIn(q: Queries, question: string): GuardianAnswer {
  const type = TYPE_WORDS.find(([re]) => re.test(question))?.[1] ?? null;
  const state = q._findState(question);
  const num = Number(question.match(/(\d+)/)?.[1] ?? NaN);
  let out: QueryOutput;
  if (/why|increase|rise|spike/i.test(question) && state) out = q.state_trend({ state, type });
  else if (/contractor|technician|visit/i.test(question)) out = q.contractor_visits_before_theft({ hours: /(\d+)\s*h/i.test(question) ? Number(question.match(/(\d+)\s*h/i)![1]) : 48 });
  else if (/risk|tonight|next/i.test(question)) out = q.top_risk_sites({ count: Number.isFinite(num) ? num : 20 });
  else if (/sla|team/i.test(question)) out = q.teams_missing_sla({});
  else if (/vehicle|plate/i.test(question)) out = q.vehicle_incidents();
  else if (/camera|offline|eta/i.test(question)) out = q.camera_offline_high_eta({ etaMin: Number.isFinite(num) ? num : 15 });
  else out = q.incidents_query({ state, type, days: /(\d+)\s*days?/i.test(question) ? Number(question.match(/(\d+)\s*days?/i)![1]) : 30 });
  return { question, answer: out.summary, confidence: out.confidence, results: out.results, provenance: out.provenance, engine: "built-in", caveats: ["Decision support only — Guardian takes no consequential action without authorisation."] };
}

const TOOLS: Anthropic.Tool[] = [
  { name: "state_trend", description: "Compare this month's incidents in a state with last month and list likely drivers (campaigns, time bands, incident types, insider-linked access).", input_schema: { type: "object", properties: { state: { type: "string" }, type: { type: "string", enum: ["vandalism", "battery_theft", "generator_theft", "diesel_theft", "cable_theft", "solar_theft", "intrusion", "sabotage"] } }, required: ["state"] } },
  { name: "contractor_visits_before_theft", description: "Contractor/technician site visits followed by a theft at the same site within N hours.", input_schema: { type: "object", properties: { hours: { type: "number" } } } },
  { name: "top_risk_sites", description: "Highest 72-hour vandalism-risk sites with contributing factors and recommended actions.", input_schema: { type: "object", properties: { count: { type: "number" } } } },
  { name: "teams_missing_sla", description: "Response teams that repeatedly missed the 20-minute response SLA.", input_schema: { type: "object", properties: { minBreaches: { type: "number" } } } },
  { name: "vehicle_incidents", description: "Vehicles associated with more than one incident.", input_schema: { type: "object", properties: {} } },
  { name: "camera_offline_high_eta", description: "Sites with cameras offline and nearest response ETA above N minutes.", input_schema: { type: "object", properties: { etaMin: { type: "number" } } } },
  { name: "incidents_query", description: "List incidents by state, type and look-back window in days.", input_schema: { type: "object", properties: { state: { type: "string" }, type: { type: "string" }, days: { type: "number" } } } },
  {
    name: "submit_answer",
    description: "Submit the final answer. Call exactly once after running the queries you need.",
    strict: true,
    input_schema: { type: "object", additionalProperties: false, properties: { answer: { type: "string" }, confidence: { type: "number" }, caveats: { type: "array", items: { type: "string" } } }, required: ["answer", "confidence", "caveats"] },
  },
];

const SYSTEM = `You are Guardian, the operational-intelligence copilot inside ITIPS, a telecom-tower security platform used by a tower operator's network operations and security teams.

Answer questions using only the query tools provided; every claim must trace to records they return, and cite site IDs (ATC-…), incident IDs (INC-…) or team IDs (RT-…). If the data cannot answer the question, say so.

You advise; you never act. Do not dispatch teams, change site settings, suspend contractors or accuse anyone — describe access or vehicle links as correlations that warrant review, and present risk scores as estimates, not predictions.

Run the queries you need, then call submit_answer once with a concise answer, a confidence between 0 and 1, and any caveats.`;

async function viaClaude(q: Queries, question: string): Promise<GuardianAnswer> {
  const client = new Anthropic();
  const messages: Anthropic.MessageParam[] = [{ role: "user", content: question }];
  const results: Result[] = [];
  const provenance = new Set<string>();
  for (let turn = 0; turn < 6; turn++) {
    const response = await client.beta.messages.create({
      model: "claude-opus-5-5",
      max_tokens: 16000,
      output_config: { effort: "medium" },
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: SYSTEM,
      tools: TOOLS,
      messages,
    } as Parameters<typeof client.beta.messages.create>[0]) as Anthropic.Message;
    if (response.stop_reason === "refusal") throw new Error("Guardian request declined by model safeguards");
    messages.push({ role: "assistant", content: response.content });
    const uses = response.content.filter((b): b is Anthropic.ToolUseBlock => b.type === "tool_use");
    const submit = uses.find((u) => u.name === "submit_answer");
    if (submit) {
      const input = submit.input as { answer: string; confidence: number; caveats: string[] };
      return { question, answer: input.answer, confidence: Math.max(0, Math.min(1, input.confidence)), results: dedupe(results), provenance: [...provenance], engine: "claude", caveats: [...input.caveats, "Decision support only — Guardian takes no consequential action without authorisation."] };
    }
    if (!uses.length) {
      const text = response.content.filter((b): b is Anthropic.TextBlock => b.type === "text").map((b) => b.text).join("\n");
      return { question, answer: text || "No answer produced.", confidence: 0.5, results: dedupe(results), provenance: [...provenance], engine: "claude", caveats: [] };
    }
    messages.push({
      role: "user",
      content: uses.map((u): Anthropic.ToolResultBlockParam => {
        const fn = (q as unknown as Record<string, (a: unknown) => QueryOutput>)[u.name];
        if (!fn || u.name.startsWith("_")) return { type: "tool_result", tool_use_id: u.id, content: `Unknown tool ${u.name}`, is_error: true };
        const out = fn(u.input ?? {});
        results.push(...out.results);
        out.provenance.forEach((p) => provenance.add(p));
        return { type: "tool_result", tool_use_id: u.id, content: JSON.stringify({ summary: out.summary, results: out.results.slice(0, 20) }) };
      }),
    });
  }
  throw new Error("Guardian did not finish within 6 turns");
}

const dedupe = (rs: Result[]) => [...new Map(rs.map((r) => [r.id, r])).values()];

export async function askGuardian(snap: OpsSnapshot, question: string, nowMs: number): Promise<GuardianAnswer> {
  const q = makeQueries(snap, nowMs);
  if (process.env.ANTHROPIC_API_KEY) {
    try { return await viaClaude(q, question); }
    catch (err) {
      const a = builtIn(q, question);
      a.caveats.unshift(`Claude engine unavailable (${err instanceof Error ? err.message : "error"}); answered by the built-in engine.`);
      return a;
    }
  }
  return builtIn(q, question);
}
