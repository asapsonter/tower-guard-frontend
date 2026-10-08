import { useMemo, useState } from "react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Incident, ModusOperandi } from "@/lib/cnii";
import { MODUS_LABEL } from "@/lib/cnii";
import { MODUS_ORDER, OPERATORS, moMatrix, moTrend } from "./analysis";

const MO_COLOR: Record<ModusOperandi, string> = {
  fence_cutting: "#f97316", gate_compromise: "#eab308", impersonation: "#ec4899", insider_assisted: "#ef4444", battery_removal: "#06b6d4",
  generator_theft: "#3b82f6", diesel_siphoning: "#84cc16", cable_cutting: "#a855f7", solar_theft: "#facc15", equipment_substitution: "#94a3b8",
};

const tick = { fill: "hsl(var(--muted-foreground))", fontSize: 10 };
const tipStyle = { background: "hsl(var(--card))", border: "1px solid hsl(var(--primary) / 0.3)", fontSize: 11 };

/** MO × operator heatmap. A row lit across many operators is a cross-operator pattern. */
export function ModusHeatmap({ incidents, selected, onSelect }: { incidents: Incident[]; selected: ModusOperandi | null; onSelect: (m: ModusOperandi | null) => void }) {
  const matrix = useMemo(() => moMatrix(incidents), [incidents]);
  const max = Math.max(1, ...[...matrix.values()].flatMap((r) => Object.values(r)));
  if (!incidents.length) return <p className="text-xs text-muted-foreground">No incidents in range.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[11px] border-separate border-spacing-[3px]">
        <thead>
          <tr>
            <th className="text-left text-[9px] uppercase tracking-[0.14em] text-muted-foreground font-normal">Modus operandi</th>
            {OPERATORS.map((o) => <th key={o} className="text-[9px] uppercase tracking-[0.1em] text-muted-foreground font-normal whitespace-nowrap px-1">{o}</th>)}
            <th className="text-[9px] uppercase tracking-[0.1em] text-muted-foreground font-normal">Total</th>
            <th className="text-[9px] uppercase tracking-[0.1em] text-muted-foreground font-normal">Spread</th>
          </tr>
        </thead>
        <tbody>
          {MODUS_ORDER.map((mo) => {
            const row = matrix.get(mo)!;
            const total = OPERATORS.reduce((s, o) => s + row[o], 0);
            const spread = OPERATORS.filter((o) => row[o] > 0).length;
            const active = selected === mo;
            return (
              <tr key={mo} className={`cursor-pointer ${selected && !active ? "opacity-40" : ""}`} onClick={() => onSelect(active ? null : mo)}>
                <td className="whitespace-nowrap pr-2 text-foreground">
                  <span className="inline-block h-2 w-2 rounded-full mr-1.5" style={{ background: MO_COLOR[mo] }} />{MODUS_LABEL[mo]}
                </td>
                {OPERATORS.map((o) => {
                  const v = row[o];
                  return (
                    <td key={o} className="text-center font-mono tabular-nums rounded-sm h-7 min-w-[42px]"
                      style={{ background: v ? `hsl(var(--primary) / ${0.08 + (v / max) * 0.72})` : "hsl(var(--secondary) / 0.4)", color: v / max > 0.55 ? "#04070d" : undefined }}
                      title={`${MODUS_LABEL[mo]} · ${o}: ${v}`}>
                      {v || "·"}
                    </td>
                  );
                })}
                <td className="text-center font-mono tabular-nums text-foreground">{total}</td>
                <td className="text-center">
                  <span className={`font-mono text-[10px] ${spread >= 4 ? "text-warning" : "text-muted-foreground"}`}>{spread}/{OPERATORS.length}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="text-[10px] text-muted-foreground mt-2">
        Click a row to isolate that MO in the trend. <span className="text-warning">Spread ≥ 4</span> = the same method is hitting most operators — a correlation for analysts, not a finding.
      </p>
    </div>
  );
}

export function ModusTrend({ incidents, nowIso, selected }: { incidents: Incident[]; nowIso: string; selected: ModusOperandi | null }) {
  const data = useMemo(() => moTrend(incidents, nowIso), [incidents, nowIso]);
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const top = useMemo(() => {
    const totals = MODUS_ORDER.map((mo) => [mo, data.reduce((s, r) => s + (r[mo] as number), 0)] as const).sort((a, b) => b[1] - a[1]);
    return selected ? [selected] : totals.slice(0, 5).map(([mo]) => mo);
  }, [data, selected]);
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid stroke="hsl(var(--primary) / 0.1)" vertical={false} />
        <XAxis dataKey="week" tick={tick} interval={1} />
        <YAxis tick={tick} allowDecimals={false} />
        <Tooltip contentStyle={tipStyle} labelFormatter={(l) => `Week ending ${l}`} />
        <Legend wrapperStyle={{ fontSize: 10, cursor: "pointer" }} onClick={(e) => { const k = String(e.dataKey); setHidden((h) => { const n = new Set(h); n.has(k) ? n.delete(k) : n.add(k); return n; }); }} />
        {top.map((mo) => (
          <Line key={mo} type="monotone" dataKey={mo} name={MODUS_LABEL[mo]} stroke={MO_COLOR[mo]} strokeWidth={2} dot={false} hide={hidden.has(mo)} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
