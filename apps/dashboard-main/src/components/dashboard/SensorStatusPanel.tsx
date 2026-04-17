import { Wifi, Activity, Cpu, Zap, Signal, ShieldCheck, Fence, Eye, Video, Vibrate } from "lucide-react";
import type { Sensor, SensorStatus } from "@tower-guard/data";

const statusConfig: Record<"active" | "dead" | "unknown", { label: string; colorClass: string; dotClass: string }> = {
  active: { label: "Active", colorClass: "text-success", dotClass: "bg-success" },
  dead: { label: "Dead", colorClass: "text-destructive", dotClass: "bg-destructive" },
  unknown: { label: "Waiting", colorClass: "text-muted-foreground", dotClass: "bg-muted-foreground" },
};

const typeIcons: Record<string, typeof Activity> = {
  gate: ShieldCheck,
  generator: Zap,
  battery: Cpu,
  tower: Signal,
  fence: Fence,
  pir: Eye,
  vibration: Vibrate,
  camera: Video,
};

const SensorItem = ({ sensor }: { sensor: Sensor }) => {
  const isActive = sensor.status === "online";
  const isUnknown = sensor.status === "unknown";
  const displayStatus = isActive ? "active" : isUnknown ? "unknown" : "dead";
  const config = statusConfig[displayStatus];
  const Icon = typeIcons[sensor.type] || Activity;

  return (
    <div className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-secondary/50 transition-colors">
      <div className={`p-2 rounded-lg bg-secondary ${config.colorClass}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-foreground truncate">{sensor.name}</p>
        <p className="text-[10px] text-muted-foreground">Last: {sensor.lastSeen}</p>
      </div>
      <div className="flex items-center gap-2">
        <span className={`text-[10px] font-bold ${config.colorClass}`}>
          {config.label}
        </span>
        <span className={`h-2.5 w-2.5 rounded-full ${config.dotClass} ${!isActive && !isUnknown ? "animate-blink" : ""}`} />
      </div>
    </div>
  );
};

const SensorStatusPanel = ({ sensors }: { sensors: Sensor[] }) => {
  const activeCount = sensors.filter((s) => s.status === "online").length;

  return (
    <div className="glass-panel h-full flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Wifi className="h-4 w-4 text-success" />
          <span className="text-sm font-semibold text-foreground">Device Status</span>
        </div>
        <span className="text-[10px] font-mono bg-success/20 text-success px-2 py-0.5 rounded-full">
          {activeCount}/{sensors.length} ACTIVE
        </span>
      </div>
      <div className="flex-1 p-3 space-y-1 overflow-y-auto max-h-[320px]">
        {sensors.map((sensor) => (
          <SensorItem key={sensor.id} sensor={sensor} />
        ))}
      </div>
    </div>
  );
};

export default SensorStatusPanel;
