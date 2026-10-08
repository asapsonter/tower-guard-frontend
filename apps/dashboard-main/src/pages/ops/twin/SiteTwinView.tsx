import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { CircleMarker, Marker, Polyline, Tooltip } from "react-leaflet";
import {
  Activity, AlertTriangle, Boxes, Cctv, Crosshair, HeartPulse, History, KeyRound, MapPin, Radar, ShieldAlert, Siren, TrendingUp, Video,
} from "lucide-react";
import { Panel } from "@/components/ops/Panel";
import { Meter, Pill } from "@/components/ops/Pill";
import { OpsMap, dotIcon } from "@/components/ops/OpsMap";
import {
  ACCESS_STATUS_COLOR, ASSET_STATUS_COLOR, INCIDENT_TYPE_COLOR, INCIDENT_TYPE_LABEL, SITE_STATE_COLOR, SITE_STATE_LABEL,
  TEAM_STATUS_COLOR, TEAM_STATUS_LABEL, fmtDate, fmtNaira, fmtTime, timeAgo, useOps,
  type AssetKind, type SiteDetail, type SiteEvent,
} from "@/lib/ops";
import { PROTECTION_COLOR, riskColor } from "../health/protection";
import { CameraTile } from "./CameraTile";
import { ASSET_STATUS_LABEL, SiteSchematic } from "./SiteSchematic";

const EVENT_COLOR: Record<SiteEvent["severity"], string> = { info: "#38bdf8", warning: "#eab308", critical: "#ef4444" };
const OUTCOME_LABEL: Record<string, string> = {
  ongoing: "Ongoing", disrupted: "Attack disrupted", theft_completed: "Theft completed", damage_only: "Damage only", false_alarm: "False alarm",
};

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground">{label}</dt>
      <dd className="text-[12px] text-foreground truncate">{children}</dd>
    </div>
  );
}

const linkBtn = "inline-flex items-center gap-1.5 rounded-md border border-primary/25 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary hover:bg-primary/20 transition-colors";

