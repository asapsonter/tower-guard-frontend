/**
 * Guardian AI — NSCDC investigative copilot.
 *
 * Answers are always built from dataset queries so every result links back
 * to a record (incident, case, suspect, vehicle…) with provenance. Guardian
 * recommends and summarises; it never arrests, blacklists or accuses.
 *
 * Engines:
 *  - "claude": when ANTHROPIC_API_KEY is set, Claude plans which queries to
 *    run (tool use) and writes the narrative answer.
 *  - "built-in": keyword intent routing over the same query functions.
 */
import Anthropic from "@anthropic-ai/sdk";
import type { CniiSnapshot, GuardianAnswer, IncidentType } from "./types.js";
import { distanceKm } from "./geo.js";

type Result = GuardianAnswer["results"][number];
interface QueryOutput { summary: string; results: Result[]; provenance: string[]; confidence: number }

const DAY_MS = 86400_000;
const TYPE_WORDS: [RegExp, IncidentType][] = [
  [/cable/i, "cable_theft"],
  [/batter|generator|diesel/i, "battery_generator_theft"],
  [/armed|gun|weapon/i, "armed_intrusion"],
  [/sabotage/i, "tower_sabotage"],
  [/vandal/i, "vandalism"],
];
const naira = (n: number) => `₦${(n / 1_000_000).toFixed(1)}m`;

// ── Query functions (shared by both engines) ──────────────────────────────

