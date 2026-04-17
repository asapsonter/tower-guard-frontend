import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Monitor, Activity, Volume2, Droplets, Thermometer,
  Shield, AlertTriangle, Camera, X, Timer,
} from "lucide-react";
import LiveVideoFeed from "@/components/dashboard/LiveVideoFeed";
import RealTimeAlerts from "@/components/dashboard/RealTimeAlerts";
import SensorStatusPanel from "@/components/dashboard/SensorStatusPanel";
import AlarmControls from "@/components/dashboard/AlarmControls";
import FirstResponderDispatch from "@/components/dashboard/FirstResponderDispatch";
import EventLogTable from "@/components/dashboard/EventLogTable";
import { useSimulation } from "@tower-guard/hooks";

// ── Site ambient readings (cabinet/enclosure sensors, not outdoor weather) ──
const AMBIENT = {
  temp: 28,           // °C — cabinet interior
  humidity: 54,       // %RH
  noise: 42,          // dB ambient noise at mast base
  airQuality: "Good", // particulate/gas summary
  vibration: 0.12,    // g — passive vibration floor
};

// ── SLA Countdown ──────────────────────────────────────────────────────────
const SLA_LIMIT_SECONDS = 900; // 15 minutes

interface DispatchTimer {
  id: string;
  label: string;
  dispatchedAt: number;
}

