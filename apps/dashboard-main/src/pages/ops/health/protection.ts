import type { ProtectionState, SiteSummary } from "@/lib/ops";

export const PROTECTION_STATES: ProtectionState[] = ["FULLY PROTECTED", "DEGRADED BUT OPERATIONAL", "PROTECTION AT RISK", "UNPROTECTED"];

export const PROTECTION_COLOR: Record<ProtectionState, string> = {
  "FULLY PROTECTED": "#22c55e",
  "DEGRADED BUT OPERATIONAL": "#eab308",
  "PROTECTION AT RISK": "#f97316",
  UNPROTECTED: "#ef4444",
};

export const PROTECTION_SHORT: Record<ProtectionState, string> = {
  "FULLY PROTECTED": "Fully protected",
  "DEGRADED BUT OPERATIONAL": "Degraded",
  "PROTECTION AT RISK": "At risk",
  UNPROTECTED: "Unprotected",
};

export const BACKHAUL_LABEL: Record<SiteSummary["backhaul"], string> = {
  primary: "Primary",
  secondary: "Secondary (failover)",
  down: "Down",
};
export const BACKHAUL_COLOR: Record<SiteSummary["backhaul"], string> = {
  primary: "#22c55e",
  secondary: "#eab308",
  down: "#ef4444",
};

/** Colour for a 0–100 score where higher is better. */
export function scoreColor(score: number): string {
  return score >= 90 ? "#22c55e" : score >= 70 ? "#eab308" : score >= 40 ? "#f97316" : "#ef4444";
}

/** Colour for a 0–100 risk score where higher is worse. */
export function riskColor(score: number): string {
  return score >= 70 ? "#ef4444" : score >= 50 ? "#f97316" : score >= 30 ? "#eab308" : "#22c55e";
}

export function riskBand(score: number): "Very high" | "High" | "Medium" | "Low" {
  return score >= 70 ? "Very high" : score >= 50 ? "High" : score >= 30 ? "Medium" : "Low";
}
