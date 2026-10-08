import { useEffect, useRef } from "react";
import {
  FRAME_H, FRAME_W, drawDetections, drawZone, postProcess, renderFrame, scenarioAt, type CameraView,
} from "@/components/dashboard/surveillance/scene";

/**
 * Renders a single recorded frame of the simulated scene at `sceneSec`.
 * Several of these driven by the same clock give frame-synchronised playback.
 */
export function PlaybackCanvas({ view, sceneSec }: { view: CameraView; sceneSec: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (!ctx) return;
    const boxes = renderFrame(ctx, view, sceneSec);
    postProcess(ctx, view.mode, sceneSec, Math.floor(sceneSec * 12));
    drawZone(ctx, view, sceneSec, scenarioAt(sceneSec).phase === "breach");
    drawDetections(ctx, boxes, sceneSec);
  }, [view, sceneSec]);
  return <canvas ref={ref} width={FRAME_W} height={FRAME_H} className="block w-full h-auto aspect-video bg-black" />;
}

/** Synchronised radar PPI: sweep and intruder track at the same playback instant. */
export function RadarPpi({ sceneSec }: { sceneSec: number }) {
  const sc = scenarioAt(sceneSec);
  const sweep = (sceneSec * 90) % 360;
  const rad = (d: number) => (d - 90) * (Math.PI / 180);
  // map intruder world-x (-80 … 560 at the fence) to range (fence = 30% radius)
  const blip = sc.intruder
    ? (() => {
      const k = Math.max(0, Math.min(1, (sc.intruder.x + 80) / 640));
      const r = 92 - k * 62;
      const a = rad(-20 + k * 10);
      return { x: 100 + Math.cos(a) * r, y: 100 + Math.sin(a) * r };
    })()
    : null;
  return (
    <div className="relative aspect-video w-full bg-black flex items-center justify-center">
      <svg viewBox="0 0 200 200" className="h-full">
        {[30, 60, 92].map((r) => <circle key={r} cx={100} cy={100} r={r} fill="none" stroke="#22d3ee" strokeOpacity={0.25} />)}
        <line x1={100} y1={8} x2={100} y2={192} stroke="#22d3ee" strokeOpacity={0.15} />
        <line x1={8} y1={100} x2={192} y2={100} stroke="#22d3ee" strokeOpacity={0.15} />
        <circle cx={100} cy={100} r={30} fill="#22d3ee" fillOpacity={0.05} />
        <text x={104} y={74} fontSize={7} fill="#22d3ee" fillOpacity={0.6} fontFamily="monospace">FENCE</text>
        <line x1={100} y1={100} x2={100 + Math.cos(rad(sweep)) * 92} y2={100 + Math.sin(rad(sweep)) * 92} stroke="#22d3ee" strokeWidth={1.5} strokeOpacity={0.8} />
        {blip && (
          <g>
            <circle cx={blip.x} cy={blip.y} r={4} fill="#ef4444" />
            <circle cx={blip.x + 6} cy={blip.y + 3} r={3} fill="#ef4444" fillOpacity={0.7} />
            <text x={blip.x + 8} y={blip.y - 6} fontSize={7} fill="#ef4444" fontFamily="monospace">2 TRK</text>
          </g>
        )}
      </svg>
    </div>
  );
}