const formatCountdown = (seconds: number) => {
  const abs = Math.abs(seconds);
  const m = Math.floor(abs / 60);
  const s = abs % 60;
  const sign = seconds < 0 ? "+" : "";
  return `${sign}${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
};

// ── Intruder Snapshot Gallery ──────────────────────────────────────────────
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5050";

function resolveUrl(url?: string) {
  if (!url) return null;
  if (url.startsWith("/")) return `${API_BASE_URL}${url}`;
  return url;
}

// ── Main component ─────────────────────────────────────────────────────────
const LiveMonitoring = () => {
  const {
    alerts,
    events,
    sensors,
    triggeredSensors,
  } = useSimulation();

  const criticalAlert = alerts.find(a => a.severity === "critical");

  // ── SLA dispatch timers — track when a dispatch is triggered ─────────────
  const [dispatches, setDispatches] = useState<DispatchTimer[]>([]);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Auto-create a dispatch timer when a critical alert appears
  useEffect(() => {
    if (!criticalAlert) return;
    setDispatches(prev => {
      if (prev.some(d => d.id === criticalAlert.id)) return prev;
      return [
        ...prev,
        {
          id: criticalAlert.id,
          label: `${criticalAlert.eventType} — ${criticalAlert.sensorName}`,
          dispatchedAt: Date.now(),
        },
      ].slice(-4); // keep last 4
    });
  }, [criticalAlert]);

  // ── Intruder snapshots from events ───────────────────────────────────────
  const snapshots = useMemo(
    () => events.filter(e => e.hasSnapshot && e.snapshotUrl).slice(0, 8),
    [events],
  );
  const [expandedSnapshot, setExpandedSnapshot] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Monitor className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-bold text-foreground">Live Monitoring</h1>
        </div>
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-success/10 border border-success/30 text-[10px] font-semibold text-success">
          <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
          LIVE
        </span>
      </div>

      {/* ── Row 1: Video + Alerts ───────────────────────────────────────── */}
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-8">
          <LiveVideoFeed />
        </div>
        <div className="col-span-12 lg:col-span-4">
          <RealTimeAlerts alerts={alerts} />
        </div>
      </div>

      {/* ── Row 2: Site Ambient + SLA Countdown ─────────────────────────── */}
      <div className="grid grid-cols-12 gap-4">
        {/* Ambient + SLA stacked */}
        <div className="col-span-12 flex flex-col gap-4 lg:grid lg:grid-cols-2">
          {/* Site Ambient */}
          <div className="glass-panel">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50">
              <Activity className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">Site Ambient</span>
              <span className="text-[9px] text-muted-foreground ml-auto font-mono">Cabinet sensors</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4">
              {[
                { icon: Thermometer, label: "Temperature", value: `${AMBIENT.temp}°C`, sub: AMBIENT.temp > 40 ? "Above threshold" : "Nominal", color: AMBIENT.temp > 40 ? "text-warning" : "text-orange-400" },
                { icon: Droplets, label: "Humidity", value: `${AMBIENT.humidity}%`, sub: AMBIENT.humidity > 80 ? "Condensation risk" : "Nominal", color: "text-cyan-400" },
                { icon: Volume2, label: "Noise", value: `${AMBIENT.noise} dB`, sub: AMBIENT.noise > 70 ? "Elevated" : "Quiet", color: AMBIENT.noise > 70 ? "text-warning" : "text-success" },
                { icon: Activity, label: "Vibration", value: `${AMBIENT.vibration.toFixed(2)} g`, sub: AMBIENT.airQuality, color: "text-blue-400" },
              ].map(w => (
                <div key={w.label} className="flex items-center gap-2.5">
                  <w.icon className={`h-5 w-5 ${w.color} shrink-0`} />
                  <div>
                    <p className="text-[9px] text-muted-foreground">{w.label}</p>
                    <p className="text-sm font-bold text-foreground">{w.value}</p>
                    <p className="text-[9px] text-muted-foreground">{w.sub}</p>
                  </div>
                </div>
              ))}
            </div>
            {(AMBIENT.temp > 40 || AMBIENT.humidity > 80 || AMBIENT.noise > 70) && (
              <div className="px-4 pb-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-warning/10 border border-warning/30">
                  <AlertTriangle className="h-3.5 w-3.5 text-warning shrink-0" />
                  <span className="text-[10px] text-warning font-medium">
                    Ambient conditions outside normal operating envelope
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* SLA Countdown for Active Dispatches */}
          <div className="glass-panel flex-1">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50">
              <Timer className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">NSCDC Dispatch SLA</span>
              <span className="text-[9px] text-muted-foreground ml-auto">Target: 15 min</span>
            </div>
            <div className="p-4">
              {dispatches.length === 0 ? (
                <div className="text-center py-4">
                  <Shield className="h-6 w-6 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">No active dispatches</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {dispatches.map(d => {
                    const elapsed = Math.floor((now - d.dispatchedAt) / 1000);
                    const remaining = SLA_LIMIT_SECONDS - elapsed;
                    const percent = Math.min((elapsed / SLA_LIMIT_SECONDS) * 100, 100);
                    const isBreach = remaining <= 0;
                    const isWarning = remaining > 0 && remaining < SLA_LIMIT_SECONDS * 0.33;

                    return (
                      <div
                        key={d.id}
                        className={`rounded-lg border px-3 py-2.5 ${
                          isBreach ? "border-destructive/50 bg-destructive/5"
                          : isWarning ? "border-warning/50 bg-warning/5"
                          : "border-border/50"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <p className="text-[10px] text-muted-foreground truncate max-w-[200px]">{d.label}</p>
                          <span className={`text-sm font-mono font-bold ${
                            isBreach ? "text-destructive animate-pulse"
                            : isWarning ? "text-warning"
                            : "text-foreground"
                          }`}>
                            {isBreach ? "BREACH " : "ETA "}
                            {formatCountdown(remaining)}
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              isBreach ? "bg-destructive" : isWarning ? "bg-warning" : "bg-primary"
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Row 3: Intruder Snapshot Gallery ────────────────────────────── */}
      <div className="glass-panel">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50">
          <Camera className="h-4 w-4 text-destructive" />
          <span className="text-sm font-semibold text-foreground">Intruder Snapshots</span>
          <span className="text-[9px] text-muted-foreground ml-auto">{snapshots.length} captures</span>
        </div>
        {snapshots.length === 0 ? (
          <div className="p-6 text-center">
            <Camera className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">No snapshots captured yet. Snapshots appear when alerts fire.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 p-3">
            {snapshots.map(snap => {
              const src = resolveUrl(snap.snapshotUrl);
              if (!src) return null;
              return (
                <button
                  key={snap.id}
                  onClick={() => setExpandedSnapshot(src)}
                  className="group relative rounded-lg overflow-hidden border border-border/50 hover:border-destructive/50 transition-colors"
                >
                  <img src={src} alt="Intruder" className="w-full aspect-square object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute bottom-0 left-0 right-0 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-[8px] font-mono text-white truncate">{snap.eventType}</p>
                    <p className="text-[7px] text-white/70">{snap.timestamp}</p>
                  </div>
                  <div className="absolute top-1 right-1">
                    <span className="h-2 w-2 rounded-full bg-destructive block animate-pulse" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Expanded snapshot modal */}
      <AnimatePresence>
        {expandedSnapshot && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center"
            onClick={() => setExpandedSnapshot(null)}
          >
            <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }} className="relative max-w-lg" onClick={e => e.stopPropagation()}>
              <img src={expandedSnapshot} alt="Intruder snapshot" className="rounded-lg border border-destructive/50" />
              <button onClick={() => setExpandedSnapshot(null)} className="absolute -top-3 -right-3 bg-destructive rounded-full p-1">
                <X className="h-4 w-4 text-destructive-foreground" />
              </button>
              <div className="absolute bottom-3 left-3 bg-destructive/90 px-3 py-1 rounded text-xs font-bold text-destructive-foreground">
                INTRUDER SNAPSHOT
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Row 4: Activity Timeline (Event Log) ───────────────────────── */}
      <EventLogTable events={events} />

      {/* ── Row 5: Sensors + Alarm + Dispatch ──────────────────────────── */}
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 md:col-span-4">
          <SensorStatusPanel sensors={sensors} />
        </div>
        <div className="col-span-12 md:col-span-4">
          <AlarmControls />
        </div>
        <div className="col-span-12 md:col-span-4">
          <FirstResponderDispatch
            incidentId={criticalAlert?.id}
            incidentType={criticalAlert?.eventType}
            location={criticalAlert?.sensorName}
          />
        </div>
      </div>
    </div>
  );
};

export default LiveMonitoring;
