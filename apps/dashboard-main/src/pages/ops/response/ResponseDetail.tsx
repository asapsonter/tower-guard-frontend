import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Crosshair, Siren, Truck, User } from "lucide-react";
import { Panel } from "@/components/ops/Panel";
import { Pill } from "@/components/ops/Pill";
import {
  INCIDENT_STATUS_LABEL, RESPONSE_STAGES, SEVERITY_COLOR, TEAM_STATUS_COLOR, TEAM_STATUS_LABEL, fmtClock, fmtTime, secondsBetween,
  type Incident, type ResponseStage, type ResponseTeam,
} from "@/lib/ops";
import { BigSlaClock, EtaLive, VerificationBadges } from "./SlaBits";
import { awaitingDispatch, claimGapMin } from "./sla";

const STAGE_LABEL: Record<ResponseStage, string> = {
  alert: "Alert", verified: "Verified", dispatched: "Dispatched", departed: "Departed", arrived: "Arrived (verified)", secured: "Secured", closed: "Closed",
};

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <div className="text-[12px] text-foreground truncate">{children}</div>
    </div>
  );
}

/** Selected incident: big SLA clock + full response record. */
export function ResponseDetail({ inc, team, generatedAt }: { inc: Incident; team?: ResponseTeam; generatedAt: string }) {
  const r = inc.response;
  const start = r.stages.alert ?? inc.detectedAt;
  const gap = claimGapMin(r);
  return (
    <Panel title={<span className="flex items-center gap-2"><span className="font-mono text-primary">{inc.id}</span>{inc.title}</span>} icon={Siren}
      actions={<Link to={`/incidents/${inc.id}`} className="text-[10px] text-primary hover:underline">Incident room →</Link>}>
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <Pill color={SEVERITY_COLOR[inc.severity]} solid className="uppercase">{inc.severity}</Pill>
          <Pill color="#06b6d4">{INCIDENT_STATUS_LABEL[inc.status]}</Pill>
          <Link to={`/sites/${inc.siteId}`} className="text-muted-foreground hover:text-primary truncate">{inc.siteName} · {inc.state}</Link>
        </div>

        <BigSlaClock inc={inc} />

        {awaitingDispatch(inc) ? (
          <a href="#dispatch" className="flex items-center gap-2 rounded-md border border-warning/50 bg-warning/5 px-3 py-2 text-[12px] text-warning hover:bg-warning/10">
            <AlertTriangle className="h-4 w-4" /> Awaiting dispatch — review the ITIPS recommendation below
          </a>
        ) : team ? (
          <div className="rounded-md border border-primary/15 p-3 space-y-2.5">
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-primary" />
              <Link to={`/response?team=${team.id}`} className="text-[13px] font-semibold text-foreground hover:text-primary">{team.callsign}</Link>
              <Pill color={TEAM_STATUS_COLOR[team.status]}>{TEAM_STATUS_LABEL[team.status]}</Pill>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Vehicle"><span className="font-mono">{team.vehicle.plate}</span> · {team.vehicle.type}</Field>
              <Field label="Armed officers"><span className="font-mono text-warning">{team.crew.filter((c) => c.armed).length}</span> / {team.crew.length} crew</Field>
              <Field label="Dispatch time"><span className="font-mono">{fmtTime(r.stages.dispatched)}</span></Field>
              <Field label="Distance"><span className="font-mono">{r.distanceKm ? `${r.distanceKm} km` : "—"}</span></Field>
              <Field label="Predicted ETA"><EtaLive inc={inc} generatedAt={generatedAt} /></Field>
              <Field label="Actual arrival"><span className="font-mono">{fmtTime(r.stages.arrived)}</span></Field>
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-0.5">
              {team.crew.map((c) => (
                <li key={c.name} className="flex items-center gap-1.5 text-[11px]">
                  {c.armed ? <Crosshair className="h-3 w-3 text-warning" /> : <User className="h-3 w-3 text-muted-foreground" />}
                  <span className="text-foreground truncate">{c.name}</span>
                  <span className="text-[10px] text-muted-foreground truncate">{c.role}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-[11px] text-muted-foreground">No team record attached.</p>
        )}

        <div>
          <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground mb-1">Arrival verification (independent)</p>
          <VerificationBadges inc={inc} showMissing />
          {gap != null && gap > 0 && (
            <p className="mt-1 text-[10px] text-destructive">Team claimed arrival at {fmtTime(r.claimedArrival)}; GPS geofence verified {fmtTime(r.stages.arrived)}. SLA measured on the verified time.</p>
          )}
          {r.breachReason && <p className="mt-1 text-[10px] text-muted-foreground">Breach reason: <span className="text-foreground">{r.breachReason}</span></p>}
        </div>

        <ol className="grid grid-cols-7 gap-1">
          {RESPONSE_STAGES.map((s) => {
            const at = r.stages[s];
            const off = secondsBetween(start, at);
            return (
              <li key={s} className="min-w-0 text-center">
                <span className={`mx-auto block h-1.5 rounded-full ${at ? "bg-primary" : "bg-secondary"}`} />
                <p className={`mt-1 text-[8px] uppercase tracking-wide truncate ${at ? "text-foreground" : "text-muted-foreground"}`} title={STAGE_LABEL[s]}>{s}</p>
                <p className="font-mono text-[9px] text-muted-foreground">{off != null ? `+${fmtClock(off)}` : "—"}</p>
              </li>
            );
          })}
        </ol>
      </div>
    </Panel>
  );
}
