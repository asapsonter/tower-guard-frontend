import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, AlertTriangle } from "lucide-react";
import { Pill } from "@/components/cnii/Pill";
import { fmtDate, fmtDuration, type Incident } from "@/lib/cnii";
import { EVIDENCE_LABEL, discrepancyFor, metricsFor, unverifiedArrival, type ResponseMetrics } from "./slaMetrics";

type SortKey = "id" | "state" | "unit" | keyof ResponseMetrics | "sla";

const COLUMNS: { key: SortKey; label: string; numeric?: boolean }[] = [
  { key: "id", label: "Incident" },
  { key: "state", label: "State" },
  { key: "unit", label: "Unit" },
  { key: "sla", label: "SLA", numeric: true },
  { key: "dispatchLatency", label: "Dispatch latency", numeric: true },
  { key: "turnout", label: "Turnout", numeric: true },
  { key: "travel", label: "Travel", numeric: true },
  { key: "arrival", label: "Arrival", numeric: true },
  { key: "intervention", label: "Intervention", numeric: true },
  { key: "total", label: "Total", numeric: true },
];

interface Row { inc: Incident; m: ResponseMetrics }

function sortValue(r: Row, key: SortKey): string | number | null {
  switch (key) {
    case "id": return r.inc.id;
    case "state": return r.inc.state;
    case "unit": return r.inc.respondingUnitId ?? "";
    case "sla": return r.inc.response.slaSeconds;
    default: return r.m[key];
  }
}

/** Sortable response audit; breaches and claimed/verified discrepancies highlighted. */
export function AuditTable({ incidents, selectedId, onSelect }: { incidents: Incident[]; selectedId?: string; onSelect: (id: string) => void }) {
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "arrival", dir: -1 });

  const rows = useMemo(() => {
    const list: Row[] = incidents.map((inc) => ({ inc, m: metricsFor(inc) }));
    return list.sort((a, b) => {
      const va = sortValue(a, sort.key); const vb = sortValue(b, sort.key);
      if (va == null && vb == null) return 0;
      if (va == null) return 1; // nulls last regardless of direction
      if (vb == null) return -1;
      return (typeof va === "number" && typeof vb === "number" ? va - vb : String(va).localeCompare(String(vb))) * sort.dir;
    });
  }, [incidents, sort]);

  if (rows.length === 0) return <p className="p-4 text-xs text-muted-foreground">No incidents match this filter.</p>;

  const header = (c: (typeof COLUMNS)[number]) => {
    const active = sort.key === c.key;
    return (
      <th key={c.key} className={`pr-3 py-2 ${c.numeric ? "text-right" : ""}`}>
        <button onClick={() => setSort({ key: c.key, dir: active ? (sort.dir === 1 ? -1 : 1) : c.numeric ? -1 : 1 })}
          className={`inline-flex items-center gap-0.5 uppercase tracking-[0.14em] ${active ? "text-primary" : "hover:text-foreground"}`}>
          {c.label}{active && (sort.dir === 1 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
        </button>
      </th>
    );
  };

  return (
    <div className="overflow-x-auto max-h-[520px] overflow-y-auto">
      <table className="w-full min-w-[1180px] text-[11px]">
        <thead className="sticky top-0 z-10 bg-card/95 backdrop-blur">
          <tr className="text-left text-[9px] text-muted-foreground">
            {COLUMNS.map(header)}
            <th className="pr-3">Arrival evidence</th>
            <th className="pr-3">Result</th>
            <th className="pr-3">Breach reason</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ inc, m }) => {
            const d = discrepancyFor(inc);
            const noEvidence = unverifiedArrival(inc);
            const breached = inc.response.breached;
            const sel = inc.id === selectedId;
            return (
              <tr key={inc.id} onClick={() => onSelect(inc.id)}
                className={`cursor-pointer border-t border-primary/10 hover:bg-secondary/40 ${breached ? "bg-destructive/5" : ""} ${sel ? "outline outline-1 outline-primary/60" : ""}`}
                style={breached ? { boxShadow: "inset 3px 0 0 #ef4444" } : undefined}>
                <td className="py-1.5 pr-3 whitespace-nowrap">
                  <span className="font-mono text-primary">{inc.id}</span>
                  <span className="block text-[9px] text-muted-foreground">{fmtDate(inc.detectedAt)}</span>
                </td>
                <td className="pr-3 whitespace-nowrap">{inc.state}</td>
                <td className="pr-3 font-mono">{inc.respondingUnitId ?? "—"}</td>
                <td className="pr-3 text-right font-mono tabular-nums text-muted-foreground">{Math.round(inc.response.slaSeconds / 60)}m</td>
                {(["dispatchLatency", "turnout", "travel", "arrival", "intervention", "total"] as const).map((k) => (
                  <td key={k} className={`pr-3 text-right font-mono tabular-nums ${k === "arrival" && m.arrival != null && m.arrival > inc.response.slaSeconds ? "text-destructive font-semibold" : ""}`}>
                    {fmtDuration(m[k])}
                  </td>
                ))}
                <td className="pr-3">
                  <div className="flex flex-wrap gap-1">
                    {inc.response.arrivalEvidence.map((e) => <Pill key={e} color="#22c55e">{EVIDENCE_LABEL[e]}</Pill>)}
                    {noEvidence && <Pill color="#ef4444"><AlertTriangle className="h-2.5 w-2.5" /> No independent evidence</Pill>}
                    {d && <Pill color="#f59e0b" solid>Claimed {Math.round(d.claimedSec / 60)}m · verified {Math.round(d.verifiedSec / 60)}m</Pill>}
                    {!m.arrival && !noEvidence && <span className="text-muted-foreground">—</span>}
                  </div>
                </td>
                <td className="pr-3">
                  {m.arrival == null && inc.status !== "closed"
                    ? <Pill color={breached ? "#ef4444" : "#3b82f6"}>{breached ? "Overdue" : "In progress"}</Pill>
                    : <Pill color={breached ? "#ef4444" : "#22c55e"}>{breached ? "Breached" : "Met"}</Pill>}
                </td>
                <td className="pr-3 text-muted-foreground max-w-[260px]">{inc.response.breachReason ?? "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