export function makeQueries(snap: CniiSnapshot, nowMs: number) {
  const states = snap.stateCommands.map((s) => s.state);
  const findState = (q: string) => states.find((s) => new RegExp(`\\b${s === "FCT" ? "(FCT|Abuja)" : s}\\b`, "i").test(q)) ?? null;

  return {
    incidents_query(args: { state?: string | null; type?: IncidentType | null; days?: number; operator?: string | null }): QueryOutput {
      const days = args.days ?? 90;
      const list = snap.incidents.filter((i) =>
        (!args.state || i.state.toLowerCase() === args.state.toLowerCase()) &&
        (!args.type || i.type === args.type) &&
        (!args.operator || i.operator.toLowerCase().includes(args.operator.toLowerCase())) &&
        nowMs - new Date(i.detectedAt).getTime() <= days * DAY_MS,
      );
      const byType = new Map<string, number>();
      list.forEach((i) => byType.set(i.type, (byType.get(i.type) ?? 0) + 1));
      return {
        summary: `${list.length} incident(s)${args.state ? ` in ${args.state}` : ""}${args.type ? ` of type ${args.type}` : ""} in the last ${days} days. By type: ${[...byType].map(([k, v]) => `${k} ${v}`).join(", ") || "none"}.`,
        results: list.slice(0, 25).map((i) => ({ id: i.id, kind: "incident", label: `${i.id} · ${i.title}`, detail: `${i.siteName} · ${i.operator} · ${i.detectedAt.slice(0, 10)} · ${i.status}`, link: `/incident/${i.id}` })),
        provenance: ["ITIPS incident register (verified sensor + camera events)"],
        confidence: 0.97,
      };
    },

    cross_operator_suspects(): QueryOutput {
      const rows = snap.suspects
        .map((s) => {
          const incs = snap.incidents.filter((i) => i.suspectIds.includes(s.id));
          const graphIncs = snap.graph.edges.filter((e) => e.from === s.id && e.to.startsWith("INC-")).map((e) => snap.incidents.find((i) => i.id === e.to)).filter(Boolean);
          const all = [...new Map([...incs, ...graphIncs].map((i) => [i!.id, i!])).values()];
          const ops = [...new Set(all.map((i) => i.operator))];
          return { s, all, ops };
        })
        .filter((r) => r.ops.length > 1)
        .sort((a, b) => b.ops.length - a.ops.length);
      return {
        summary: `${rows.length} suspect(s) are linked to incidents at more than one operator.`,
        results: rows.map((r) => ({ id: r.s.id, kind: "suspect", label: r.s.name ? `${r.s.name} ("${r.s.alias}")` : `Unidentified ("${r.s.alias}")`, detail: `${r.ops.join(" → ")} · ${r.all.length} incidents · status ${r.s.status}`, link: `/intelligence?focus=${r.s.id}` })),
        provenance: ["Case files (arrest records, witness statements)", "CCTV analyst review", "Threat relationship graph edges with confidence ≥ 0.6"],
        confidence: 0.82,
      };
    },

    stolen_asset_cases(args: { equipmentType?: string | null }): QueryOutput {
      const want = (args.equipmentType ?? "battery").toLowerCase();
      const assets = snap.stolenAssets.filter((a) => a.equipmentType.includes(want.replace(/s$/, "")) || (want.includes("lithium") && a.equipmentType === "battery"));
      const caseIds = [...new Set(assets.map((a) => snap.incidents.find((i) => i.id === a.incidentId)?.caseId).filter((x): x is string => !!x))];
      return {
        summary: `${assets.length} ${want} asset(s) on the stolen-asset registry across ${caseIds.length} case(s); ${assets.filter((a) => a.recoveryStatus === "recovered").length} recovered, total value ${naira(assets.reduce((s, a) => s + a.valueNaira, 0))}.`,
        results: caseIds.slice(0, 20).map((cid) => {
          const c = snap.cases.find((x) => x.id === cid)!;
          const n = assets.filter((a) => snap.incidents.find((i) => i.id === a.incidentId)?.caseId === cid).length;
          return { id: cid, kind: "case", label: `${cid} · ${c.title}`, detail: `${n} ${want} item(s) · ${c.status} · lead ${c.leadInvestigator}`, link: `/investigations/${cid}` };
        }),
        provenance: ["National CNII Stolen Asset Registry (operator serial numbers)"],
        confidence: 0.94,
      };
    },

    sla_by_command(args: { threshold?: number }): QueryOutput {
      const threshold = args.threshold ?? 90;
      const rows = snap.scorecards.filter((r) => r.level === "state" && r.incidentsAssigned > 0 && r.slaCompliance < threshold).sort((a, b) => a.slaCompliance - b.slaCompliance);
      return {
        summary: `${rows.length} state command(s) below ${threshold}% response-SLA compliance over the last 90 days.`,
        results: rows.map((r) => ({ id: r.id, kind: "command", label: r.name, detail: `SLA ${r.slaCompliance}% · ${r.incidentsAssigned} incidents · avg response ${Math.round(r.responseSeconds / 60)} min`, link: `/performance?focus=${r.id}` })),
        provenance: ["Response records with GPS-geofence arrival evidence", "Unit-claimed arrivals excluded where not independently verified"],
        confidence: 0.9,
      };
    },

    vehicles_multi_site(): QueryOutput {
      const rows = snap.vehicles.filter((v) => v.seenAt.length > 1).sort((a, b) => b.seenAt.length - a.seenAt.length);
      return {
        summary: `${rows.length} vehicle(s) appeared near more than one vandalised site.`,
        results: rows.map((v) => ({ id: v.id, kind: "vehicle", label: `${v.plate ?? "Unregistered"} · ${v.description}`, detail: `Seen at ${v.seenAt.length} sites: ${v.seenAt.join(", ")}`, link: `/intelligence?focus=${v.id}` })),
        provenance: ["ANPR and site CCTV", "Witness statements"],
        confidence: 0.8,
      };
    },

    stale_investigations(args: { days?: number }): QueryOutput {
      const days = args.days ?? 30;
      const rows = snap.cases.filter((c) => (c.status === "open" || c.status === "referred") && nowMs - new Date(c.lastActivityAt).getTime() > days * DAY_MS)
        .sort((a, b) => a.lastActivityAt.localeCompare(b.lastActivityAt));
      return {
        summary: `${rows.length} open investigation(s) with no recorded activity for over ${days} days.`,
        results: rows.slice(0, 30).map((c) => ({ id: c.id, kind: "case", label: `${c.id} · ${c.title}`, detail: `Last activity ${c.lastActivityAt.slice(0, 10)} · lead ${c.leadInvestigator} · ${c.state}`, link: `/investigations/${c.id}` })),
        provenance: ["Investigation case activity log"],
        confidence: 0.96,
      };
    },

    contractor_incidents(args: { contractor: string }): QueryOutput {
      const needle = args.contractor.toLowerCase().replace(/\b(ltd|limited|services?)\b/g, "").trim();
      const visits = snap.visits.filter((v) => v.contractor.toLowerCase().includes(needle) || v.technician.toLowerCase().includes(needle));
      const siteIds = new Set(visits.map((v) => v.siteId));
      const incs = snap.incidents.filter((i) => siteIds.has(i.siteId) && visits.some((v) => v.siteId === i.siteId && new Date(v.visitAt) < new Date(i.detectedAt) && new Date(i.detectedAt).getTime() - new Date(v.visitAt).getTime() < 3 * DAY_MS));
      const referrals = snap.insiderReferrals.filter((r) => r.subject.toLowerCase().includes(needle));
      return {
        summary: `${visits.length} recorded visit(s) by "${args.contractor}"; ${incs.length} incident(s) occurred at a visited site within 72h of a visit. ${referrals.length} insider-risk referral(s) exist. This is a correlation for investigation, not a finding of wrongdoing.`,
        results: [
          ...referrals.map((r) => ({ id: r.id, kind: "referral", label: `${r.id} · ${r.pattern}`, detail: `Risk ${r.riskScore} · ${r.status}`, link: `/insider?focus=${r.id}` })),
          ...incs.map((i) => ({ id: i.id, kind: "incident", label: `${i.id} · ${i.title}`, detail: `${i.siteName} · ${i.detectedAt.slice(0, 10)}`, link: `/incident/${i.id}` })),
        ],
        provenance: ["Operator work-order and access-control systems", "ITIPS incident register"],
        confidence: incs.length ? 0.74 : 0.5,
      };
    },

    deployment_recommendation(args: { teams?: number }): QueryOutput {
      const teams = Math.max(1, Math.min(10, args.teams ?? 5));
      const covered = (p: { lat: number; lng: number }) => snap.units.filter((u) => (u.status === "available" || u.status === "standby") && distanceKm(u.location, p) < 8).length;
      const candidates = [
        ...snap.predictions.map((p) => ({ id: p.id, name: p.region, location: p.location, score: p.confidence * 100 + (p.changePct ?? 20), why: p.headline })),
        ...snap.hotspots.map((h) => ({ id: h.id, name: h.name, location: h.location, score: h.incidents90d * 2, why: `${h.incidents90d} incidents in 90 days (${h.dominantType.replace(/_/g, " ")})` })),
      ]
        .map((c) => ({ ...c, score: c.score - covered(c.location) * 15 }))
        .sort((a, b) => b.score - a.score)
        .filter((c, i, arr) => arr.findIndex((x) => distanceKm(x.location, c.location) < 10) === i)
        .slice(0, teams);
      return {
        summary: `Suggested night positions for ${teams} additional patrol team(s), 22:00–05:00, weighted by predicted risk and existing coverage. A commander must approve any deployment.`,
        results: candidates.map((c, i) => ({ id: c.id, kind: "deployment", label: `Team ${i + 1} → ${c.name}`, detail: `${c.why} · ${covered(c.location)} team(s) already within 8 km`, link: `/threat?focus=${c.id}` })),
        provenance: ["90-day incident history (night-weighted)", "Predictive risk model outputs", "Live unit positions"],
        confidence: 0.68,
      };
    },

    _findState: findState,
  };
}

