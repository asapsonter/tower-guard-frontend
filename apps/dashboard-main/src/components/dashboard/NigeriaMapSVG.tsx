import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Maximize2, Layers } from "lucide-react";
import { MapContainer, TileLayer, Marker, Tooltip as LeafletTooltip, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { mockTelecomMasts, STATE_COORDS, NIGERIAN_STATES, TELECOM_PROVIDERS, type TelecomMast } from "@tower-guard/data";

// ── Tile layer definitions ──────────────────────────────────────────────────
//
// All providers configured for retina/HD rendering where supported via:
//   tileSize: 512, zoomOffset: -1
// This downloads 2x-resolution tiles so the map stays sharp on high-DPI
// displays. Free providers that support retina include CartoDB and Stadia.
// Esri tiles are 256px native — we leave them at the default to avoid
// double-loading.
//
// MapTiler is the highest-quality option but requires a free API key
// (sign up at maptiler.com, 100k tiles/month free). To enable, set
// VITE_MAPTILER_KEY in .env. The map auto-detects the key and only adds
// MapTiler options to the picker when present.
const MAPTILER_KEY = (import.meta.env.VITE_MAPTILER_KEY as string | undefined) ?? "";

interface TileSpec {
  label: string;
  url: string;
  attribution: string;
  /** Native tile size — set to 512 for retina/HD providers */
  tileSize?: number;
  /** Required when tileSize is 512 to keep zoom levels aligned */
  zoomOffset?: number;
  /** Max zoom this provider supports (Esri caps at ~19, MapTiler at 22) */
  maxZoom?: number;
  /** Optional second layer for hybrid (satellite + labels) */
  overlayUrl?: string;
}

const buildTileLayers = (): Record<string, TileSpec> => {
  const layers: Record<string, TileSpec> = {
    // Esri World Imagery — free, no API key, decent satellite coverage of Africa
    satellite: {
      label: "Satellite",
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      attribution: "&copy; Esri &mdash; Sources: Esri, Maxar, Earthstar Geographics",
      maxZoom: 19,
    },
    // Esri Hybrid — satellite + Esri's reference labels overlaid
    hybrid: {
      label: "Hybrid",
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      attribution: "&copy; Esri",
      maxZoom: 19,
      overlayUrl: "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
    },
    // CartoDB Dark Matter — best dark base for the dashboard, retina-aware
    dark: {
      label: "Dark",
      url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      attribution: "&copy; <a href='https://carto.com/'>CARTO</a>",
      tileSize: 512,
      zoomOffset: -1,
      maxZoom: 20,
    },
    // CartoDB Voyager — clean modern street map, retina-aware
    streets: {
      label: "Streets",
      url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
      attribution: "&copy; <a href='https://carto.com/'>CARTO</a> &copy; <a href='https://osm.org/copyright'>OSM</a>",
      tileSize: 512,
      zoomOffset: -1,
      maxZoom: 20,
    },
    // Esri World Topo — terrain + roads + place names
    terrain: {
      label: "Terrain",
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
      attribution: "&copy; Esri",
      maxZoom: 19,
    },
  };

  // MapTiler — only added if the user has a key configured. These are the
  // sharpest providers because MapTiler ships native retina support and
  // higher zoom levels.
  if (MAPTILER_KEY) {
    layers["maptiler-satellite"] = {
      label: "MapTiler HD Sat",
      url: `https://api.maptiler.com/maps/hybrid/{z}/{x}/{y}@2x.jpg?key=${MAPTILER_KEY}`,
      attribution: '&copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a>',
      tileSize: 512,
      zoomOffset: -1,
      maxZoom: 22,
    };
    layers["maptiler-streets"] = {
      label: "MapTiler HD Street",
      url: `https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}@2x.png?key=${MAPTILER_KEY}`,
      attribution: '&copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a>',
      tileSize: 512,
      zoomOffset: -1,
      maxZoom: 22,
    };
  }

  return layers;
};

const TILE_LAYERS = buildTileLayers();
type TileLayerKey = keyof typeof TILE_LAYERS;

// ── Status colors ───────────────────────────────────────────────────────────
const STATUS_COLORS = {
  critical: { fill: "#ef4444", glow: "rgba(239,68,68,0.6)" },
  alert:    { fill: "#f97316", glow: "rgba(249,115,22,0.6)" },
  secure:   { fill: "#22c55e", glow: "rgba(34,197,94,0.5)" },
} as const;

const getStateStatus = (state: string) => {
  const stateMasts = mockTelecomMasts.filter(m => m.state === state);
  if (stateMasts.some(m => m.status === "critical")) return "critical" as const;
  if (stateMasts.some(m => m.status === "alert")) return "alert" as const;
  return "secure" as const;
};

// ── Custom DivIcon factories ────────────────────────────────────────────────
//
// We replaced Leaflet's CircleMarker (flat SVG circles) with HTML-based
// DivIcons. This gives us:
//   * Crisp gradients, drop shadows, glow rings
//   * GPU-accelerated CSS animations for the critical pulse
//   * Pixel-perfect rendering at any zoom (HTML, not raster)
//   * Easy hover/scale via CSS
//
// Each icon is a small DOM tree wrapped in L.divIcon. The visual styles
// live in the dashboard-main index.css under .tg-marker / .tg-marker-* .
const makeMastIcon = (status: keyof typeof STATUS_COLORS, size: number, isLarge = false) => {
  const colors = STATUS_COLORS[status];
  const pulseClass = status === "critical" ? "tg-marker-pulse" : "";
  return L.divIcon({
    className: "tg-marker-wrap",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `
      <div class="tg-marker ${pulseClass}" style="
        --dot-color: ${colors.fill};
        --dot-glow:  ${colors.glow};
        width: ${size}px;
        height: ${size}px;
      ">
        ${status === "critical" ? '<div class="tg-marker-ring"></div>' : ""}
        <div class="tg-marker-dot ${isLarge ? "tg-marker-dot-lg" : ""}"></div>
      </div>
    `,
  });
};

const makeStateIcon = (status: keyof typeof STATUS_COLORS, count: number, stateName: string) => {
  const colors = STATUS_COLORS[status];
  // The icon is taller than 44px because we include the state name below
  // the dot. Total height = 44 (dot) + 18 (label gap + text). Anchor
  // point stays at the center of the dot so lat/lng is accurate.
  return L.divIcon({
    className: "tg-marker-wrap",
    iconSize: [90, 62],
    iconAnchor: [45, 22], // centers the dot, label hangs below
    html: `
      <div class="tg-state-marker ${status === "critical" ? "tg-marker-pulse" : ""}" style="
        --dot-color: ${colors.fill};
        --dot-glow:  ${colors.glow};
      ">
        ${status === "critical" ? '<div class="tg-marker-ring"></div>' : ""}
        <div class="tg-state-marker-inner">
          <span class="tg-state-marker-count">${count}</span>
        </div>
        <div class="tg-state-marker-name">${stateName}</div>
      </div>
    `,
  });
};

const makeLgaIcon = (mastCount: number, hasCritical: boolean) => {
  const status: keyof typeof STATUS_COLORS = hasCritical ? "critical" : "secure";
  const colors = STATUS_COLORS[status];
  return L.divIcon({
    className: "tg-marker-wrap",
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    html: `
      <div class="tg-lga-marker" style="
        --dot-color: ${colors.fill};
        --dot-glow:  ${colors.glow};
      ">
        <div class="tg-lga-marker-dot"></div>
        <span class="tg-lga-marker-count">${mastCount}</span>
      </div>
    `,
  });
};

// ── Nigeria center & bounds ─────────────────────────────────────────────────
const NIGERIA_CENTER: L.LatLngExpression = [9.06, 8.0];
const NIGERIA_BOUNDS: L.LatLngBoundsExpression = [[4.2, 2.7], [13.9, 14.7]];

// ── Map controller — handles flyTo on state/LGA selection ──────────────────
interface MapControllerProps {
  selectedState: string | null | undefined;
  selectedLga: string | null | undefined;
  visibleMasts: TelecomMast[];
}

const MapController = ({ selectedState, selectedLga, visibleMasts }: MapControllerProps) => {
  const map = useMap();

  useEffect(() => {
    // When an LGA is selected, fit to its actual masts (much more accurate
    // than the state center). Falls back to state center if no masts.
    if (selectedLga && visibleMasts.length > 0) {
      const bounds = L.latLngBounds(visibleMasts.map((m) => [m.lat, m.lng] as [number, number]));
      map.flyToBounds(bounds.pad(0.4), { duration: 0.8 });
      return;
    }
    if (selectedState && visibleMasts.length > 0) {
      const bounds = L.latLngBounds(visibleMasts.map((m) => [m.lat, m.lng] as [number, number]));
      map.flyToBounds(bounds.pad(0.3), { duration: 0.8 });
      return;
    }
    if (selectedState && STATE_COORDS[selectedState]) {
      const { lat, lng } = STATE_COORDS[selectedState];
      map.flyTo([lat, lng], 8, { duration: 0.8 });
      return;
    }
    map.flyToBounds(NIGERIA_BOUNDS, { duration: 0.8, padding: [20, 20] });
  }, [selectedState, selectedLga, visibleMasts, map]);

  return null;
};

// ── LGA centroid computation ────────────────────────────────────────────────
//
// CRITICAL FIX: previously LGA labels were placed in a synthetic ring around
// the state center using sin/cos angles. That meant LGAs were NOT at their
// real geographic positions on the map.
//
// Now we compute each LGA's position as the centroid of its actual masts.
// This is geographically accurate because every mast has a real lat/lng,
// and the centroid of cluster of masts is a sensible approximation of the
// LGA's center. LGAs with no masts are skipped — they wouldn't add value
// to the dispatch view anyway.
interface LgaCentroid {
  lga: string;
  lat: number;
  lng: number;
  mastCount: number;
  hasCritical: boolean;
}

const computeLgaCentroids = (state: string): LgaCentroid[] => {
  const stateMasts = mockTelecomMasts.filter((m) => m.state === state);
  const byLga = new Map<string, TelecomMast[]>();
  for (const mast of stateMasts) {
    const arr = byLga.get(mast.lga) ?? [];
    arr.push(mast);
    byLga.set(mast.lga, arr);
  }
  return Array.from(byLga.entries()).map(([lga, masts]) => {
    const lat = masts.reduce((sum, m) => sum + m.lat, 0) / masts.length;
    const lng = masts.reduce((sum, m) => sum + m.lng, 0) / masts.length;
    return {
      lga,
      lat,
      lng,
      mastCount: masts.length,
      hasCritical: masts.some((m) => m.status === "critical"),
    };
  });
};

// ── Props ───────────────────────────────────────────────────────────────────
interface NigeriaMapSVGProps {
  selectedState?: string | null;
  selectedLga?: string | null;
  onStateSelect?: (state: string | null) => void;
  onLgaSelect?: (lga: string | null) => void;
  masts?: TelecomMast[];
}

// ── Main Component ──────────────────────────────────────────────────────────
const NigeriaMapSVG = ({ selectedState, selectedLga, onStateSelect, onLgaSelect, masts: liveMasts }: NigeriaMapSVGProps) => {
  const navigate = useNavigate();
  const [activeTile, setActiveTile] = useState<TileLayerKey>("satellite");
  const [showTileMenu, setShowTileMenu] = useState(false);

  const allMasts = liveMasts || mockTelecomMasts;

  const visibleMasts = useMemo(() => {
    if (selectedLga) return allMasts.filter(m => m.state === selectedState && m.lga === selectedLga);
    if (selectedState) return allMasts.filter(m => m.state === selectedState);
    return allMasts;
  }, [selectedState, selectedLga, allMasts]);

  // LGA centroids derived from real mast positions — only computed when a
  // state is selected (we don't show them at the national level).
  const lgaCentroids = useMemo(
    () => (selectedState && !selectedLga ? computeLgaCentroids(selectedState) : []),
    [selectedState, selectedLga],
  );

  const criticalCount = visibleMasts.filter(m => m.status === "critical").length;
  const alertCount = visibleMasts.filter(m => m.status === "alert").length;
  const secureCount = visibleMasts.filter(m => m.status === "secure").length;

  const handleMastClick = (mast: TelecomMast) => {
    navigate(`/mast/${mast.id}`);
  };

  const tile = TILE_LAYERS[activeTile];

  return (
    <div className="glass-panel flex flex-col">
      {/* ── Header bar ───────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">
            {selectedState ? selectedLga ? `${selectedLga}, ${selectedState}` : `${selectedState} State` : "National Telecom Mast Overview"}
          </span>
          {selectedState && (
            <button onClick={() => { onStateSelect?.(null); onLgaSelect?.(null); }} className="text-[10px] text-primary hover:underline ml-2">
              &larr; Back to National View
            </button>
          )}
        </div>
        <div className="flex items-center gap-3 text-[10px] font-mono">
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-destructive" />{criticalCount} Critical</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-warning" />{alertCount} Alert</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-success" />{secureCount} Secure</span>
        </div>
      </div>

      {/* ── Map container ────────────────────────────────────────────────── */}
      <div className="relative min-h-[450px]">
        <MapContainer
          bounds={NIGERIA_BOUNDS}
          minZoom={6}
          maxZoom={tile.maxZoom ?? 18}
          zoomControl={false}
          className="h-[450px] w-full z-0"
          style={{ background: "#0f172a" }}
          maxBounds={[[3.5, 2.0], [14.5, 15.5]]}
          maxBoundsViscosity={1.0}
          // Canvas renderer is faster for many markers and looks crisper
          // than the default SVG when there's a lot on screen.
          preferCanvas={false}
        >
          <TileLayer
            key={activeTile}
            url={tile.url}
            attribution={tile.attribution}
            tileSize={tile.tileSize ?? 256}
            zoomOffset={tile.zoomOffset ?? 0}
            maxZoom={tile.maxZoom ?? 19}
            // Detect retina automatically; this property tells Leaflet to
            // request @2x tiles where supported.
            detectRetina={!tile.tileSize}
          />
          {/* Hybrid overlay (satellite + labels) */}
          {tile.overlayUrl && (
            <TileLayer
              key={`${activeTile}-overlay`}
              url={tile.overlayUrl}
              attribution=""
              maxZoom={tile.maxZoom ?? 19}
            />
          )}

          <MapController
            selectedState={selectedState ?? null}
            selectedLga={selectedLga ?? null}
            visibleMasts={visibleMasts}
          />

          {/* ── National view: state markers ─────────────────────────────── */}
          {!selectedState && Object.entries(STATE_COORDS).map(([state, coords]) => {
            const stateMasts = mockTelecomMasts.filter(m => m.state === state);
            if (stateMasts.length === 0) return null;
            const status = getStateStatus(state);

            return (
              <Marker
                key={state}
                position={[coords.lat, coords.lng]}
                icon={makeStateIcon(status, stateMasts.length, state)}
                eventHandlers={{ click: () => onStateSelect?.(state) }}
              >
                {/* Hover tooltip with extra detail — name is already visible
                    permanently via the baked-in label below the dot, but hovering
                    gives the mast count breakdown + "click to zoom" hint. */}
                <LeafletTooltip direction="top" offset={[0, -22]} className="leaflet-mast-tooltip">
                  <div className="font-sans text-xs">
                    <p className="font-bold">{state}</p>
                    <p className="text-[10px] opacity-70">{stateMasts.length} mast{stateMasts.length !== 1 ? "s" : ""} &bull; Click to zoom</p>
                  </div>
                </LeafletTooltip>
              </Marker>
            );
          })}

          {/* ── State/LGA view: individual mast markers with PERMANENT labels at exact location ── */}
          {selectedState && visibleMasts.map((mast) => {
            const provider = TELECOM_PROVIDERS.find(p => p.shortName === mast.providerShort);
            const dotSize = selectedLga ? 22 : 16;

            return (
              <Marker
                key={mast.id}
                position={[mast.lat, mast.lng]}
                icon={makeMastIcon(mast.status, dotSize, !!selectedLga)}
                eventHandlers={{ click: () => handleMastClick(mast) }}
              >
                {/* Permanent label anchored to the right of the dot, at the
                    mast's exact lat/lng. Visible whenever a state is selected. */}
                <LeafletTooltip
                  direction="right"
                  offset={[12, 0]}
                  permanent
                  className="leaflet-mast-name-label"
                >
                  <div className="text-[10px] font-mono leading-tight">
                    <div className="font-bold text-foreground">{mast.name}</div>
                    {selectedLga && (
                      <div className="text-muted-foreground text-[9px]">{mast.providerShort}</div>
                    )}
                  </div>
                </LeafletTooltip>

                <Popup className="leaflet-mast-popup" closeButton={true}>
                  <div className="font-sans text-xs space-y-1.5 min-w-[200px]">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: provider?.color }} />
                      <span className="font-bold text-sm" style={{ color: provider?.color }}>{mast.provider}</span>
                    </div>
                    <p className="font-bold">{mast.name}</p>
                    <div className="border-t border-gray-600 pt-1 space-y-0.5 text-[10px]">
                      <p>LGA: {mast.lga} &bull; {mast.address}</p>
                      <p>Tower Height: {mast.towerHeight}m</p>
                      <p className="font-bold" style={{ color: STATUS_COLORS[mast.status].fill }}>
                        {mast.status.toUpperCase()} &bull; Tampered: {mast.tampered} &bull; Intruders: {mast.intruders}
                      </p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleMastClick(mast); }}
                      className="w-full mt-1 px-2 py-1 rounded text-[10px] font-semibold text-white"
                      style={{ backgroundColor: provider?.color || "#6366f1" }}
                    >
                      Open Surveillance Dashboard &rarr;
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* ── LGA labels at REAL centroids (state view only) ───────────── */}
          {selectedState && !selectedLga && lgaCentroids.map((lc) => (
            <Marker
              key={lc.lga}
              position={[lc.lat, lc.lng]}
              icon={makeLgaIcon(lc.mastCount, lc.hasCritical)}
              eventHandlers={{ click: () => onLgaSelect?.(lc.lga) }}
              // Render LGA labels under the mast markers so masts win on overlap
              zIndexOffset={-100}
            >
              <LeafletTooltip
                direction="top"
                offset={[0, -8]}
                permanent
                className="leaflet-lga-label"
              >
                <span className="text-[10px] font-mono font-semibold">{lc.lga}</span>
              </LeafletTooltip>
            </Marker>
          ))}
        </MapContainer>

        {/* ── Tile layer switcher ────────────────────────────────────────── */}
        <div className="absolute top-3 left-3 z-[1000]">
          <div className="relative">
            <button
              onClick={() => setShowTileMenu(!showTileMenu)}
              className="glass-panel p-2 hover:bg-secondary transition-colors flex items-center gap-1.5"
              title="Change map style"
            >
              <Layers className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-[10px] font-mono text-muted-foreground">{TILE_LAYERS[activeTile].label}</span>
            </button>
            {showTileMenu && (
              <div className="absolute top-full left-0 mt-1 glass-panel p-1 min-w-[160px] space-y-0.5">
                {(Object.entries(TILE_LAYERS) as [TileLayerKey, TileSpec][]).map(([key, layer]) => (
                  <button
                    key={key}
                    onClick={() => { setActiveTile(key); setShowTileMenu(false); }}
                    className={`w-full text-left px-2.5 py-1.5 rounded text-[10px] font-mono transition-colors ${
                      activeTile === key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"
                    }`}
                  >
                    {layer.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Reset view button ──────────────────────────────────────────── */}
        {selectedState && (
          <div className="absolute top-3 right-3 z-[1000]">
            <button
              onClick={() => { onStateSelect?.(null); onLgaSelect?.(null); }}
              className="glass-panel p-1.5 hover:bg-secondary transition-colors"
              title="Reset to national view"
            >
              <Maximize2 className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NigeriaMapSVG;
