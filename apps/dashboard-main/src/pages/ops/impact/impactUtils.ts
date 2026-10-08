import type { Incident, MonthlyImpact } from "@/lib/ops";

export const LOSS_KEYS = ["batteries", "generators", "diesel", "cables", "solar", "restoration"] as const;
export type LossKey = (typeof LOSS_KEYS)[number];
export const LOSS_LABEL: Record<LossKey, string> = {
  batteries: "Batteries stolen", generators: "Generators stolen / damaged", diesel: "Diesel losses", cables: "Feeder cable losses",
  solar: "Solar equipment losses", restoration: "Restoration expenditure",
};
export const LOSS_COLOR: Record<LossKey, string> = {
  batteries: "#06b6d4", generators: "#3b82f6", diesel: "#eab308", cables: "#a855f7", solar: "#84cc16", restoration: "#f97316",
};

/** Seed restoration rate is ₦4,200 per downtime minute → default value of an avoided downtime hour. */
export const DEFAULT_DOWNTIME_VALUE_PER_HOUR = 4_200 * 60;

export const monthLabel = (m: string) =>
  new Date(`${m}-01T00:00:00Z`).toLocaleDateString("en-GB", { month: "short", year: "2-digit", timeZone: "UTC" });

export const totalLoss = (m: MonthlyImpact) => LOSS_KEYS.reduce((s, k) => s + m.losses[k], 0);

export interface Breakdown {
  key: string;
  incidents: number;
  loss: number;
  recovered: number;
  downtimeH: number;
}

export function breakdownBy(incidents: Incident[], keyOf: (i: Incident) => string): Breakdown[] {
  const m = new Map<string, Breakdown>();
  for (const i of incidents) {
    const k = keyOf(i);
    const b = m.get(k) ?? { key: k, incidents: 0, loss: 0, recovered: 0, downtimeH: 0 };
    b.incidents++;
    b.loss += i.lossNaira;
    b.recovered += i.recoveredNaira;
    b.downtimeH += i.downtimeMin / 60;
    m.set(k, b);
  }
  return [...m.values()].sort((a, b) => b.loss - a.loss);
}
