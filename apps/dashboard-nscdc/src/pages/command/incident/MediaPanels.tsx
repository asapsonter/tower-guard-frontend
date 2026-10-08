import { useState } from "react";
import { Link } from "react-router-dom";
import { Camera, Images, Lock, Video } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@tower-guard/ui";
import { Panel } from "@/components/cnii/Panel";
import { useNow, type Incident } from "@/lib/cnii";
import { cameraId } from "./roomUtils";

/** Approved live feed tile, or the "not approved" state. */
export function VideoFeedPanel({ inc }: { inc: Incident }) {
  const now = useNow();
  const cam = cameraId(inc);
  const still = inc.stillImages[0];
  const stamp = new Date(now).toLocaleString("en-GB", { timeZone: "Africa/Lagos", hour12: false });

  return (
    <Panel title="Live video feed" icon={Video} bodyClassName="p-3"
      actions={inc.videoFeedApproved ? <span className="hud-chip">Approved feed · {cam}</span> : <span className="hud-chip !text-warning !border-warning/40">Not approved</span>}>
      {inc.videoFeedApproved && still ? (
        <div className="relative aspect-video rounded-md overflow-hidden border border-primary/20 bg-black">
          <img src={still} alt={`Live feed ${cam}`} className="h-full w-full object-cover opacity-90 saturate-[0.8]" />
          <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(0deg,rgba(0,0,0,0.18)_0px,rgba(0,0,0,0.18)_1px,transparent_1px,transparent_3px)]" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-primary/20 to-transparent animate-scanline" />
          <div className="absolute top-2 left-2 flex items-center gap-1.5 rounded bg-black/60 px-1.5 py-0.5">
            <span className="h-2 w-2 rounded-full bg-destructive animate-blink" />
            <span className="font-mono text-[10px] font-bold text-destructive">REC</span>
          </div>
          <span className="absolute top-2 right-2 rounded bg-black/60 px-1.5 py-0.5 font-mono text-[10px] text-foreground tabular-nums">{stamp} WAT</span>
          <span className="absolute bottom-2 left-2 rounded bg-black/60 px-1.5 py-0.5 font-mono text-[10px] text-primary">Approved feed · {cam}</span>
          <span className="absolute bottom-2 right-2 rounded bg-black/60 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">{inc.siteId}</span>
        </div>
      ) : (
        <div className="aspect-video rounded-md border border-dashed border-warning/40 bg-warning/5 flex flex-col items-center justify-center gap-2 text-center px-6">
          <Lock className="h-6 w-6 text-warning" />
          <p className="text-[12px] font-semibold text-foreground">Feed not approved for NSCDC</p>
          <p className="text-[11px] text-muted-foreground">Live CCTV from {inc.operator} requires operator approval under the incident data-sharing protocol.</p>
          <button className="mt-1 rounded-md border border-warning/50 px-3 py-1 text-[11px] font-semibold text-warning hover:bg-warning/10">Request access</button>
        </div>
      )}
    </Panel>
  );
}

/** Still image gallery with click-to-enlarge. */
export function StillsPanel({ inc }: { inc: Incident }) {
  const [open, setOpen] = useState<string | null>(null);
  const cam = cameraId(inc);
  return (
    <Panel title="Still images" icon={Images} actions={<span className="hud-chip">{inc.stillImages.length}</span>} bodyClassName="p-3">
      {inc.stillImages.length === 0 ? (
        <p className="text-xs text-muted-foreground">No still images captured.</p>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {inc.stillImages.map((src, i) => (
            <button key={src} onClick={() => setOpen(src)} className="group relative aspect-video rounded overflow-hidden border border-primary/15 hover:border-primary/50">
              <img src={src} alt={`Still ${i + 1}`} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
              <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1 font-mono text-[9px] text-foreground">
                <Camera className="inline h-2.5 w-2.5 mr-0.5" />{cam} · #{i + 1}
              </span>
            </button>
          ))}
        </div>
      )}
      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="font-mono text-sm">{inc.id} · {cam}</DialogTitle>
            <DialogDescription>Still captured at {inc.siteName}. Evidential copies are held in the custody register.</DialogDescription>
          </DialogHeader>
          {open && <img src={open} alt="Enlarged still" className="w-full rounded-md border border-primary/20" />}
          <Link to={`/evidence?focus=${inc.id}`} className="text-[11px] text-primary hover:underline">Open evidence register →</Link>
        </DialogContent>
      </Dialog>
    </Panel>
  );
}
