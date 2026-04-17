/**
 * NCC National Coverage — read-only Leaflet map showing all 380 masts.
 *
 * This is a simplified version of the Tower Guard Site Dashboard's map.
 * NCC regulators can browse masts, see status, and click into states
 * but cannot dispatch, arm/disarm, or modify anything.
 */
import { useState, useMemo, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Tooltip as LeafletTooltip, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin, Layers, Signal, Shield, AlertTriangle } from "lucide-react";
import {
  mockTelecomMasts,
  STATE_COORDS,
  TELECOM_PROVIDERS,
  type TelecomMast,
} from "@tower-guard/data";

// ── Tile providers ──
const TILES = {
  satellite: {
    label: "Satellite",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attr: "&copy; Esri",
  },
  dark: {
    label: "Dark",
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attr: "&copy; CARTO",
    tileSize: 512,
    zoomOffset: -1,
  },
  streets: {
    label: "Streets",
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    attr: "&copy; CARTO &copy; OSM",
    tileSize: 512,
    zoomOffset: -1,
  },
} as const;

type TileKey = keyof typeof TILES;

// ── Status colors ──
const STATUS = {
  critical: { fill: "#ef4444", glow: "rgba(239,68,68,0.6)" },
  alert:    { fill: "#f97316", glow: "rgba(249,115,22,0.6)" },
  secure:   { fill: "#22c55e", glow: "rgba(34,197,94,0.5)" },
} as const;

const makeDot = (status: keyof typeof STATUS, size: number) => {
  const c = STATUS[status];
  return L.divIcon({
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `<div style="
      width:${size}px;height:${size}px;border-radius:50%;
      background:${c.fill};border:2px solid #fff;
      box-shadow:0 0 0 1px rgba(0,0,0,0.4),0 0 10px ${c.glow};
    "></div>`,
  });
};

const BOUNDS: L.LatLngBoundsExpression = [[4.2, 2.7], [13.9, 14.7]];

// ── Fly on state select ──
const FlyController = ({ state }: { state: string | null }) => {
  const map = useMap();
  useEffect(() => {
    if (state) {
      const masts = mockTelecomMasts.filter(m => m.state === state);
      if (masts.length > 0) {
        const bounds = L.latLngBounds(masts.map(m => [m.lat, m.lng] as [number, number]));
        map.flyToBounds(bounds.pad(0.3), { duration: 0.8 });
        return;
      }
      const c = STATE_COORDS[state];
      if (c) map.flyTo([c.lat, c.lng], 8, { duration: 0.8 });
    } else {
      map.flyToBounds(BOUNDS, { duration: 0.8, padding: [20, 20] });
    }
  }, [state, map]);
  return null;
};

interface NationalCoverageProps {
  provider?: string | null;
  state?: string | null;
}

