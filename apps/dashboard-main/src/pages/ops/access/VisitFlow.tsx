import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Building2, CalendarClock, ClipboardList, DoorOpen, LogIn, LogOut, MapPin, User, Wrench } from "lucide-react";
import { Pill } from "@/components/ops/Pill";
import { ACCESS_STATUS_COLOR, INSIDER_FLAG_LABEL, fmtDate, type AccessVisit } from "@/lib/ops";

export const STATUS_LABEL: Record<AccessVisit["status"], string> = {
  AUTHORIZED: "AUTHORIZED", IN_PROGRESS: "ON SITE", OUTSIDE_WINDOW: "OUTSIDE WINDOW", NO_WORK_ORDER: "NO WORK ORDER",
  SCOPE_EXCEEDED: "SCOPE EXCEEDED", INSIDER_RISK: "INSIDER RISK",
};

/** HH:MM in WAT. */
export function hhmm(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en-GB", { timeZone: "Africa/Lagos", hour: "2-digit", minute: "2-digit", hour12: false });
}

const minsBetween = (a: string, b: string) => Math.round((new Date(b).getTime() - new Date(a).getTime()) / 60000);

/** Arrival relative to the approved window, as a short phrase + tone. */
export function windowCheck(v: AccessVisit): { text: string; ok: boolean } {
  if (!v.windowStart || !v.windowEnd) return { text: "No approved window", ok: false };
  const early = minsBetween(v.arrival, v.windowStart);
  const lateEnd = minsBetween(v.windowEnd, v.arrival);
  if (early > 15) return { text: `Arrived ${early} min before window`, ok: false };
  if (lateEnd > 0) return { text: `Arrived ${lateEnd} min after window closed`, ok: false };
  if (v.exit && minsBetween(v.windowEnd, v.exit) > 15) return { text: `Exit ${minsBetween(v.windowEnd, v.exit)} min after window`, ok: false };
  return { text: "Inside approved window", ok: true };
}

function Step({ icon: Icon, label, value, sub, bad }: { icon: typeof User; label: string; value: ReactNode; sub?: ReactNode; bad?: boolean }) {
  return (
    <div className={`min-w-0 rounded-md border px-2.5 py-2 ${bad ? "border-destructive/50 bg-destructive/10" : "border-primary/15 bg-secondary/30"}`}>
      <div className="flex items-center gap-1 text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
        <Icon className={`h-3 w-3 ${bad ? "text-destructive" : "text-primary"}`} /> {label}
      </div>
      <div className={`mt-0.5 text-[12px] font-semibold truncate ${bad ? "text-destructive" : "text-foreground"}`}>{value}</div>
      {sub && <div className="text-[10px] text-muted-foreground truncate">{sub}</div>}
    </div>
  );
}

/** Person → Employer → Work Order → Site → Approved Window → Arrival → Activities → Exit */
export function VisitFlow({ visit: v }: { visit: AccessVisit }) {
  const win = windowCheck(v);
  const color = ACCESS_STATUS_COLOR[v.status];
  const dwell = v.exit ? minsBetween(v.arrival, v.exit) : null;
  const steps = [
    <Step key="p" icon={User} label="Person" value={v.person} sub={v.role} bad={v.person === "Unregistered crew"} />,
    <Step key="e" icon={Building2} label="Employer" value={v.employer} sub={`Vehicle ${v.vehiclePlate}`} />,
    <Step key="w" icon={ClipboardList} label="Work order" value={<span className="font-mono">{v.workOrder ?? "NONE"}</span>} bad={!v.workOrder} />,
    <Step key="s" icon={MapPin} label="Site" value={<Link to={`/sites/${v.siteId}`} className="font-mono text-primary hover:underline">{v.siteId}</Link>} sub={v.siteName} />,
    <Step key="a" icon={CalendarClock} label="Approved window" value={<span className="font-mono">{v.windowStart ? `${hhmm(v.windowStart)}–${hhmm(v.windowEnd)}` : "NONE"}</span>} sub={fmtDate(v.windowStart ?? v.arrival)} bad={!v.windowStart} />,
    <Step key="r" icon={LogIn} label="Actual arrival" value={<span className="font-mono">{hhmm(v.arrival)}</span>} sub={win.text} bad={!win.ok} />,
    <Step key="x" icon={Wrench} label="Activities" value={`${v.activities.length} logged`} sub={v.activities[0]} bad={v.flags.includes("out_of_scope_asset") || v.flags.includes("camera_obstructed_after")} />,
    <Step key="o" icon={v.exit ? LogOut : DoorOpen} label="Exit" value={<span className="font-mono">{v.exit ? hhmm(v.exit) : "ON SITE"}</span>} sub={dwell != null ? `Dwell ${dwell} min` : "Visit in progress"} bad={v.flags.includes("unusual_dwell")} />,
  ];

  return (
    <div className="space-y-3">
      <div className="rounded-md border px-3 py-2 font-mono text-[12px] leading-relaxed" style={{ borderColor: `${color}66`, background: `${color}10` }}>
        <span className="text-muted-foreground">{v.role.includes("ngineer") ? "Engineer" : "Person"}:</span> <span className="text-foreground">{v.person}</span>
        <span className="text-muted-foreground"> · Contractor:</span> <span className="text-foreground">{v.employer}</span>
        <span className="text-muted-foreground"> · WO:</span> <span className={v.workOrder ? "text-foreground" : "text-destructive"}>{v.workOrder ?? "NONE"}</span>
        <span className="text-muted-foreground"> · Authorized:</span> <span className={v.windowStart ? "text-foreground" : "text-destructive"}>{v.windowStart ? `${hhmm(v.windowStart)}–${hhmm(v.windowEnd)}` : "NONE"}</span>
        <span className="text-muted-foreground"> · Actual arrival:</span> <span className="text-foreground">{hhmm(v.arrival)}</span>
        <span className="text-muted-foreground"> · Exit:</span> <span className="text-foreground">{v.exit ? hhmm(v.exit) : "on site"}</span>
        <span className="text-muted-foreground"> · Status:</span> <span className="font-bold" style={{ color }}>{STATUS_LABEL[v.status]}</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-1.5 items-stretch">
        {steps.map((s, i) => (
          <div key={i} className="relative">
            {s}
            {i < steps.length - 1 && <ArrowRight className="hidden xl:block absolute -right-[9px] top-1/2 -translate-y-1/2 h-3 w-3 text-primary/60 z-10" />}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground mb-1">Activity log</p>
          <ol className="space-y-1">
            {v.activities.map((a, i) => (
              <li key={i} className="flex items-start gap-2 text-[11px]">
                <span className="font-mono text-primary">{String(i + 1).padStart(2, "0")}</span>
                <span className="text-foreground">{a}</span>
              </li>
            ))}
            {v.companions > 0 && <li className="text-[11px] text-warning">Accompanied by {v.companions} unregistered person(s)</li>}
          </ol>
        </div>
        <div>
          <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground mb-1">Correlation flags (for review)</p>
          {v.flags.length === 0 ? <p className="text-[11px] text-success">No anomalies — access matches the work order and window.</p> : (
            <div className="flex flex-wrap gap-1">
              {v.flags.map((f) => <Pill key={f} color="#f97316">{INSIDER_FLAG_LABEL[f]}</Pill>)}
            </div>
          )}
          {v.linkedIncidentId && (
            <p className="mt-2 text-[11px] text-muted-foreground">
              Linked incident: <Link to={`/incidents/${v.linkedIncidentId}`} className="font-mono text-primary hover:underline">{v.linkedIncidentId}</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
