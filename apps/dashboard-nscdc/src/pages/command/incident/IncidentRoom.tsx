import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  Activity, AlertTriangle, Building2, Car, ExternalLink, FileLock2, FolderSearch, History, MapPin, Radio, ShieldAlert, Truck, UserSearch,
} from "lucide-react";
import { Panel } from "@/components/cnii/Panel";
import { Meter, Pill } from "@/components/cnii/Pill";
import { SlaCountdown } from "@/components/cnii/SlaCountdown";
import { Timeline } from "@/components/cnii/Timeline";
import {
  EVIDENCE_KIND_LABEL, INCIDENT_STATUS_LABEL, INCIDENT_TYPE_COLOR, INCIDENT_TYPE_LABEL, MODUS_LABEL, SEVERITY_COLOR, UNIT_STATUS_COLOR,
  UNIT_STATUS_LABEL, fmtClock, fmtDuration, fmtTime, useNow, type CniiSnapshot, type Incident, type ResponseUnit, type Suspect,
} from "@/lib/cnii";
import { RoomMap } from "./RoomMap";
import { StillsPanel, VideoFeedPanel } from "./MediaPanels";
import { AWAITING_DISPATCH, etaRemaining, placeName } from "./roomUtils";

const SUSPECT_STATUS_COLOR: Record<Suspect["status"], string> = {
  unidentified: "#94a3b8", identified: "#eab308", wanted: "#ef4444", arrested: "#22c55e", charged: "#3b82f6", released: "#a78bfa",
};
const COMMS_COLOR = { online: "#22c55e", degraded: "#f59e0b", offline: "#ef4444" } as const;

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <div className="text-[12px] text-foreground">{children}</div>
    </div>
  );
}

