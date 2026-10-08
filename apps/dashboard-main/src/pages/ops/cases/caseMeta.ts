import { CASE_STAGES, type CaseStage, type EvidenceItem } from "@/lib/ops";

export const EVIDENCE_KIND_LABEL: Record<EvidenceItem["kind"], string> = {
  original_footage: "Original footage", event_clip: "Event clip", still: "Still image", sensor_log: "Sensor log",
  ai_classification: "AI classification", gps_record: "GPS record", access_log: "Access log", bodycam: "Responder bodycam",
  statement: "Statement", recovered_asset: "Recovered asset",
};

/** Stage colour: investigation (amber) → prosecution (blue) → outcome (green). */
export function stageColor(stage: CaseStage): string {
  const i = CASE_STAGES.indexOf(stage);
  if (i <= 2) return "#f59e0b";
  if (i <= 5) return "#06b6d4";
  if (i <= 7) return "#3b82f6";
  return "#22c55e";
}

export const shortHash = (h: string) => `${h.slice(0, 12)}…${h.slice(-6)}`;
