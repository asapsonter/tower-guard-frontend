import { Link } from "react-router-dom";
import { Pill } from "@/components/ops/Pill";
import {
  INCIDENT_STATUS_LABEL, SEVERITY_COLOR, SITE_STATE_COLOR, timeAgo, type Incident, type SiteSummary,
} from "@/lib/ops";
import { SEVERITY_RANK, warningReason } from "./scope";

const MAX_WARNINGS = 25;

/** Compact live feed: active incidents (severity → recency) then warning sites. */
export function AlertsFeed({ incidents, warnings, now }: { incidents: Incident[]; warnings: SiteSummary[]; now: number }) {
  const inc = [...incidents].sort((a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity] || b.detectedAt.localeCompare(a.detectedAt));
  const warn = [...warnings].sort((a, b) => b.riskScore - a.riskScore);
  if (!inc.length && !warn.length) return <p className="text-xs text-muted-foreground p-3">No active alerts in this scope.</p>;
  return (
    <ul className="divide-y divide-primary/10">
      {inc.map((i) => (
        <li key={i.id}>
          <Link to={`/incidents/${i.id}`} className="flex items-start gap-2 px-3 py-2 hover:bg-primary/5">
            <span className="mt-1 h-2 w-2 rounded-full shrink-0 animate-pulse" style={{ backgroundColor: SEVERITY_COLOR[i.severity] }} />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-foreground truncate">
                <span className="font-mono text-primary mr-1.5">{i.id.replace("INC-2026-", "")}</span>
                {i.title}
              </p>
              <p className="text-[10px] text-muted-foreground truncate">{i.siteName} · {i.state} · {INCIDENT_STATUS_LABEL[i.status]}</p>
            </div>
            <div className="flex flex-col items-end gap-0.5 shrink-0">
              <Pill color={SEVERITY_COLOR[i.severity]}>{i.severity.toUpperCase()}</Pill>
              <span className="text-[10px] font-mono tabular-nums text-muted-foreground">{timeAgo(i.detectedAt, now)}</span>
            </div>
          </Link>
        </li>
      ))}
      {warn.slice(0, MAX_WARNINGS).map((s) => (
        <li key={s.id}>
          <Link to={`/sites/${s.id}`} className="flex items-start gap-2 px-3 py-2 hover:bg-primary/5">
            <span className="mt-1 h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: SITE_STATE_COLOR.warning }} />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-foreground truncate">{s.name}</p>
              <p className="text-[10px] text-muted-foreground truncate"><span className="font-mono">{s.id}</span> · {s.state} · {warningReason(s)}</p>
            </div>
            <Pill color={SITE_STATE_COLOR.warning}>WARNING</Pill>
          </Link>
        </li>
      ))}
      {warn.length > MAX_WARNINGS && (
        <li className="px-3 py-2 text-[10px] text-muted-foreground">
          +{warn.length - MAX_WARNINGS} more warning sites · <Link to="/health" className="text-primary hover:underline">open System Health</Link>
        </li>
      )}
    </ul>
  );
}
