import { Marker, Polyline, Tooltip } from "react-leaflet";
import { CniiMap, dotIcon } from "@/components/cnii/CniiMap";
import { SEVERITY_COLOR, UNIT_STATUS_COLOR, UNIT_STATUS_LABEL, type Incident, type ResponseUnit } from "@/lib/cnii";

/** Mini map: site, responding unit and the route between them. */
export function RoomMap({ inc, unit, height = 300 }: { inc: Incident; unit?: ResponseUnit; height?: number }) {
  const fit = [inc.location, ...(unit ? [unit.location] : []), ...inc.route];
  return (
    <CniiMap center={inc.location} zoom={13} height={height} fitTo={fit}
      overlay={
        <div className="absolute bottom-2 left-2 z-[500] rounded-md border border-primary/25 bg-card/85 backdrop-blur px-2 py-1.5 space-y-0.5 text-[10px] text-muted-foreground">
          <p className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: SEVERITY_COLOR[inc.severity] }} /> Incident site</p>
          {unit && <p className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm" style={{ background: UNIT_STATUS_COLOR[unit.status] }} /> {unit.callsign}</p>}
          {inc.route.length > 1 && <p className="flex items-center gap-1.5"><span className="w-4 border-t-2 border-dashed border-cyan-400" /> Route</p>}
        </div>
      }>
      {inc.route.length > 1 && (
        <Polyline positions={inc.route.map((p) => [p.lat, p.lng] as [number, number])} pathOptions={{ color: "#22d3ee", weight: 3, dashArray: "6 6", opacity: 0.9 }} />
      )}
      <Marker position={[inc.location.lat, inc.location.lng]} icon={dotIcon(SEVERITY_COLOR[inc.severity], { size: 16, pulse: true, label: inc.siteId })}>
        <Tooltip className="cnii-tip" direction="top">{inc.siteName}</Tooltip>
      </Marker>
      {unit && (
        <Marker position={[unit.location.lat, unit.location.lng]} icon={dotIcon(UNIT_STATUS_COLOR[unit.status], { size: 13, shape: "square", label: unit.callsign })}>
          <Tooltip className="cnii-tip" direction="top">{unit.callsign} · {UNIT_STATUS_LABEL[unit.status]}</Tooltip>
        </Marker>
      )}
    </CniiMap>
  );
}