type Queries = ReturnType<typeof makeQueries>;

// ── Built-in engine ───────────────────────────────────────────────────────

function builtIn(q: Queries, question: string): GuardianAnswer {
  const days = Number(question.match(/(\d+)\s*days?/i)?.[1] ?? 90);
  const type = TYPE_WORDS.find(([re]) => re.test(question))?.[1] ?? null;
  let out: QueryOutput;
  if (/more than one operator|multiple operators|cross[- ]operator/i.test(question)) out = q.cross_operator_suspects();
  else if (/stolen|lithium|recover/i.test(question) && /batter|cable|generator|solar|asset/i.test(question)) out = q.stolen_asset_cases({ equipmentType: question.match(/cable|generator|solar|rectifier|antenna/i)?.[0] ?? "battery" });
  else if (/sla|miss|late|slow/i.test(question) && /command/i.test(question)) out = q.sla_by_command({});
  else if (/vehicle/i.test(question)) out = q.vehicles_multi_site();
  else if (/not progressed|stale|no activity|stalled|inactive/i.test(question)) out = q.stale_investigations({ days: Number(question.match(/(\d+)\s*days?/i)?.[1] ?? 30) });
  else if (/contractor|technician/i.test(question)) out = q.contractor_incidents({ contractor: question.match(/contractor\s+([\w\s.-]+?)(\?|$)/i)?.[1]?.trim() ?? "Apex" });
  else if (/deploy|patrol|position|tonight/i.test(question)) out = q.deployment_recommendation({ teams: Number(question.match(/(\d+)\s*(additional\s*)?(patrol\s*)?teams?/i)?.[1] ?? 5) });
  else out = q.incidents_query({ state: q._findState(question), type, days });
  return {
    question,
    answer: out.summary,
    confidence: out.confidence,
    results: out.results,
    provenance: out.provenance,
    engine: "built-in",
    caveats: ["Results are decision support. Guardian does not arrest, blacklist or accuse; authorised officers decide."],
  };
}

// ── Claude engine ─────────────────────────────────────────────────────────

