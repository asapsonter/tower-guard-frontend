import {
  Activity, BatteryWarning, DoorClosed, Flame, Fuel, Fence, Plug, Radar, ScanEye, Thermometer, Vibrate, type LucideIcon,
} from "lucide-react";
import { timeAgo, useNow, type Sensor, type SensorKind } from "@/lib/ops";

const ICON: Record<SensorKind, LucideIcon> = {
  mmwave_radar: Radar, pir: ScanEye, fence_vibration: Fence, door_contact: DoorClosed, gate_contact: DoorClosed,
  cabinet_vibration: Vibrate, battery_movement: BatteryWarning, fuel_level: Fuel, smoke: Flame, temperature: Thermometer, power: Plug,
};
export const SENSOR_STATUS_COLOR: Record<Sensor["status"], string> = { normal: "#22c55e", triggered: "#ef4444", fault: "#eab308", offline: "#64748b" };
const POINTS = 32;

function noise(seed: number, i: number) {
  const x = Math.sin(seed * 0.0001 + i * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function seedOf(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Rolling synthetic trace for a sensor (2 s buckets), shaped by its status. */
function series(s: Sensor, bucket: number): number[] {
  const seed = seedOf(s.id);
  return Array.from({ length: POINTS }, (_, i) => {
    const idx = bucket - POINTS + i;
    const n = noise(seed, idx);
    if (s.status === "offline") return 0;
    if (s.status === "fault") return n > 0.7 ? n : 0.05;
    if (s.status === "triggered" && i > POINTS - 9) return 0.65 + n * 0.35;
    if (s.kind === "temperature" || s.kind === "fuel_level" || s.kind === "power") return 0.45 + n * 0.1;
    return 0.08 + n * 0.14;
  });
}

function Sparkline({ values, color, dashed }: { values: number[]; color: string; dashed: boolean }) {
  const w = 120;
  const h = 26;
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * w},${h - 2 - v * (h - 4)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="h-6 w-full">
      <polyline points={`0,${h} ${pts} ${w},${h}`} fill={color} fillOpacity={0.12} stroke="none" />
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.4} strokeDasharray={dashed ? "3 3" : undefined} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/** Live board of every ITIPS sensor: status, reading and a short trace. */
export function SensorBoard({ sensors }: { sensors: Sensor[] }) {
  const now = useNow(2000);
  const bucket = Math.floor(now / 2000);
  if (!sensors.length) return <p className="text-[12px] text-muted-foreground">No sensors reported.</p>;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-2">
      {sensors.map((s) => {
        const Icon = ICON[s.kind] ?? Activity;
        const color = SENSOR_STATUS_COLOR[s.status];
        const hot = s.status === "triggered";
        return (
          <div key={s.id} className={`rounded-md border px-2.5 py-2 ${hot ? "bg-destructive/10" : "bg-background/30"}`} style={{ borderColor: `${color}${hot ? "99" : "40"}` }}>
            <div className="flex items-center gap-1.5">
              <Icon className="h-3.5 w-3.5 shrink-0" style={{ color }} />
              <span className="truncate text-[12px] font-medium text-foreground">{s.label}</span>
              <span className={`ml-auto text-[9px] font-mono font-bold uppercase ${hot ? "animate-pulse" : ""}`} style={{ color }}>{s.status}</span>
            </div>
            <div className="mt-0.5 flex items-baseline gap-2">
              <span className="truncate font-mono text-[12px] tabular-nums" style={{ color: hot ? color : undefined }}>{s.reading}</span>
              <span className="ml-auto truncate text-[9px] text-muted-foreground">{s.zone}</span>
            </div>
            <Sparkline values={series(s, bucket)} color={color} dashed={s.status === "offline"} />
            <p className="text-[9px] text-muted-foreground">changed {timeAgo(s.lastChange, now)}</p>
          </div>
        );
      })}
    </div>
  );
}
