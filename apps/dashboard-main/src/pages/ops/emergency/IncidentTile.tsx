import { Link } from "react-router-dom";
import { ArrowRight, Cpu, Radio, Truck } from "lucide-react";
import SimulatedCamera from "@/components/dashboard/surveillance/SimulatedCamera";
import type { CameraView } from "@/components/dashboard/surveillance/scene";
import { Meter, Pill } from "@/components/ops/Pill";
import {
  INCIDENT_STATUS_LABEL, SEVERITY_COLOR, TEAM_STATUS_COLOR, TEAM_STATUS_LABEL, fmtClock, fmtDuration, fmtTime, useSite,
  type Incident, type ResponseTeam,
} from "@/lib/ops";
import { SLA_BAND_COLOR, alertAt, arrivedAt, etaRemaining, slaBand, slaRemaining } from "./sla";

const FALLBACK_VIEWS: CameraView[] = [
  { mode: "night", panX: 300, zoom: 1, drift: 40 },
  { mode: "thermal", panX: 380, zoom: 1.2, drift: 40 },
  { mode: "mono", panX: 600, zoom: 1.15, drift: 40 },
];

const VERIFY_LABEL = { gps_geofence: "GPS geofence", geo_checkin: "Geo check-in", access_record: "Access record", cctv: "CCTV" } as const;

function hashIdx(id: string, n: number) {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h % n;
}

interface IncidentTileProps {
  incident: Incident;
  team: ResponseTeam | undefined;
  generatedAt: string;
  now: number;
}

