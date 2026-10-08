import { useMemo, useState } from "react";
import { Database, Search, ShieldAlert, ShieldCheck } from "lucide-react";
import { Panel } from "@/components/cnii/Panel";
import { EVIDENCE_KIND_LABEL, fmtDate, fmtTime, type EvidenceItem, type EvidenceKind } from "@/lib/cnii";

const FIELD = "h-8 rounded-md border border-primary/20 bg-background/60 px-2 text-xs text-foreground focus:outline-none focus:border-primary/50 min-w-0";

type Integrity = "all" | "ok" | "unverified" | "gap" | "any_issue";

const INTEGRITY_LABEL: Record<Integrity, string> = {
  all: "All integrity states",
  ok: "Verified & intact",
  unverified: "Hash not verified",
  gap: "Custody gap",
  any_issue: "Any integrity issue",
};

export function EvidenceRegister({ items, selectedId, onSelect }: { items: EvidenceItem[]; selectedId: string | null; onSelect: (id: string) => void }) {
  const [q, setQ] = useState("");
  const [caseId, setCaseId] = useState("all");
  const [kind, setKind] = useState<"all" | EvidenceKind>("all");
  const [integrity, setIntegrity] = useState<Integrity>("all");

  const caseIds = useMemo(() => [...new Set(items.map((e) => e.caseId).filter((c): c is string => !!c))].sort().reverse(), [items]);
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return items
      .filter((e) => caseId === "all" || e.caseId === caseId)
      .filter((e) => kind === "all" || e.kind === kind)
      .filter((e) => {
        switch (integrity) {
          case "ok": return e.hashVerified && e.custodyIntact;
          case "unverified": return !e.hashVerified;
          case "gap": return !e.custodyIntact;
          case "any_issue": return !e.hashVerified || !e.custodyIntact;
          default: return true;
        }
      })
      .filter((e) => !needle || [e.id, e.title, e.originatingDevice, e.caseId ?? "", e.incidentId, e.sha256, e.acquiredBy].some((s) => s.toLowerCase().includes(needle)))
      .sort((a, b) => b.capturedAt.localeCompare(a.capturedAt));
  }, [items, q, caseId, kind, integrity]);

  return (
    <Panel title="Evidence register" icon={Database} actions={<span className="text-[10px] font-mono text-muted-foreground">{filtered.length}/{items.length}</span>} bodyClassName="p-3 flex flex-col gap-2">
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Evidence ID, device, hash, incident…" className={`${FIELD} w-full pl-7`} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <select value={caseId} onChange={(e) => setCaseId(e.target.value)} className={FIELD} aria-label="Filter by case">
          <option value="all">All cases</option>
          {caseIds.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={kind} onChange={(e) => setKind(e.target.value as typeof kind)} className={FIELD} aria-label="Filter by kind">
          <option value="all">All kinds</option>
          {(Object.keys(EVIDENCE_KIND_LABEL) as EvidenceKind[]).map((k) => <option key={k} value={k}>{EVIDENCE_KIND_LABEL[k]}</option>)}
        </select>
        <select value={integrity} onChange={(e) => setIntegrity(e.target.value as Integrity)} className={FIELD} aria-label="Filter by integrity">
          {(Object.keys(INTEGRITY_LABEL) as Integrity[]).map((k) => <option key={k} value={k}>{INTEGRITY_LABEL[k]}</option>)}
        </select>
      </div>
      <div className="max-h-[720px] overflow-auto -mx-1">
        <table className="w-full text-[11px]">
          <thead className="sticky top-0 bg-card text-[9px] uppercase tracking-[0.1em] text-muted-foreground border-b border-primary/15">
            <tr>
              <th className="px-2 py-1.5 text-left">Evidence</th>
              <th className="px-2 py-1.5 text-left">Kind</th>
              <th className="px-2 py-1.5 text-left hidden md:table-cell">Case</th>
              <th className="px-2 py-1.5 text-left">Captured</th>
              <th className="px-2 py-1.5 text-center" title="Hash · Custody">Integrity</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((e) => {
              const sel = e.id === selectedId;
              const issue = !e.hashVerified || !e.custodyIntact;
              return (
                <tr key={e.id} onClick={() => onSelect(e.id)} className={`border-b border-border/30 cursor-pointer ${sel ? "bg-primary/10" : issue ? "bg-destructive/5 hover:bg-destructive/10" : "hover:bg-primary/5"}`}>
                  <td className="px-2 py-1.5 min-w-0">
                    <span className="block font-mono text-primary">{e.id}</span>
                    <span className="block text-foreground truncate max-w-[220px]">{e.title}</span>
                  </td>
                  <td className="px-2 py-1.5 whitespace-nowrap text-muted-foreground">{EVIDENCE_KIND_LABEL[e.kind]}</td>
                  <td className="px-2 py-1.5 font-mono whitespace-nowrap text-muted-foreground hidden md:table-cell">{e.caseId ?? "—"}</td>
                  <td className="px-2 py-1.5 font-mono whitespace-nowrap text-muted-foreground">{fmtDate(e.capturedAt)}<span className="block text-[10px]">{fmtTime(e.capturedAt)}</span></td>
                  <td className="px-2 py-1.5">
                    <span className="flex items-center justify-center gap-1">
                      {e.hashVerified ? <ShieldCheck className="h-3.5 w-3.5 text-success" aria-label="Hash verified" /> : <ShieldAlert className="h-3.5 w-3.5 text-destructive" aria-label="Hash not verified" />}
                      <span className={`h-2 w-2 rounded-full ${e.custodyIntact ? "bg-success" : "bg-warning"}`} title={e.custodyIntact ? "Custody intact" : "Custody gap"} />
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!filtered.length && <p className="py-8 text-center text-xs text-muted-foreground">No evidence matches these filters.</p>}
      </div>
    </Panel>
  );
}
