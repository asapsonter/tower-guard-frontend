import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Siren } from "lucide-react";
import { INCIDENT_TYPE_LABEL, SEVERITY_COLOR, type Incident, type Severity, type SiteSummary } from "@/lib/ops";

const SEV_ORDER: Severity[] = ["critical", "high", "medium", "low"];

/** Site search plus quick-picks for sites with active incidents. */
export function SitePicker({ sites, incidents, currentId }: { sites: SiteSummary[]; incidents: Incident[]; currentId?: string }) {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);

  const matches = useMemo(() => {
    const n = q.trim().toLowerCase();
    if (n.length < 2) return [];
    return sites.filter((s) => s.id.toLowerCase().includes(n) || s.name.toLowerCase().includes(n) || s.state.toLowerCase().includes(n)).slice(0, 10);
  }, [q, sites]);

  const quick = useMemo(() => incidents
    .filter((i) => i.status !== "closed")
    .sort((a, b) => SEV_ORDER.indexOf(a.severity) - SEV_ORDER.indexOf(b.severity) || b.detectedAt.localeCompare(a.detectedAt))
    .slice(0, 12), [incidents]);

  const go = (id: string) => { setQ(""); setOpen(false); navigate(`/fusion/${id}`); };

  return (
    <div className="glass-panel flex flex-wrap items-center gap-3 p-3">
      <div className="relative w-full sm:w-72">
        <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <input value={q} onChange={(e) => { setQ(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={(e) => { if (e.key === "Enter" && matches[0]) go(matches[0].id); }}
          placeholder="Search a site (ID, name, state)…"
          className="h-8 w-full rounded-md border border-primary/20 bg-background/60 pl-7 pr-2 text-[12px] placeholder:text-muted-foreground focus:outline-none focus:border-primary/50" />
        {open && matches.length > 0 && (
          <ul className="absolute z-[600] mt-1 w-full rounded-md border border-primary/25 bg-card/95 backdrop-blur shadow-xl">
            {matches.map((s) => (
              <li key={s.id}>
                <button onMouseDown={(e) => e.preventDefault()} onClick={() => go(s.id)} className="flex w-full items-center gap-2 px-2.5 py-1.5 text-left hover:bg-primary/10">
                  <span className="font-mono text-[11px] text-primary">{s.id}</span>
                  <span className="truncate text-[11px] text-foreground">{s.name}</span>
                  <span className="ml-auto text-[10px] text-muted-foreground">{s.state}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
        <span className="flex items-center gap-1 text-[9px] uppercase tracking-[0.14em] text-muted-foreground mr-1"><Siren className="h-3 w-3 text-destructive" />Active incidents</span>
        {quick.map((i) => {
          const active = i.siteId === currentId;
          return (
            <button key={i.id} onClick={() => go(i.siteId)} title={`${i.id} · ${INCIDENT_TYPE_LABEL[i.type]} · ${i.siteName}`}
              className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-mono transition-colors ${active ? "bg-primary/20 border-primary text-primary" : "border-primary/20 text-muted-foreground hover:text-foreground"}`}>
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: SEVERITY_COLOR[i.severity] }} />
              {i.siteId}
            </button>
          );
        })}
      </div>
    </div>
  );
}
