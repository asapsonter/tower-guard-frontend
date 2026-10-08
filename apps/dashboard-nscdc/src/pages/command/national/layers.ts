import { INCIDENT_TYPE_COLOR, INCIDENT_TYPE_LABEL, type IncidentType } from "@/lib/cnii";

export type LayerKey =
  | "active"
  | IncidentType
  | "units"
  | "formations"
  | "hotspots"
  | "corridors"
  | "recovered";

export interface LayerDef {
  key: LayerKey;
  label: string;
  color: string;
  group: "Incidents" | "Response" | "Intelligence";
  /** Marker shape shown in the colour key */
  swatch: "dot" | "square" | "diamond" | "ring" | "line";
}

const TYPES: IncidentType[] = ["vandalism", "theft", "armed_intrusion", "cable_theft", "battery_generator_theft", "tower_sabotage"];

export const LAYERS: LayerDef[] = [
  { key: "active", label: "Active incidents", color: "#ef4444", group: "Incidents", swatch: "dot" },
  ...TYPES.map((t): LayerDef => ({ key: t, label: INCIDENT_TYPE_LABEL[t], color: INCIDENT_TYPE_COLOR[t], group: "Incidents", swatch: "dot" })),
  { key: "units", label: "Responder locations", color: "#06b6d4", group: "Response", swatch: "square" },
  { key: "formations", label: "NSCDC formations / posts", color: "#22c55e", group: "Response", swatch: "diamond" },
  { key: "hotspots", label: "Incident hotspots", color: "#f97316", group: "Intelligence", swatch: "ring" },
  { key: "corridors", label: "High-risk corridors", color: "#ef4444", group: "Intelligence", swatch: "line" },
  { key: "recovered", label: "Recovered assets", color: "#10b981", group: "Intelligence", swatch: "diamond" },
];

export const INCIDENT_TYPES = TYPES;

export const DEFAULT_LAYERS: Record<LayerKey, boolean> = Object.fromEntries(LAYERS.map((l) => [l.key, true])) as Record<LayerKey, boolean>;

/** Corridor / risk colour scale (0..100). */
export function riskColor(risk: number): string {
  if (risk >= 80) return "#ef4444";
  if (risk >= 65) return "#f97316";
  if (risk >= 50) return "#eab308";
  return "#22c55e";
}
