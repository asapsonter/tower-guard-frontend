/**
 * Geo-Location Page
 *
 * Full-screen interactive map that zooms directly into a selected
 * geographic location (State / LGA) and displays the masts there.
 *
 * Health indicators:
 *   Green        = healthy / secure
 *   Red blinking = alarm dispatched (critical)
 *   Rose badge   = VANDALISED (tampered > 0)
 *
 * If no masts exist at the selected location the map still zooms in
 * and shows the 5 nearest masts within ~50 km.
 */
import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Tooltip as LeafletTooltip, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Layers, Navigation } from "lucide-react";
import {
  mockTelecomMasts,
  STATE_COORDS,
  TELECOM_PROVIDERS,
  type TelecomMast,
} from "@tower-guard/data";

// ── Constants ──────────────────────────────────────────────────────────────
const NIGERIA_CENTER: L.LatLngExpression = [9.06, 8.0];
const NIGERIA_BOUNDS: L.LatLngBoundsExpression = [[4.2, 2.7], [13.9, 14.7]];

// Approximate km per degree at Nigeria's latitude (~9 N)
const KM_PER_DEG = 111;
const MAX_NEARBY_KM = 50;
const MAX_NEARBY_COUNT = 5;

// ── Tile layers (clean, minimal set) ───────────────────────────────────────
interface TileSpec {
  label: string;
  url: string;
  attribution: string;
  tileSize?: number;
  zoomOffset?: number;
  maxZoom?: number;
}

const TILE_LAYERS: Record<string, TileSpec> = {
  streets: {
    label: "Streets",
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    attribution: "&copy; CARTO &copy; OSM",
    tileSize: 512,
    zoomOffset: -1,
    maxZoom: 20,
  },
  satellite: {
    label: "Satellite",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "&copy; Esri",
    maxZoom: 19,
  },
  dark: {
    label: "Dark",
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution: "&copy; CARTO",
    tileSize: 512,
    zoomOffset: -1,
    maxZoom: 20,
  },
};

type TileKey = string;

// ── Status colors ──────────────────────────────────────────────────────────
const STATUS_COLORS = {
  critical: { fill: "#ef4444", glow: "rgba(239,68,68,0.6)" },
  alert:    { fill: "#f97316", glow: "rgba(249,115,22,0.6)" },
  secure:   { fill: "#22c55e", glow: "rgba(34,197,94,0.5)" },
} as const;

// ── Haversine distance (km) ────────────────────────────────────────────────
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Marker icon factory ────────────────────────────────────────────────────
const makeIcon = (mast: TelecomMast) => {
  const isVandalised = mast.tampered > 0;
  const status = mast.status;
  const colors = STATUS_COLORS[status];
  const size = 18;
  const pulseClass = status === "critical" ? "tg-marker-pulse" : "";

  return L.divIcon({
    className: "tg-marker-wrap",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `
      <div class="tg-marker ${pulseClass}" style="
        --dot-color: ${isVandalised ? "#9f1239" : colors.fill};
        --dot-glow:  ${isVandalised ? "rgba(159,18,57,0.6)" : colors.glow};
        width: ${size}px;
        height: ${size}px;
      ">
        ${status === "critical" ? '<div class="tg-marker-ring"></div>' : ""}
        <div class="tg-marker-dot"></div>
      </div>
    `,
  });
};

// ── Status label for a mast ────────────────────────────────────────────────
function statusLabel(mast: TelecomMast) {
  if (mast.tampered > 0) return { text: "VANDALISED", color: "#9f1239" };
  if (mast.status === "critical") return { text: "ALARM", color: STATUS_COLORS.critical.fill };
  if (mast.status === "alert") return { text: "ALERT", color: STATUS_COLORS.alert.fill };
  return { text: "HEALTHY", color: STATUS_COLORS.secure.fill };
}

// ── LGA centroid from NIGERIAN_STATES or STATE_COORDS ──────────────────────
function getLgaCentroid(state: string, lga: string): { lat: number; lng: number } | null {
  // Try to compute from actual mast positions first
  const lgaMasts = mockTelecomMasts.filter(m => m.state === state && m.lga === lga);
  if (lgaMasts.length > 0) {
    return {
      lat: lgaMasts.reduce((s, m) => s + m.lat, 0) / lgaMasts.length,
      lng: lgaMasts.reduce((s, m) => s + m.lng, 0) / lgaMasts.length,
    };
  }
  // Fall back to state center
  const coords = STATE_COORDS[state];
  if (coords) return { lat: coords.lat, lng: coords.lng };
  return null;
}

