import { Link } from "react-router-dom";
import { Marker, Tooltip } from "react-leaflet";
import { Car, X } from "lucide-react";
import { OpsMap, dotIcon } from "@/components/ops/OpsMap";
import { Panel } from "@/components/ops/Panel";
import { Pill } from "@/components/ops/Pill";
import { ACCESS_STATUS_COLOR, INCIDENT_TYPE_LABEL, fmtDate, fmtTime, type AccessVisit, type GeoPoint, type Incident, type InsiderSubject, type SiteSummary } from "@/lib/ops";
import { OUTCOME_COLOR, OUTCOME_LABEL } from "./campaignUtils";

type Row =
  | { kind: "incident"; at: string; inc: Incident }
  | { kind: "visit"; at: string; visit: AccessVisit };

/** Everything on record for one vehicle plate: incidents (ANPR / CCTV) and access visits. */
export function VehicleView({ plate, incidents, visits, sites, subject, onClose }: {
  plate: string; incidents: Incident[]; visits: AccessVisit[]; sites: Map<string, SiteSummary>; subject?: InsiderSubject; onClose: () => void;
}) {
  const incs = incidents.filter((i) => i.vehiclePlates.includes(plate));
  const vis = visits.filter((v) => v.vehiclePlate === plate);
  const rows: Row[] = [
    ...incs.map((inc) => ({ kind: "incident" as const, at: inc.detectedAt, inc })),
    ...vis.map((visit) => ({ kind: "visit" as const, at: visit.arrival, visit })),
  ].sort((a, b) => b.at.localeCompare(a.at));
  const points: { id: string; p: GeoPoint; color: string; label: string }[] = [
    ...incs.map((i) => ({ id: i.id, p: i.location, color: OUTCOME_COLOR[i.outcome], label: `${i.id} · ${INCIDENT_TYPE_LABEL[i.type]}` })),
    ...vis.flatMap((v) => { const s = sites.get(v.siteId); return s ? [{ id: v.id, p: s.location, color: "#3b82f6", label: `${v.id} · visit by ${v.person}` }] : []; }),
  ];
  const siteCount = new Set([...incs.map((i) => i.siteId), ...vis.map((v) => v.siteId)]).size;

  return (
    <Panel title={<span className="flex items-center gap-2">Vehicle <span className="font-mono text-primary">{plate}</span></span>} icon={Car}
      actions={<>
        <span className="hud-chip">{incs.length} incidents · {vis.length} visits · {siteCount} sites</span>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
      </>}>
      {rows.length === 0 ? <p className="text-xs text-muted-foreground">No incidents or visits on record for this plate.</p> : (
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 lg:col-span-5">
            <OpsMap height={300} defaultTiles="dark" fitTo={points.map((x) => x.p)}>
              {points.map((x) => (
                <Marker key={x.id} position={[x.p.lat, x.p.lng]} icon={dotIcon(x.color, { size: 11, shape: x.id.startsWith("VIS") ? "square" : "dot" })}>
                  <Tooltip className="cnii-tip">{x.label}</Tooltip>
                </Marker>
              ))}
            </OpsMap>
            {subject && (
              <p className="mt-2 text-[11px] text-muted-foreground">
                On the insider-risk review queue as <span className="text-foreground">{subject.name}</span> (review score {subject.riskScore}). <Link to="/access" className="text-primary hover:underline">Open review queue →</Link>
              </p>
            )}
          </div>
          <ol className="col-span-12 lg:col-span-7 space-y-1 max-h-[340px] overflow-y-auto pr-1">
            {rows.map((r) => r.kind === "incident" ? (
              <li key={r.inc.id} className="flex flex-wrap items-center gap-2 rounded-md border border-primary/10 px-2 py-1.5 text-[11px]">
                <span className="font-mono text-muted-foreground w-28">{fmtDate(r.at).slice(0, 6)} {fmtTime(r.at).slice(0, 5)}</span>
                <Pill color="#ef4444">Incident</Pill>
                <Link to={`/incidents/${r.inc.id}`} className="font-mono text-primary hover:underline">{r.inc.id}</Link>
                <span className="text-foreground">{INCIDENT_TYPE_LABEL[r.inc.type]}</span>
                <Link to={`/sites/${r.inc.siteId}`} className="font-mono text-muted-foreground hover:text-primary">{r.inc.siteId}</Link>
                <span className="ml-auto" style={{ color: OUTCOME_COLOR[r.inc.outcome] }}>{OUTCOME_LABEL[r.inc.outcome]}</span>
              </li>
            ) : (
              <li key={r.visit.id} className="flex flex-wrap items-center gap-2 rounded-md border border-primary/10 px-2 py-1.5 text-[11px]">
                <span className="font-mono text-muted-foreground w-28">{fmtDate(r.at).slice(0, 6)} {fmtTime(r.at).slice(0, 5)}</span>
                <Pill color="#3b82f6">Visit</Pill>
                <Link to={`/access?visit=${r.visit.id}`} className="font-mono text-primary hover:underline">{r.visit.id}</Link>
                <span className="text-foreground">{r.visit.person}</span>
                <span className="text-muted-foreground">{r.visit.employer}</span>
                <Link to={`/sites/${r.visit.siteId}`} className="font-mono text-muted-foreground hover:text-primary">{r.visit.siteId}</Link>
                <span className="ml-auto"><Pill color={ACCESS_STATUS_COLOR[r.visit.status]}>{r.visit.status.replace(/_/g, " ")}</Pill></span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </Panel>
  );
}
