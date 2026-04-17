import { useState, useEffect, useCallback } from "react";
import { Badge } from "@tower-guard/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@tower-guard/ui";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye, Shield, AlertTriangle, Video, Activity,
  Scan, Radio, Users, Clock, Crosshair
} from "lucide-react";
import thermalFeed from "@/assets/evidence1.jpeg";

interface Detection {
  id: string;
  type: "Person" | "Vehicle" | "Unknown";
  confidence: number;
  timestamp: string;
}

const SmartMonitoring = () => {
  const [detections, setDetections] = useState<Detection[]>([]);
  const [scanActive, setScanActive] = useState(true);
  const [feedMode, setFeedMode] = useState<"thermal" | "night">("thermal");
  const [scanAngle, setScanAngle] = useState(0);
  const [stats] = useState({
    totalDetections: 0,
    intrudersToday: 0,
    alertsSent: 0,
    uptime: 99.7,
  });

  // Simulate ML detections for the Live Detections log.
  // Bounding-box overlays and the alarm feed have been removed; only the
  // telemetry list remains.
  const simulateDetections = useCallback(() => {
    const numDetections = Math.floor(Math.random() * 3) + 1;
    const newDetections: Detection[] = [];
    for (let i = 0; i < numDetections; i++) {
      newDetections.push({
        id: `det-${Date.now()}-${i}`,
        type: Math.random() > 0.3 ? "Person" : Math.random() > 0.5 ? "Vehicle" : "Unknown",
        confidence: Math.floor(75 + Math.random() * 23),
        timestamp: new Date().toLocaleTimeString(),
      });
    }
    setDetections(newDetections);
  }, []);

  // Simulate detections cycle
  useEffect(() => {
    simulateDetections();
    const interval = setInterval(simulateDetections, 3000);
    return () => clearInterval(interval);
  }, [simulateDetections]);

  // Scan animation
  useEffect(() => {
    const interval = setInterval(() => {
      setScanAngle(prev => (prev + 2) % 360);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Scan className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-bold text-foreground">Smart Monitoring — AI Detection</h1>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs gap-1 border-emerald-500/50 text-emerald-500">
            <Activity className="h-3 w-3" /> ML Engine Active
          </Badge>
          <Badge variant="outline" className="text-xs gap-1 border-primary/50 text-primary">
            <Radio className="h-3 w-3 animate-pulse" /> LWIR + RGB
          </Badge>
        </div>
      </div>

      {/* Feature Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: Crosshair, label: "Intruder Detection", desc: "AI-powered perimeter watch", active: true },
          { icon: AlertTriangle, label: "Suspicious Activity", desc: "Behavioral analysis", active: true },
          { icon: Video, label: "Playback Storage", desc: "30-day cloud retention", active: true },
          { icon: Shield, label: "Smart Alerts", desc: "Instant dispatch notifications", active: true },
        ].map((feat, i) => (
          <Card key={i} className="bg-card/50 border-border/50 hover:border-primary/40 transition-colors cursor-pointer">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <feat.icon className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">{feat.label}</p>
                <p className="text-[10px] text-muted-foreground truncate">{feat.desc}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Feed + Detection Panel */}
      <div className="grid grid-cols-12 gap-4">
        {/* Thermal Feed */}
        <div className="col-span-12 lg:col-span-8">
          <Card className="overflow-hidden border-border/50 bg-black">
            <div className="relative aspect-video">
              <img
                src={thermalFeed}
                alt="Thermal LWIR detection feed"
                className={`w-full h-full object-cover ${feedMode === "night" ? "brightness-75 contrast-125 hue-rotate-[40deg]" : ""}`}
              />

              {/* Scan overlay */}
              {scanActive && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  <div
                    className="absolute top-0 left-1/2 w-px h-full bg-gradient-to-b from-primary/60 via-primary/20 to-transparent origin-bottom"
                    style={{ transform: `rotate(${scanAngle}deg)`, transformOrigin: "50% 100%" }}
                  />
                </div>
              )}

              {/* HUD Overlay */}
              <div className="absolute top-2 left-3 flex items-center gap-2">
                <span className="text-[10px] font-mono text-red-400 bg-black/70 px-2 py-0.5 rounded flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" /> REC
                </span>
                <span className="text-[10px] font-mono text-emerald-400 bg-black/70 px-2 py-0.5 rounded">
                  LWIR + ML
                </span>
              </div>
              <div className="absolute top-2 right-3">
                <span className="text-[10px] font-mono text-white/70 bg-black/70 px-2 py-0.5 rounded">
                  {new Date().toLocaleTimeString()} | CAM-01
                </span>
              </div>
              <div className="absolute bottom-2 left-3 flex items-center gap-2">
                <span className="text-[10px] font-mono text-orange-400 bg-black/70 px-2 py-0.5 rounded">
                  RGB
                </span>
                <span className="text-[9px] font-bold text-white bg-orange-600/80 px-2 py-0.5 rounded">
                  LWIR
                </span>
                <span className="text-[9px] font-bold text-white bg-emerald-600/80 px-2 py-0.5 rounded">
                  ML
                </span>
              </div>

              {/* Scanline effect */}
              <div className="absolute inset-0 pointer-events-none bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.03)_2px,rgba(0,0,0,0.03)_4px)]" />
            </div>

            {/* Feed controls */}
            <div className="flex items-center justify-between px-4 py-2 bg-card border-t border-border/50">
              <div className="flex items-center gap-2">
                {(["thermal", "night"] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setFeedMode(mode)}
                    className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
                      feedMode === mode
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {mode === "thermal" ? "🔥 Thermal" : "🌙 Night Vision"}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setScanActive(!scanActive)}
                  className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
                    scanActive ? "bg-emerald-600/20 text-emerald-400" : "bg-secondary text-muted-foreground"
                  }`}
                >
                  <Scan className="h-3 w-3 inline mr-1" />
                  {scanActive ? "Scanning" : "Paused"}
                </button>
              </div>
            </div>
          </Card>
        </div>

        {/* Detection Log + Stats */}
        <div className="col-span-12 lg:col-span-4 space-y-4">
          {/* Live Detections */}
          <Card className="border-border/50">
            <CardHeader className="pb-2 px-4 pt-3">
              <CardTitle className="text-sm flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-primary" /> Live Detections
                </span>
                <Badge variant="secondary" className="text-[10px]">{detections.length} objects</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3 space-y-2 max-h-[180px] overflow-y-auto">
              <AnimatePresence>
                {detections.map((det) => (
                  <motion.div
                    key={det.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center justify-between p-2 rounded-md bg-secondary/50 border border-border/30"
                  >
                    <div className="flex items-center gap-2">
                      <Users className={`h-3.5 w-3.5 ${det.type === "Person" ? "text-cyan-400" : "text-yellow-400"}`} />
                      <span className="text-xs font-medium text-foreground">{det.type}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-emerald-400">{det.confidence}%</span>
                      <span className="text-[10px] text-muted-foreground">{det.timestamp}</span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </CardContent>
          </Card>

        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Detections", value: stats.totalDetections, icon: Eye, color: "text-primary" },
          { label: "Intruders Today", value: stats.intrudersToday, icon: Users, color: "text-destructive" },
          { label: "Alerts Dispatched", value: stats.alertsSent, icon: AlertTriangle, color: "text-warning" },
          { label: "System Uptime", value: `${stats.uptime}%`, icon: Clock, color: "text-emerald-500" },
        ].map((stat, i) => (
          <Card key={i} className="border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`h-10 w-10 rounded-lg bg-secondary flex items-center justify-center ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">{stat.value}</p>
                <p className="text-[10px] text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default SmartMonitoring;
