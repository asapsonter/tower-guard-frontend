import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Pause, Play, RotateCcw, SkipBack, SkipForward } from "lucide-react";
import type { CameraView } from "@/components/dashboard/surveillance/scene";
import { fmtTime, type Camera, type Incident } from "@/lib/ops";
import { PlaybackCanvas, RadarPpi } from "./PlaybackCanvas";

/** Scene second at which the simulated intruder starts its approach. */
const SCENE_APPROACH = 18;
/** Scene base: any whole number of 48 s cycles. */
const SCENE_BASE = 48 * 500;
const SPEEDS = [1, 4, 16, 64];

/** Maps incident-relative seconds onto the simulated scene: intrusion first, then a quiet compound. */
function sceneFor(t: number): number {
  const rel = t < 22 ? SCENE_APPROACH + t : 40 + ((t - 22) % 26);
  return SCENE_BASE + rel;
}

function fmtRel(t: number) {
  const sign = t < 0 ? "−" : "+";
  const s = Math.abs(Math.round(t));
  return `T${sign}${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

interface Props { incident: Incident | null; cameras: Camera[] }

/** Event playback: scrubber over the incident timeline driving a 2×2 multi-camera grid on one shared clock. */
export function EventPlayback({ incident, cameras }: Props) {
  const t0 = incident ? new Date(incident.detectedAt).getTime() : Date.now() - 60_000;
  const events = useMemo(() => (incident?.timeline ?? [])
    .map((e) => ({ ...e, off: (new Date(e.at).getTime() - t0) / 1000 }))
    .sort((a, b) => a.off - b.off), [incident, t0]);
  const fullEnd = Math.max(40, (events.length ? events[events.length - 1].off : 30) + 30);
  const [range, setRange] = useState<"window" | "full">("window");
  const [lo, hi] = range === "window" ? [-20, 40] : [-20, fullEnd];

  const [t, setT] = useState(-5);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);

  useEffect(() => { setT(-5); setRange("window"); setPlaying(true); }, [incident?.id]);

  useEffect(() => {
    if (!playing) return;
    const step = 1 / 15;
    const id = setInterval(() => setT((x) => Math.min(hi, x + step * speed)), step * 1000);
    return () => clearInterval(id);
  }, [playing, speed, hi]);
  useEffect(() => { if (t >= hi) setPlaying(false); }, [t, hi]);

  const seek = (x: number) => {
    if (x > 40 && range === "window") setRange("full");
    setT(x);
  };

  const tiles = useMemo(() => cameras.slice(0, 4).map((c) => ({ cam: c, view: { ...c.view, drift: 30 } as CameraView })), [cameras]);

  const sceneSec = sceneFor(t);
  const current = [...events].reverse().find((e) => e.off <= t);
  const pct = (x: number) => ((x - lo) / (hi - lo)) * 100;
  const prevEvent = [...events].reverse().find((e) => e.off < t - 0.5);
  const nextEvent = events.find((e) => e.off > t + 0.5);

  return (
    <div className="grid grid-cols-12 gap-3">
      <div className="col-span-12 lg:col-span-8 space-y-2">
        <div className="grid grid-cols-2 gap-1.5">
          {tiles.map(({ cam, view }) => (
            <div key={cam.id} className="relative overflow-hidden rounded border border-primary/20 bg-black">
              {cam.online ? <PlaybackCanvas view={view} sceneSec={sceneSec} /> : (
                <div className="aspect-video flex items-center justify-center font-mono text-[10px] tracking-[0.3em] text-destructive">NO RECORDING</div>
              )}
              <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center gap-1.5 bg-gradient-to-b from-black/70 to-transparent px-1.5 py-0.5 font-mono text-[8px] text-white/85">
                <span className="text-primary font-bold">▶ PLAYBACK</span>
                <span className="truncate">{cam.label}</span>
              </div>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 flex bg-gradient-to-t from-black/70 to-transparent px-1.5 py-0.5 font-mono text-[8px] text-white/85">
                <span>{fmtTime(new Date(t0 + t * 1000).toISOString())}</span>
                <span className="ml-auto">{fmtRel(t)}</span>
              </div>
            </div>
          ))}
          {tiles.length < 4 && (
            <div className="relative overflow-hidden rounded border border-primary/20 bg-black">
              <RadarPpi sceneSec={sceneSec} />
              <div className="pointer-events-none absolute inset-x-0 top-0 px-1.5 py-0.5 font-mono text-[8px] text-white/85 bg-gradient-to-b from-black/70 to-transparent">
                <span className="text-primary font-bold">▶ PLAYBACK</span> mmWave radar · PPI
              </div>
            </div>
          )}
        </div>

        {/* transport */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button onClick={() => prevEvent && seek(prevEvent.off)} className="rounded border border-primary/25 p-1 text-primary hover:bg-primary/15" aria-label="Previous event"><SkipBack className="h-3.5 w-3.5" /></button>
          <button onClick={() => { if (t >= hi) setT(lo); setPlaying((p) => !p); }} className="rounded border border-primary/40 bg-primary/15 p-1 text-primary hover:bg-primary/25" aria-label={playing ? "Pause" : "Play"}>
            {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          </button>
          <button onClick={() => nextEvent && seek(nextEvent.off)} className="rounded border border-primary/25 p-1 text-primary hover:bg-primary/15" aria-label="Next event"><SkipForward className="h-3.5 w-3.5" /></button>
          <button onClick={() => { setT(-5); setPlaying(true); }} className="rounded border border-primary/25 p-1 text-primary hover:bg-primary/15" aria-label="Restart"><RotateCcw className="h-3.5 w-3.5" /></button>
          <span className="font-mono text-[12px] font-bold text-foreground tabular-nums">{fmtRel(t)}</span>
          <div className="ml-auto flex rounded-md border border-primary/20 overflow-hidden">
            {SPEEDS.map((s) => (
              <button key={s} onClick={() => setSpeed(s)} className={`px-1.5 py-0.5 font-mono text-[10px] ${speed === s ? "bg-primary/25 text-primary" : "text-muted-foreground hover:text-foreground"}`}>{s}×</button>
            ))}
          </div>
          <div className="flex rounded-md border border-primary/20 overflow-hidden">
            {(["window", "full"] as const).map((r) => (
              <button key={r} onClick={() => { setRange(r); if (r === "window" && t > 40) setT(-5); }}
                className={`px-1.5 py-0.5 text-[10px] ${range === r ? "bg-primary/25 text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                {r === "window" ? "Detection window" : "Full incident"}
              </button>
            ))}
          </div>
        </div>

        {/* scrubber */}
        <div className="relative pt-4">
          {events.filter((e) => e.off >= lo && e.off <= hi).map((e, i) => (
            <button key={`${e.at}-${i}`} title={`${fmtRel(e.off)} · ${e.label}`} onClick={() => seek(e.off)}
              className={`absolute top-0 h-3 w-1 -translate-x-1/2 rounded-sm ${current === e ? "bg-primary" : "bg-warning/80 hover:bg-primary"}`}
              style={{ left: `${pct(e.off)}%` }} />
          ))}
          <input type="range" min={lo} max={hi} step={0.1} value={Math.min(hi, Math.max(lo, t))}
            onChange={(e) => { setPlaying(false); setT(Number(e.target.value)); }}
            className="w-full accent-[hsl(var(--primary))]" aria-label="Playback position" />
          <div className="flex justify-between font-mono text-[9px] text-muted-foreground"><span>{fmtRel(lo)}</span><span>{fmtRel(0)} detection</span><span>{fmtRel(hi)}</span></div>
        </div>
        <p className="text-[10px] text-muted-foreground">One shared clock drives every tile — all cameras show the same instant. Frames are a simulated reconstruction synchronised to the incident timeline.</p>
      </div>

      <div className="col-span-12 lg:col-span-4 min-w-0">
        <p className="mb-1 text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
          {incident ? <>Timeline · <Link to={`/incidents/${incident.id}`} className="text-primary hover:underline font-mono">{incident.id}</Link></> : "No incident recorded at this site"}
        </p>
        <ol className="max-h-[420px] overflow-y-auto space-y-0.5">
          {events.map((e, i) => {
            const isCur = current === e;
            return (
              <li key={`${e.at}-${i}`}>
                <button onClick={() => seek(e.off)}
                  className={`w-full rounded px-2 py-1 text-left transition-colors ${isCur ? "bg-primary/15 border-l-2 border-primary" : e.off <= t ? "border-l-2 border-primary/30 hover:bg-primary/5" : "border-l-2 border-transparent opacity-60 hover:bg-primary/5"}`}>
                  <p className="text-[11px] text-foreground"><span className="font-mono text-primary mr-1.5">{fmtRel(e.off)}</span>{e.label}</p>
                  {e.detail && <p className="text-[10px] text-muted-foreground truncate">{e.detail}</p>}
                </button>
              </li>
            );
          })}
          {!events.length && <li className="text-[11px] text-muted-foreground px-2">Showing the last 60 s of the rolling buffer.</li>}
        </ol>
      </div>
    </div>
  );
}
