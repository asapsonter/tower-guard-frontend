import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Incident } from "@/lib/cnii";
import { metricsFor } from "./slaMetrics";

const BIN_MIN = 2;
const MAX_MIN = 36;
const TICK = { fill: "hsl(var(--muted-foreground))", fontSize: 10 };

/** Distribution of alert→arrival times (2-min bins), split met/breached, with SLA target lines. */
export function ArrivalChart({ incidents }: { incidents: Incident[] }) {
  const data = useMemo(() => {
    const bins = Array.from({ length: MAX_MIN / BIN_MIN }, (_, i) => ({ mid: i * BIN_MIN + BIN_MIN / 2, label: `${i * BIN_MIN}–${(i + 1) * BIN_MIN}`, met: 0, breached: 0 }));
    for (const inc of incidents) {
      const sec = metricsFor(inc).arrival;
      if (sec == null) continue;
      const idx = Math.min(bins.length - 1, Math.floor(sec / 60 / BIN_MIN));
      if (inc.response.breached || sec > inc.response.slaSeconds) bins[idx].breached += 1; else bins[idx].met += 1;
    }
    bins[bins.length - 1].label = `${MAX_MIN - BIN_MIN}+`;
    return bins;
  }, [incidents]);

  if (!data.some((d) => d.met + d.breached > 0)) return <p className="text-xs text-muted-foreground">No verified arrivals in this period.</p>;

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 16, right: 8, left: -18, bottom: 0 }} barCategoryGap={2} barGap={0}>
        <CartesianGrid stroke="hsl(var(--primary) / 0.1)" vertical={false} />
        <XAxis dataKey="mid" type="number" domain={[0, MAX_MIN]} ticks={[0, 5, 10, 15, 20, 25, 30, 35]} tick={TICK} tickLine={false} axisLine={{ stroke: "hsl(var(--primary) / 0.2)" }}
          label={{ value: "Alert → verified arrival (min)", position: "insideBottom", offset: -2, fill: "hsl(var(--muted-foreground))", fontSize: 10 }} height={34} />
        <YAxis tick={TICK} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip cursor={{ fill: "hsl(var(--primary) / 0.06)" }}
          contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--primary) / 0.3)", fontSize: 11 }}
          labelFormatter={(_, p) => `${p?.[0]?.payload?.label ?? ""} min`} />
        <Legend wrapperStyle={{ fontSize: 10 }} iconSize={8} />
        <ReferenceLine x={15} stroke="#f59e0b" strokeDasharray="4 3" label={{ value: "SLA 15m FCT/Lagos", fill: "#f59e0b", fontSize: 9, position: "insideTopRight" }} />
        <ReferenceLine x={20} stroke="#ef4444" strokeDasharray="4 3" label={{ value: "SLA 20m other states", fill: "#ef4444", fontSize: 9, position: "insideTopLeft" }} />
        <Bar dataKey="met" name="SLA met" stackId="a" fill="#22c55e" stroke="hsl(var(--card))" strokeWidth={1} />
        <Bar dataKey="breached" name="SLA breached" stackId="a" fill="#ef4444" stroke="hsl(var(--card))" strokeWidth={1} radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
