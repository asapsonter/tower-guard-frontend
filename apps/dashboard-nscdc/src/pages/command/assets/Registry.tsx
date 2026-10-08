import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import type { Operator, StolenAsset, Suspect } from "@/lib/cnii";
import { fmtDate, fmtNaira } from "@/lib/cnii";
import { Pill } from "@/components/cnii/Pill";
import { EQUIPMENT_LABEL, EQUIPMENT_TYPES, RECOVERY_STATUS_COLOR, type EquipmentType } from "./insights";

const PAGE = 80;
const selectCls = "bg-secondary/50 border border-primary/20 rounded-md px-2 py-1.5 text-[11px] text-foreground focus:outline-none focus:border-primary/50";

/** National CNII Stolen Asset Registry — searchable, filterable. */
export function Registry({ assets, suspects }: { assets: StolenAsset[]; suspects: Suspect[] }) {
  const [q, setQ] = useState("");
  const [type, setType] = useState<EquipmentType | "all">("all");
  const [status, setStatus] = useState<StolenAsset["recoveryStatus"] | "all">("all");
  const [op, setOp] = useState<Operator | "all">("all");
  const [limit, setLimit] = useState(PAGE);
  const susName = useMemo(() => new Map(suspects.map((s) => [s.id, s.name ?? `Unidentified ("${s.alias}")`])), [suspects]);
  const operators = useMemo(() => [...new Set(assets.map((a) => a.operator))].sort(), [assets]);

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    return assets
      .filter((a) => (type === "all" || a.equipmentType === type) && (status === "all" || a.recoveryStatus === status) && (op === "all" || a.operator === op))
      .filter((a) => !s || [a.id, a.serialNumber, a.manufacturer, a.siteName, a.operator, a.incidentId, a.receivingDealer ?? "", a.recoveryLocation?.name ?? "", a.suspectId ? susName.get(a.suspectId) ?? "" : ""]
        .some((x) => x.toLowerCase().includes(s)))
      .sort((a, b) => b.stolenAt.localeCompare(a.stolenAt));
  }, [assets, q, type, status, op, susName]);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 border-b border-primary/10">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => { setQ(e.target.value); setLimit(PAGE); }} placeholder="Serial, site, dealer, suspect, incident…"
            className="w-full bg-secondary/50 border border-primary/20 rounded-md pl-8 pr-2.5 py-1.5 text-[12px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/50" />
        </div>
        <select value={type} onChange={(e) => setType(e.target.value as EquipmentType | "all")} className={selectCls}>
          <option value="all">All equipment</option>
          {EQUIPMENT_TYPES.map((t) => <option key={t} value={t}>{EQUIPMENT_LABEL[t]}</option>)}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value as StolenAsset["recoveryStatus"] | "all")} className={selectCls}>
          <option value="all">All statuses</option>
          {(["missing", "tracked", "recovered", "destroyed"] as const).map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={op} onChange={(e) => setOp(e.target.value as Operator | "all")} className={selectCls}>
          <option value="all">All operators</option>
          {operators.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        <span className="ml-auto text-[10px] font-mono text-muted-foreground">{rows.length} records · {fmtNaira(rows.reduce((s, a) => s + a.valueNaira, 0))}</span>
      </div>
      <div className="overflow-x-auto max-h-[520px] overflow-y-auto">
        <table className="w-full text-[11px]">
          <thead className="sticky top-0 bg-card z-10">
            <tr className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground text-left">
              {["Registry ID", "Equipment", "Serial no.", "Operator / site", "Value", "Stolen", "Status", "Tracker / recovery location", "Suspect", "Receiving market / dealer"].map((h) => (
                <th key={h} className="px-3 py-2 font-normal whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, limit).map((a) => (
              <tr key={a.id} className="border-t border-primary/10 hover:bg-primary/5">
                <td className="px-3 py-1.5 font-mono text-muted-foreground whitespace-nowrap">{a.id}</td>
                <td className="px-3 py-1.5 whitespace-nowrap"><p className="text-foreground">{EQUIPMENT_LABEL[a.equipmentType]}</p><p className="text-[10px] text-muted-foreground">{a.manufacturer}</p></td>
                <td className="px-3 py-1.5 font-mono whitespace-nowrap">{a.serialNumber}</td>
                <td className="px-3 py-1.5">
                  <p className="text-foreground">{a.operator}</p>
                  <Link to={`/incident/${a.incidentId}`} className="text-[10px] text-muted-foreground hover:text-primary">{a.siteName}</Link>
                </td>
                <td className="px-3 py-1.5 font-mono tabular-nums whitespace-nowrap">{fmtNaira(a.valueNaira)}</td>
                <td className="px-3 py-1.5 font-mono whitespace-nowrap">{fmtDate(a.stolenAt)}</td>
                <td className="px-3 py-1.5"><Pill color={RECOVERY_STATUS_COLOR[a.recoveryStatus]}>{a.recoveryStatus}</Pill></td>
                <td className="px-3 py-1.5">
                  {a.recoveryLocation ? (
                    <><p className="text-foreground">{a.recoveryLocation.name}</p><p className="text-[10px] text-muted-foreground font-mono">recovered {fmtDate(a.recoveredAt)}</p></>
                  ) : a.trackerLocation ? (
                    <p className="font-mono text-warning">{a.trackerLocation.lat.toFixed(4)}, {a.trackerLocation.lng.toFixed(4)}</p>
                  ) : <span className="text-muted-foreground">—</span>}
                </td>
                <td className="px-3 py-1.5">
                  {a.suspectId ? <Link to={`/intelligence?focus=${a.suspectId}`} className="text-foreground hover:text-primary">{susName.get(a.suspectId) ?? a.suspectId}</Link> : <span className="text-muted-foreground">—</span>}
                </td>
                <td className="px-3 py-1.5">{a.receivingDealer ?? <span className="text-muted-foreground">{a.recoveryLocation ? "Dealer not identified" : "—"}</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && <p className="text-xs text-muted-foreground p-4">No registry records match.</p>}
        {rows.length > limit && (
          <button onClick={() => setLimit((l) => l + PAGE)} className="w-full py-2 text-[11px] text-primary hover:bg-primary/5 border-t border-primary/10">
            Show more ({rows.length - limit} remaining)
          </button>
        )}
      </div>
    </div>
  );
}