const TOOLS: Anthropic.Tool[] = [
  { name: "incidents_query", description: "List ITIPS telecom incidents filtered by state, type, operator and look-back window in days.", input_schema: { type: "object", properties: { state: { type: "string", description: "Nigerian state, or FCT for Abuja" }, type: { type: "string", enum: ["vandalism", "theft", "armed_intrusion", "cable_theft", "battery_generator_theft", "tower_sabotage"] }, operator: { type: "string" }, days: { type: "number" } } } },
  { name: "cross_operator_suspects", description: "Suspects linked to incidents at more than one telecom operator.", input_schema: { type: "object", properties: {} } },
  { name: "stolen_asset_cases", description: "Cases involving stolen equipment from the national stolen asset registry.", input_schema: { type: "object", properties: { equipmentType: { type: "string", description: "battery | generator | cable | solar_panel | rectifier | antenna" } } } },
  { name: "sla_by_command", description: "State commands below a response-SLA compliance threshold (percent).", input_schema: { type: "object", properties: { threshold: { type: "number" } } } },
  { name: "vehicles_multi_site", description: "Vehicles observed near more than one incident site.", input_schema: { type: "object", properties: {} } },
  { name: "stale_investigations", description: "Open investigations with no activity for more than N days.", input_schema: { type: "object", properties: { days: { type: "number" } } } },
  { name: "contractor_incidents", description: "Visits by a contractor or technician and incidents at visited sites within 72 hours, plus insider-risk referrals.", input_schema: { type: "object", properties: { contractor: { type: "string" } }, required: ["contractor"] } },
  { name: "deployment_recommendation", description: "Risk-weighted positions for additional patrol teams tonight.", input_schema: { type: "object", properties: { teams: { type: "number" } } } },
  {
    name: "submit_answer",
    description: "Submit the final answer to the commander. Call exactly once, after running the queries you need.",
    strict: true,
    input_schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        answer: { type: "string", description: "Concise answer citing record IDs from query results." },
        confidence: { type: "number", description: "0 to 1, reflecting evidence strength." },
        caveats: { type: "array", items: { type: "string" } },
      },
      required: ["answer", "confidence", "caveats"],
    },
  },
];

const SYSTEM = `You are Guardian, the investigative copilot for the Nigeria Security and Civil Defence Corps (NSCDC) Critical National Information Infrastructure command.

Answer commanders' questions using only the query tools provided. Every claim must trace to records returned by a tool; cite record IDs (INC-…, NSCDC-CNII-…, SUS-…, VEH-…). If the data cannot answer the question, say so.

You support decisions; you never decide. Do not label any person guilty, do not recommend arrests or blacklisting, and describe insider-risk or suspect links as correlations that warrant investigation, subject to lawful process. Deployment suggestions are recommendations for an authorised officer to approve.

Run the queries you need, then call submit_answer once with a short answer (a few sentences or a short list), a confidence between 0 and 1, and any caveats.`;

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

    const toolUses = response.content.filter((b): b is Anthropic.ToolUseBlock => b.type === "tool_use");
    const submit = toolUses.find((t) => t.name === "submit_answer");
    if (submit) {
      const input = submit.input as { answer: string; confidence: number; caveats: string[] };
      return {
        question,
        answer: input.answer,
        confidence: Math.max(0, Math.min(1, input.confidence)),
        results: dedupe(results),
        provenance: [...provenance],
        engine: "claude",
        caveats: [...input.caveats, "Guardian does not arrest, blacklist or accuse; authorised officers decide."],
      };
    }
    if (toolUses.length === 0) {
      const text = response.content.filter((b): b is Anthropic.TextBlock => b.type === "text").map((b) => b.text).join("\n");
      return { question, answer: text || "No answer produced.", confidence: 0.5, results: dedupe(results), provenance: [...provenance], engine: "claude", caveats: [] };
    }

    const toolResults: Anthropic.ToolResultBlockParam[] = toolUses.map((t) => {
      const fn = (q as unknown as Record<string, (a: unknown) => QueryOutput>)[t.name];
      if (!fn || t.name.startsWith("_")) return { type: "tool_result", tool_use_id: t.id, content: `Unknown tool ${t.name}`, is_error: true };
      const out = fn(t.input ?? {});
      results.push(...out.results);
      out.provenance.forEach((p) => provenance.add(p));
      return { type: "tool_result", tool_use_id: t.id, content: JSON.stringify({ summary: out.summary, results: out.results.slice(0, 20) }) };
    });
    messages.push({ role: "user", content: toolResults });
  }
  throw new Error("Guardian did not finish within 6 turns");
}

const dedupe = (rs: Result[]) => [...new Map(rs.map((r) => [r.id, r])).values()];

export async function askGuardian(snap: CniiSnapshot, question: string, nowMs: number): Promise<GuardianAnswer> {
  const q = makeQueries(snap, nowMs);
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      return await viaClaude(q, question);
    } catch (err) {
      const answer = builtIn(q, question);
      answer.caveats.unshift(`Claude engine unavailable (${err instanceof Error ? err.message : "error"}); answered by the built-in engine.`);
      return answer;
    }
  }
  return builtIn(q, question);
}
