/**
 * SiteAreaMap — Real Leaflet map showing the logged-in mast site's council area.
 *
 * Replaces the previous SVG-based NationalCoverageMap. On load, the map:
 *   1. Centers on the logged-in mast site (from VITE_HARDWARE_MAST_ID)
 *   2. Zooms to show the AMAC council area with all masts in the region
 *   3. Highlights the logged-in site with a larger pulsing marker
 *   4. Shows nearby masts with status-colored dots and permanent name labels
 *
 * The component still exports as the default so Index.tsx doesn't need to
 * change its import.
 */
import { useMemo } from "react";
import { MapContainer, TileLayer, Marker, Tooltip as LeafletTooltip, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin, Signal } from "lucide-react";
import { mockTelecomMasts, TELECOM_PROVIDERS, type TelecomMast } from "@tower-guard/data";

// ── Resolve the site mast from env ──────────────────────────────────────────
const HARDWARE_MAST_ID =
  (import.meta.env.VITE_HARDWARE_MAST_ID as string | undefined) ?? "tm_021";

const SITE_MAST = mockTelecomMasts.find((m) => m.id === HARDWARE_MAST_ID);
const SITE_LAT = SITE_MAST?.lat ?? 9.0827;
const SITE_LNG = SITE_MAST?.lng ?? 7.4947;

// ── Status colors ───────────────────────────────────────────────────────────
const STATUS = {
  critical: { fill: "#ef4444", glow: "rgba(239,68,68,0.6)" },
  alert:    { fill: "#f97316", glow: "rgba(249,115,22,0.6)" },
  secure:   { fill: "#22c55e", glow: "rgba(34,197,94,0.5)" },
} as const;

// ── DivIcon factories ───────────────────────────────────────────────────────
const makeDot = (status: keyof typeof STATUS, size: number, isSite = false) => {
  const c = STATUS[status];
  const pulseHtml = isSite
    ? `<div style="position:absolute;inset:0;border-radius:50%;border:2px solid ${c.fill};animation:tg-marker-pulse-anim 2s ease-out infinite;"></div>`
    : "";
  return L.divIcon({
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `
      <div style="position:relative;width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;cursor:pointer;">
        ${pulseHtml}
        <div style="
          width:${isSite ? "70%" : "60%"};height:${isSite ? "70%" : "60%"};border-radius:50%;
          background:${c.fill};border:${isSite ? "3px" : "2px"} solid #fff;
          box-shadow:0 0 0 1px rgba(0,0,0,0.4),0 0 ${isSite ? "16" : "10"}px ${c.glow},0 2px 4px rgba(0,0,0,0.4);
        "></div>
      </div>
    `,
  });
};

// ── Masts in the AMAC council area (within ~0.15 degree radius of the site) ──
// We show all FCT masts that are geographically close to the logged-in site,
// which effectively represents the council area view.
const AREA_RADIUS_DEG = 0.12; // ~13 km radius

const NationalCoverageMap = () => {
  // Masts near the logged-in site
  const areaMasts = useMemo(() => {
    return mockTelecomMasts.filter((m) => {
      const dLat = Math.abs(m.lat - SITE_LAT);
      const dLng = Math.abs(m.lng - SITE_LNG);
      return dLat < AREA_RADIUS_DEG && dLng < AREA_RADIUS_DEG;
    });
  }, []);

  const stats = useMemo(() => ({
    total: areaMasts.length,
    critical: areaMasts.filter(m => m.status === "critical").length,
    alert: areaMasts.filter(m => m.status === "alert").length,
    secure: areaMasts.filter(m => m.status === "secure").length,
  }), [areaMasts]);

  return (
    <div className="glass-panel flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          <div>
            <span className="text-sm font-semibold text-foreground">
              {SITE_MAST?.name ?? "Site Area"} — Council Area
            </span>
            <p className="text-[9px] text-muted-foreground">AMAC, Abuja FCT</p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-[10px] font-mono">
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-destructive" />{stats.critical}</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-warning" />{stats.alert}</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-success" />{stats.secure}</span>
          <span className="flex items-center gap-1"><Signal className="h-3 w-3 text-muted-foreground" />{stats.total}</span>
        </div>
      </div>

      {/* Leaflet map */}
      <div className="relative" style={{ height: 320 }}>
        <MapContainer
          center={[SITE_LAT, SITE_LNG]}
          zoom={13}
          minZoom={10}
          maxZoom={18}
          zoomControl={false}
          className="h-full w-full z-0"
          style={{ background: "#0f172a" }}
        >
          {/* Esri satellite imagery — realistic vegetation-green terrain */}
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            attribution="Imagery &copy; Esri, Maxar, Earthstar Geographics"
            maxNativeZoom={18}
            maxZoom={18}
            className="tg-satellite-tiles"
          />
          {/* Road + place-name overlays so the street context isn't lost */}
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}"
            maxNativeZoom={18}
            maxZoom={18}
            opacity={0.55}
          />
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
            maxNativeZoom={18}
            maxZoom={18}
          />

          {/* Area masts */}
          {areaMasts.map((mast) => {
            const isSite = mast.id === HARDWARE_MAST_ID;
            const provider = TELECOM_PROVIDERS.find(p => p.shortName === mast.providerShort);
            return (
              <Marker
                key={mast.id}
                position={[mast.lat, mast.lng]}
                icon={makeDot(mast.status, isSite ? 28 : 18, isSite)}
                zIndexOffset={isSite ? 1000 : 0}
              >
                <LeafletTooltip
                  direction="right"
                  offset={[10, 0]}
                  permanent={isSite}
                  className="leaflet-mast-name-label"
                >
                  <div className="text-[10px] font-mono leading-tight">
                    <div className="font-bold">{mast.name}</div>
                    <div className="text-[9px] opacity-70">{mast.providerShort} &bull; {mast.lga}</div>
                  </div>
                </LeafletTooltip>
                {!isSite && (
                  <Popup className="leaflet-mast-popup" closeButton>
                    <div className="font-sans text-xs space-y-1 min-w-[160px]">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: provider?.color }} />
                        <span className="font-bold" style={{ color: provider?.color }}>{mast.provider}</span>
                      </div>
                      <p className="font-semibold">{mast.name}</p>
                      <p className="text-[10px] text-muted-foreground">{mast.address}</p>
                      <p className="font-bold text-[10px]" style={{ color: STATUS[mast.status].fill }}>
                        {mast.status.toUpperCase()}
                      </p>
                    </div>
                  </Popup>
                )}
              </Marker>
            );
          })}
        </MapContainer>

        {/* "This Site" badge overlaid on the map */}
        <div className="absolute bottom-3 left-3 z-[1000] glass-panel px-2.5 py-1.5 flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          <span className="text-[9px] font-semibold text-foreground">
            {SITE_MAST?.name ?? "This Site"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default NationalCoverageMap;
