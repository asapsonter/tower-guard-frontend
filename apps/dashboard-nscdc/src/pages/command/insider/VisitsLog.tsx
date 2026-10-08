import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import type { CniiSnapshot, Incident } from "@/lib/cnii";
import { fmtDate, fmtTime } from "@/lib/cnii";
import { Pill } from "@/components/cnii/Pill";
import { CORRELATION_WINDOW_H, followingIncident } from "./correlate";

/** Searchable work-order visit log with anomaly flags. */
export function VisitsLog({ snap, bySite, onReferral }: { snap: CniiSnapshot; bySite: Map<string, Incident[]>; onReferral: (id: string) => void }) {
  const [q, setQ] = useState("");
  const [anomaliesOnly, setAnomaliesOnly] = useState(false);

  const rows = useMemo(() => {
    const refByVisit = new Map<string, string[]>();
    for (const r of snap.insiderReferrals) for (const vid of r.linkedVisitIds) refByVisit.set(vid, [...(refByVisit.get(vid) ?? []), r.id]);
    return snap.visits.map((v) => {
      const link = followingIncident(v, bySite);
      const within = link.gapHours != null && link.gapHours <= CORRELATION_WINDOW_H ? link : null;
      const flags = [
        !v.workOrder && "No work order",
        v.cameraObstructed && "Camera obstructed",
        within && `Incident +${Math.round(within.gapHours!)}h`,
      ].filter((f): f is string => !!f);
      return { v, flags, incident: within?.incident ?? null, referrals: refByVisit.get(v.id) ?? [] };
    }).sort((a, b) => b.v.visitAt.localeCompare(a.v.visitAt));
  }, [snap, bySite]);

  const shown = rows.filter((r) => {
    if (anomaliesOnly && !r.flags.length) return false;
    if (!q.trim()) return true;
    const s = q.toLowerCase();
    return [r.v.id, r.v.technician, r.v.contractor, r.v.vehiclePlate, r.v.siteName, r.v.operator, r.v.workOrder ?? "no work order"].some((x) => x.toLowerCase().includes(s));
  });

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 px-4 py-2.5 border-b border-primary/10">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Technician, contractor, plate, site, work order…"
            className="w-full bg-secondary/50 border border-primary/20 rounded-md pl-8 pr-2.5 py-1.5 text-[12px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/50" />
        </div>
        <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground cursor-pointer">
          <input type="checkbox" checked={anomaliesOnly} onChange={(e) => setAnomaliesOnly(e.target.checked)} className="accent-[hsl(var(--primary))]" />
          Anomalies only
        </label>
        <span className="ml-auto text-[10px] font-mono text-muted-foreground">{shown.length} / {rows.length} visits</span>
      </div>
      <div className="overflow-x-auto max-h-[440px] overflow-y-auto">
        <table className="w-full text-[11px]">
          <thead className="sticky top-0 bg-card z-10">
            <tr className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground text-left">
              {["Visit", "Time", "Technician / contractor", "Vehicle", "Site", "Work order", "Assets touched", "Flags"].map((h) => <th key={h} className="px-3 py-2 font-normal whitespace-nowrap">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {shown.map(({ v, flags, incident, referrals }) => (
              <tr key={v.id} className={`border-t border-primary/10 ${flags.length ? "bg-destructive/5" : ""}`}>
                <td className="px-3 py-1.5 font-mono text-muted-foreground whitespace-nowrap">{v.id}</td>
                <td className="px-3 py-1.5 font-mono whitespace-nowrap">{fmtDate(v.visitAt)} <span className="text-muted-foreground">{fmtTime(v.visitAt).slice(0, 5)}</span></td>
                <td className="px-3 py-1.5"><p className="text-foreground">{v.technician}</p><p className="text-[10px] text-muted-foreground">{v.contractor}</p></td>
                <td className="px-3 py-1.5 font-mono whitespace-nowrap">{v.vehiclePlate}</td>
                <td className="px-3 py-1.5"><p className="text-foreground">{v.siteName}</p><p className="text-[10px] text-muted-foreground">{v.operator}</p></td>
                <td className="px-3 py-1.5 font-mono whitespace-nowrap">{v.workOrder ?? <span className="text-destructive font-semibold">NONE</span>}</td>
                <td className="px-3 py-1.5 text-muted-foreground">{v.assetsTouched.join(", ")}</td>
                <td className="px-3 py-1.5">
                  <div className="flex flex-wrap gap-1">
                    {flags.map((f) => <Pill key={f} color={f.startsWith("Incident") ? "#f97316" : "#ef4444"}>{f}</Pill>)}
                    {incident && <Link to={`/incident/${incident.id}`} className="text-[10px] font-mono text-primary hover:underline">{incident.id}</Link>}
                    {referrals.map((r) => <button key={r} onClick={() => onReferral(r)} className="hud-chip text-primary">{r}</button>)}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!shown.length && <p className="text-xs text-muted-foreground p-4">No visits match.</p>}
      </div>
    </div>
  );
}
