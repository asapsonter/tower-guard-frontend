import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle, BrainCircuit, CheckCircle2, Clock, FileLock2, GitBranch, KeyRound, ListOrdered, MapPin, MessageSquare, Phone, Radio,
  ShieldAlert, Smartphone, Truck, Users,
} from "lucide-react";
import { Panel } from "@/components/ops/Panel";
import { Meter, Pill } from "@/components/ops/Pill";
import { SlaCountdown } from "@/components/ops/SlaCountdown";
import { Timeline } from "@/components/ops/Timeline";
import {
  ACCESS_STATUS_COLOR, INCIDENT_STATUS_LABEL, INCIDENT_TYPE_COLOR, INCIDENT_TYPE_LABEL, INSIDER_FLAG_LABEL, SEVERITY_COLOR, TEAM_STATUS_COLOR,
  TEAM_STATUS_LABEL, fmtDate, fmtNaira, fmtTime, type Incident, type OpsSnapshot, type ResponseTeam,
} from "@/lib/ops";
import { EtaLive, VerificationBadges } from "../response/SlaBits";
import { awaitingDispatch } from "../response/sla";
import { CameraWall } from "./CameraWall";
import { IncidentMap } from "./IncidentMap";

const CHANNEL_ICON = { radio: Radio, phone: Phone, app: Smartphone, sms: MessageSquare } as const;
const OUTCOME_LABEL: Record<Incident["outcome"], string> = {
  ongoing: "Ongoing", disrupted: "Attack disrupted", theft_completed: "Theft completed", damage_only: "Damage only", false_alarm: "False alarm",
};

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <div className="text-[12px] text-foreground truncate">{children}</div>
    </div>
  );
}