// ── Map controller ─────────────────────────────────────────────────────────
interface MapControllerProps {
  center: { lat: number; lng: number } | null;
  mastsInView: TelecomMast[];
  zoom: number;
}

const MapController = ({ center, mastsInView, zoom }: MapControllerProps) => {
  const map = useMap();

  useEffect(() => {
    if (!center) {
      map.flyToBounds(NIGERIA_BOUNDS, { duration: 0.6, padding: [20, 20] });
      return;
    }

    if (mastsInView.length > 0) {
      const bounds = L.latLngBounds(mastsInView.map(m => [m.lat, m.lng] as [number, number]));
      // Include the center point so the map covers the selected area
      bounds.extend([center.lat, center.lng]);
      map.flyToBounds(bounds.pad(0.15), { duration: 0.8, maxZoom: zoom });
    } else {
      map.flyTo([center.lat, center.lng], zoom, { duration: 0.8 });
    }
  }, [center, mastsInView, zoom, map]);

  return null;
};

// ── Props ──────────────────────────────────────────────────────────────────
interface GeoLocationProps {
  selectedState?: string | null;
  selectedLga?: string | null;
}

// ── Main component ─────────────────────────────────────────────────────────
const GeoLocation = ({ selectedState, selectedLga }: GeoLocationProps) => {
  const navigate = useNavigate();
  const [activeTile, setActiveTile] = useState("satellite");
  const [showTileMenu, setShowTileMenu] = useState(false);

  // Resolve the center point for the selected location
  const center = useMemo(() => {
    if (selectedLga && selectedState) return getLgaCentroid(selectedState, selectedLga);
    if (selectedState) {
      const coords = STATE_COORDS[selectedState];
      return coords ? { lat: coords.lat, lng: coords.lng } : null;
    }
    return null;
  }, [selectedState, selectedLga]);

  // Masts at the selected location
  const localMasts = useMemo(() => {
    if (selectedLga && selectedState) {
      return mockTelecomMasts.filter(m => m.state === selectedState && m.lga === selectedLga);
    }
    if (selectedState) {
      return mockTelecomMasts.filter(m => m.state === selectedState);
    }
    return [];
  }, [selectedState, selectedLga]);

  // If no masts at the location, find 5 nearest within 50 km
  const nearbyMasts = useMemo(() => {
    if (localMasts.length > 0 || !center) return [];
    return mockTelecomMasts
      .map(m => ({ mast: m, dist: haversineKm(center.lat, center.lng, m.lat, m.lng) }))
      .filter(e => e.dist <= MAX_NEARBY_KM)
      .sort((a, b) => a.dist - b.dist)
      .slice(0, MAX_NEARBY_COUNT)
      .map(e => e.mast);
  }, [localMasts, center]);

  const mastsInView = localMasts.length > 0 ? localMasts : nearbyMasts;
  const isShowingNearby = localMasts.length === 0 && nearbyMasts.length > 0;
  const isEmptyArea = localMasts.length === 0 && nearbyMasts.length === 0 && center !== null;

  // Zoom level: LGA gets street-level, state gets state-level, none gets national
  const zoom = selectedLga ? 14 : selectedState ? 9 : 6;

  const locationLabel = selectedLga && selectedState
    ? `${selectedLga}, ${selectedState}`
    : selectedState
    ? `${selectedState} State`
    : "Select a location";

  const tile = TILE_LAYERS[activeTile];

  return (
    <div className="flex flex-col h-full -m-4">
      {/* ── Floating header bar ──────────────────────────────────────────── */}
      <div className="absolute top-2 left-14 right-4 z-[1000] pointer-events-none">
        <div className="flex items-center justify-between">
          {/* Location badge */}
          <div className="pointer-events-auto glass-panel px-4 py-2.5 flex items-center gap-3 shadow-lg">
            <Navigation className="h-4 w-4 text-primary" />
            <div>
              <p className="text-sm font-bold text-foreground">{locationLabel}</p>
              {isShowingNearby && (
                <p className="text-[10px] text-warning font-medium">
                  No masts here — showing {nearbyMasts.length} nearest within {MAX_NEARBY_KM}km
                </p>
              )}
              {isEmptyArea && (
                <p className="text-[10px] text-muted-foreground">
                  No masts within {MAX_NEARBY_KM}km of this location
                </p>
              )}
              {localMasts.length > 0 && (
                <p className="text-[10px] text-muted-foreground">
                  {localMasts.length} mast{localMasts.length !== 1 ? "s" : ""} in this area
                </p>
              )}
            </div>
          </div>

          {/* Health legend */}
          <div className="pointer-events-auto glass-panel px-3 py-2 flex items-center gap-3 text-[10px] font-mono shadow-lg">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-green-500" /> Healthy
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" /> Alarm
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-900" /> Vandalised
            </span>
          </div>
        </div>
      </div>

      {/* ── Full-screen map ──────────────────────────────────────────────── */}
      <div className="flex-1 relative">
        <MapContainer
          bounds={NIGERIA_BOUNDS}
          minZoom={6}
          maxZoom={tile.maxZoom ?? 18}
          zoomControl={false}
          className="h-full w-full z-0"
          style={{ background: "#0f172a" }}
          maxBounds={[[3.5, 2.0], [14.5, 15.5]]}
          maxBoundsViscosity={1.0}
        >
          <TileLayer
            key={activeTile}
            url={tile.url}
            attribution={tile.attribution}
            tileSize={tile.tileSize ?? 256}
            zoomOffset={tile.zoomOffset ?? 0}
            maxZoom={tile.maxZoom ?? 19}
            detectRetina={!tile.tileSize}
          />

          <MapController center={center} mastsInView={mastsInView} zoom={zoom} />

          {/* Mast markers */}
          {mastsInView.map((mast) => {
            const provider = TELECOM_PROVIDERS.find(p => p.shortName === mast.providerShort);
            const sl = statusLabel(mast);

            return (
              <Marker
                key={mast.id}
                position={[mast.lat, mast.lng]}
                icon={makeIcon(mast)}
                eventHandlers={{ click: () => navigate(`/mast/${mast.id}`) }}
              >
                {/* Permanent label next to each marker */}
                <LeafletTooltip
                  direction="right"
                  offset={[12, 0]}
                  permanent
                  className="geo-mast-label"
                >
                  <div className="text-[10px] font-mono leading-tight">
                    <div className="font-bold">{mast.name}</div>
                    <div style={{ color: sl.color }} className="font-bold text-[9px]">{sl.text}</div>
                  </div>
                </LeafletTooltip>

                {/* Click popup */}
                <Popup className="leaflet-mast-popup" closeButton>
                  <div className="font-sans text-xs space-y-1.5 min-w-[200px]">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: provider?.color }} />
                      <span className="font-bold text-sm" style={{ color: provider?.color }}>{mast.provider}</span>
                    </div>
                    <p className="font-bold">{mast.name}</p>
                    <div className="border-t border-gray-600 pt-1 space-y-0.5 text-[10px]">
                      <p>{mast.lga}, {mast.state}</p>
                      <p>{mast.address}</p>
                      <p className="font-bold" style={{ color: sl.color }}>
                        {sl.text}
                        {mast.tampered > 0 && ` (${mast.tampered} tampering events)`}
                      </p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/mast/${mast.id}`); }}
                      className="w-full mt-1 px-2 py-1 rounded text-[10px] font-semibold text-white"
                      style={{ backgroundColor: provider?.color || "#6366f1" }}
                    >
                      Open Mast Dashboard &rarr;
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {/* ── Tile layer switcher ────────────────────────────────────────── */}
        <div className="absolute bottom-4 left-4 z-[1000]">
          <div className="relative">
            <button
              onClick={() => setShowTileMenu(!showTileMenu)}
              className="glass-panel p-2 hover:bg-secondary transition-colors flex items-center gap-1.5 shadow-lg"
              title="Change map style"
            >
              <Layers className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-[10px] font-mono text-muted-foreground">{tile.label}</span>
            </button>
            {showTileMenu && (
              <div className="absolute bottom-full left-0 mb-1 glass-panel p-1 min-w-[120px] space-y-0.5 shadow-lg">
                {Object.entries(TILE_LAYERS).map(([key, layer]) => (
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
      </div>
    </div>
  );
};

export default GeoLocation;
