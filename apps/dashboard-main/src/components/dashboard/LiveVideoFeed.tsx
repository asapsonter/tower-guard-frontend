import { useState, useEffect } from "react";
import { Video, Maximize2, MinimizeIcon, Radio, Cpu, Crosshair, ShieldAlert, Activity } from "lucide-react";
import SimulatedCamera from "./surveillance/SimulatedCamera";
import { scenarioAt, type CameraView, type FeedMode, type ThreatPhase } from "./surveillance/scene";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5050";

// ── Real stream (backend MJPEG) ───────────────────────────────────────────

interface StreamConfig {
  id: string;
  label: string;
  streamUrl: string;
}

const LIVE_STREAM: StreamConfig = {
  id: "combined",
  label: "AI Detection — Combined Feed",
  streamUrl: `${API_BASE_URL}/stream/deepstream/combined`,
};

type StreamStatus = "loading" | "ok" | "error";

const LiveStreamPanel = ({ camera }: { camera: StreamConfig }) => {
  const [status, setStatus] = useState<StreamStatus>("loading");
  const [retryKey, setRetryKey] = useState(0);

  return (
    <div className="relative aspect-video bg-black overflow-hidden">
      {status === "loading" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-20">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-[10px] text-muted-foreground font-mono">Connecting…</span>
        </div>
      )}
      {status === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 z-20">
          <Video className="h-8 w-8 text-destructive opacity-60" />
          <span className="text-[10px] text-destructive font-mono">Stream unavailable</span>
          <button
            onClick={() => { setStatus("loading"); setRetryKey((k) => k + 1); }}
            className="mt-1 px-3 py-1 bg-primary/20 text-primary text-[10px] font-semibold rounded hover:bg-primary/30 transition-colors"
          >
            Retry
          </button>
        </div>
      )}
      {status !== "error" && (
        <img
          key={`${camera.id}-${retryKey}`}
          src={camera.streamUrl}
          alt={`${camera.label} live feed`}
          className="block w-full h-full object-contain"
          onLoad={() => setStatus("ok")}
          onError={() => setStatus("error")}
        />
      )}
    </div>
  );
};

// ── Simulated site cameras ────────────────────────────────────────────────

interface SimCamera {
  id: string;
  label: string;
  view: CameraView;
}

const SIM_CAMERAS: SimCamera[] = [
  { id: "CAM-01", label: "Perimeter · West Fence", view: { mode: "night", panX: 300, zoom: 1, drift: 60 } },
  { id: "CAM-02", label: "Thermal · Compound", view: { mode: "thermal", panX: 380, zoom: 1.2, drift: 40 } },
  { id: "CAM-03", label: "Mast & Shelter", view: { mode: "mono", panX: 600, zoom: 1.15, drift: 30 } },
];

const MODES: { id: FeedMode; label: string }[] = [
  { id: "night", label: "NIR" },
  { id: "thermal", label: "THERMAL" },
  { id: "mono", label: "MONO" },
];

const THREAT: Record<ThreatPhase, { label: string; level: number; tone: string }> = {
  clear: { label: "NOMINAL", level: 0.12, tone: "text-success" },
  approach: { label: "ELEVATED", level: 0.55, tone: "text-warning" },
  breach: { label: "CRITICAL", level: 0.97, tone: "text-destructive" },
  retreat: { label: "ELEVATED", level: 0.6, tone: "text-warning" },
};

const useClock = (ms: number) => {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return now;
};

const Telemetry = ({ icon: Icon, label, value, tone = "text-foreground" }: {
  icon: typeof Cpu; label: string; value: string; tone?: string;
}) => (
  <div className="flex items-center gap-2 min-w-0">
    <Icon className="h-3.5 w-3.5 text-primary/80 shrink-0" />
    <div className="min-w-0">
      <p className="text-[8px] uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className={`text-[11px] font-mono font-semibold truncate ${tone}`}>{value}</p>
    </div>
  </div>
);

