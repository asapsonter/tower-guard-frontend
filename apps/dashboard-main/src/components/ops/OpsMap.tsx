import { useEffect, useState, type ReactNode } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import type { GeoPoint } from "@/lib/ops";

// Esri tiles need no API key (CARTO's basemaps now return "API key required" tiles)
const TILES = {
  dark: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
    labels: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}",
    attribution: "&copy; Esri",
    maxNativeZoom: 16,
  },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    labels: "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
    attribution: "Imagery &copy; Esri",
    maxNativeZoom: 18,
  },
} as const;
export type TileKey = keyof typeof TILES;

export const NIGERIA_CENTER: GeoPoint = { lat: 9.08, lng: 8.2 };

interface OpsMapProps {
  center?: GeoPoint;
  zoom?: number;
  height?: number | string;
  /** Fit the view to these points whenever the list changes */
  fitTo?: GeoPoint[];
  children?: ReactNode;
  /** Extra overlay rendered above the map (legends, layer toggles) */
  overlay?: ReactNode;
  defaultTiles?: TileKey;
}

/** Leaflet map with the HUD styling and a dark/satellite toggle. */
export function OpsMap({ center = NIGERIA_CENTER, zoom = 6, height = 420, fitTo, children, overlay, defaultTiles = "satellite" }: OpsMapProps) {
  const [tiles, setTiles] = useState<TileKey>(defaultTiles);
  return (
    <div className="relative rounded-md overflow-hidden border border-primary/15" style={{ height }}>
      <MapContainer center={[center.lat, center.lng]} zoom={zoom} zoomControl={false} className="h-full w-full z-0" style={{ background: "#05080f" }} preferCanvas>
        <TileLayer key={tiles} url={TILES[tiles].url} attribution={TILES[tiles].attribution} maxNativeZoom={TILES[tiles].maxNativeZoom} maxZoom={18} className={tiles === "satellite" ? "tg-satellite-tiles" : undefined} />
        <TileLayer key={`${tiles}-labels`} url={TILES[tiles].labels} maxNativeZoom={TILES[tiles].maxNativeZoom} maxZoom={18} opacity={0.85} />
        {fitTo && <FitBounds points={fitTo} />}
        {children}
      </MapContainer>
      <div className="absolute top-2 right-2 z-[500] flex rounded-md border border-primary/25 overflow-hidden bg-card/80 backdrop-blur">
        {(Object.keys(TILES) as TileKey[]).map((k) => (
          <button key={k} onClick={() => setTiles(k)} className={`px-2 py-1 text-[9px] font-mono uppercase tracking-wider ${tiles === k ? "bg-primary/25 text-primary" : "text-muted-foreground hover:text-foreground"}`}>
            {k}
          </button>
        ))}
      </div>
      {overlay}
    </div>
  );
}

function FitBounds({ points }: { points: GeoPoint[] }) {
  const map = useMap();
  const key = points.map((p) => `${p.lat.toFixed(3)},${p.lng.toFixed(3)}`).join("|");
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) { map.setView([points[0].lat, points[0].lng], 13); return; }
    map.fitBounds(L.latLngBounds(points.map((p) => [p.lat, p.lng])), { padding: [30, 30], maxZoom: 13 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, map]);
  return null;
}

/**
 * HTML marker icon: a glowing dot, optionally pulsing, optionally with a
 * short text label (e.g. unit callsign). Use with react-leaflet <Marker icon={…}>.
 */
export function dotIcon(color: string, opts: { size?: number; pulse?: boolean; label?: string; shape?: "dot" | "square" | "diamond" } = {}) {
  const size = opts.size ?? 12;
  const shape = opts.shape ?? "dot";
  const radius = shape === "dot" ? "50%" : "2px";
  const rotate = shape === "diamond" ? "transform: rotate(45deg);" : "";
  const label = opts.label ? `<span class="cnii-marker-label">${opts.label}</span>` : "";
  const ring = opts.pulse ? `<span class="cnii-marker-ring" style="border-color:${color};border-radius:${radius}"></span>` : "";
  return L.divIcon({
    className: "cnii-marker-wrap",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `<span class="cnii-marker" style="width:${size}px;height:${size}px">${ring}<span class="cnii-marker-dot" style="background:${color};box-shadow:0 0 10px ${color};border-radius:${radius};${rotate}"></span>${label}</span>`,
  });
}