export default function NationalCoverage({ provider, state: stateFilter }: NationalCoverageProps) {
  const [tile, setTile] = useState<TileKey>("satellite");
  const [showTiles, setShowTiles] = useState(false);
  const [localState, setSelectedState] = useState<string | null>(null);

  // Global state filter takes precedence over local map state selection
  const effectiveState = stateFilter ?? localState;

  // Base mast set — filtered by provider when one is selected
  const baseMasts = useMemo(() => {
    let masts = mockTelecomMasts;
    if (provider) masts = masts.filter(m => m.providerShort === provider);
    return masts;
  }, [provider]);

  const visibleMasts = useMemo(
    () => effectiveState ? baseMasts.filter(m => m.state === effectiveState) : baseMasts,
    [effectiveState, baseMasts],
  );

  const stats = useMemo(() => ({
    total: visibleMasts.length,
    critical: visibleMasts.filter(m => m.status === "critical").length,
    alert: visibleMasts.filter(m => m.status === "alert").length,
    secure: visibleMasts.filter(m => m.status === "secure").length,
  }), [visibleMasts]);

  const t = TILES[tile];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-bold text-foreground">
            {effectiveState ? `${effectiveState} State` : "National Telecom Coverage"}
          </h1>
          {effectiveState && (
            <button onClick={() => setSelectedState(null)} className="text-[10px] text-primary hover:underline ml-2">
              &larr; All states
            </button>
          )}
        </div>
        <span className="text-[10px] px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 font-semibold">
          NCC READ-ONLY
        </span>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: "Total Masts", value: stats.total, icon: Signal, color: "text-primary" },
          { label: "Secure", value: stats.secure, icon: Shield, color: "text-success" },
          { label: "Alert", value: stats.alert, icon: AlertTriangle, color: "text-warning" },
          { label: "Critical", value: stats.critical, icon: AlertTriangle, color: "text-destructive" },
        ].map((s) => (
          <div key={s.label} className="glass-panel px-3 py-2.5 flex items-center gap-2">
            <s.icon className={`h-4 w-4 ${s.color} shrink-0`} />
            <div>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
              <p className="text-sm font-bold text-foreground">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Map */}
      <div className="glass-panel overflow-hidden relative">
        <MapContainer
          bounds={BOUNDS}
          minZoom={6}
          maxZoom={18}
          zoomControl={false}
          className="h-[520px] w-full z-0"
          style={{ background: "#0f172a" }}
          maxBounds={[[3.5, 2.0], [14.5, 15.5]]}
          maxBoundsViscosity={1.0}
        >
          <TileLayer
            key={tile}
            url={t.url}
            attribution={t.attr}
            tileSize={(t as any).tileSize ?? 256}
            zoomOffset={(t as any).zoomOffset ?? 0}
            maxZoom={19}
            detectRetina={!(t as any).tileSize}
          />
          <FlyController state={effectiveState} />

          {/* National view — state dots */}
          {!effectiveState && Object.entries(STATE_COORDS).map(([state, coords]) => {
            const masts = baseMasts.filter(m => m.state === state);
            if (masts.length === 0) return null;
            const hasCritical = masts.some(m => m.status === "critical");
            const hasAlert = masts.some(m => m.status === "alert");
            const status: keyof typeof STATUS = hasCritical ? "critical" : hasAlert ? "alert" : "secure";
            return (
              <Marker
                key={state}
                position={[coords.lat, coords.lng]}
                icon={L.divIcon({
                  className: "",
                  iconSize: [80, 50],
                  iconAnchor: [40, 18],
                  html: `
                    <div style="display:flex;flex-direction:column;align-items:center;cursor:pointer;">
                      <div style="
                        width:28px;height:28px;border-radius:50%;
                        background:linear-gradient(135deg,${STATUS[status].fill},color-mix(in srgb,${STATUS[status].fill} 70%,#000));
                        border:2px solid #fff;display:flex;align-items:center;justify-content:center;
                        box-shadow:0 0 0 1px rgba(0,0,0,0.5),0 0 14px ${STATUS[status].glow};
                      ">
                        <span style="color:#fff;font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:700;">${masts.length}</span>
                      </div>
                      <span style="
                        margin-top:2px;font-family:'Inter',system-ui,sans-serif;font-size:8px;font-weight:600;
                        color:hsl(210 20% 88%);text-shadow:0 1px 3px rgba(0,0,0,0.9),0 0 6px rgba(0,0,0,0.7);
                        white-space:nowrap;
                      ">${state}</span>
                    </div>
                  `,
                })}
                eventHandlers={{ click: () => setSelectedState(state) }}
              >
                <LeafletTooltip direction="top" offset={[0, -20]}>
                  <div className="text-xs font-sans">
                    <p className="font-bold">{state}</p>
                    <p className="text-[10px] opacity-70">{masts.length} masts &bull; Click to zoom</p>
                  </div>
                </LeafletTooltip>
              </Marker>
            );
          })}

          {/* State view — individual masts */}
          {effectiveState && visibleMasts.map((mast) => {
            const provider = TELECOM_PROVIDERS.find(p => p.shortName === mast.providerShort);
            return (
              <Marker
                key={mast.id}
                position={[mast.lat, mast.lng]}
                icon={makeDot(mast.status, 14)}
              >
                <LeafletTooltip direction="right" offset={[10, 0]} permanent className="leaflet-mast-name-label">
                  <div className="text-[10px] font-mono leading-tight">
                    <div className="font-bold">{mast.name}</div>
                    <div className="text-[9px] opacity-70">{mast.providerShort}</div>
                  </div>
                </LeafletTooltip>
              </Marker>
            );
          })}
        </MapContainer>

        {/* Tile switcher */}
        <div className="absolute top-3 left-3 z-[1000]">
          <button
            onClick={() => setShowTiles(!showTiles)}
            className="glass-panel p-2 flex items-center gap-1.5 hover:bg-secondary transition-colors"
          >
            <Layers className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-[10px] font-mono text-muted-foreground">{TILES[tile].label}</span>
          </button>
          {showTiles && (
            <div className="absolute top-full left-0 mt-1 glass-panel p-1 min-w-[120px] space-y-0.5">
              {(Object.keys(TILES) as TileKey[]).map((k) => (
                <button
                  key={k}
                  onClick={() => { setTile(k); setShowTiles(false); }}
                  className={`w-full text-left px-2.5 py-1.5 rounded text-[10px] font-mono transition-colors ${
                    tile === k ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  {TILES[k].label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
