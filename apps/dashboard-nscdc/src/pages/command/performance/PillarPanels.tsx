import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Meter } from "@/components/cnii/Pill";
import { PILLARS, compositeColor, type FormationRow } from "./scorecards";

const TOOLTIP_STYLE = { background: "hsl(var(--card))", border: "1px solid hsl(var(--primary) / 0.3)", fontSize: 11 };

/** Radar of the five pillars for the selected formation vs its parent (or national) benchmark. */
export function PillarRadar({ row, benchmark }: { row: FormationRow; benchmark?: FormationRow }) {
  const data = PILLARS.map((p) => ({
    pillar: `${p.label} ${Math.round(p.weight * 100)}%`,
    selected: row.pillars[p.key],
    benchmark: benchmark?.pillars[p.key],
  }));
  return (
    <div className="h-[250px]">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="62%" margin={{ top: 8, right: 40, bottom: 8, left: 40 }}>
          <PolarGrid stroke="hsl(var(--primary) / 0.15)" />
          <PolarAngleAxis dataKey="pillar" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
          <PolarRadiusAxis domain={[0, 100]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 8 }} axisLine={false} tickCount={5} />
          {benchmark && (
            <Radar name={benchmark.name} dataKey="benchmark" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.08} strokeDasharray="4 3" />
          )}
          <Radar name={row.name} dataKey="selected" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.25} />
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Legend wrapperStyle={{ fontSize: 10 }} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Shows the weighting explicitly and how the selected formation's composite is built. */
export function WeightingExplainer({ row }: { row: FormationRow }) {
  return (
    <div className="space-y-2.5">
      <p className="text-[11px] text-muted-foreground leading-relaxed">
        Performance is measured by a <span className="text-foreground font-semibold">weighted composite</span>, not raw arrest counts.
        Each pillar is scored 0–100 and weighted:
      </p>
      <div className="space-y-1.5">
        {PILLARS.map((p) => {
          const v = row.pillars[p.key];
          return (
            <div key={p.key} className="grid grid-cols-[1fr_auto] gap-x-2 items-center">
              <div className="min-w-0">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-1.5 text-foreground">
                    <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
                    {p.label} <span className="font-mono text-muted-foreground">×{Math.round(p.weight * 100)}%</span>
                  </span>
                  <span className="font-mono tabular-nums text-foreground">{v}</span>
                </div>
                <Meter value={v} color={p.color} className="mt-0.5" />
                <p className="text-[9px] text-muted-foreground truncate">{p.measures}</p>
              </div>
              <span className="font-mono tabular-nums text-[10px] text-primary w-10 text-right">+{(v * p.weight).toFixed(1)}</span>
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-between border-t border-primary/15 pt-2 text-xs">
        <span className="text-muted-foreground">Composite = Σ pillar × weight</span>
        <span className="font-mono font-bold text-lg tabular-nums" style={{ color: compositeColor(row.composite) }}>{row.composite}</span>
      </div>
    </div>
  );
}