/** The Incident Room — every facet of one incident on one screen. */
export function IncidentRoom({ inc, snap }: { inc: Incident; snap: OpsSnapshot }) {
  const team = inc.teamId ? snap.teams.find((t) => t.id === inc.teamId) : undefined;
  const sevColor = SEVERITY_COLOR[inc.severity];
  const awaiting = awaitingDispatch(inc);
  const live = inc.status !== "closed";

  return (
    <div className="space-y-4">
      {/* Room bar */}
      <div className="glass-panel p-4 flex flex-wrap items-center gap-4" style={{ boxShadow: `inset 3px 0 0 ${sevColor}` }}>
        <div className="min-w-0 flex-1">
          <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground">Incident Room · auto-created at verification</p>
          <h2 className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[15px] font-bold text-foreground">
            <span className="font-mono text-primary">{inc.id}</span>
            <span className="text-primary/40">|</span>
            <span className="font-display uppercase tracking-wide">{inc.title}</span>
            <span className="text-primary/40">|</span>
            <span className="uppercase">{inc.state}</span>
            <span className="text-primary/40">|</span>
            <Pill color={sevColor} solid className="text-[11px] uppercase">{inc.severity}</Pill>
          </h2>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Pill color={INCIDENT_TYPE_COLOR[inc.type]}>{INCIDENT_TYPE_LABEL[inc.type]}</Pill>
            <Pill color={live ? "#06b6d4" : "#64748b"}>{INCIDENT_STATUS_LABEL[inc.status]}</Pill>
            <Link to={`/sites/${inc.siteId}`} className="hud-chip hover:text-primary">{inc.siteId} · {inc.siteName}</Link>
            <span className="hud-chip">{inc.tenant} · {inc.zone}</span>
            {inc.lossNaira > 0 && <Pill color="#ef4444">Loss {fmtNaira(inc.lossNaira)}</Pill>}
            {inc.recoveredNaira > 0 && <Pill color="#22c55e">Recovered {fmtNaira(inc.recoveredNaira)}</Pill>}
            <span className="text-[10px] text-muted-foreground">Detected {fmtDate(inc.detectedAt)} {fmtTime(inc.detectedAt)} WAT · {OUTCOME_LABEL[inc.outcome]}</span>
          </div>
        </div>
        <SlaCountdown size="lg" alertAt={inc.response.stages.alert ?? inc.detectedAt} slaSeconds={inc.response.slaSeconds} arrivalAt={inc.response.stages.arrived} />
      </div>

      {awaiting && (
        <div className="glass-panel border-warning/50 bg-warning/5 p-4 flex flex-wrap items-center gap-3">
          <AlertTriangle className="h-6 w-6 text-warning shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-foreground">No response team assigned — awaiting dispatch</p>
            <p className="text-[11px] text-muted-foreground">ITIPS recommends the closest compliant armed team; an authorised NOC officer approves the dispatch.</p>
          </div>
          <Link to={`/response?incident=${inc.id}`} className="rounded-md bg-warning px-4 py-2 text-[12px] font-bold text-black hover:bg-warning/90">
            Smart dispatch →
          </Link>
        </div>
      )}

      <div className="grid grid-cols-12 gap-4">
        {/* Unified timeline */}
        <Panel title="Unified incident timeline" icon={ListOrdered} className="col-span-12 lg:col-span-4"
          actions={<span className="hud-chip">{inc.timeline.length} events</span>} bodyClassName="p-4 overflow-y-auto max-h-[760px]">
          <Timeline events={inc.timeline} />
          <p className="mt-2 border-t border-primary/10 pt-2 text-[10px] text-muted-foreground">
            One operational record — radar, cameras, sensors, AI, deterrents, NOC, response GPS and police — in a single sequence.
          </p>
        </Panel>

        <div className="col-span-12 lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4 content-start">
          <div className="md:col-span-2"><CameraWall siteId={inc.siteId} live={live} /></div>

          <Panel title="Incident map" icon={MapPin} bodyClassName="p-2">
            <IncidentMap inc={inc} team={team} generatedAt={snap.generatedAt} />
          </Panel>

          <ResponderPanel inc={inc} team={team} generatedAt={snap.generatedAt} />
        </div>

        <FusionPanel inc={inc} snap={snap} />
        <EvidencePanel inc={inc} snap={snap} />
        <CommsPanel inc={inc} />
        <EscalationPanel inc={inc} />
        <AccessPanel inc={inc} snap={snap} />
      </div>
    </div>
  );
}

function ResponderPanel({ inc, team, generatedAt }: { inc: Incident; team?: ResponseTeam; generatedAt: string }) {
  const r = inc.response;
  return (
    <Panel title="Response team" icon={Truck}
      actions={<Link to={`/response?incident=${inc.id}`} className="text-[10px] text-primary hover:underline">Response command →</Link>}>
      {!team ? (
        <p className="text-xs text-muted-foreground">No team assigned yet.</p>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: TEAM_STATUS_COLOR[team.status] }} />
            <Link to={`/response?team=${team.id}`} className="text-[13px] font-semibold text-foreground hover:text-primary">{team.callsign}</Link>
            <Pill color={TEAM_STATUS_COLOR[team.status]}>{TEAM_STATUS_LABEL[team.status]}</Pill>
          </div>
          <div className="rounded-md border border-primary/20 bg-primary/5 px-3 py-2">
            <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Responder ETA</p>
            <EtaLive inc={inc} generatedAt={generatedAt} className="text-2xl font-bold" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Vehicle"><span className="font-mono">{team.vehicle.plate}</span> · {team.vehicle.type}</Field>
            <Field label="Crew">{team.crew.length} · <span className="text-warning">{team.crew.filter((c) => c.armed).length} armed</span></Field>
            <Field label="Dispatched"><span className="font-mono">{fmtTime(r.stages.dispatched)}</span></Field>
            <Field label="Distance"><span className="font-mono">{r.distanceKm ? `${r.distanceKm} km` : "—"}</span></Field>
            <Field label="Provider">{team.provider}</Field>
            <Field label="Last GPS fix"><span className="font-mono">{fmtTime(team.lastGpsFix)}</span></Field>
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground mb-1">Arrival verification</p>
            <VerificationBadges inc={inc} />
          </div>
        </div>
      )}
    </Panel>
  );
}

