import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ChevronRight, Flag } from "lucide-react";
import { Meter } from "@/components/cnii/Pill";
import { fmtDuration, fmtNaira } from "@/lib/cnii";
import { PILLARS, compositeColor, type FormationRow } from "./scorecards";

type SortKey =
  | "composite" | "name" | "incidentsAssigned" | "ackSeconds" | "mobilisationSeconds" | "responseSeconds" | "slaCompliance"
  | "successfulInterventions" | "recoveriesNaira" | "falseDispatches" | "evidenceCompleteness" | "reportCompletion"
  | "repeatIncidents" | "conductFlags" | "arrests";

/** Lower is better for these — the default sort direction flips. */
const LOWER_BETTER = new Set<SortKey>(["ackSeconds", "mobilisationSeconds", "responseSeconds", "falseDispatches", "repeatIncidents", "conductFlags", "name"]);

const COLS: { key: SortKey; label: string; title: string; render: (r: FormationRow) => string }[] = [
  { key: "incidentsAssigned", label: "Inc.", title: "Incidents assigned", render: (r) => String(r.incidentsAssigned) },
  { key: "ackSeconds", label: "Ack", title: "Acknowledgement time (dispatch → acceptance)", render: (r) => fmtDuration(r.ackSeconds) },
  { key: "mobilisationSeconds", label: "Mob", title: "Mobilisation time (acceptance → departure)", render: (r) => fmtDuration(r.mobilisationSeconds) },
  { key: "responseSeconds", label: "Resp", title: "Response time (alert → verified arrival)", render: (r) => fmtDuration(r.responseSeconds) },
  { key: "slaCompliance", label: "SLA", title: "SLA compliance", render: (r) => `${r.slaCompliance}%` },
  { key: "successfulInterventions", label: "Interv.", title: "Successful interventions", render: (r) => String(r.successfulInterventions) },
  { key: "recoveriesNaira", label: "Recov.", title: "Recoveries (₦)", render: (r) => fmtNaira(r.recoveriesNaira) },
  { key: "falseDispatches", label: "False", title: "False dispatches", render: (r) => String(r.falseDispatches) },
  { key: "evidenceCompleteness", label: "Evid.", title: "Evidence completeness", render: (r) => `${r.evidenceCompleteness}%` },
  { key: "reportCompletion", label: "Report", title: "Report completion", render: (r) => `${r.reportCompletion}%` },
  { key: "repeatIncidents", label: "Repeat", title: "Repeat incidents at the same sites", render: (r) => String(r.repeatIncidents) },
];

type SortState = { key: SortKey; desc: boolean };

function Th({ k, label, title, className = "", sort, onSort }: { k: SortKey; label: string; title?: string; className?: string; sort: SortState; onSort: (k: SortKey) => void }) {
  return (
    <th className={`px-2 py-2 font-medium whitespace-nowrap ${className}`} title={title}>
      <button onClick={() => onSort(k)} className={`inline-flex items-center gap-0.5 uppercase tracking-[0.1em] hover:text-primary ${sort.key === k ? "text-primary" : ""}`}>
        {label}
        {sort.key === k && (sort.desc ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />)}
      </button>
    </th>
  );
}

export function ScorecardTable({ rows, onOpen }: { rows: FormationRow[]; onOpen: (r: FormationRow) => void }) {
  const [sort, setSort] = useState<SortState>({ key: "composite", desc: true });

  // Rank is always by composite, independent of the current column sort.
  const rank = useMemo(() => new Map([...rows].sort((a, b) => b.composite - a.composite).map((r, i) => [r.id, i + 1])), [rows]);
  const sorted = useMemo(() => {
    const out = [...rows].sort((a, b) => {
      const av = a[sort.key]; const bv = b[sort.key];
      const cmp = typeof av === "string" && typeof bv === "string" ? av.localeCompare(bv) : (av as number) - (bv as number);
      return sort.desc ? -cmp : cmp;
    });
    return out;
  }, [rows, sort]);

  const toggle = (key: SortKey) => setSort((s) => (s.key === key ? { key, desc: !s.desc } : { key, desc: !LOWER_BETTER.has(key) }));

  if (!rows.length) return <p className="p-6 text-center text-xs text-muted-foreground">No subordinate formations with recorded activity.</p>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead className="text-[9px] text-muted-foreground border-b border-primary/15">
          <tr className="text-right">
            <th className="px-2 py-2 text-left font-medium uppercase tracking-[0.1em]">#</th>
            <Th sort={sort} onSort={toggle} k="name" label="Formation" className="text-left" />
            <Th sort={sort} onSort={toggle} k="composite" label="Composite" title="Weighted composite — primary measure" className="text-left" />
            <th className="px-2 py-2 font-medium uppercase tracking-[0.1em] text-left whitespace-nowrap" title="Pillar scores: Response · Prevention · Conduct · Evidence · Outcomes">Pillars</th>
            {COLS.map((c) => <Th sort={sort} onSort={toggle} key={c.key} k={c.key} label={c.label} title={c.title} />)}
            <Th sort={sort} onSort={toggle} k="conductFlags" label="Flags" title="Professional conduct flags" />
            <Th sort={sort} onSort={toggle} k="arrests" label="Arrests*" title="Secondary indicator only — not a performance target" className="opacity-70" />
          </tr>
        </thead>
        <tbody>
          {sorted.map((r) => {
            return (
              <tr key={r.id} onClick={() => onOpen(r)} className="border-b border-border/30 hover:bg-primary/5 cursor-pointer text-right font-mono tabular-nums">
                <td className="px-2 py-1.5 text-left text-muted-foreground">{rank.get(r.id)}</td>
                <td className="px-2 py-1.5 text-left font-sans">
                  <span className="inline-flex items-center gap-1 text-foreground whitespace-nowrap">
                    {r.name}
                    <ChevronRight className="h-3 w-3 text-primary/60" />
                  </span>
                </td>
                <td className="px-2 py-1.5 text-left">
                  <div className="flex items-center gap-2 min-w-[96px]">
                    <span className="font-bold w-7" style={{ color: compositeColor(r.composite) }}>{r.composite}</span>
                    <Meter value={r.composite} color={compositeColor(r.composite)} className="flex-1" />
                  </div>
                </td>
                <td className="px-2 py-1.5 text-left">
                  <div className="flex items-end gap-0.5 h-4" title={PILLARS.map((p) => `${p.label} ${r.pillars[p.key]}`).join(" · ")}>
                    {PILLARS.map((p) => (
                      <span key={p.key} className="w-1.5 rounded-sm" style={{ height: `${Math.max(8, r.pillars[p.key])}%`, background: p.color }} />
                    ))}
                  </div>
                </td>
                {COLS.map((c) => <td key={c.key} className="px-2 py-1.5 whitespace-nowrap">{c.render(r)}</td>)}
                <td className="px-2 py-1.5">
                  {r.conductFlags > 0
                    ? <span className="inline-flex items-center gap-0.5 text-destructive"><Flag className="h-3 w-3" />{r.conductFlags}</span>
                    : <span className="text-muted-foreground">0</span>}
                </td>
                <td className="px-2 py-1.5 text-muted-foreground/80">{r.arrests}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="px-2 pt-2 text-[10px] text-muted-foreground">
        Ranked by weighted composite. *Arrests are shown for context only and are not a performance target — rewarding raw arrest counts
        incentivises low-quality arrests over prevention, lawful conduct and prosecutable evidence.
      </p>
    </div>
  );
}
