import { useState } from "react";
import { Link } from "react-router-dom";
import { Video, VideoOff } from "lucide-react";
import { Panel } from "@/components/ops/Panel";
import SimulatedCamera from "@/components/dashboard/surveillance/SimulatedCamera";
import { useNow, useSite, type Camera } from "@/lib/ops";

function Stamp() {
  const now = new Date(useNow());
  return <>{now.toLocaleString("en-GB", { timeZone: "Africa/Lagos", hour12: false })} WAT</>;
}

function Offline({ cam }: { cam: Camera }) {
  return (
    <div className="aspect-video bg-black/80 flex flex-col items-center justify-center gap-1 text-muted-foreground">
      <VideoOff className="h-6 w-6 text-destructive/70" />
      <span className="font-mono text-[10px]">{cam.id} · NO SIGNAL</span>
    </div>
  );
}

/** Live cameras for the incident site (simulated CCTV from the site's Digital Twin). */
export function CameraWall({ siteId, live }: { siteId: string; live: boolean }) {
  const { site, loading, error } = useSite(siteId);
  const [activeId, setActiveId] = useState<string | null>(null);
  const cams = site?.cameras ?? [];
  const active = cams.find((c) => c.id === activeId) ?? cams.find((c) => c.online) ?? cams[0];

  return (
    <Panel title="Live cameras" icon={Video} bodyClassName="p-2"
      actions={<>
        <span className="hud-chip">{cams.filter((c) => c.online).length}/{cams.length} online</span>
        <Link to={`/sites/${siteId}`} className="text-[10px] text-primary hover:underline">Digital twin →</Link>
      </>}>
      {loading && !site ? (
        <div className="aspect-video flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
          <span className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" /> Connecting to site VMS…
        </div>
      ) : error || !active ? (
        <div className="aspect-video flex items-center justify-center text-[11px] text-muted-foreground">{error ?? "No cameras registered at this site."}</div>
      ) : (
        <div className="space-y-2">
          <div className={`relative overflow-hidden rounded-md border ${live ? "border-destructive/60" : "border-primary/20"}`}>
            {active.online ? <SimulatedCamera view={{ ...active.view, drift: 40 }} fps={20} /> : <Offline cam={active} />}
            <div className="absolute top-2 left-2 flex items-center gap-2 z-10">
              <span className="flex items-center gap-1.5 bg-destructive/90 px-2 py-0.5 rounded-sm text-[10px] font-bold text-destructive-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-destructive-foreground animate-blink" /> REC
              </span>
              <span className="text-[10px] font-mono text-white/90 bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded-sm truncate max-w-[60%]">
                {active.id} · {active.label}
              </span>
            </div>
            <span className="absolute top-2 right-2 z-10 text-[10px] font-mono text-white/90 bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded-sm"><Stamp /></span>
            <span className="absolute bottom-2 right-2 z-10 text-[9px] font-mono text-white/80 bg-black/50 px-1.5 py-0.5 rounded-sm">
              {active.type.toUpperCase()} · {active.fps}fps · {(active.bitrateKbps / 1000).toFixed(1)} Mbps
            </span>
          </div>
          {cams.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {cams.slice(0, 4).map((c) => (
                <button key={c.id} onClick={() => setActiveId(c.id)}
                  className={`relative overflow-hidden rounded border text-left ${c.id === active.id ? "border-primary shadow-[0_0_14px_-4px_hsl(var(--primary)/0.8)]" : "border-primary/15 opacity-70 hover:opacity-100"}`}>
                  {c.online ? <SimulatedCamera view={{ ...c.view, drift: 40 }} fps={6} showAnalytics={false} /> : <Offline cam={c} />}
                  <span className="absolute bottom-0.5 left-0.5 text-[8px] font-mono text-white/90 bg-black/60 px-1 rounded-sm">{c.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </Panel>
  );
}