function FusionPanel({ inc, snap }: { inc: Incident; snap: OpsSnapshot }) {
  const f = inc.fusion;
  const color = f.confidence >= 85 ? "#ef4444" : f.confidence >= 60 ? "#f59e0b" : "#22c55e";
  const campaign = inc.campaignId ? snap.campaigns.find((c) => c.id === inc.campaignId) : undefined;
  const insiderVisit = snap.visits.find((v) => v.linkedIncidentId === inc.id);
  return (
    <Panel title="Fusion verdict" icon={BrainCircuit} className="col-span-12 md:col-span-6 xl:col-span-4"
      actions={<Link to={`/fusion/${inc.siteId}`} className="text-[10px] text-primary hover:underline">Sensor fusion →</Link>}>
      <div className="flex items-end gap-3">
        <p className="font-mono text-3xl font-bold tabular-nums" style={{ color }}>{f.confidence}%</p>
        <p className="pb-1 text-[13px] font-semibold text-foreground">{f.verdict}</p>
      </div>
      <Meter value={f.confidence} color={color} className="mt-1" />
      <ul className="mt-3 space-y-1">
        {f.signals.slice(0, 6).map((s, i) => (
          <li key={i} className="flex items-center gap-2 text-[11px]">
            <span className={`font-mono w-9 text-right ${s.weight > 0 ? "text-destructive" : s.weight < 0 ? "text-success" : "text-muted-foreground"}`}>
              {s.weight > 0 ? `+${s.weight}` : s.weight}
            </span>
            <span className="text-muted-foreground w-24 truncate">{s.source}</span>
            <span className="text-foreground truncate">{s.finding}</span>
          </li>
        ))}
        {f.signals.length === 0 && <li className="text-[11px] text-muted-foreground">Signal breakdown not retained for this incident.</li>}
      </ul>
      <div className="mt-3 border-t border-primary/10 pt-2 space-y-1.5">
        <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Linked intelligence</p>
        {campaign ? (
          <Link to={`/intelligence?campaign=${campaign.id}`} className="flex items-center gap-2 text-[11px] hover:text-primary">
            <GitBranch className="h-3.5 w-3.5 text-primary" />
            <span className="font-mono text-primary">{campaign.id}</span> {campaign.name}
            <span className="ml-auto text-[10px] text-muted-foreground">{campaign.siteIds.length} sites · {campaign.trend}</span>
          </Link>
        ) : <p className="text-[11px] text-muted-foreground">Not linked to a known campaign.</p>}
        {inc.vehiclePlates.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
            <span className="text-muted-foreground">Vehicles:</span>
            {inc.vehiclePlates.map((p) => <Link key={p} to={`/intelligence?vehicle=${encodeURIComponent(p)}`} className="hud-chip hover:text-primary">{p}</Link>)}
          </div>
        )}
        {inc.insiderRisk && (
          <Link to={insiderVisit ? `/access?visit=${insiderVisit.id}` : `/access?q=${inc.siteId}`} className="flex items-center gap-2 text-[11px] text-warning hover:underline">
            <ShieldAlert className="h-3.5 w-3.5" /> Insider-risk correlation — warrants review, not an accusation
          </Link>
        )}
      </div>
    </Panel>
  );
}