/** Complete Site Security Digital Twin for one site. */
export function SiteTwinView({ site }: { site: SiteDetail }) {
  const { team } = useOps();
  const [asset, setAsset] = useState<AssetKind | null>(null);
  const unit = team(site.nearestTeam.id);
  const assetTotal = site.assets.reduce((s, a) => s + a.valueNaira, 0);
  const alarmAssets = site.assets.filter((a) => a.status === "intrusion" || a.status === "tamper");

  return (
    <div className="space-y-4">
      {/* ── Identity ─────────────────────────────────────────────── */}
      <section className="glass-panel p-4">
        <div className="flex flex-wrap items-start gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-lg font-bold text-primary text-glow">{site.id}</span>
              <Pill color={SITE_STATE_COLOR[site.status]} solid>{SITE_STATE_LABEL[site.status].toUpperCase()}</Pill>
              <Pill color={PROTECTION_COLOR[site.protectionState]}>{site.protectionState}</Pill>
              <span className="hud-chip">{site.siteClass}</span>
            </div>
            <p className="text-[13px] text-foreground">{site.name} <span className="text-muted-foreground">· {site.address} · {site.lga} LGA</span></p>
          </div>
          <div className="ml-auto flex flex-wrap gap-2">
            <Link to={`/fusion/${site.id}`} className={linkBtn}><Radar className="h-3.5 w-3.5" />Sensor fusion</Link>
            <Link to={`/health?site=${site.id}`} className={linkBtn}><HeartPulse className="h-3.5 w-3.5" />System health</Link>
            <Link to={`/risk?site=${site.id}`} className={linkBtn}><TrendingUp className="h-3.5 w-3.5" />Risk forecast</Link>
            {site.activeIncidentId && (
              <Link to={`/incidents/${site.activeIncidentId}`} className="inline-flex items-center gap-1.5 rounded-md border border-destructive/50 bg-destructive/15 px-2.5 py-1 text-[11px] font-semibold text-destructive hover:bg-destructive/25">
                <Siren className="h-3.5 w-3.5 animate-pulse" />Incident room {site.activeIncidentId}
              </Link>
            )}
          </div>
        </div>

        {alarmAssets.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-[12px]">
            <ShieldAlert className="h-4 w-4 text-destructive" />
            <span className="font-semibold text-destructive uppercase tracking-wide">Asset alarm</span>
            {alarmAssets.map((a) => (
              <button key={a.kind} onClick={() => setAsset(a.kind)} className="hover:underline" style={{ color: ASSET_STATUS_COLOR[a.status] }}>
                {a.label} · {ASSET_STATUS_LABEL[a.status]}
              </button>
            ))}
          </div>
        )}

        <dl className="mt-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-x-4 gap-y-2.5">
          <Field label="GPS"><span className="font-mono">{site.location.lat.toFixed(4)}, {site.location.lng.toFixed(4)}</span></Field>
          <Field label="Operator / tenants">ATC · {site.tenants.join(", ")}</Field>
          <Field label="Classification">{site.siteClass === "Hub" ? "Hub (critical aggregation)" : `Priority ${site.siteClass}`}</Field>
          <Field label="Risk class · 72h score">
            <span style={{ color: riskColor(site.riskScore) }}>{site.riskClass}</span> · <span className="font-mono tabular-nums" style={{ color: riskColor(site.riskScore) }}>{site.riskScore}/100</span>
          </Field>
          <Field label="Tower">{site.towerType} · <span className="font-mono">{site.towerHeightM} m</span></Field>
          <Field label="Maintenance contractor">{site.maintenanceContractor}</Field>
          <Field label="Response cluster">{site.responseCluster} <span className="font-mono text-muted-foreground">({site.clusterId})</span></Field>
          <Field label="Zone / state">{site.zone} · {site.state}</Field>
          <Field label="Nearest unit">
            <Link to={`/response?team=${site.nearestTeam.id}`} className="text-primary hover:underline font-mono">{site.nearestTeam.callsign}</Link>
          </Field>
          <Field label="Distance · ETA"><span className="font-mono tabular-nums">{site.nearestTeam.distanceKm} km · {site.nearestTeam.etaMin} min</span></Field>
          <Field label="Unit status"><span style={{ color: TEAM_STATUS_COLOR[site.nearestTeam.status] }}>{TEAM_STATUS_LABEL[site.nearestTeam.status]}</span></Field>
          <Field label="Protection score"><span className="font-mono tabular-nums" style={{ color: PROTECTION_COLOR[site.protectionState] }}>{site.protectionScore}/100</span></Field>
        </dl>
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          <span className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground mr-1">Critical assets</span>
          {site.criticalAssets.map((c) => <span key={c} className="hud-chip">{c}</span>)}
        </div>
      </section>

      <div className="grid grid-cols-12 gap-4">
        {/* ── Live schematic ──────────────────────────────────────── */}
        <Panel title="Live site status" icon={Activity} className="col-span-12 lg:col-span-7"
          actions={<span className="text-[10px] text-muted-foreground">hover / click an asset</span>}>
          <SiteSchematic assets={site.assets} selected={asset} onSelect={setAsset} />
        </Panel>

        {/* ── Asset register ─────────────────────────────────────── */}
        <Panel title="Asset register" icon={Boxes} className="col-span-12 lg:col-span-5" bodyClassName="p-0"
          actions={<span className="font-mono text-[10px] text-muted-foreground">{fmtNaira(assetTotal)} at site</span>}>
          <ul className="divide-y divide-primary/5">
            {site.assets.map((a) => (
              <li key={a.kind}>
                <button onClick={() => setAsset(asset === a.kind ? null : a.kind)}
                  className={`w-full flex items-start gap-2 px-3 py-1.5 text-left transition-colors ${asset === a.kind ? "bg-primary/10" : "hover:bg-primary/5"}`}>
                  <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${a.status === "intrusion" || a.status === "tamper" ? "animate-pulse" : ""}`} style={{ background: ASSET_STATUS_COLOR[a.status] }} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-medium text-foreground">{a.label}</span>
                      <span className="text-[9px] font-mono uppercase" style={{ color: ASSET_STATUS_COLOR[a.status] }}>{ASSET_STATUS_LABEL[a.status]}</span>
                      <span className="ml-auto font-mono text-[10px] text-muted-foreground tabular-nums">{a.valueNaira ? fmtNaira(a.valueNaira) : "—"}</span>
                    </div>
                    <p className="truncate text-[10px] text-muted-foreground">{a.detail}</p>
                    {a.lastEvent && <p className="truncate text-[10px] font-mono text-warning">{a.lastEvent}</p>}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </Panel>

        {/* ── Cameras ────────────────────────────────────────────── */}
        <Panel title="Live cameras" icon={Cctv} className="col-span-12"
          actions={<>
            <span className="font-mono text-[10px] text-muted-foreground">{site.cameras.filter((c) => c.online).length}/{site.cameras.length} online</span>
            <Link to={`/fusion/${site.id}`} className="text-[11px] text-primary hover:underline">Open fusion workspace →</Link>
          </>}>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2">
            {site.cameras.map((c) => <CameraTile key={c.id} camera={c} fps={10} compact />)}
          </div>
        </Panel>

        {/* ── Map + nearest unit ─────────────────────────────────── */}
        <Panel title="Location & nearest response" icon={MapPin} className="col-span-12 lg:col-span-4" bodyClassName="p-3 space-y-2">
          <OpsMap key={site.id} center={site.location} zoom={12} height={210} fitTo={unit ? [site.location, unit.location] : [site.location]}>
            <CircleMarker center={[site.location.lat, site.location.lng]} radius={8}
              pathOptions={{ color: SITE_STATE_COLOR[site.status], fillColor: SITE_STATE_COLOR[site.status], fillOpacity: 0.8, weight: 2 }}>
              <Tooltip className="cnii-tip">{site.id}</Tooltip>
            </CircleMarker>
            {unit && (
              <>
                <Polyline positions={[[unit.location.lat, unit.location.lng], [site.location.lat, site.location.lng]]} pathOptions={{ color: "#38bdf8", weight: 1.5, dashArray: "4 4" }} />
                <Marker position={[unit.location.lat, unit.location.lng]} icon={dotIcon(TEAM_STATUS_COLOR[unit.status], { size: 12, label: unit.callsign, shape: "diamond" })} />
              </>
            )}
          </OpsMap>
          <div className="flex items-center gap-2 rounded-md border border-primary/15 bg-primary/5 px-2.5 py-2">
            <Crosshair className="h-4 w-4 text-primary" />
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-semibold text-foreground font-mono">{site.nearestTeam.callsign}</p>
              <p className="text-[10px] text-muted-foreground truncate">{unit ? `${unit.provider} · ${unit.vehicle.type} ${unit.vehicle.plate}` : site.nearestTeam.id}</p>
            </div>
            <div className="text-right">
              <p className="font-mono text-[12px] tabular-nums text-foreground">{site.nearestTeam.distanceKm} km · {site.nearestTeam.etaMin} min</p>
              <p className="text-[10px]" style={{ color: TEAM_STATUS_COLOR[site.nearestTeam.status] }}>{TEAM_STATUS_LABEL[site.nearestTeam.status]}</p>
            </div>
          </div>
        </Panel>

        {/* ── Recent events ──────────────────────────────────────── */}
        <Panel title="Recent events" icon={Activity} className="col-span-12 md:col-span-6 lg:col-span-4" bodyClassName="p-0">
          <ul className="max-h-[300px] overflow-y-auto divide-y divide-primary/5">
            {site.recentEvents.map((e, i) => (
              <li key={`${e.at}-${i}`} className="flex items-start gap-2 px-3 py-1.5">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: EVENT_COLOR[e.severity] }} />
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] text-foreground">{e.label}</p>
                  <p className="text-[10px] text-muted-foreground"><span className="font-mono">{fmtTime(e.at)}</span> · {e.source} · {timeAgo(e.at)}</p>
                </div>
              </li>
            ))}
            {!site.recentEvents.length && <li className="p-4 text-[12px] text-muted-foreground">No recent events.</li>}
          </ul>
        </Panel>

        {/* ── Risk factors ───────────────────────────────────────── */}
        <Panel title="72h risk factors" icon={AlertTriangle} className="col-span-12 md:col-span-6 lg:col-span-4"
          actions={<Link to={`/risk?site=${site.id}`} className="text-[11px] text-primary hover:underline">Forecast →</Link>}>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-3xl font-bold tabular-nums" style={{ color: riskColor(site.riskScore) }}>{site.riskScore}</span>
            <span className="text-[11px] text-muted-foreground">/ 100 · {site.riskClass} risk</span>
          </div>
          <p className="text-[10px] text-muted-foreground mb-2">A risk estimate for the next 72 hours — not a prediction that an attack will occur.</p>
          <ul className="space-y-2">
            {site.riskFactors.map((f) => (
              <li key={f.key}>
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="text-foreground truncate">{f.label}</span>
                  <span className="ml-auto font-mono tabular-nums text-warning">+{f.contribution}</span>
                </div>
                <Meter value={Math.min(100, f.contribution * 3)} color="#f97316" />
                <p className="text-[10px] text-muted-foreground truncate">{f.detail}</p>
              </li>
            ))}
            {!site.riskFactors.length && <li className="text-[12px] text-muted-foreground">No elevated risk factors.</li>}
          </ul>
        </Panel>

        {/* ── Access visits ──────────────────────────────────────── */}
        <Panel title="Recent access visits" icon={KeyRound} className="col-span-12 lg:col-span-6" bodyClassName="p-0"
          actions={<Link to={`/access?q=${encodeURIComponent(site.id)}`} className="text-[11px] text-primary hover:underline">Access workspace →</Link>}>
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
                <tr className="border-b border-primary/10">
                  <th className="px-3 py-1.5 text-left font-medium">Person</th>
                  <th className="px-2 py-1.5 text-left font-medium">Work order</th>
                  <th className="px-2 py-1.5 text-left font-medium">In / out</th>
                  <th className="px-3 py-1.5 text-right font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/5">
                {site.recentVisits.map((v) => (
                  <tr key={v.id} className="hover:bg-primary/5">
                    <td className="px-3 py-1.5">
                      <Link to={`/access?visit=${v.id}`} className="text-foreground hover:text-primary">{v.person}</Link>
                      <p className="text-[10px] text-muted-foreground truncate max-w-[180px]">{v.employer}</p>
                    </td>
                    <td className="px-2 py-1.5 font-mono">{v.workOrder ?? <span className="text-warning">none</span>}</td>
                    <td className="px-2 py-1.5 font-mono tabular-nums whitespace-nowrap">{fmtTime(v.arrival).slice(0, 5)} → {v.exit ? fmtTime(v.exit).slice(0, 5) : "on site"}<p className="text-[10px] text-muted-foreground">{fmtDate(v.arrival)}</p></td>
                    <td className="px-3 py-1.5 text-right"><Pill color={ACCESS_STATUS_COLOR[v.status]}>{v.status.replace(/_/g, " ")}</Pill></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!site.recentVisits.length && <p className="p-4 text-[12px] text-muted-foreground">No access visits on record.</p>}
          </div>
          <p className="px-3 py-2 text-[10px] text-muted-foreground border-t border-primary/10">Access anomalies are correlations for review — not accusations.</p>
        </Panel>

        {/* ── Incident history ───────────────────────────────────── */}
        <Panel title="Incident history" icon={History} className="col-span-12 lg:col-span-6" bodyClassName="p-0">
          <ul className="divide-y divide-primary/5 max-h-[300px] overflow-y-auto">
            {site.incidentHistory.map((h) => (
              <li key={h.id}>
                <Link to={`/incidents/${h.id}`} className="flex items-center gap-2 px-3 py-1.5 hover:bg-primary/5">
                  <span className="h-2 w-2 shrink-0 rounded-sm" style={{ background: INCIDENT_TYPE_COLOR[h.type] }} />
                  <span className="font-mono text-[11px] text-primary">{h.id}</span>
                  <span className="text-[11px] text-foreground">{INCIDENT_TYPE_LABEL[h.type]}</span>
                  <span className={`text-[10px] ${h.outcome === "ongoing" ? "text-destructive" : "text-muted-foreground"}`}>{OUTCOME_LABEL[h.outcome] ?? h.outcome}</span>
                  <span className="ml-auto font-mono text-[10px] text-muted-foreground">{fmtDate(h.at)}</span>
                </Link>
              </li>
            ))}
            {!site.incidentHistory.length && <li className="p-4 text-[12px] text-muted-foreground">No incidents recorded at this site.</li>}
          </ul>
          <div className="flex items-center gap-2 border-t border-primary/10 px-3 py-2">
            <Video className="h-3.5 w-3.5 text-primary" />
            <Link to={`/fusion/${site.id}`} className="text-[11px] text-primary hover:underline">Replay last event in the fusion workspace</Link>
          </div>
        </Panel>
      </div>
    </div>
  );
}