/** The NSCDC Incident Room — every facet of one incident on one screen. */
export function IncidentRoom({ inc, snap }: { inc: Incident; snap: CniiSnapshot }) {
  const unit = inc.respondingUnitId ? snap.units.find((u) => u.id === inc.respondingUnitId) : undefined;
  const suspects = snap.suspects.filter((s) => inc.suspectIds.includes(s.id));
  const vehicles = snap.vehicles.filter((v) => inc.vehicleIds.includes(v.id));
  const evidence = snap.evidence.filter((e) => e.incidentId === inc.id);
  const awaiting = AWAITING_DISPATCH(inc);
  const sevColor = SEVERITY_COLOR[inc.severity];

  return (
    <div className="space-y-4">
      {/* Room header */}
      <div className="glass-panel p-4 flex flex-wrap items-center gap-4" style={{ boxShadow: `inset 3px 0 0 ${sevColor}` }}>
        <div className="min-w-0 flex-1">
          <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground">NSCDC Incident Room</p>
          <h2 className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[15px] font-bold text-foreground">
            <span className="font-mono text-primary">{inc.id}</span>
            <span className="text-muted-foreground">·</span>
            <span className="font-display uppercase tracking-wide">{inc.title}</span>
            <span className="text-muted-foreground">·</span>
            <span>{placeName(inc)}</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-[12px] text-muted-foreground">Threat Level:</span>
            <Pill color={sevColor} solid className="text-[11px]">{inc.threatLevel}</Pill>
          </h2>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Pill color={INCIDENT_TYPE_COLOR[inc.type]}>{INCIDENT_TYPE_LABEL[inc.type]}</Pill>
            <Pill color={awaiting ? "#f59e0b" : "#22c55e"}>{INCIDENT_STATUS_LABEL[inc.status]}</Pill>
            {inc.verified && <span className="hud-chip">Verified</span>}
            <span className="text-[10px] text-muted-foreground">Detected {fmtTime(inc.detectedAt)} WAT</span>
          </div>
        </div>
        <SlaCountdown size="lg" alertAt={inc.response.stages.alert ?? inc.detectedAt} slaSeconds={inc.response.slaSeconds} arrivalAt={inc.response.verifiedArrival} />
      </div>

      {awaiting && (
        <div className="glass-panel border-warning/50 bg-warning/5 p-4 flex flex-wrap items-center gap-3">
          <AlertTriangle className="h-6 w-6 text-warning shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-foreground">No response team assigned — awaiting dispatch</p>
            <p className="text-[11px] text-muted-foreground">ITIPS will recommend the closest compliant team. An authorised officer must approve the dispatch.</p>
          </div>
          <Link to={`/dispatch?incident=${inc.id}`} className="rounded-md bg-warning px-4 py-2 text-[12px] font-bold text-black hover:bg-warning/90">
            Request dispatch recommendation →
          </Link>
        </div>
      )}

      <div className="grid grid-cols-12 gap-4">
        <Panel title="Site location & route" icon={MapPin} className="col-span-12 lg:col-span-7" bodyClassName="p-3">
          <RoomMap inc={inc} unit={unit} />
        </Panel>
        <div className="col-span-12 lg:col-span-5">
          <VideoFeedPanel inc={inc} />
        </div>

        <Panel title="Threat classification" icon={ShieldAlert} className="col-span-12 md:col-span-6 xl:col-span-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Type">{INCIDENT_TYPE_LABEL[inc.type]}</Field>
            <Field label="Severity"><span className="uppercase font-semibold" style={{ color: sevColor }}>{inc.severity}</span></Field>
            <Field label="Persons detected"><span className="font-mono">{inc.personsDetected}</span></Field>
            <Field label="Weapon">{inc.weaponSuspected ? <span className="text-destructive font-semibold">Possible weapon</span> : "None detected"}</Field>
          </div>
          <div className="mt-3">
            <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground mb-1">Modus operandi</p>
            <div className="flex flex-wrap gap-1.5">{inc.modusOperandi.map((m) => <span key={m} className="hud-chip">{MODUS_LABEL[m]}</span>)}</div>
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground">{inc.threatSummary}</p>
        </Panel>

        <Panel title="Operator & site" icon={Building2} className="col-span-12 md:col-span-6 xl:col-span-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Operator">{inc.operator}</Field>
            <Field label="Site ID"><span className="font-mono">{inc.siteId}</span></Field>
            <div className="col-span-2"><Field label="Site">{inc.siteName}</Field></div>
            <Field label="LGA / State">{inc.lga}, {inc.state}</Field>
            <Field label="Zone">{inc.zone}</Field>
            <Field label="Coordinates"><span className="font-mono text-[11px]">{inc.location.lat.toFixed(4)}, {inc.location.lng.toFixed(4)}</span></Field>
            <Field label="Command"><span className="font-mono text-[11px]">{inc.areaCommandId}</span></Field>
          </div>
          <p className="mt-3 text-[10px] text-muted-foreground">Operator data limited to this incident under the CNII data-sharing protocol.</p>
        </Panel>

        <RespondingUnitPanel inc={inc} unit={unit} generatedAt={snap.generatedAt} />

        <div className="col-span-12 md:col-span-6 xl:col-span-4"><StillsPanel inc={inc} /></div>

        <Panel title="Sensor alerts" icon={Activity} className="col-span-12 md:col-span-6 xl:col-span-4" actions={<span className="hud-chip">{inc.sensorAlerts.length}</span>}>
          {inc.sensorAlerts.length === 0 ? <p className="text-xs text-muted-foreground">No sensor alerts.</p> : (
            <ul className="space-y-2">
              {inc.sensorAlerts.map((s, i) => (
                <li key={i} className="flex items-center gap-2 rounded border border-primary/10 px-2 py-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-warning shrink-0" />
                  <span className="text-[12px] text-foreground">{s.sensor}</span>
                  <span className="font-mono text-[11px] text-warning">{s.reading}</span>
                  <span className="ml-auto font-mono text-[10px] text-muted-foreground">{fmtTime(s.at)}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Suspects & vehicles" icon={UserSearch} className="col-span-12 xl:col-span-4">
          {suspects.length === 0 && vehicles.length === 0 ? (
            <p className="text-xs text-muted-foreground">No suspects or vehicles linked yet.</p>
          ) : (
            <div className="space-y-3">
              {suspects.length > 0 && (
                <ul className="space-y-1.5">
                  {suspects.map((s) => (
                    <li key={s.id}>
                      <Link to={`/intelligence?focus=${s.id}`} className="block rounded border border-primary/10 px-2 py-1.5 hover:border-primary/40">
                        <div className="flex items-center gap-2">
                          <span className="text-[12px] font-semibold text-foreground">{s.alias}</span>
                          {s.name && <span className="text-[11px] text-muted-foreground truncate">{s.name}</span>}
                          <Pill color={SUSPECT_STATUS_COLOR[s.status]} className="ml-auto capitalize">{s.status}</Pill>
                        </div>
                        <p className="text-[10px] text-muted-foreground truncate">{s.description}{s.armed ? " · armed" : ""}</p>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              {vehicles.length > 0 && (
                <ul className="space-y-1.5">
                  {vehicles.map((v) => (
                    <li key={v.id} className="flex items-center gap-2 rounded border border-primary/10 px-2 py-1.5">
                      <Car className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span className="font-mono text-[11px] text-foreground">{v.plate ?? "Plate unknown"}</span>
                      <span className="text-[11px] text-muted-foreground truncate">{v.description}</span>
                      <span className="ml-auto text-[10px] text-muted-foreground whitespace-nowrap">{v.seenAt.length} sites</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </Panel>

        <Panel title="Incident timeline" icon={History} className="col-span-12 lg:col-span-7"
          actions={<span className="text-[10px] text-muted-foreground">This becomes the single operational record</span>}>
          <Timeline events={inc.timeline} />
        </Panel>

        <Panel title="Case & evidence" icon={FolderSearch} className="col-span-12 lg:col-span-5">
          {inc.caseId ? (
            <Link to={`/investigations/${inc.caseId}`} className="flex items-center gap-2 rounded-md border border-primary/30 bg-primary/5 px-3 py-2 hover:bg-primary/10">
              <FolderSearch className="h-4 w-4 text-primary" />
              <div className="min-w-0">
                <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Investigation case</p>
                <p className="font-mono text-[12px] text-primary">{inc.caseId}</p>
              </div>
              <ExternalLink className="ml-auto h-3.5 w-3.5 text-primary" />
            </Link>
          ) : (
            <p className="text-xs text-muted-foreground">No investigation case opened yet.</p>
          )}
          <div className="mt-3">
            <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground mb-1">Evidence ({evidence.length})</p>
            {evidence.length === 0 ? <p className="text-xs text-muted-foreground">No evidence ingested for this incident.</p> : (
              <ul className="space-y-1">
                {evidence.slice(0, 8).map((e) => (
                  <li key={e.id}>
                    <Link to={`/evidence?focus=${e.id}`} className="flex items-center gap-2 rounded px-1.5 py-1 hover:bg-secondary/50">
                      <FileLock2 className="h-3 w-3 text-primary shrink-0" />
                      <span className="font-mono text-[10px] text-primary">{e.id}</span>
                      <span className="text-[11px] text-foreground truncate">{e.title}</span>
                      <span className="ml-auto text-[9px] text-muted-foreground whitespace-nowrap">{EVIDENCE_KIND_LABEL[e.kind]}</span>
                      {e.hashVerified && <span className="text-[9px] text-success">✓ hash</span>}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Field label="Arrests"><span className="font-mono">{inc.arrests}</span></Field>
            <Field label="Assets recovered"><span className="font-mono">₦{inc.assetsRecoveredNaira.toLocaleString()}</span></Field>
          </div>
        </Panel>
      </div>
    </div>
  );
}

function RespondingUnitPanel({ inc, unit, generatedAt }: { inc: Incident; unit?: ResponseUnit; generatedAt: string }) {
  const now = useNow();
  const eta = etaRemaining(inc, generatedAt, now);
  return (
    <Panel title="Responding unit" icon={Truck} className="col-span-12 md:col-span-12 xl:col-span-4"
      actions={unit && <Link to={`/dispatch?focus=${unit.id}`} className="text-[11px] text-primary hover:underline">Dispatch board →</Link>}>
      {!unit ? (
        <p className="text-xs text-muted-foreground">{AWAITING_DISPATCH(inc) ? "No unit assigned — dispatch pending." : "No responding unit recorded."}</p>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[15px] font-bold text-primary">{unit.callsign}</span>
            <Pill color={UNIT_STATUS_COLOR[unit.status]}>{UNIT_STATUS_LABEL[unit.status]}</Pill>
            {unit.armed && <span className="hud-chip">Armed</span>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Commander">{unit.commander.rank} {unit.commander.name}</Field>
            <Field label="Crew">{unit.officers.length + 1} officers</Field>
            <Field label="Vehicle"><span className="font-mono text-[11px]">{unit.vehicle.plate}</span> · {unit.vehicle.type}</Field>
            <Field label="Comms">
              <span className="inline-flex items-center gap-1 capitalize"><Radio className="h-3 w-3" style={{ color: COMMS_COLOR[unit.comms] }} />{unit.comms}</span>
            </Field>
          </div>
          <div>
            <div className="flex justify-between text-[9px] uppercase tracking-[0.14em] text-muted-foreground"><span>Equipment readiness</span><span className="font-mono">{unit.equipmentReadiness}%</span></div>
            <Meter value={unit.equipmentReadiness} color={unit.equipmentReadiness >= 70 ? "#22c55e" : "#f59e0b"} className="mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-3 rounded-md border border-primary/15 bg-primary/5 p-2.5">
            <Field label="Route distance"><span className="font-mono">{inc.response.distanceKm} km</span></Field>
            <Field label="ETA">
              {eta == null ? (
                <span className="font-mono text-success">{inc.response.verifiedArrival ? `Arrived ${fmtTime(inc.response.verifiedArrival)}` : "—"}</span>
              ) : (
                <span className={`font-mono text-lg font-bold tabular-nums ${eta < 0 ? "text-destructive" : "text-primary"}`}>
                  {eta < 0 ? `${fmtClock(eta)} late` : fmtDuration(eta)}
                </span>
              )}
            </Field>
          </div>
        </div>
      )}
    </Panel>
  );
}