function EvidencePanel({ inc, snap }: { inc: Incident; snap: OpsSnapshot }) {
  const ecf = inc.caseId ? snap.cases.find((c) => c.id === inc.caseId) : undefined;
  const verified = ecf?.evidence.filter((e) => e.verified).length ?? 0;
  const stills = ecf?.evidence.filter((e) => e.preview).slice(0, 3) ?? [];
  return (
    <Panel title="Evidence" icon={FileLock2} className="col-span-12 md:col-span-6 xl:col-span-4"
      actions={<span className="hud-chip">{ecf?.evidence.length || inc.evidenceCount} items</span>}>
      {ecf ? (
        <div className="space-y-3">
          <Link to={`/cases/${ecf.id}`} className="block rounded-md border border-primary/25 bg-primary/5 px-3 py-2 hover:border-primary/50">
            <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Evidence case file</p>
            <p className="font-mono text-[13px] text-primary">{ecf.id} →</p>
            <p className="text-[11px] text-muted-foreground truncate">{ecf.title}</p>
          </Link>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div><p className="font-mono text-lg font-bold text-foreground">{ecf.evidence.length}</p><p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Items</p></div>
            <div><p className="font-mono text-lg font-bold text-success">{verified}</p><p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Hash OK</p></div>
            <div><p className="font-mono text-lg font-bold text-foreground capitalize">{ecf.stage.replace(/_/g, " ")}</p><p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Stage</p></div>
          </div>
          {stills.length > 0 && (
            <div className="grid grid-cols-3 gap-1.5">
              {stills.map((e) => <img key={e.id} src={e.preview} alt={e.title} className="aspect-video w-full rounded border border-primary/15 object-cover" />)}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2 text-[11px] text-muted-foreground">
          <p><span className="font-mono text-lg font-bold text-foreground">{inc.evidenceCount}</span> items captured &amp; hashed in the ITIPS evidence vault.</p>
          <p>The evidence case file is compiled automatically and will appear in <Link to="/cases" className="text-primary hover:underline">Evidence &amp; Prosecution</Link> once indexed.</p>
        </div>
      )}
    </Panel>
  );
}

function CommsPanel({ inc }: { inc: Incident }) {
  return (
    <Panel title="Communications" icon={Radio} className="col-span-12 md:col-span-6 xl:col-span-4" actions={<span className="hud-chip">{inc.comms.length}</span>}>
      {inc.comms.length === 0 ? <p className="text-xs text-muted-foreground">No logged communications for this incident.</p> : (
        <ul className="space-y-2 max-h-[300px] overflow-y-auto">
          {inc.comms.map((c, i) => {
            const Icon = CHANNEL_ICON[c.channel];
            return (
              <li key={i} className="rounded border border-primary/10 px-2.5 py-1.5">
                <div className="flex items-center gap-2 text-[10px]">
                  <Icon className="h-3 w-3 text-primary" />
                  <span className="font-semibold text-foreground">{c.from}</span>
                  <span className="uppercase text-muted-foreground">{c.channel}</span>
                  <span className="ml-auto font-mono text-muted-foreground">{fmtTime(c.at)}</span>
                </div>
                <p className="mt-0.5 text-[12px] text-foreground/90">{c.text}</p>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}

function EscalationPanel({ inc }: { inc: Incident }) {
  return (
    <Panel title="Escalation chain" icon={Users} className="col-span-12 md:col-span-6 xl:col-span-4">
      <ol className="space-y-2">
        {inc.escalation.map((e) => {
          const notified = !!e.notifiedAt;
          return (
            <li key={e.level} className={`flex items-center gap-3 rounded border px-2.5 py-1.5 ${notified ? "border-primary/20" : "border-primary/10 opacity-60"}`}>
              <span className={`h-6 w-6 shrink-0 rounded-full border flex items-center justify-center font-mono text-[11px] ${notified ? "border-primary text-primary bg-primary/10" : "border-muted-foreground/40 text-muted-foreground"}`}>L{e.level}</span>
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-semibold text-foreground truncate">{e.role}</p>
                <p className="text-[10px] text-muted-foreground truncate">{e.name}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-mono text-[10px] text-muted-foreground">{notified ? `Notified ${fmtTime(e.notifiedAt)}` : "Not triggered"}</p>
                {notified && (e.acknowledged
                  ? <p className="flex items-center justify-end gap-1 text-[10px] text-success"><CheckCircle2 className="h-3 w-3" />Acknowledged</p>
                  : <p className="flex items-center justify-end gap-1 text-[10px] text-warning"><Clock className="h-3 w-3" />Awaiting ack</p>)}
              </div>
            </li>
          );
        })}
      </ol>
    </Panel>
  );
}

function AccessPanel({ inc, snap }: { inc: Incident; snap: OpsSnapshot }) {
  const visits = snap.visits.filter((v) => v.siteId === inc.siteId).sort((a, b) => b.arrival.localeCompare(a.arrival)).slice(0, 8);
  const flagged = visits.filter((v) => v.status !== "AUTHORIZED" && v.status !== "IN_PROGRESS").length;
  return (
    <Panel title="Site access records" icon={KeyRound} className="col-span-12 xl:col-span-12"
      actions={<>
        {flagged > 0 && <Pill color="#ef4444">{flagged} not authorised</Pill>}
        <Link to={`/access?q=${inc.siteId}`} className="text-[10px] text-primary hover:underline">Access &amp; insider →</Link>
      </>}
      bodyClassName="p-0">
      {visits.length === 0 ? <p className="p-4 text-xs text-muted-foreground">No access records for this site in the retention window.</p> : (
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="text-left text-[9px] uppercase tracking-[0.14em] text-muted-foreground border-b border-primary/10">
                <th className="px-3 py-2 font-medium">Person</th><th className="px-3 py-2 font-medium">Work order</th>
                <th className="px-3 py-2 font-medium">Window</th><th className="px-3 py-2 font-medium">Arrival / exit</th>
                <th className="px-3 py-2 font-medium">Vehicle</th><th className="px-3 py-2 font-medium">Status</th><th className="px-3 py-2 font-medium">Flags</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/5">
              {visits.map((v) => {
                const bad = v.status !== "AUTHORIZED" && v.status !== "IN_PROGRESS";
                return (
                  <tr key={v.id} className={bad ? "bg-destructive/5" : ""}>
                    <td className="px-3 py-1.5">
                      <Link to={`/access?visit=${v.id}`} className="font-semibold text-foreground hover:text-primary">{v.person}</Link>
                      <p className="text-[10px] text-muted-foreground">{v.employer} · {v.role}</p>
                    </td>
                    <td className="px-3 py-1.5 font-mono">{v.workOrder ?? <span className="text-destructive">None</span>}</td>
                    <td className="px-3 py-1.5 font-mono text-muted-foreground whitespace-nowrap">{v.windowStart ? `${fmtTime(v.windowStart).slice(0, 5)}–${fmtTime(v.windowEnd).slice(0, 5)}` : "—"}</td>
                    <td className="px-3 py-1.5 font-mono whitespace-nowrap">{fmtDate(v.arrival)} {fmtTime(v.arrival).slice(0, 5)} → {v.exit ? fmtTime(v.exit).slice(0, 5) : "on site"}</td>
                    <td className="px-3 py-1.5 font-mono">{v.vehiclePlate}</td>
                    <td className="px-3 py-1.5"><Pill color={ACCESS_STATUS_COLOR[v.status]}>{bad && <AlertTriangle className="h-3 w-3" />}{v.status.replace(/_/g, " ")}</Pill></td>
                    <td className="px-3 py-1.5 text-[10px] text-muted-foreground max-w-[260px] truncate" title={v.flags.map((f) => INSIDER_FLAG_LABEL[f]).join(", ")}>
                      {v.flags.length ? v.flags.map((f) => INSIDER_FLAG_LABEL[f]).join(" · ") : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {flagged > 0 && <p className="px-3 py-2 text-[10px] text-muted-foreground border-t border-primary/10">Flags are correlations that warrant review — never accusations.</p>}
        </div>
      )}
    </Panel>
  );
}

