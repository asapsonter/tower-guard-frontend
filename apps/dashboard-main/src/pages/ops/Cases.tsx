import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Banknote, FileSearch, Gavel, Scale, Search, Siren, Users, UserX } from "lucide-react";
import { PageHeader } from "@/components/ops/Panel";
import { KpiTile } from "@/components/ops/KpiTile";
import { fmtNaira, fmtNum, useOps, type CaseStage } from "@/lib/ops";
import { CaseFunnel } from "./cases/CaseFunnel";
import { CaseList } from "./cases/CaseList";
import { CaseView } from "./cases/CaseView";

const FEATURED_INCIDENT = "INC-2026-10482";

export default function Cases() {
  const { id } = useParams<{ id: string }>();
  const { snap } = useOps();
  const [query, setQuery] = useState("");
  const [stage, setStage] = useState<CaseStage | null>(null);

  const sorted = useMemo(() => {
    if (!snap) return [];
    const featured = snap.incidents.find((i) => i.id === FEATURED_INCIDENT)?.caseId;
    return [...snap.cases].sort((a, b) =>
      Number(b.id === featured) - Number(a.id === featured) || (b.stageDates.incident ?? "").localeCompare(a.stageDates.incident ?? ""));
  }, [snap]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sorted.filter((c) =>
      (!stage || c.stage === stage) &&
      (!q || [c.id, c.title, c.incidentId, c.siteId, c.policeRef, c.court, c.owner, ...c.suspects.map((s) => s.name)].some((x) => x?.toLowerCase().includes(q))));
  }, [sorted, query, stage]);

  if (!snap) return null;
  const k = snap.caseKpis;
  const selected = id ? snap.cases.find((c) => c.id === id) : filtered[0] ?? sorted[0];

  return (
    <div className="space-y-4">
      <PageHeader title="Evidence, Investigation & Prosecution" icon={Scale}
        subtitle="Every incident automatically opens an Evidence Case File — from footage to judgment and asset recovery" />

      <div>
        <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-7 gap-3">
          <KpiTile label="Incidents" value={fmtNum(k.incidents)} icon={Siren} />
          <KpiTile label="Investigations" value={fmtNum(k.investigations)} icon={FileSearch} />
          <KpiTile label="Arrests" value={fmtNum(k.arrests)} icon={UserX} tone="text-warning" />
          <KpiTile label="Charged" value={fmtNum(k.charged)} icon={Users} tone="text-primary" />
          <KpiTile label="Active court cases" value={fmtNum(k.activeCourtCases)} icon={Gavel} tone="text-primary" />
          <KpiTile label="Convictions" value={fmtNum(k.convictions)} icon={Scale} tone="text-success" />
          <KpiTile label="Assets recovered" value={fmtNaira(k.assetsRecoveredNaira)} icon={Banknote} tone="text-success" />
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          Management view — turns security spending into measurable outcomes: from detected incidents to arrests, convictions and recovered assets.
        </p>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-5 xl:col-span-3 space-y-4 min-w-0">
          <CaseList cases={filtered} allCases={sorted} selectedId={selected?.id} query={query} onQuery={setQuery} stage={stage} onStage={setStage} />
          <CaseFunnel cases={snap.cases} active={stage} onStage={setStage} />
        </div>
        <div className="col-span-12 lg:col-span-7 xl:col-span-9 min-w-0">
          {selected ? (
            <CaseView key={selected.id} ecf={selected} incident={snap.incidents.find((i) => i.id === selected.incidentId)} />
          ) : (
            <div className="glass-panel p-6 text-sm text-muted-foreground flex items-center gap-2">
              <Search className="h-4 w-4" />
              {id ? <>Case <span className="font-mono text-foreground">{id}</span> was not found. <Link to="/cases" className="text-primary hover:underline">Back to cases</Link></> : "No case files."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
