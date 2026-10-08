import { useState } from "react";
import { ChevronLeft, ChevronRight, Home, Thermometer, ZoomIn, ZoomOut } from "lucide-react";
import { FRAME_W, WORLD_W } from "@/components/dashboard/surveillance/scene";
import type { Camera } from "@/lib/ops";
import { CameraTile } from "../twin/CameraTile";

const PAN_MIN = 0;
const PAN_MAX = WORLD_W - FRAME_W;
const PRESETS: { label: string; panX: number; zoom: number }[] = [
  { label: "North fence", panX: 260, zoom: 1.6 },
  { label: "Tower base", panX: 520, zoom: 1.4 },
  { label: "Gate", panX: 620, zoom: 1.8 },
  { label: "Wide", panX: 320, zoom: 1 },
];

const btn = "flex h-7 w-7 items-center justify-center rounded border border-primary/25 bg-primary/10 text-primary hover:bg-primary/25 transition-colors";

/** PTZ camera with on-screen pan / zoom / preset controls driving the simulated feed. */
function PtzCamera({ camera, digital }: { camera: Camera; digital: boolean }) {
  const [ptz, setPtz] = useState<{ panX: number; zoom: number } | null>(null);
  const cur = ptz ?? { panX: camera.view.panX, zoom: camera.view.zoom };
  const set = (panX: number, zoom: number) => setPtz({ panX: Math.max(PAN_MIN, Math.min(PAN_MAX, panX)), zoom: Math.max(1, Math.min(3, zoom)) });

  return (
    <div className="space-y-1.5">
      <CameraTile camera={camera} fps={15} view={ptz ? { ...ptz, drift: 0 } : undefined} compact
        badge={<span className="rounded bg-primary/30 px-1 text-primary">{digital ? "ePTZ" : "PTZ"} {cur.zoom.toFixed(1)}×</span>} />
      <div className="flex flex-wrap items-center gap-1">
        <button className={btn} aria-label="Pan left" onClick={() => set(cur.panX - 60, cur.zoom)} disabled={!camera.online}><ChevronLeft className="h-4 w-4" /></button>
        <button className={btn} aria-label="Pan right" onClick={() => set(cur.panX + 60, cur.zoom)} disabled={!camera.online}><ChevronRight className="h-4 w-4" /></button>
        <button className={btn} aria-label="Zoom in" onClick={() => set(cur.panX, cur.zoom + 0.25)} disabled={!camera.online}><ZoomIn className="h-4 w-4" /></button>
        <button className={btn} aria-label="Zoom out" onClick={() => set(cur.panX, cur.zoom - 0.25)} disabled={!camera.online}><ZoomOut className="h-4 w-4" /></button>
        <button className={btn} aria-label="Home" onClick={() => setPtz(null)} disabled={!camera.online}><Home className="h-3.5 w-3.5" /></button>
        <span className="ml-1 font-mono text-[10px] text-muted-foreground tabular-nums">pan {Math.round(cur.panX)}</span>
      </div>
      <div className="flex flex-wrap gap-1">
        {PRESETS.map((p) => (
          <button key={p.label} onClick={() => set(p.panX, p.zoom)} disabled={!camera.online}
            className="rounded-full border border-primary/20 px-2 py-0.5 text-[10px] text-muted-foreground hover:border-primary/50 hover:text-primary disabled:opacity-40">
            {p.label}
          </button>
        ))}
      </div>
      {digital && <p className="text-[10px] text-muted-foreground">No mechanical PTZ at this site class — digital pan/zoom on the gate camera.</p>}
    </div>
  );
}

/** Live optical + thermal + PTZ video for one site. */
export function VideoWall({ cameras }: { cameras: Camera[] }) {
  const optical = cameras.find((c) => c.type === "optical") ?? cameras[0];
  const thermal = cameras.find((c) => c.type === "thermal");
  const ptzCam = cameras.find((c) => c.type === "ptz");
  const ePtz = !ptzCam ? cameras.filter((c) => c.type === "optical")[1] ?? optical : undefined;

  if (!optical) return <p className="text-[12px] text-muted-foreground">No cameras deployed at this site.</p>;

  return (
    <div className="grid grid-cols-12 gap-3">
      <div className="col-span-12 lg:col-span-8 space-y-1">
        <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Live optical · AI analytics</p>
        <CameraTile camera={optical} fps={20} />
      </div>
      <div className="col-span-12 lg:col-span-4 space-y-3">
        <div className="space-y-1">
          <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Thermal</p>
          {thermal ? (
            <CameraTile camera={thermal} fps={12} compact />
          ) : (
            <div className="flex aspect-video items-center justify-center gap-2 rounded-md border border-dashed border-primary/20 text-[11px] text-muted-foreground">
              <Thermometer className="h-4 w-4" />Thermal not deployed at this site
            </div>
          )}
        </div>
        <div className="space-y-1">
          <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground">PTZ control</p>
          <PtzCamera key={(ptzCam ?? ePtz ?? optical).id} camera={ptzCam ?? ePtz ?? optical} digital={!ptzCam} />
        </div>
      </div>
    </div>
  );
}
