import { useMemo, useState } from "react";
import { CircleMarker, Marker, Polyline, Tooltip } from "react-leaflet";
import type { GeoPoint, Incident, StolenAsset } from "@/lib/cnii";
import { fmtDate, fmtNaira } from "@/lib/cnii";
import { CniiMap, dotIcon } from "@/components/cnii/CniiMap";
import { EQUIPMENT_LABEL, type MarketAgg } from "./insights";

type Layer = "flows" | "tracked" | "markets" | "missing";
const LAYERS: { key: Layer; label: string; color: string }[] = [
  { key: "flows", label: "Theft → recovery", color: "#22c55e" },
  { key: "tracked", label: "Live tracker", color: "#eab308" },
  { key: "markets", label: "Markets", color: "#ec4899" },
  { key: "missing", label: "Missing (theft site)", color: "#ef4444" },
];

export function RecoveryMap({ assets, incById, markets }: { assets: StolenAsset[]; incById: Map<string, Incident>; markets: MarketAgg[] }) {
  const [on, setOn] = useState<Set<Layer>>(new Set(["flows", "tracked", "markets"]));
  const toggle = (k: Layer) => setOn((s) => { const n = new Set(s); n.has(k) ? n.delete(k) : n.add(k); return n; });
  const located = useMemo(() => assets.map((a) => ({ a, site: incById.get(a.incidentId)?.location ?? null })).filter((x): x is { a: StolenAsset; site: GeoPoint } => !!x.site), [assets, incById]);
  const fit = useMemo(() => [...located.map((x) => x.site), ...markets.map((m) => m.location)], [located, markets]);
  const maxRec = Math.max(1, ...markets.map((m) => m.recovered));

  const overlay = (
    <div className="absolute bottom-2 left-2 z-[500] rounded-md border border-primary/25 bg-card/85 backdrop-blur px-2 py-1.5 space-y-1">
      {LAYERS.map((l) => (
        <label key={l.key} className="flex items-center gap-1.5 text-[10px] text-muted-foreground cursor-pointer">
          <input type="checkbox" checked={on.has(l.key)} onChange={() => toggle(l.key)} className="accent-[hsl(var(--primary))] h-3 w-3" />
          <span className="h-2 w-2 rounded-full" style={{ background: l.color }} /> {l.label}
        </label>
      ))}
    </div>
  );

  return (
    <CniiMap height={460} fitTo={fit} overlay={overlay}>
      {on.has("missing") && located.filter((x) => x.a.recoveryStatus === "missing").map(({ a, site }) => (
        <CircleMarker key={`m-${a.id}`} center={[site.lat, site.lng]} radius={3} pathOptions={{ color: "#ef4444", weight: 1, fillOpacity: 0.6 }}>
          <Tooltip className="cnii-tip">{EQUIPMENT_LABEL[a.equipmentType]} {a.serialNumber} · missing since {fmtDate(a.stolenAt)}</Tooltip>
        </CircleMarker>
      ))}
      {on.has("flows") && located.filter((x) => x.a.recoveryLocation).map(({ a, site }) => (
        <Polyline key={`f-${a.id}`} positions={[[site.lat, site.lng], [a.recoveryLocation!.location.lat, a.recoveryLocation!.location.lng]]}
          pathOptions={{ color: "#22c55e", weight: 1.2, opacity: 0.45 }}>
          <Tooltip className="cnii-tip" sticky>{EQUIPMENT_LABEL[a.equipmentType]} {a.serialNumber}: {a.siteName} → {a.recoveryLocation!.name}</Tooltip>
        </Polyline>
      ))}
      {on.has("flows") && located.filter((x) => x.a.recoveryLocation || x.a.recoveryStatus === "tracked").map(({ a, site }) => (
        <CircleMarker key={`s-${a.id}`} center={[site.lat, site.lng]} radius={3.5} pathOptions={{ color: "#f97316", weight: 1, fillOpacity: 0.8 }}>
          <Tooltip className="cnii-tip">Theft site · {a.siteName} ({a.operator})</Tooltip>
        </CircleMarker>
      ))}
      {on.has("tracked") && located.filter((x) => x.a.trackerLocation).map(({ a, site }) => (
        <Polyline key={`tl-${a.id}`} positions={[[site.lat, site.lng], [a.trackerLocation!.lat, a.trackerLocation!.lng]]} pathOptions={{ color: "#eab308", weight: 1.2, opacity: 0.55, dashArray: "4 4" }} />
      ))}
      {on.has("tracked") && located.filter((x) => x.a.trackerLocation).map(({ a }) => (
        <Marker key={`t-${a.id}`} position={[a.trackerLocation!.lat, a.trackerLocation!.lng]} icon={dotIcon("#eab308", { size: 10, pulse: true, shape: "diamond" })}>
          <Tooltip className="cnii-tip">
            <div className="text-[11px]">
              <p className="font-semibold">{EQUIPMENT_LABEL[a.equipmentType]} · {a.manufacturer}</p>
              <p className="font-mono">{a.serialNumber}</p>
              <p>Live tracker · from {a.siteName} · {fmtNaira(a.valueNaira)}</p>
            </div>
          </Tooltip>
        </Marker>
      ))}
      {on.has("markets") && markets.map((m) => (
        <CircleMarker key={`mk-${m.name}`} center={[m.location.lat, m.location.lng]} radius={7 + (m.recovered / maxRec) * 18}
          pathOptions={{ color: "#ec4899", weight: 1.5, fillColor: "#ec4899", fillOpacity: 0.22 }}>
          <Tooltip className="cnii-tip">
            <div className="text-[11px]">
              <p className="font-semibold">{m.name}</p>
              <p>{m.recovered} items recovered · {fmtNaira(m.value)}</p>
              <p>{m.dealers.size} receiving dealer(s) identified</p>
            </div>
          </Tooltip>
        </CircleMarker>
      ))}
    </CniiMap>
  );
}
