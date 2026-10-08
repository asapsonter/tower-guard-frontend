import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Dna } from "lucide-react";
import { Panel } from "@/components/ops/Panel";
import { INCIDENT_TYPE_COLOR, INCIDENT_TYPE_LABEL, fmtDate, type AccessVisit, type Incident } from "@/lib/ops";
import { GENES, compareDna, matchColor, threatDna } from "./dna";

/**
 * Threat DNA strips for the incidents of a campaign. Pick a reference incident
 * (A) and a comparison (B); every strip is coloured by its gene-level match to A.
 */
export function DnaPanel({ incidents, visits, className = "" }: { incidents: Incident[]; visits: AccessVisit[]; className?: string }) {
  const dnas = useMemo(() => new Map(incidents.map((i) => [i.id, threatDna(i, visits)])), [incidents, visits]);
  const [refId, setRefId] = useState<string | null>(null);
  const [cmpId, setCmpId] = useState<string | null>(null);
  const ref = incidents.find((i) => i.id === refId) ?? incidents[0];
  const cmp = incidents.find((i) => i.id === cmpId && i.id !== ref?.id) ?? incidents.find((i) => i.id !== ref?.id);

  if (!ref) return <Panel title="Threat DNA" icon={Dna} className={className}><p className="text-xs text-muted-foreground">No incidents.</p></Panel>;
  const refDna = dnas.get(ref.id)!;
  const pair = cmp ? compareDna(refDna, dnas.get(cmp.id)!) : null;
  const avg = incidents.length > 1
    ? Math.round(incidents.filter((i) => i.id !== ref.id).reduce((s, i) => s + compareDna(refDna, dnas.get(i.id)!).score, 0) / (incidents.length - 1))
    : 100;

  return (
    <Panel title="Threat DNA — campaign comparison" icon={Dna} className={className}
      actions={<span className="hud-chip">mean similarity to A · {avg}%</span>}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-[10px]">
          <thead>
            <tr className="text-left text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
              <th className="py-1 pr-2 w-14">A / B</th>
              <th className="py-1 pr-2">Incident</th>
              {GENES.map((g) => <th key={g.key} className="py-1 px-0.5 text-center">{g.label}</th>)}
              <th className="py-1 pl-2 text-right">Similarity</th>
            </tr>
          </thead>
          <tbody>
            {incidents.map((inc) => {
              const dna = dnas.get(inc.id)!;
              const isRef = inc.id === ref.id;
              const cmpRes = compareDna(refDna, dna);
              return (
                <tr key={inc.id} className={`border-t border-primary/5 ${isRef ? "bg-primary/10" : inc.id === cmp?.id ? "bg-warning/5" : ""}`}>
                  <td className="py-1 pr-2 whitespace-nowrap">
                    <button onClick={() => setRefId(inc.id)} className={`mr-1 rounded px-1 font-bold ${isRef ? "bg-primary text-primary-foreground" : "border border-primary/30 text-primary"}`}>A</button>
                    <button disabled={isRef} onClick={() => setCmpId(inc.id)} className={`rounded px-1 font-bold disabled:opacity-30 ${inc.id === cmp?.id ? "bg-warning text-black" : "border border-warning/40 text-warning"}`}>B</button>
                  </td>
                  <td className="py-1 pr-2 whitespace-nowrap">
                    <Link to={`/incidents/${inc.id}`} className="font-mono text-primary hover:underline">{inc.id}</Link>
                    <span className="ml-1 text-muted-foreground">{fmtDate(inc.detectedAt).slice(0, 6)}</span>
                    <span className="ml-1" style={{ color: INCIDENT_TYPE_COLOR[inc.type] }}>{INCIDENT_TYPE_LABEL[inc.type]}</span>
                  </td>
                  {GENES.map((g) => (
                    <td key={g.key} className="px-0.5 py-1">
                      <div title={`${g.label}: ${dna[g.key].display}`} className="h-4 rounded-sm"
                        style={{ background: isRef ? "hsl(var(--primary) / 0.7)" : matchColor(cmpRes.genes[g.key]), opacity: isRef ? 1 : 0.35 + cmpRes.genes[g.key] * 0.65 }} />
                    </td>
                  ))}
                  <td className="py-1 pl-2 text-right font-mono tabular-nums text-foreground">{isRef ? "ref" : `${cmpRes.score}%`}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-2 flex flex-wrap gap-3 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1"><span className="h-2.5 w-4 rounded-sm" style={{ background: matchColor(1) }} /> same as A</span>
        <span className="flex items-center gap-1"><span className="h-2.5 w-4 rounded-sm" style={{ background: matchColor(0.5) }} /> partial</span>
        <span className="flex items-center gap-1"><span className="h-2.5 w-4 rounded-sm" style={{ background: matchColor(0) }} /> different</span>
      </div>

      {cmp && pair && (
        <div className="mt-3 rounded-md border border-primary/15">
          <div className="flex items-center gap-2 border-b border-primary/10 px-3 py-1.5 text-[11px]">
            <span className="font-mono text-primary">A {ref.id}</span>
            <span className="text-muted-foreground">vs</span>
            <span className="font-mono text-warning">B {cmp.id}</span>
            <span className="ml-auto font-mono font-bold text-foreground">{pair.score}% similar</span>
          </div>
          <div className="divide-y divide-primary/5">
            {GENES.map((g) => (
              <div key={g.key} className="grid grid-cols-[90px_1fr_1fr_14px] gap-2 px-3 py-1 text-[10px] items-center">
                <span className="uppercase tracking-[0.12em] text-muted-foreground">{g.label}</span>
                <span className="text-foreground truncate" title={refDna[g.key].display}>{refDna[g.key].display}</span>
                <span className="text-foreground truncate" title={dnas.get(cmp.id)![g.key].display}>{dnas.get(cmp.id)![g.key].display}</span>
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: matchColor(pair.genes[g.key]) }} />
              </div>
            ))}
          </div>
        </div>
      )}
      <p className="mt-2 text-[10px] text-muted-foreground">Similarity is a correlation aid for analysts — shared genes suggest, but do not prove, a common actor.</p>
    </Panel>
  );
}