const LiveVideoFeed = () => {
  const [expanded, setExpanded] = useState(false);
  const [source, setSource] = useState<"sim" | "live">("sim");
  const [activeId, setActiveId] = useState(SIM_CAMERAS[0].id);
  const [modeOverride, setModeOverride] = useState<Record<string, FeedMode>>({});
  const now = useClock(250);

  const scenario = scenarioAt(now.getTime() / 1000);
  const threat = THREAT[scenario.phase];
  const active = SIM_CAMERAS.find((c) => c.id === activeId) ?? SIM_CAMERAS[0];
  const viewFor = (c: SimCamera): CameraView => ({ ...c.view, mode: modeOverride[c.id] ?? c.view.mode });
  const activeMode = viewFor(active).mode;
  const tracked = scenario.intruder ? 2 : 1;
  const timestamp = `${now.toISOString().slice(0, 10)} ${now.toTimeString().slice(0, 8)}`;

  return (
    <div className={`glass-panel overflow-hidden flex flex-col ${expanded ? "fixed inset-4 z-50" : ""}`}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-primary/15">
        <div className="flex items-center gap-2">
          <Video className="h-4 w-4 text-primary" />
          <span className="font-display text-[12px] font-bold text-foreground text-glow">LIVE SURVEILLANCE</span>
          <span className="hud-chip">{source === "sim" ? `${SIM_CAMERAS.length} cams · sim` : "backend stream"}</span>
        </div>
        <div className="flex items-center gap-2">
          {source === "sim" && (
            <div className="flex rounded-md border border-primary/20 overflow-hidden">
              {MODES.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setModeOverride((o) => ({ ...o, [active.id]: m.id }))}
                  className={`px-2 py-1 text-[9px] font-mono font-semibold tracking-wider transition-colors ${
                    activeMode === m.id ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          )}
          <div className="flex rounded-md border border-primary/20 overflow-hidden">
            {(["sim", "live"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSource(s)}
                className={`px-2 py-1 text-[9px] font-mono font-semibold tracking-wider uppercase transition-colors ${
                  source === s ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1 rounded hover:bg-secondary transition-colors"
            title={expanded ? "Minimize" : "Expand"}
          >
            {expanded
              ? <MinimizeIcon className="h-4 w-4 text-muted-foreground" />
              : <Maximize2 className="h-4 w-4 text-muted-foreground" />}
          </button>
        </div>
      </div>

      {source === "live" ? (
        <LiveStreamPanel camera={LIVE_STREAM} />
      ) : (
        <div className={`flex-1 flex flex-col gap-2 p-2 ${expanded ? "overflow-y-auto" : ""}`}>
          {/* Main camera */}
          <div className={`relative overflow-hidden rounded-md border ${
            scenario.phase === "breach" ? "border-destructive/70 shadow-[0_0_30px_-6px_hsl(var(--destructive)/0.7)]" : "border-primary/20"
          }`}>
            <SimulatedCamera view={viewFor(active)} fps={24} />

            {/* Reticle */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <Crosshair className="h-8 w-8 text-primary/30" strokeWidth={1} />
            </div>

            {/* OSD — top */}
            <div className="absolute top-2 left-2 flex items-center gap-2 z-10">
              <span className="flex items-center gap-1.5 bg-destructive/90 px-2 py-0.5 rounded-sm text-[10px] font-bold text-destructive-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-destructive-foreground animate-blink" />
                REC
              </span>
              <span className="text-[10px] font-mono text-white/90 bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded-sm">
                {active.id} · {active.label}
              </span>
            </div>
            <div className="absolute top-2 right-2 z-10 text-right">
              <p className="text-[10px] font-mono text-white/90 bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded-sm">{timestamp}</p>
            </div>

            {/* Threat banner */}
            {scenario.phase !== "clear" && (
              <div className={`absolute top-9 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 px-3 py-1 rounded-sm border text-[10px] font-mono font-bold tracking-wider backdrop-blur-sm ${
                scenario.phase === "breach"
                  ? "bg-destructive/25 border-destructive text-red-200 animate-pulse"
                  : "bg-warning/20 border-warning/70 text-orange-100"
              }`}>
                <ShieldAlert className="h-3.5 w-3.5" />
                {scenario.phase === "breach"
                  ? "PERIMETER BREACH · ZONE 3 · RESPONDERS NOTIFIED"
                  : scenario.phase === "approach"
                    ? "MOTION · UNIDENTIFIED PERSON APPROACHING ZONE 3"
                    : "SUBJECT LEAVING ZONE 3 · TRACKING"}
              </div>
            )}

            {/* OSD — bottom */}
            <div className="absolute bottom-2 left-2 right-2 flex items-end justify-between z-10 text-[9px] font-mono text-white/80">
              <span className="bg-black/50 backdrop-blur-sm px-1.5 py-0.5 rounded-sm">
                PTZ AZ {(214 + Math.sin(now.getTime() / 8000) * 6).toFixed(1)}° · EL -12.0° · {activeMode.toUpperCase()}
              </span>
              <span className="bg-black/50 backdrop-blur-sm px-1.5 py-0.5 rounded-sm">H.265 · 1080p · 24fps · 4.2 Mbps</span>
            </div>
          </div>

          {/* Thumbnails */}
          <div className="grid grid-cols-3 gap-2">
            {SIM_CAMERAS.map((cam) => (
              <button
                key={cam.id}
                onClick={() => setActiveId(cam.id)}
                className={`relative overflow-hidden rounded-md border text-left transition-all ${
                  cam.id === active.id
                    ? "border-primary shadow-[0_0_16px_-4px_hsl(var(--primary)/0.8)]"
                    : "border-primary/15 opacity-70 hover:opacity-100"
                }`}
              >
                <SimulatedCamera view={viewFor(cam)} fps={8} />
                <span className="absolute bottom-1 left-1 text-[9px] font-mono text-white/90 bg-black/60 px-1.5 rounded-sm">
                  {cam.id}
                </span>
                {scenario.phase === "breach" && cam.id !== "CAM-03" && (
                  <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive animate-blink" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Analytics telemetry strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-4 py-2.5 border-t border-primary/15 bg-primary/[0.03]">
        <Telemetry icon={Cpu} label="AI Model" value="YOLOv8-seg · edge" />
        <Telemetry icon={Activity} label="Objects tracked" value={source === "sim" ? `${tracked} person${tracked > 1 ? "s" : ""}` : "—"} />
        <Telemetry icon={Radio} label="Link" value="38 ms · 99.9%" />
        <div className="min-w-0">
          <div className="flex items-center justify-between">
            <p className="text-[8px] uppercase tracking-[0.18em] text-muted-foreground">Threat level</p>
            <p className={`text-[10px] font-mono font-bold ${threat.tone}`}>{source === "sim" ? threat.label : "—"}</p>
          </div>
          <div className="mt-1 h-1.5 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-success via-warning to-destructive"
              style={{ width: `${(source === "sim" ? threat.level : 0) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveVideoFeed;
