import { useState, useEffect } from "react";
import { Video, Maximize2, MinimizeIcon } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5050";

interface CameraConfig {
  id: string;
  label: string;
  streamUrl: string;
}

const CAMERAS: CameraConfig[] = [
  // Original camera_1 feed (raw RTSP)
  // {
  //   id: "camera_1",
  //   label: "CAM-01",
  //   streamUrl: `${API_BASE_URL}/stream/live/camera_1`,
  // },
  // YOLO Segmentation feed
  // {
  //   id: "camera_1",
  //   label: "CAM-01 — YOLO Segmentation",
  //   streamUrl: `${API_BASE_URL}/stream/yolo/camera_1`,
  // },
  // Original camera_2 feed (ISAPI snapshot polling)
  // {
  //   id: "camera_2",
  //   label: "CAM-02",
  //   streamUrl: `${API_BASE_URL}/stream/live/camera_2`,
  // },
  // DeepStream AI single camera feed
  // {
  //   id: "camera_2",
  //   label: "CAM-02 — AI Detection",
  //   streamUrl: "http://192.168.0.108:5050/video_feed/1",
  // },
  {
    id: "combined",
    label: "AI Detection — Combined Feed",
    streamUrl: `${API_BASE_URL}/stream/deepstream/combined`,
  },
];

type StreamStatus = "loading" | "ok" | "error";

const CameraPanel = ({ camera, currentTime }: { camera: CameraConfig; currentTime: Date }) => {
  const [status, setStatus] = useState<StreamStatus>("loading");
  const [retryKey, setRetryKey] = useState(0);

  const retry = () => {
    setStatus("loading");
    setRetryKey((k) => k + 1);
  };

  return (
    <div className="relative flex-1 bg-black overflow-hidden">
      {/* Loading spinner */}
      {status === "loading" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-20">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-[10px] text-muted-foreground font-mono">Connecting…</span>
        </div>
      )}

      {/* Error state */}
      {status === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 z-20">
          <Video className="h-8 w-8 text-destructive opacity-60" />
          <span className="text-[10px] text-destructive font-mono">Stream unavailable</span>
          <button
            onClick={retry}
            className="mt-1 px-3 py-1 bg-primary/20 text-primary text-[10px] font-semibold rounded hover:bg-primary/30 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* MJPEG stream — display:block removes inline gap, width:100% sizes to container */}
      {status !== "error" && (
        <img
          key={`${camera.id}-${retryKey}`}
          src={camera.streamUrl}
          alt={`${camera.label} live feed`}
          className="block w-full h-auto"
          onLoad={() => setStatus("ok")}
          onError={() => setStatus("error")}
        />
      )}

      {/* Scanline effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="w-full h-px bg-primary/20 animate-scanline" />
      </div>

      {/* LIVE badge */}
      <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-destructive/90 px-2 py-0.5 rounded text-[10px] font-bold text-destructive-foreground z-10">
        <span className="h-1.5 w-1.5 rounded-full bg-destructive-foreground animate-blink" />
        LIVE
      </div>

      {/* Camera label */}
      <div className="absolute top-2 right-2 bg-background/70 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] font-mono text-foreground z-10">
        {camera.label}
      </div>

      {/* Timestamp + info */}
      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between z-10">
        <span className="text-[9px] font-mono text-foreground/80 bg-background/60 backdrop-blur-sm px-1.5 py-0.5 rounded">
          {camera.label} | {camera.id}
        </span>
        <span className="text-[9px] font-mono text-foreground/80 bg-background/60 backdrop-blur-sm px-1.5 py-0.5 rounded">
          {currentTime.toISOString().slice(0, 10)} {currentTime.toTimeString().slice(0, 8)}
        </span>
      </div>
    </div>
  );
};

const LiveVideoFeed = () => {
  const [expanded, setExpanded] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className={`glass-panel overflow-hidden flex flex-col ${expanded ? "fixed inset-4 z-50" : ""}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Video className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Live Surveillance Feed</span>
          <span className="text-[10px] font-mono bg-primary/10 text-primary px-2 py-0.5 rounded-full">
            {CAMERAS.length} cameras
          </span>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="p-1 rounded hover:bg-secondary transition-colors"
          title={expanded ? "Minimize" : "Expand"}
        >
          {expanded
            ? <MinimizeIcon className="h-4 w-4 text-muted-foreground" />
            : <Maximize2 className="h-4 w-4 text-muted-foreground" />
          }
        </button>
      </div>

      {/* Split-screen: two cameras side by side */}
      <div className="flex-1 flex flex-row divide-x divide-border/30">
        {CAMERAS.map((cam) => (
          <CameraPanel key={cam.id} camera={cam} currentTime={currentTime} />
        ))}
      </div>
    </div>
  );
};

export default LiveVideoFeed;
