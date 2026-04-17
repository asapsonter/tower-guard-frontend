/**
 * Geo-Location Page
 *
 * A dedicated map page for browsing telecom mast sites by geographic location.
 * No live stream, no alerts feed — just the map and geo-location filters.
 *
 * Features:
 *   - Full-height Leaflet map showing all 380 mast sites
 *   - Geo-location filters: State → LGA drill-down
 *   - Zone quick-filter pills
 *   - Health status on every mast dot:
 *       Green = secure/healthy
 *       Orange = alert (anomaly detected)
 *       Red blinking = alarm dispatched / critical
 *       Skull icon = vandalised
 *   - Right panel with state/LGA stats and clickable mast list
 *   - Defaults to the logged-in site's state on load
 */
import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Tooltip as LeafletTooltip, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  MapPin, Shield, AlertTriangle, Activity, Signal,
  ChevronRight, Filter, Globe, ChevronDown, Layers,
} from "lucide-react";
import {
  mockTelecomMasts,
  STATE_COORDS,
  GEOPOLITICAL_ZONES,
  TELECOM_PROVIDERS,
  type TelecomMast,
} from "@tower-guard/data";

// ── Logged-in site's default state ──
const HARDWARE_MAST_ID =
  (import.meta.env.VITE_HARDWARE_MAST_ID as string | undefined) ?? "tm_021";
const SITE_MAST = mockTelecomMasts.find((m) => m.id === HARDWARE_MAST_ID);
const DEFAULT_STATE = SITE_MAST?.state ?? "FCT";

// ── Leaflet map config (mirrors the NCC National Coverage page) ──
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

const STATUS_DOT = {
  critical: { fill: "#ef4444", glow: "rgba(239,68,68,0.6)" },
  alert:    { fill: "#f97316", glow: "rgba(249,115,22,0.6)" },
  secure:   { fill: "#22c55e", glow: "rgba(34,197,94,0.5)" },
} as const;

