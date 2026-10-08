import { ChevronRight } from "lucide-react";
import { Pill } from "@/components/ops/Pill";
import { SITE_STATES, SITE_STATE_COLOR, SITE_STATE_LABEL, type SiteSummary } from "@/lib/ops";
import { STATE_RANK, type DrillChild, type ScopeLevel, type StateCounts } from "./scope";

/** Proportional stacked bar of site states. */
export function StateBar({ counts, total }: { counts: StateCounts; total: number }) {
  return (
    <div className="flex h-1.5 rounded-full overflow-hidden bg-secondary">
      {SITE_STATES.map((s) => counts[s] > 0 && (
        <span key={s} style={{ width: `${(counts[s] / Math.max(1, total)) * 100}%`, backgroundColor: SITE_STATE_COLOR[s] }} title={`${SITE_STATE_LABEL[s]}: ${counts[s]}`} />
      ))}
    </div>
  );
}

function CountsRow({ counts }: { counts: StateCounts }) {
  return (
    <div className="grid grid-cols-6 gap-1 mt-1">
      {SITE_STATES.map((s) => (
        <span key={s} className="flex items-center gap-1 text-[10px] font-mono tabular-nums" title={SITE_STATE_LABEL[s]} style={{ color: counts[s] ? SITE_STATE_COLOR[s] : "hsl(var(--muted-foreground) / 0.5)" }}>
          <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: SITE_STATE_COLOR[s] }} />
          {counts[s]}
        </span>
      ))}
    </div>
  );
}

const CHILD_NOUN: Record<Exclude<ScopeLevel, "cluster">, string> = { national: "zone", zone: "state", state: "cluster" };

interface DrillPanelProps {
  level: ScopeLevel;
  items: DrillChild[];
  sites: SiteSummary[];
  onChild: (key: string) => void;
  onSite: (id: string) => void;
}

export function DrillList({ level, items, sites, onChild, onSite }: DrillPanelProps) {
  if (level === "cluster") {
    const sorted = [...sites].sort((a, b) => STATE_RANK[b.status] - STATE_RANK[a.status] || b.riskScore - a.riskScore);
    if (!sorted.length) return <p className="text-xs text-muted-foreground p-3">No protected sites in this cluster.</p>;
    return (
      <ul className="divide-y divide-primary/10">
        {sorted.map((s) => (
          <li key={s.id}>
            <button onClick={() => onSite(s.id)} className="w-full text-left px-3 py-2 hover:bg-primary/5 flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: SITE_STATE_COLOR[s.status] }} />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-foreground truncate">{s.name}</p>
                <p className="text-[10px] font-mono text-muted-foreground truncate">{s.id} · {s.siteClass} · risk {s.riskScore} · prot. {s.protectionScore}</p>
              </div>
              <Pill color={SITE_STATE_COLOR[s.status]}>{SITE_STATE_LABEL[s.status]}</Pill>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            </button>
          </li>
        ))}
      </ul>
    );
  }
  return (
    <ul className="divide-y divide-primary/10">
      {items.map((c) => (
        <li key={c.key}>
          <button onClick={() => onChild(c.key)} className="w-full text-left px-3 py-2 hover:bg-primary/5" title={`Drill into ${CHILD_NOUN[level]} ${c.label}`}>
            <div className="flex items-center gap-2">
              <p className="text-xs font-semibold text-foreground truncate flex-1">
                {c.label}
                {c.sub && <span className="ml-1.5 font-mono text-[10px] text-muted-foreground font-normal">{c.sub}</span>}
              </p>
              {c.activeIncidents > 0 && <Pill color="#ef4444">{c.activeIncidents} active</Pill>}
              <span className="text-[10px] font-mono tabular-nums text-muted-foreground">{c.total} sites</span>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            </div>
            <div className="mt-1.5"><StateBar counts={c.counts} total={c.total} /></div>
            <CountsRow counts={c.counts} />
          </button>
        </li>
      ))}
    </ul>
  );
}
