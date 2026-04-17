/**
 * Canonical status color tokens used across all 4 apps.
 * Single source of truth for critical/alert/secure visual identity.
 */
export const STATUS_COLORS = {
  critical: { fill: "#ef4444", bg: "rgba(239,68,68,0.15)", border: "#ef4444" },
  alert:    { fill: "#f97316", bg: "rgba(249,115,22,0.15)", border: "#f97316" },
  secure:   { fill: "#22c55e", bg: "rgba(34,197,94,0.08)",  border: "#22c55e" },
} as const;

export type MastStatus = keyof typeof STATUS_COLORS;