const makeDot = (status: keyof typeof STATUS_DOT, size: number) => {
  const c = STATUS_DOT[status];
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

const NIGERIA_BOUNDS: L.LatLngBoundsExpression = [[4.2, 2.7], [13.9, 14.7]];

// Flies to the selected state or back out to national on clear.
const FlyController = ({ state }: { state: string | null }) => {
  const map = useMap();
  useEffect(() => {
    if (state) {
      const masts = mockTelecomMasts.filter((m) => m.state === state);
      if (masts.length > 0) {
        const bounds = L.latLngBounds(masts.map((m) => [m.lat, m.lng] as [number, number]));
        map.flyToBounds(bounds.pad(0.3), { duration: 0.8 });
        return;
      }
      const c = STATE_COORDS[state];
      if (c) map.flyTo([c.lat, c.lng], 8, { duration: 0.8 });
    } else {
      map.flyToBounds(NIGERIA_BOUNDS, { duration: 0.8, padding: [20, 20] });
    }
  }, [state, map]);
  return null;
};

// ── Zone → State mapping ──
const ZONE_STATES: Record<string, string[]> = {
  "North-West": ["Kaduna", "Kano", "Katsina", "Kebbi", "Sokoto", "Zamfara", "Jigawa"],
  "North-East": ["Adamawa", "Bauchi", "Borno", "Gombe", "Taraba", "Yobe"],
  "North-Central": ["Benue", "Kogi", "Kwara", "Nasarawa", "Niger", "Plateau", "FCT"],
  "South-West": ["Ekiti", "Lagos", "Ogun", "Ondo", "Osun", "Oyo"],
  "South-East": ["Abia", "Anambra", "Ebonyi", "Enugu", "Imo"],
  "South-South": ["Akwa Ibom", "Bayelsa", "Cross River", "Delta", "Edo", "Rivers"],
};

const zoneDotColors: Record<string, string> = {
  "North-West": "bg-red-500",
  "North-East": "bg-orange-500",
  "North-Central": "bg-amber-500",
  "South-West": "bg-emerald-500",
  "South-East": "bg-cyan-500",
  "South-South": "bg-violet-500",
};

function getZoneForState(state: string): string {
  for (const [zone, states] of Object.entries(ZONE_STATES)) {
    if (states.includes(state)) return zone;
  }
  return "North-Central";
}

// ── Stats helper ──
function computeStats(masts: TelecomMast[]) {
  return {
    total: masts.length,
    secure: masts.filter(m => m.status === "secure").length,
    alert: masts.filter(m => m.status === "alert").length,
    critical: masts.filter(m => m.status === "critical").length,
    avgFuel: masts.length > 0 ? Math.round(masts.reduce((s, m) => s + m.generatorFuel, 0) / masts.length) : 0,
    avgBattery: masts.length > 0 ? Math.round(masts.reduce((s, m) => s + m.batteryCharge, 0) / masts.length) : 0,
    tampered: masts.reduce((s, m) => s + m.tampered, 0),
    intruders: masts.reduce((s, m) => s + m.intruders, 0),
  };
}

// ── All states that have masts ──
const STATES_WITH_MASTS = [...new Set(mockTelecomMasts.map(m => m.state))].sort();

const NationalCoverage = () => {
  const navigate = useNavigate();

  // Geo-location filters — state defaults to the site's state
  const [selectedState, setSelectedState] = useState<string | null>(DEFAULT_STATE);
  const [selectedLga, setSelectedLga] = useState<string | null>(null);
  const [activeZone, setActiveZone] = useState<string | null>(null);
  const [tile, setTile] = useState<TileKey>("satellite");
  const [showTiles, setShowTiles] = useState(false);

  // Available states filtered by zone
  const availableStates = useMemo(() => {
    if (!activeZone) return STATES_WITH_MASTS;
    const zoneStates = ZONE_STATES[activeZone] || [];
    return STATES_WITH_MASTS.filter(s => zoneStates.includes(s));
  }, [activeZone]);

  // Available LGAs for the selected state
  const availableLgas = useMemo(() => {
    if (!selectedState) return [];
    return [...new Set(mockTelecomMasts.filter(m => m.state === selectedState).map(m => m.lga))].sort();
  }, [selectedState]);

  // Filtered masts for the current geo-location selection
  const filteredMasts = useMemo(() => {
    if (selectedLga) return mockTelecomMasts.filter(m => m.state === selectedState && m.lga === selectedLga);
    if (selectedState) return mockTelecomMasts.filter(m => m.state === selectedState);
    if (activeZone) {
      const zoneStates = ZONE_STATES[activeZone] || [];
      return mockTelecomMasts.filter(m => zoneStates.includes(m.state));
    }
    return mockTelecomMasts;
  }, [selectedState, selectedLga, activeZone]);

  const stats = useMemo(() => computeStats(filteredMasts), [filteredMasts]);

  const handleStateSelect = (state: string | null) => {
    setSelectedState(state);
    setSelectedLga(null);
  };

  const handleLgaSelect = (lga: string | null) => {
    setSelectedLga(lga);
  };

  const handleZoneSelect = (zone: string | null) => {
    setActiveZone(zone);
    setSelectedState(null);
    setSelectedLga(null);
  };

  // The scope label for the current selection
  const scopeLabel = selectedLga
    ? `${selectedLga}, ${selectedState}`
    : selectedState
    ? `${selectedState} State`
    : activeZone
    ? `${activeZone} Zone`
    : "All Nigeria";

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* ── Page header + geo-location filters ─────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            Geo-Location — Mast Sites
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Browse telecom mast sites by geographic location. Filter by zone, state, or LGA.
          </p>
        </div>

        {/* Geo-location dropdowns */}
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />

          {/* State selector */}
          <div className="relative">
            <select
              value={selectedState ?? ""}
              onChange={(e) => handleStateSelect(e.target.value || null)}
              className="appearance-none glass-panel pl-3 pr-7 py-1.5 text-[11px] font-mono text-foreground bg-secondary/60 rounded-md border border-border/50 cursor-pointer hover:bg-secondary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">All States</option>
              {availableStates.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
          </div>

          {/* LGA selector — only visible when a state is selected */}
          {selectedState && availableLgas.length > 0 && (
            <div className="relative">
              <select
                value={selectedLga ?? ""}
                onChange={(e) => handleLgaSelect(e.target.value || null)}
                className="appearance-none glass-panel pl-3 pr-7 py-1.5 text-[11px] font-mono text-foreground bg-secondary/60 rounded-md border border-border/50 cursor-pointer hover:bg-secondary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">All LGAs in {selectedState}</option>
                {availableLgas.map(l => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
            </div>
          )}

          {/* Clear filters */}
          {(selectedState || activeZone) && (
            <button
              onClick={() => { handleStateSelect(null); setActiveZone(null); }}
              className="text-[10px] text-destructive hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* ── Zone quick-filter pills ────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <button
          onClick={() => handleZoneSelect(null)}
          className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-all ${
            !activeZone && !selectedState ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
          }`}
        >
          All Zones
        </button>
        {GEOPOLITICAL_ZONES.map(zone => (
          <button
            key={zone}
            onClick={() => handleZoneSelect(activeZone === zone ? null : zone)}
            className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-all flex items-center gap-1.5 ${
              activeZone === zone ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${zoneDotColors[zone]}`} />
            {zone}
          </button>
        ))}
      </div>

      {/* ── Stats bar ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
        {[
          { label: "Masts", value: stats.total, icon: Signal, color: "text-primary" },
          { label: "Secure", value: stats.secure, icon: Shield, color: "text-success" },
          { label: "Alert", value: stats.alert, icon: AlertTriangle, color: "text-warning" },
          { label: "Critical", value: stats.critical, icon: Activity, color: "text-destructive" },
          { label: "Avg Fuel", value: `${stats.avgFuel}%`, icon: Activity, color: "text-primary" },
          { label: "Avg Battery", value: `${stats.avgBattery}%`, icon: Activity, color: "text-primary" },
          { label: "Tampered", value: stats.tampered, icon: AlertTriangle, color: "text-destructive" },
          { label: "Intruders", value: stats.intruders, icon: AlertTriangle, color: "text-warning" },
        ].map(s => (
          <div key={s.label} className="glass-panel px-2 py-1.5 flex items-center gap-1.5">
            <s.icon className={`h-3 w-3 ${s.color} shrink-0`} />
            <div className="min-w-0">
              <p className="text-[9px] text-muted-foreground truncate">{s.label}</p>
              <p className="text-xs font-bold text-foreground">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Map + right panel ──────────────────────────────────────────── */}
      <div className="flex gap-4 flex-1 min-h-[520px]">
        {/* Leaflet map — state dots at national zoom, individual masts on state click */}
        <div className="flex-1 min-h-[500px] glass-panel overflow-hidden relative">
          <MapContainer
            bounds={NIGERIA_BOUNDS}
            minZoom={6}
            maxZoom={18}
            zoomControl={false}
            className="h-full w-full z-0"
            style={{ background: "#0f172a", minHeight: 500 }}
            maxBounds={[[3.5, 2.0], [14.5, 15.5]]}
            maxBoundsViscosity={1.0}
          >
            <TileLayer
              key={tile}
              url={TILES[tile].url}
              attribution={TILES[tile].attr}
              tileSize={(TILES[tile] as { tileSize?: number }).tileSize ?? 256}
              zoomOffset={(TILES[tile] as { zoomOffset?: number }).zoomOffset ?? 0}
              maxZoom={19}
              detectRetina={!(TILES[tile] as { tileSize?: number }).tileSize}
            />
            <FlyController state={selectedState} />

            {/* National view — one dot per state with mast count */}
            {!selectedState && Object.entries(STATE_COORDS).map(([state, coords]) => {
              const masts = mockTelecomMasts.filter((m) => m.state === state);
              if (masts.length === 0) return null;
              const hasCritical = masts.some((m) => m.status === "critical");
              const hasAlert = masts.some((m) => m.status === "alert");
              const status: keyof typeof STATUS_DOT = hasCritical ? "critical" : hasAlert ? "alert" : "secure";
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
                          background:linear-gradient(135deg,${STATUS_DOT[status].fill},color-mix(in srgb,${STATUS_DOT[status].fill} 70%,#000));
                          border:2px solid #fff;display:flex;align-items:center;justify-content:center;
                          box-shadow:0 0 0 1px rgba(0,0,0,0.5),0 0 14px ${STATUS_DOT[status].glow};
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
                  eventHandlers={{ click: () => handleStateSelect(state) }}
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

            {/* State view — individual mast markers */}
            {selectedState && filteredMasts.map((mast) => {
              const provider = TELECOM_PROVIDERS.find((p) => p.shortName === mast.providerShort);
              return (
                <Marker
                  key={mast.id}
                  position={[mast.lat, mast.lng]}
                  icon={makeDot(mast.status, 14)}
                  eventHandlers={{ click: () => navigate(`/mast/${mast.id}`) }}
                >
                  <LeafletTooltip direction="right" offset={[10, 0]} permanent className="leaflet-mast-name-label">
                    <div className="text-[10px] font-mono leading-tight">
                      <div className="font-bold">{mast.name}</div>
                      <div className="text-[9px] opacity-70" style={{ color: provider?.color }}>
                        {mast.providerShort} &bull; {mast.lga}
                      </div>
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

        {/* Right panel — geo-location detail + mast list */}
        <div className="w-72 shrink-0 flex flex-col gap-2 min-h-0">
          {/* Scope header */}
          <div className="glass-panel px-3 py-2.5 border-b border-border/50">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground">{scopeLabel}</span>
              <span className="text-[10px] font-mono text-muted-foreground">{filteredMasts.length} masts</span>
            </div>
            {selectedState && (
              <p className="text-[9px] text-muted-foreground mt-0.5">
                {getZoneForState(selectedState)} Zone
              </p>
            )}
          </div>

          {/* Health legend */}
          <div className="glass-panel px-3 py-2 flex items-center gap-3 text-[9px] font-mono">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-success" /> Healthy</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-warning" /> Alert</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-destructive animate-pulse" /> Alarm</span>
          </div>

          {/* Mast list for the selected geo-location */}
          <div className="glass-panel flex-1 overflow-y-auto">
            <div className="px-3 py-2 border-b border-border/50 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Mast Sites
            </div>
            {filteredMasts.length === 0 ? (
              <div className="p-4 text-center">
                <MapPin className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">No masts in this location</p>
              </div>
            ) : (
              filteredMasts
                .sort((a, b) => {
                  // Critical first, then alert, then secure
                  const order = { critical: 0, alert: 1, secure: 2 };
                  return (order[a.status] ?? 3) - (order[b.status] ?? 3);
                })
                .map(mast => (
                  <button
                    key={mast.id}
                    onClick={() => navigate(`/mast/${mast.id}`)}
                    className="w-full flex items-center justify-between px-3 py-2 hover:bg-secondary/50 transition-colors text-left border-b border-border/20"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`h-2 w-2 rounded-full shrink-0 ${
                        mast.status === "critical" ? "bg-destructive animate-pulse"
                        : mast.status === "alert" ? "bg-warning"
                        : "bg-success"
                      }`} />
                      <div className="min-w-0">
                        <p className="text-[10px] font-mono text-foreground truncate">{mast.name}</p>
                        <p className="text-[9px] text-muted-foreground truncate">{mast.lga} &bull; {mast.providerShort}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {mast.tampered > 0 && (
                        <span className="text-[8px] px-1 py-0.5 rounded bg-destructive/20 text-destructive font-bold">
                          T:{mast.tampered}
                        </span>
                      )}
                      <span className={`text-[9px] font-bold ${
                        mast.status === "critical" ? "text-destructive"
                        : mast.status === "alert" ? "text-warning"
                        : "text-success"
                      }`}>
                        {mast.status === "critical" ? "ALARM"
                         : mast.status === "alert" ? "ALERT"
                         : mast.generatorFuel < 20 ? "LOW FUEL"
                         : "OK"}
                      </span>
                      <ChevronRight className="h-3 w-3 text-muted-foreground" />
                    </div>
                  </button>
                ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NationalCoverage;
