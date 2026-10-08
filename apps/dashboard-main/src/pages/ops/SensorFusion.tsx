import { Link, useParams } from "react-router-dom";
import { Box, Cctv, Film, GitMerge, Layers, Loader2, Radar, Siren } from "lucide-react";
import { PageHeader, Panel } from "@/components/ops/Panel";
import { Pill } from "@/components/ops/Pill";
import { SITE_STATE_COLOR, SITE_STATE_LABEL, useOps, useSite, type Incident } from "@/lib/ops";
import { EventPlayback } from "./fusion/EventPlayback";
import { ConfidenceGauge, EvidenceStack, RawVsFused, VERDICT_COLOR } from "./fusion/FusionVerdict";
import { SensorBoard } from "./fusion/SensorBoard";
import { SitePicker } from "./fusion/SitePicker";
import { VideoWall } from "./fusion/VideoWall";

const FEATURED_INCIDENT = "INC-2026-10482";

export default function SensorFusion() {
  const { siteId: param } = useParams<{ siteId: string }>();
  const { snap, incident } = useOps();
  const siteId = param ?? incident(FEATURED_INCIDENT)?.siteId ?? snap?.sites[0]?.id;
  const { site, loading, error } = useSite(siteId);
  if (!snap) return null;

  const ready = site && site.id === siteId ? site : null;
  // The incident to replay & explain: the active one, else the most recent with a fusion record.
  const replay: Incident | null = ready
    ? (ready.activeIncidentId ? incident(ready.activeIncidentId) : undefined)
      ?? ready.incidentHistory.map((h) => incident(h.id)).find((i): i is Incident => !!i && i.fusion.signals.length > 0)
      ?? (ready.incidentHistory[0] ? incident(ready.incidentHistory[0].id) : undefined)
      ?? null
    : null;
  const fusion = ready?.fusion ?? (replay && replay.fusion.signals.length ? replay.fusion : null);
  const fusionIsLive = !!ready?.fusion;

  return (
    <>
      <PageHeader title="CCTV & Sensor Fusion" icon={GitMerge}
        subtitle="Not a VMS: video, radar, perimeter, cabinet, fuel and power sensors and access context fused into one explained threat verdict"
        actions={ready && (
          <>
            <Link to={`/sites/${ready.id}`} className="hud-chip hover:text-primary"><Box className="h-3 w-3" />Digital twin</Link>
            {ready.activeIncidentId && (
              <Link to={`/incidents/${ready.activeIncidentId}`} className="inline-flex items-center gap-1.5 rounded-md border border-destructive/50 bg-destructive/15 px-2.5 py-1 text-[11px] font-semibold text-destructive hover:bg-destructive/25">
                <Siren className="h-3.5 w-3.5 animate-pulse" />Incident room {ready.activeIncidentId}
              </Link>
            )}
          </>
        )} />

      <SitePicker sites={snap.sites} incidents={snap.incidents} currentId={siteId} />

      {!ready ? (
        <div className="glass-panel flex items-center gap-2 p-6 text-sm text-muted-foreground">
          {error && !loading ? <>Could not load site <span className="font-mono text-foreground">{siteId}</span> ({error}).</> : <><Loader2 className="h-4 w-4 animate-spin text-primary" />Loading sensor fusion for <span className="font-mono text-foreground">{siteId}</span>…</>}
        </div>
      ) : (
        <>
          <div className="glass-panel flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2.5">
            <span className="font-mono text-[14px] font-bold text-primary">{ready.id}</span>
            <span className="text-[12px] text-foreground">{ready.name}</span>
            <span className="text-[11px] text-muted-foreground">{ready.state} · {ready.siteClass} · {ready.tenants.join(", ")}</span>
            <Pill color={SITE_STATE_COLOR[ready.status]}>{SITE_STATE_LABEL[ready.status]}</Pill>
            <span className="ml-auto flex flex-wrap gap-1.5">
              <span className="hud-chip"><Cctv className="h-3 w-3" />{ready.cameras.filter((c) => c.online).length}/{ready.cameras.length} cameras</span>
              <span className="hud-chip"><Radar className="h-3 w-3" />{ready.sensors.length} sensors</span>
              <span className="hud-chip"><Layers className="h-3 w-3" />{ready.sensors.filter((s) => s.status === "triggered").length} triggered</span>
            </span>
          </div>

          <div className="grid grid-cols-12 gap-4">
            <Panel title="Live video · optical / thermal / PTZ" icon={Cctv} className="col-span-12 xl:col-span-8">
              <VideoWall key={ready.id} cameras={ready.cameras} />
            </Panel>

            <Panel title="Sensor fusion confidence" icon={GitMerge} className="col-span-12 xl:col-span-4"
              actions={fusion && !fusionIsLive && replay ? <span className="text-[10px] text-muted-foreground">last event · <span className="font-mono">{replay.id}</span></span> : undefined}>
              {fusion ? (
                <div className="space-y-3">
                  <ConfidenceGauge value={fusion.confidence} color={VERDICT_COLOR[fusion.verdict]} label={fusion.verdict} />
                  <EvidenceStack fusion={fusion} />
                  <p className="text-[10px] text-muted-foreground">
                    {fusion.signals.map((s) => s.finding).join(" / ")} → <span className="font-semibold" style={{ color: VERDICT_COLOR[fusion.verdict] }}>Threat confidence {fusion.confidence}% — {fusion.verdict}</span>
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <ConfidenceGauge value={0} color="#22c55e" label="No threat" />
                  <p className="text-[12px] text-muted-foreground text-center">All sensors nominal — nothing to fuse. ITIPS raises a verdict only when independent signals agree.</p>
                </div>
              )}
            </Panel>

            <Panel title="Event playback · synchronised multi-camera" icon={Film} className="col-span-12 xl:col-span-8">
              <EventPlayback incident={replay} cameras={ready.cameras} />
            </Panel>

            <Panel title="Why fusion" icon={Layers} className="col-span-12 xl:col-span-4">
              {fusion ? <RawVsFused fusion={fusion} /> : (
                <p className="text-[12px] text-muted-foreground">With no signals firing, an ordinary VMS and ITIPS look the same. The difference appears the moment several sensors fire: ITIPS explains them as one verdict instead of a stack of separate alarms.</p>
              )}
            </Panel>

            <Panel title="Sensor board" icon={Radar} className="col-span-12"
              actions={<span className="text-[10px] text-muted-foreground">mmWave · PIR · fence · door/gate · cabinet · battery · fuel · smoke · temperature · power</span>}>
              <SensorBoard sensors={ready.sensors} />
            </Panel>
          </div>
        </>
      )}
    </>
  );
}
