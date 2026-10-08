import { Marker, Polyline, Tooltip } from "react-leaflet";
import { useNavigate } from "react-router-dom";
import { OpsMap, dotIcon } from "@/components/ops/OpsMap";
import { INCIDENT_TYPE_LABEL, fmtDate, type Incident } from "@/lib/ops";
import { OUTCOME_COLOR } from "./campaignUtils";

/** Campaign progression: incidents numbered in time order, joined by a progression line. */
export function CampaignMap({ incidents, direction, height = 380 }: { incidents: Incident[]; direction?: string; height?: number }) {
  const navigate = useNavigate();
  const ordered = [...incidents].sort((a, b) => a.detectedAt.localeCompare(b.detectedAt));
  const pts = ordered.map((i) => i.location);
  return (
    <OpsMap height={height} fitTo={pts} defaultTiles="dark"
      overlay={(
        <div className="absolute bottom-2 left-2 z-[500] rounded-md border border-primary/25 bg-card/85 px-2 py-1.5 text-[10px] backdrop-blur">
          <p className="text-muted-foreground">1 → {ordered.length}: progression in time order</p>
          {direction && <p className="text-primary font-semibold">Direction: {direction}</p>}
        </div>
      )}>
      {pts.length > 1 && <Polyline positions={pts.map((p) => [p.lat, p.lng])} pathOptions={{ color: "#06b6d4", weight: 2, dashArray: "6 6", opacity: 0.9 }} />}
      {ordered.map((inc, idx) => (
        <Marker key={inc.id} position={[inc.location.lat, inc.location.lng]}
          icon={dotIcon(OUTCOME_COLOR[inc.outcome], { size: idx === ordered.length - 1 ? 16 : 12, pulse: idx === ordered.length - 1, label: String(idx + 1) })}
          eventHandlers={{ click: () => navigate(`/incidents/${inc.id}`) }}>
          <Tooltip className="cnii-tip">
            <b>{idx + 1}. {inc.id}</b><br />{inc.siteId} · {inc.siteName}<br />{INCIDENT_TYPE_LABEL[inc.type]} · {fmtDate(inc.detectedAt)}
          </Tooltip>
        </Marker>
      ))}
    </OpsMap>
  );
}
