import { ASSET_LABEL, type AccessVisit, type Incident } from "@/lib/ops";
import { OUTCOME_LABEL } from "./campaignUtils";

/** The ten Threat DNA genes. */
export const GENES = [
  { key: "people", label: "People" },
  { key: "vehicles", label: "Vehicles" },
  { key: "time", label: "Time" },
  { key: "geo", label: "Geography" },
  { key: "entry", label: "Entry method" },
  { key: "target", label: "Target asset" },
  { key: "tools", label: "Tools" },
  { key: "behaviour", label: "Behaviour" },
  { key: "response", label: "Response" },
  { key: "outcome", label: "Outcome" },
] as const;
export type GeneKey = (typeof GENES)[number]["key"];

export interface Gene {
  key: GeneKey;
  /** Normalised tokens used for similarity */
  tokens: string[];
  /** Short human value */
  display: string;
}
export type ThreatDna = Record<GeneKey, Gene>;

const TOOLS: Record<string, string[]> = {
  "Gate forced": ["Pry bar"],
  "Fence cut": ["Bolt cutters"],
  "Tank lock cut": ["Bolt cutters"],
  "Truck-assisted removal": ["Truck", "Lifting straps"],
  "Insider-assisted access": ["Technician PIN / key"],
  "Equipment smashed": ["Hammer"],
  "Cables cut at ladder base": ["Hacksaw / cable cutters"],
  "Battery cabinet forced": ["Pry bar", "Spanner set"],
  "Climbed fence": ["None observed"],
  "Ladder climb": ["Ladder"],
  "Feeder cables cut": ["Hacksaw / cable cutters"],
  "Generator housing cut": ["Angle grinder"],
  "Panel brackets unbolted": ["Spanner set"],
  "Fuel tank siphoned": ["Siphon hose", "Jerrycans"],
};

/** WAT hour (0–23) and weekday (0 = Mon). */
export function watParts(iso: string): { hour: number; weekday: number } {
  const d = new Date(new Date(iso).getTime() + 3600_000);
  return { hour: d.getUTCHours(), weekday: (d.getUTCDay() + 6) % 7 };
}


export function threatDna(inc: Incident, visits: AccessVisit[]): ThreatDna {
  const linked = visits.filter((v) => v.linkedIncidentId === inc.id);
  const { hour } = watParts(inc.detectedAt);
  const band = Math.floor(hour / 3) * 3;
  const people = linked.length ? [...new Set(linked.map((v) => v.employer))] : [];
  const plates = [...new Set([...inc.vehiclePlates, ...linked.map((v) => v.vehiclePlate)])];
  const tools = [...new Set(inc.modus.flatMap((m) => TOOLS[m] ?? ["Unknown"]))];
  const night = hour < 5 || hour >= 22;
  const behaviour = [
    night ? "Night-time" : "Daytime",
    ...(inc.insiderRisk ? ["Prior authorised access"] : []),
    ...(linked.some((v) => v.flags.includes("repeat_before_theft")) ? ["Reconnaissance visit"] : []),
    ...(linked.some((v) => v.flags.includes("camera_obstructed_after")) ? ["Camera obstruction"] : []),
    ...(inc.vehiclePlates.length ? ["Vehicle staging"] : []),
  ];
  const arrived = inc.response.stages.arrived;
  const respMin = arrived ? Math.round((new Date(arrived).getTime() - new Date(inc.detectedAt).getTime()) / 60000) : null;
  const response = respMin == null ? "No verified arrival" : inc.response.breached ? `SLA breached (${respMin} min)` : `Within SLA (${respMin} min)`;

  return {
    people: { key: "people", tokens: people.length ? people : ["unknown"], display: people.length ? `${linked.map((v) => v.person).join(", ")} (${people.join(", ")})` : "Unknown offenders" },
    vehicles: { key: "vehicles", tokens: plates.length ? plates : ["none"], display: plates.length ? plates.join(", ") : "None seen" },
    time: { key: "time", tokens: [`band-${band}`, night ? "night" : "day"], display: `${String(hour).padStart(2, "0")}:00 WAT (${String(band).padStart(2, "0")}–${String(band + 3).padStart(2, "0")})` },
    geo: { key: "geo", tokens: [inc.state, inc.clusterId], display: `${inc.state} · ${inc.clusterId}` },
    entry: { key: "entry", tokens: inc.modus, display: inc.modus.join(", ") || "Unknown" },
    target: { key: "target", tokens: [inc.targetAsset], display: ASSET_LABEL[inc.targetAsset] },
    tools: { key: "tools", tokens: tools, display: tools.join(", ") },
    behaviour: { key: "behaviour", tokens: behaviour, display: behaviour.join(", ") },
    response: { key: "response", tokens: [respMin == null ? "none" : inc.response.breached ? "breach" : "ok"], display: response },
    outcome: { key: "outcome", tokens: [inc.outcome], display: OUTCOME_LABEL[inc.outcome] },
  };
}

const jaccard = (a: string[], b: string[]) => {
  const A = new Set(a); const B = new Set(b);
  const inter = [...A].filter((x) => B.has(x)).length;
  const union = new Set([...A, ...B]).size;
  return union ? inter / union : 0;
};

/** Per-gene match (0–1) and overall similarity (0–100). */
export function compareDna(a: ThreatDna, b: ThreatDna): { genes: Record<GeneKey, number>; score: number } {
  const genes = Object.fromEntries(GENES.map((g) => [g.key, jaccard(a[g.key].tokens, b[g.key].tokens)])) as Record<GeneKey, number>;
  const score = Math.round((Object.values(genes).reduce((s, x) => s + x, 0) / GENES.length) * 100);
  return { genes, score };
}

export const matchColor = (m: number) => (m >= 0.99 ? "#22c55e" : m >= 0.4 ? "#eab308" : "#475569");
