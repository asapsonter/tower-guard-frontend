import { useEffect, useRef } from "react";
import {
  FRAME_H,
  FRAME_W,
  drawDetections,
  drawZone,
  postProcess,
  renderFrame,
  scenarioAt,
  type CameraView,
} from "./scene";

interface SimulatedCameraProps {
  view: CameraView;
  /** Target frame rate; thumbnails run slower to save CPU. */
  fps?: number;
  showAnalytics?: boolean;
  className?: string;
}

/**
 * Canvas-rendered stand-in for a CCTV stream. Renders only while on screen.
 */
const SimulatedCamera = ({ view, fps = 24, showAnalytics = true, className }: SimulatedCameraProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewRef = useRef(view);
  viewRef.current = view;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let last = 0;
    let frame = 0;
    let visible = true;
    const interval = 1000 / fps;

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    io.observe(canvas);

    const tick = (ts: number) => {
      raf = requestAnimationFrame(tick);
      if (!visible || ts - last < interval) return;
      last = ts;
      frame++;
      const now = Date.now() / 1000;
      const v = viewRef.current;
      const boxes = renderFrame(ctx, v, now);
      postProcess(ctx, v.mode, now, frame);
      if (showAnalytics) {
        const alert = scenarioAt(now).phase === "breach";
        drawZone(ctx, v, now, alert);
        drawDetections(ctx, boxes, now);
      }
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, [fps, showAnalytics]);

  return (
    <canvas
      ref={canvasRef}
      width={FRAME_W}
      height={FRAME_H}
      className={`block w-full h-auto aspect-video bg-black ${className ?? ""}`}
    />
  );
};

export default SimulatedCamera;