export function IncidentTile({ incident: i, team, generatedAt, now }: IncidentTileProps) {
  const { site } = useSite(i.siteId);
  const cam = site?.cameras.find((c) => c.online) ?? null;
  const view: CameraView = cam ? { ...cam.view, drift: 40 } : FALLBACK_VIEWS[hashIdx(i.id, FALLBACK_VIEWS.length)];
  const camLabel = cam ? `${cam.id} · ${cam.label}` : `${i.siteId} · CAM-01`;

  const sla = i.response.slaSeconds;
  const remaining = slaRemaining(i, now);
  const arrived = arrivedAt(i);
  const took = arrived ? (new Date(arrived).getTime() - new Date(alertAt(i)).getTime()) / 1000 : null;
  const band = remaining != null ? slaBand(remaining, sla) : took! <= sla ? "green" : "red";
  const bandColor = SLA_BAND_COLOR[band];
  const eta = etaRemaining(i, generatedAt, now);
  const latest = [...i.timeline].sort((a, b) => b.at.localeCompare(a.at))[0];
  const sevColor = SEVERITY_COLOR[i.severity];
  const overdue = remaining != null && remaining <= 0;

  return (
    <article
      className="glass-panel overflow-hidden flex flex-col min-w-0"
      style={{ borderColor: `${sevColor}88`, boxShadow: i.severity === "critical" ? `0 0 22px -8px ${sevColor}` : undefined }}
    >
      {/* Title bar */}
      <header className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono font-bold tracking-wider uppercase overflow-hidden" style={{ backgroundColor: `${sevColor}26`, color: sevColor }}>
        <span className="h-1.5 w-1.5 rounded-full animate-pulse shrink-0" style={{ backgroundColor: sevColor }} />
        <span className="truncate">{i.id} | {i.title} | {i.state} | {i.severity}</span>
      </header>

      {/* Live feed */}
      <div className="relative bg-black">
        <SimulatedCamera view={view} fps={6} />
        <div className="absolute top-1.5 left-1.5 flex items-center gap-1.5 z-10">
          <span className="flex items-center gap-1 bg-destructive/90 px-1.5 py-0.5 rounded-sm text-[9px] font-bold text-destructive-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-destructive-foreground animate-blink" /> REC
          </span>
          <span className="text-[9px] font-mono text-white/90 bg-black/55 px-1.5 py-0.5 rounded-sm truncate max-w-[60%]">{camLabel}</span>
        </div>
        <span className="absolute top-1.5 right-1.5 z-10 text-[9px] font-mono text-white/90 bg-black/55 px-1.5 py-0.5 rounded-sm">{fmtTime(new Date(now).toISOString())}</span>
        <span className="absolute bottom-1.5 left-1.5 z-10 text-[9px] font-mono text-white/85 bg-black/55 px-1.5 py-0.5 rounded-sm truncate max-w-[90%]">{i.siteName} · {i.siteId}</span>
      </div>

      <div className="p-3 space-y-2.5 flex-1 flex flex-col">
        {/* SLA */}
        <div>
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground">Response SLA · {fmtClock(sla)}</p>
            <Pill color={SEVERITY_COLOR[i.severity]}>{INCIDENT_STATUS_LABEL[i.status]}</Pill>
          </div>
          {remaining != null ? (
            <p className={`font-mono font-bold tabular-nums text-2xl ${overdue ? "animate-pulse" : ""}`} style={{ color: bandColor }}>
              {fmtClock(remaining)}
              <span className="ml-2 font-sans text-[10px] font-semibold">{overdue ? "OVERDUE" : "REMAINING"}</span>
            </p>
          ) : (
            <p className="font-mono font-bold tabular-nums text-lg" style={{ color: bandColor }}>
              {took! <= sla ? "MET" : "BREACHED"} · {fmtDuration(took)}
              <span className="ml-2 font-sans text-[10px] font-normal text-muted-foreground">
                verified by {i.response.arrivalVerifiedBy.map((v) => VERIFY_LABEL[v]).join(", ") || "—"}
              </span>
            </p>
          )}
          <Meter value={remaining != null ? (Math.max(0, remaining) / sla) * 100 : 100} color={bandColor} className="mt-1" />
        </div>

        {/* Team */}
        <div className="flex items-start gap-2 text-xs">
          <Truck className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
          {team ? (
            <div className="min-w-0 flex-1">
              <p className="text-foreground truncate">
                <span className="font-mono font-semibold">{team.callsign}</span>
                <span className="ml-1.5 text-[10px]" style={{ color: TEAM_STATUS_COLOR[team.status] }}>{TEAM_STATUS_LABEL[team.status]}</span>
              </p>
              <p className="text-[10px] text-muted-foreground font-mono">
                {arrived ? `On site since ${fmtTime(arrived)}` : eta != null ? `ETA ${eta > 0 ? fmtClock(eta) : "arriving"} · ${i.response.distanceKm} km` : `${i.response.distanceKm} km`}
                {eta != null && remaining != null && eta > remaining && <span className="text-destructive ml-1">· ETA beyond SLA</span>}
              </p>
            </div>
          ) : (
            <div className="min-w-0 flex-1">
              <p className="text-warning font-semibold">No team assigned</p>
              <Link to={`/response?incident=${i.id}`} className="text-[10px] text-primary hover:underline">Review ITIPS dispatch recommendation → (human approval required)</Link>
            </div>
          )}
        </div>

        {/* Latest event */}
        {latest && (
          <div className="flex items-start gap-2 text-xs">
            <Radio className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
            <p className="min-w-0 text-foreground"><span className="font-mono text-primary mr-1.5">{fmtTime(latest.at)}</span>{latest.label}</p>
          </div>
        )}

        {/* Fusion */}
        <div className="flex items-center gap-2 text-xs">
          <Cpu className="h-3.5 w-3.5 text-primary shrink-0" />
          <span className="text-muted-foreground truncate">{i.fusion.verdict}</span>
          <Meter value={i.fusion.confidence} color={i.fusion.confidence >= 85 ? "#ef4444" : i.fusion.confidence >= 60 ? "#f59e0b" : "#64748b"} className="flex-1 min-w-[40px]" />
          <span className="font-mono tabular-nums font-semibold">{i.fusion.confidence}%</span>
        </div>

        <Link
          to={`/incidents/${i.id}`}
          className="mt-auto flex items-center justify-center gap-1.5 rounded-md border border-primary/40 bg-primary/10 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
        >
          Open incident room <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </article>
  );
}
