import { Radar, Camera, Activity, Cpu, Building2, Shield, Users, MapPin, Search } from "lucide-react";
import type { TimelineEvent, TimelineSource } from "@/lib/cnii";
import { fmtTime } from "@/lib/cnii";

const SOURCE_ICON: Record<TimelineSource, typeof Radar> = {
  radar: Radar, camera: Camera, sensor: Activity, ai: Cpu, operator: Building2, command: Shield, unit: Users, gps: MapPin, investigator: Search,
};

/** Vertical incident timeline — the single operational record. */
export function Timeline({ events, compact = false }: { events: TimelineEvent[]; compact?: boolean }) {
  const sorted = [...events].sort((a, b) => a.at.localeCompare(b.at));
  return (
    <ol className="relative space-y-0">
      {sorted.map((e, i) => {
        const Icon = SOURCE_ICON[e.source] ?? Activity;
        const last = i === sorted.length - 1;
        return (
          <li key={`${e.at}-${i}`} className="relative flex gap-3 pb-3">
            {!last && <span className="absolute left-[11px] top-6 bottom-0 w-px bg-primary/20" />}
            <span className={`relative z-10 h-6 w-6 shrink-0 rounded-full border flex items-center justify-center ${last ? "border-primary bg-primary/20" : "border-primary/30 bg-card"}`}>
              <Icon className="h-3 w-3 text-primary" />
            </span>
            <div className="min-w-0 pt-0.5">
              <p className="text-xs text-foreground">
                <span className="font-mono text-primary mr-2">{fmtTime(e.at)}</span>
                {e.label}
              </p>
              {!compact && e.detail && <p className="text-[10px] text-muted-foreground">{e.detail}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
