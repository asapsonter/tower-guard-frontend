import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Archive, Siren } from "lucide-react";
import { Panel } from "@/components/ops/Panel";
import { Pill } from "@/components/ops/Pill";
import { INCIDENT_STATUS_LABEL, INCIDENT_TYPE_LABEL, SEVERITY_COLOR, fmtDate, fmtTime, type Incident } from "@/lib/ops";
import { SlaMini } from "../response/SlaBits";
import { isActive, sortActive } from "../response/sla";

const STATUS_COLOR: Record<Incident["status"], string> = {
  detected: "#eab308", verified: "#f59e0b", dispatched: "#3b82f6", en_route: "#06b6d4", on_site: "#f97316", secured: "#22c55e", closed: "#64748b",
};

/** Left rail: active incident rooms (default) or recently closed ones. */
export function IncidentList({ incidents, selectedId }: { incidents: Incident[]; selectedId?: string }) {
  const [view, setView] = useState<"active" | "closed">("active");
  const active = useMemo(() => sortActive(incidents.filter(isActive)), [incidents]);
  const closed = useMemo(
    () => incidents.filter((i) => i.status === "closed").sort((a, b) => (b.closedAt ?? b.detectedAt).localeCompare(a.closedAt ?? a.detectedAt)).slice(0, 25),
    [incidents],
  );
  const list = view === "active" ? active : closed;

  return (
    <Panel
      title={view === "active" ? "Active incident rooms" : "Recently closed"}
      icon={view === "active" ? Siren : Archive}
      bodyClassName="p-0"
      actions={
        <div className="flex rounded-md border border-primary/20 overflow-hidden">
          {(["active", "closed"] as const).map((v) => (
            <button key={v} onClick={() => setView(v)}
              className={`px-2 py-1 text-[9px] font-mono uppercase tracking-wider ${view === v ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"}`}>
              {v === "active" ? `Active ${active.length}` : "Closed"}
            </button>
          ))}
        </div>
      }
    >
      <ul className="max-h-[calc(100vh-220px)] min-h-[200px] overflow-y-auto divide-y divide-primary/10">
        {list.map((i) => {
          const sel = i.id === selectedId;
          return (
            <li key={i.id}>
              <Link to={`/incidents/${i.id}`}
                className={`block px-3 py-2.5 transition-colors ${sel ? "bg-primary/10" : "hover:bg-primary/5"}`}
                style={{ boxShadow: `inset 3px 0 0 ${sel ? "hsl(var(--primary))" : SEVERITY_COLOR[i.severity]}` }}>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] text-primary">{i.id}</span>
                  <span className="ml-auto text-[9px] font-bold uppercase" style={{ color: SEVERITY_COLOR[i.severity] }}>{i.severity}</span>
                </div>
                <p className="mt-0.5 text-[12px] font-semibold text-foreground truncate">{i.title}</p>
                <p className="text-[10px] text-muted-foreground truncate">{INCIDENT_TYPE_LABEL[i.type]} · {i.siteName} · {i.state}</p>
                <div className="mt-1 flex items-center gap-2">
                  <Pill color={STATUS_COLOR[i.status]}>{INCIDENT_STATUS_LABEL[i.status]}</Pill>
                  <span className="ml-auto">
                    {view === "active" ? <SlaMini inc={i} /> : <span className="font-mono text-[10px] text-muted-foreground">{fmtDate(i.closedAt)} {fmtTime(i.closedAt)}</span>}
                  </span>
                </div>
              </Link>
            </li>
          );
        })}
        {list.length === 0 && <li className="p-4 text-xs text-muted-foreground">No incidents.</li>}
      </ul>
    </Panel>
  );
}
