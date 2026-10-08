import type { ReactNode } from "react";
import { VideoOff } from "lucide-react";
import SimulatedCamera from "@/components/dashboard/surveillance/SimulatedCamera";
import type { CameraView } from "@/components/dashboard/surveillance/scene";
import { useNow, type Camera } from "@/lib/ops";

const TYPE_LABEL: Record<Camera["type"], string> = { optical: "OPTICAL", thermal: "THERMAL", ptz: "PTZ" };

/** Lagos-time CCTV timestamp, isolated so only the overlay re-renders each second. */
function Stamp() {
  const now = useNow(1000);
  const d = new Date(now);
  const date = d.toLocaleDateString("en-CA", { timeZone: "Africa/Lagos" });
  const time = d.toLocaleTimeString("en-GB", { timeZone: "Africa/Lagos", hour12: false });
  return <span>{date} {time} WAT</span>;
}

interface CameraTileProps {
  camera: Camera;
  /** Overrides on top of the camera's own framing (PTZ control, mode switch) */
  view?: Partial<CameraView>;
  fps?: number;
  showAnalytics?: boolean;
  /** Extra overlay content, top-right */
  badge?: ReactNode;
  className?: string;
  compact?: boolean;
}

/** One live CCTV tile: simulated feed + REC / label / timestamp overlay, or NO SIGNAL when offline. */
export function CameraTile({ camera, view, fps = 12, showAnalytics = true, badge, className = "", compact = false }: CameraTileProps) {
  const fullView: CameraView = { ...camera.view, drift: 40, ...view };
  const text = compact ? "text-[8px]" : "text-[10px]";
  return (
    <div className={`relative overflow-hidden rounded-md border border-primary/20 bg-black ${className}`}>
      {camera.online ? (
        <SimulatedCamera view={fullView} fps={fps} showAnalytics={showAnalytics} />
      ) : (
        <div className="aspect-video w-full flex flex-col items-center justify-center gap-1.5"
          style={{ backgroundImage: "repeating-linear-gradient(0deg, rgba(255,255,255,0.04) 0 1px, transparent 1px 3px)" }}>
          <VideoOff className={compact ? "h-5 w-5 text-muted-foreground" : "h-8 w-8 text-muted-foreground"} />
          <span className={`font-mono font-bold tracking-[0.3em] text-destructive ${compact ? "text-[10px]" : "text-sm"}`}>NO SIGNAL</span>
          <span className="font-mono text-[9px] text-muted-foreground">Last frame &gt; heartbeat timeout</span>
        </div>
      )}
      <div className={`pointer-events-none absolute inset-x-0 top-0 flex items-center gap-1.5 px-2 py-1 bg-gradient-to-b from-black/70 to-transparent font-mono ${text}`}>
        {camera.online ? (
          <span className="flex items-center gap-1 text-destructive font-bold"><span className="h-1.5 w-1.5 rounded-full bg-destructive animate-blink" />REC</span>
        ) : (
          <span className="text-muted-foreground font-bold">OFFLINE</span>
        )}
        <span className="text-white/90 truncate">{camera.label}</span>
        <span className="ml-auto flex items-center gap-1.5">
          {badge}
          <span className="rounded border border-white/25 px-1 text-white/80">{TYPE_LABEL[camera.type]}</span>
        </span>
      </div>
      <div className={`pointer-events-none absolute inset-x-0 bottom-0 flex items-center gap-2 px-2 py-1 bg-gradient-to-t from-black/70 to-transparent font-mono text-white/80 ${text}`}>
        <Stamp />
        <span className="ml-auto truncate">{camera.id}{camera.online ? ` · ${camera.fps}fps` : ""}</span>
      </div>
    </div>
  );
}
