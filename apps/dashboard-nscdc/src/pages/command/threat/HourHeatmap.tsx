interface HeatRow {
  label: string;
  values: number[]; // 24
  highlight?: boolean;
  onClick?: () => void;
}

/** Hour-of-day (WAT) heatmap; each row is shaded relative to its own peak to expose timing patterns. */
export function HourHeatmap({ rows }: { rows: HeatRow[] }) {
  if (rows.length === 0) return <p className="text-[12px] text-muted-foreground text-center py-8">No incidents match the current filters.</p>;
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[640px]">
        <div className="grid items-center gap-[2px]" style={{ gridTemplateColumns: "110px repeat(24, minmax(0, 1fr)) 40px" }}>
          <span />
          {Array.from({ length: 24 }, (_, h) => (
            <span key={h} className="text-center font-mono text-[9px] text-muted-foreground">{h % 3 === 0 ? String(h).padStart(2, "0") : ""}</span>
          ))}
          <span className="text-right text-[9px] uppercase tracking-wider text-muted-foreground">Σ</span>
          {rows.map((r) => {
            const max = Math.max(1, ...r.values);
            const total = r.values.reduce((s, v) => s + v, 0);
            return (
              <Row key={r.label} row={r} max={max} total={total} />
            );
          })}
        </div>
        <div className="mt-2 flex items-center gap-2 text-[9px] text-muted-foreground">
          <span>Hour of detection (WAT) · shade relative to row peak</span>
          <span className="ml-auto">low</span>
          <span className="h-2 w-24 rounded" style={{ background: "linear-gradient(90deg, rgba(34,197,94,0.08), #eab308, #ef4444)" }} />
          <span>peak</span>
        </div>
      </div>
    </div>
  );
}

function Row({ row, max, total }: { row: HeatRow; max: number; total: number }) {
  return (
    <>
      <button onClick={row.onClick} disabled={!row.onClick}
        className={`truncate text-left text-[11px] pr-1 ${row.highlight ? "text-primary font-semibold" : "text-foreground"} ${row.onClick ? "hover:text-primary" : ""}`}>
        {row.label}
      </button>
      {row.values.map((v, h) => (
        <span key={h} title={`${row.label} · ${String(h).padStart(2, "0")}:00–${String(h).padStart(2, "0")}:59 · ${v} incidents`}
          className="h-5 rounded-[2px]" style={{ background: heat(v / max) }} />
      ))}
      <span className="text-right font-mono tabular-nums text-[10px] text-muted-foreground">{total}</span>
    </>
  );
}

function heat(t: number): string {
  if (t <= 0) return "rgba(148,163,184,0.06)";
  // green → amber → red
  const stops = [[34, 197, 94], [234, 179, 8], [239, 68, 68]];
  const x = t * 2;
  const [a, b] = x <= 1 ? [stops[0], stops[1]] : [stops[1], stops[2]];
  const f = x <= 1 ? x : x - 1;
  const c = a.map((v, i) => Math.round(v + (b[i] - v) * f));
  return `rgba(${c[0]},${c[1]},${c[2]},${0.25 + t * 0.7})`;
}
