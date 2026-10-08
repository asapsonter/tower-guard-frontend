import { Link } from "react-router-dom";
import { Camera, CameraOff, Car, ClipboardCheck, ClipboardX, MapPin, Siren, User, Wrench } from "lucide-react";
import { INCIDENT_TYPE_LABEL, SEVERITY_COLOR, fmtDate, fmtTime } from "@/lib/cnii";
import { Pill } from "@/components/cnii/Pill";
import type { VisitLink } from "./correlate";

const gapTone = (h: number) => (h <= 24 ? "#ef4444" : h <= 48 ? "#f97316" : "#eab308");

/** Per-site row: work-order visit → (gap) → incident. */
export function CorrelationTimeline({ links }: { links: VisitLink[] }) {
  if (!links.length) return <p className="text-xs text-muted-foreground">No linked visits recorded for this referral.</p>;
  return (
    <ol className="space-y-3">
      {links.map(({ visit: v, incident: inc, gapHours }) => (
        <li key={v.id} className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-2 items-stretch">
          <div className="rounded-md border border-primary/15 bg-secondary/30 p-2.5 text-[11px] space-y-1">
            <div className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-primary" />
              <span className="text-foreground font-semibold truncate">{v.siteName}</span>
              <span className="text-muted-foreground">· {v.operator}</span>
              <span className="ml-auto font-mono text-[10px] text-muted-foreground">{v.id}</span>
            </div>
            <p className="font-mono text-muted-foreground">Visit {fmtDate(v.visitAt)} {fmtTime(v.visitAt)}</p>
            <p className="flex items-center gap-1.5"><User className="h-3 w-3 text-muted-foreground" /> {v.technician} <span className="text-muted-foreground">({v.contractor})</span></p>
            <p className="flex items-center gap-1.5"><Car className="h-3 w-3 text-muted-foreground" /> <span className="font-mono">{v.vehiclePlate}</span></p>
            <p className="flex items-center gap-1.5">
              {v.workOrder ? <><ClipboardCheck className="h-3 w-3 text-success" /> <span className="font-mono">{v.workOrder}</span></> : <><ClipboardX className="h-3 w-3 text-destructive" /> <span className="text-destructive font-semibold">NO WORK ORDER</span></>}
            </p>
            <p className="flex items-center gap-1.5">
              {v.cameraObstructed ? <><CameraOff className="h-3 w-3 text-destructive" /> <span className="text-destructive">Camera obstructed during visit</span></> : <><Camera className="h-3 w-3 text-muted-foreground" /> <span className="text-muted-foreground">Camera view normal</span></>}
            </p>
            <p className="flex items-center gap-1.5"><Wrench className="h-3 w-3 text-muted-foreground" /> {v.assetsTouched.join(", ") || "—"}</p>
          </div>

          <div className="flex lg:flex-col items-center justify-center gap-1 px-2">
            {gapHours != null ? (
              <>
                <span className="hidden lg:block h-6 w-px bg-primary/30" />
                <span className="font-mono text-[11px] font-semibold tabular-nums" style={{ color: gapTone(gapHours) }}>+{Math.round(gapHours)}h</span>
                <span className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground">gap</span>
                <span className="hidden lg:block h-6 w-px bg-primary/30" />
              </>
            ) : <span className="text-[10px] text-muted-foreground">no incident</span>}
          </div>

          {inc ? (
            <Link to={`/incident/${inc.id}`} className="rounded-md border p-2.5 text-[11px] space-y-1 hover:bg-primary/5 transition-colors" style={{ borderColor: `${SEVERITY_COLOR[inc.severity]}55` }}>
              <div className="flex items-center gap-2">
                <Siren className="h-3.5 w-3.5" style={{ color: SEVERITY_COLOR[inc.severity] }} />
                <span className="font-mono text-foreground">{inc.id}</span>
                <Pill color={SEVERITY_COLOR[inc.severity]} className="ml-auto">{inc.severity}</Pill>
              </div>
              <p className="font-mono text-muted-foreground">Alarm {fmtDate(inc.detectedAt)} {fmtTime(inc.detectedAt)}</p>
              <p className="text-foreground">{INCIDENT_TYPE_LABEL[inc.type]}</p>
              <p className="text-muted-foreground line-clamp-2">{inc.threatSummary}</p>
            </Link>
          ) : (
            <div className="rounded-md border border-dashed border-border/50 p-2.5 text-[11px] text-muted-foreground flex items-center">No incident at this site after the visit.</div>
          )}
        </li>
      ))}
    </ol>
  );
}
