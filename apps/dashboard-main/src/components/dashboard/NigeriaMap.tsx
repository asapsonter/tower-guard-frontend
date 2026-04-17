import { useState } from "react";
import { MapPin, Signal } from "lucide-react";
import { mockTelecomMasts, type TelecomMast } from "@tower-guard/data";
import { motion } from "framer-motion";

const statusColors = {
  secure: "bg-success",
  alert: "bg-warning",
  critical: "bg-destructive",
};

const NigeriaMap = () => {
  const [hoveredMast, setHoveredMast] = useState<TelecomMast | null>(null);

  // Map Nigeria bounding box to percentage coords
  // Lat: ~4 to ~14, Lng: ~2.5 to ~14.5
  const toPosition = (lat: number, lng: number) => ({
    left: `${((lng - 2.5) / 12) * 100}%`,
    top: `${((14 - lat) / 10) * 100}%`,
  });

  const criticalCount = mockTelecomMasts.filter(m => m.status === "critical").length;
  const alertCount = mockTelecomMasts.filter(m => m.status === "alert").length;
  const secureCount = mockTelecomMasts.filter(m => m.status === "secure").length;

  return (
    <div className="glass-panel flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">National Telecom Mast Overview</span>
        </div>
        <div className="flex items-center gap-3 text-[10px] font-mono">
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-destructive" />{criticalCount} Critical</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-warning" />{alertCount} Alert</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-success" />{secureCount} Secure</span>
        </div>
      </div>

      <div className="relative min-h-[400px] bg-secondary/30 overflow-hidden">
        {/* Nigeria outline shape - simplified SVG */}
        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
          <path
            d="M15,15 L25,10 L35,8 L50,10 L65,8 L75,12 L82,18 L85,30 L88,42 L85,55 L80,62 L75,68 L70,75 L60,80 L50,85 L40,88 L30,85 L22,78 L18,70 L15,60 L12,48 L10,35 L12,25 Z"
            fill="none"
            stroke="hsl(var(--border))"
            strokeWidth="0.5"
            opacity="0.5"
          />
          {/* Grid lines */}
          {[20, 40, 60, 80].map(v => (
            <g key={v}>
              <line x1={v} y1="0" x2={v} y2="100" stroke="hsl(var(--border))" strokeWidth="0.2" opacity="0.3" />
              <line x1="0" y1={v} x2="100" y2={v} stroke="hsl(var(--border))" strokeWidth="0.2" opacity="0.3" />
            </g>
          ))}
        </svg>

        {/* Mast icons */}
        {mockTelecomMasts.map((mast) => {
          const pos = toPosition(mast.lat, mast.lng);
          return (
            <div
              key={mast.id}
              className="absolute group cursor-pointer"
              style={{ ...pos, transform: "translate(-50%, -50%)" }}
              onMouseEnter={() => setHoveredMast(mast)}
              onMouseLeave={() => setHoveredMast(null)}
            >
              {mast.status === "critical" && (
                <span className="absolute inset-0 rounded-full bg-destructive/30 animate-ping" style={{ width: 20, height: 20, margin: "-4px" }} />
              )}
              <div className={`relative h-3 w-3 rounded-full border border-background ${statusColors[mast.status]}`}>
                {/* Mini digits */}
                <div className="absolute -top-4 left-3 flex gap-1 whitespace-nowrap pointer-events-none">
                  <span className="text-[7px] font-mono bg-background/80 px-0.5 rounded text-warning">T:{mast.tampered}</span>
                  <span className="text-[7px] font-mono bg-background/80 px-0.5 rounded text-destructive">I:{mast.intruders}</span>
                </div>
              </div>

              {/* Tooltip on hover */}
              {hoveredMast?.id === mast.id && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 z-20 bg-popover border border-border rounded-lg p-2.5 min-w-[180px] shadow-lg"
                >
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Signal className="h-3 w-3 text-primary" />
                    <span className="text-[11px] font-bold text-foreground">{mast.name}</span>
                  </div>
                  <div className="space-y-0.5 text-[10px] text-muted-foreground">
                    <p>State: <span className="text-foreground">{mast.state}</span></p>
                    <p>LGA: <span className="text-foreground">{mast.lga}</span></p>
                    <p>Tampered: <span className="text-warning font-medium">{mast.tampered}x</span></p>
                    <p>Intruders: <span className="text-destructive font-medium">{mast.intruders}</span></p>
                    <p>Status: <span className={`font-medium ${mast.status === "critical" ? "text-destructive" : mast.status === "alert" ? "text-warning" : "text-success"}`}>{mast.status.toUpperCase()}</span></p>
                  </div>
                </motion.div>
              )}
            </div>
          );
        })}

        {/* Region labels */}
        {[
          { label: "NW", x: 25, y: 20 },
          { label: "NE", x: 75, y: 20 },
          { label: "NC", x: 45, y: 38 },
          { label: "SW", x: 20, y: 60 },
          { label: "SE", x: 65, y: 70 },
          { label: "SS", x: 45, y: 78 },
        ].map((zone) => (
          <span
            key={zone.label}
            className="absolute text-[9px] font-mono text-muted-foreground/40 pointer-events-none"
            style={{ left: `${zone.x}%`, top: `${zone.y}%` }}
          >
            {zone.label}
          </span>
        ))}
      </div>
    </div>
  );
};

export default NigeriaMap;
