import { useMemo } from "react";
import type { Incident } from "@/lib/ops";
import { watParts } from "./dna";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Hour-of-day × weekday incident heatmap (WAT). */
export function Heatmap({ incidents }: { incidents: Incident[] }) {
  const { grid, max, hourTotals } = useMemo(() => {
    const g = DAYS.map(() => Array(24).fill(0) as number[]);
    incidents.forEach((i) => { const { hour, weekday } = watParts(i.detectedAt); g[weekday][hour]++; });
    const totals = Array.from({ length: 24 }, (_, h) => g.reduce((s, row) => s + row[h], 0));
    return { grid: g, max: Math.max(1, ...g.flat()), hourTotals: totals };
  }, [incidents]);
  const maxHour = Math.max(1, ...hourTotals);

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[640px]">
        <div className="grid gap-[2px]" style={{ gridTemplateColumns: "34px repeat(24, minmax(0, 1fr))" }}>
          <span />
          {hourTotals.map((t, h) => (
            <div key={h} className="flex h-8 items-end" title={`${t} incidents at ${h}:00`}>
              <div className="w-full rounded-t-sm bg-primary/60" style={{ height: `${(t / maxHour) * 100}%` }} />
            </div>
          ))}
          {grid.map((row, d) => (
            <div key={d} className="contents">
              <span className="pr-1 text-right text-[9px] uppercase text-muted-foreground leading-[18px]">{DAYS[d]}</span>
              {row.map((c, h) => {
                const t = c / max;
                return (
                  <div key={h} title={`${DAYS[d]} ${String(h).padStart(2, "0")}:00 — ${c} incident(s)`} className="h-[18px] rounded-[2px]"
                    style={{ background: c ? `rgba(239, ${Math.round(160 - t * 110)}, ${Math.round(60 - t * 20)}, ${0.18 + t * 0.82})` : "hsl(var(--secondary) / 0.5)" }} />
                );
              })}
            </div>
          ))}
          <span />
          {Array.from({ length: 24 }, (_, h) => (
            <span key={h} className="text-center font-mono text-[8px] text-muted-foreground">{h % 3 === 0 ? String(h).padStart(2, "0") : ""}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
