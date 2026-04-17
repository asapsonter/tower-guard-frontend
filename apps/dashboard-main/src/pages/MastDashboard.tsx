import { useParams, useNavigate } from "react-router-dom";
import { useMemo } from "react";
import { ArrowLeft, Signal, MapPin, Wrench, Fuel, Building2, AlertTriangle, Thermometer, Droplets, Volume2, Activity } from "lucide-react";
import { TELECOM_PROVIDERS } from "@tower-guard/data";
import LiveVideoFeed from "@/components/dashboard/LiveVideoFeed";
import SensorStatusPanel from "@/components/dashboard/SensorStatusPanel";
import AlarmControls from "@/components/dashboard/AlarmControls";
import AssetHealth from "@/components/dashboard/AssetHealth";
import { useSimulation } from "@tower-guard/hooks";
import AlertDispatchPopup from "@/components/dashboard/AlertDispatchPopup";

const MastDashboard = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { alerts, sensors, masts } = useSimulation();

  const mast = useMemo(() => masts.find(m => m.id === id), [id, masts]);

  if (!mast) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <AlertTriangle className="h-12 w-12 text-warning" />
        <p className="text-foreground font-semibold">Mast not found</p>
        <button onClick={() => navigate("/")} className="text-primary hover:underline text-sm">← Back to Dashboard</button>
      </div>
    );
  }

  const provider = TELECOM_PROVIDERS.find(p => p.shortName === mast.providerShort);
  const statusColor = mast.status === "critical" ? "text-destructive" : mast.status === "alert" ? "text-warning" : "text-success";
  const statusBg = mast.status === "critical" ? "bg-destructive/10 border-destructive/30" : mast.status === "alert" ? "bg-warning/10 border-warning/30" : "bg-success/10 border-success/30";

  // Derive device-level active/dead for quick stats
  const fuelStatus = mast.generatorFuel > 15 ? "Active" : "Dead";
  const fuelStatusColor = fuelStatus === "Active" ? "text-success" : "text-destructive";

  return (
    <div className="space-y-4">
      <AlertDispatchPopup alerts={alerts} />

      {/* Dynamic Header: Site View */}
      <div className="glass-panel p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-secondary transition-colors">
              <ArrowLeft className="h-5 w-5 text-muted-foreground" />
            </button>
            <div
              className="h-10 w-10 rounded-lg flex items-center justify-center text-xs font-bold"
              style={{ backgroundColor: provider?.color + "20", color: provider?.color, border: `1px solid ${provider?.color}40` }}
            >
              {mast.providerShort}
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">Site View: {mast.name}</h1>
              <p className="text-xs text-muted-foreground">{mast.provider} • {mast.address}</p>
            </div>
          </div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${statusBg}`}>
            <span className={`h-2.5 w-2.5 rounded-full ${mast.status === "critical" ? "bg-destructive animate-blink" : mast.status === "alert" ? "bg-warning" : "bg-success"}`} />
            <span className={`text-sm font-bold ${statusColor}`}>{mast.status.toUpperCase()}</span>
          </div>
        </div>
      </div>

      {/* Quick Stats — no battery, use Active/Dead */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {[
          { label: "State", value: mast.state, icon: MapPin, color: "text-primary", isStatus: false },
          { label: "LGA", value: mast.lga, icon: Building2, color: "text-primary", isStatus: false },
          { label: "Tower Height", value: `${mast.towerHeight}m`, icon: Signal, color: "text-foreground", isStatus: false },
          { label: "Generator", value: fuelStatus, icon: Fuel, color: fuelStatusColor, isStatus: true },
          { label: "Last Maintenance", value: mast.lastMaintenance, icon: Wrench, color: "text-muted-foreground", isStatus: false },
        ].map(stat => (
          <div key={stat.label} className="glass-panel p-3 text-center">
            <stat.icon className={`h-4 w-4 mx-auto mb-1 ${stat.color}`} />
            {stat.isStatus ? (
              <div className="flex items-center justify-center gap-1.5">
                <span className={`h-2.5 w-2.5 rounded-full ${stat.value === "Active" ? "bg-success" : "bg-destructive animate-blink"}`} />
                <p className={`text-sm font-bold ${stat.color}`}>{stat.value}</p>
              </div>
            ) : (
              <p className={`text-sm font-bold ${stat.color}`}>{stat.value}</p>
            )}
            <p className="text-[10px] text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Site Ambient + Incident summary side by side */}
      <div className="grid grid-cols-12 gap-4">
        {/* Site Ambient — replaces the street-level map */}
        <div className="col-span-12 lg:col-span-7 glass-panel overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/50">
            <Activity className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold text-foreground">Site Ambient</span>
            <span className="ml-auto text-[9px] font-mono text-muted-foreground">Cabinet sensors</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4">
            {[
              { icon: Thermometer, label: "Temperature", value: "28°C", sub: "Nominal", color: "text-orange-400" },
              { icon: Droplets, label: "Humidity", value: "54%", sub: "Nominal", color: "text-cyan-400" },
              { icon: Volume2, label: "Noise", value: "42 dB", sub: "Quiet", color: "text-success" },
              { icon: Activity, label: "Vibration", value: "0.12 g", sub: "Idle floor", color: "text-blue-400" },
            ].map(a => (
              <div key={a.label} className="flex items-center gap-2.5">
                <a.icon className={`h-5 w-5 ${a.color} shrink-0`} />
                <div>
                  <p className="text-[9px] text-muted-foreground">{a.label}</p>
                  <p className="text-sm font-bold text-foreground">{a.value}</p>
                  <p className="text-[9px] text-muted-foreground">{a.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Incident summary cards */}
        <div className="col-span-12 lg:col-span-5 grid grid-cols-2 gap-3 content-start">
          <div className="glass-panel p-4 text-center">
            <p className="text-3xl font-bold text-destructive">{mast.tampered}</p>
            <p className="text-xs text-muted-foreground mt-1">Tampering Events</p>
          </div>
          <div className="glass-panel p-4 text-center">
            <p className="text-3xl font-bold text-warning">{mast.intruders}</p>
            <p className="text-xs text-muted-foreground mt-1">Intruder Detections</p>
          </div>
          <div className="glass-panel p-4 text-center">
            <p className="text-3xl font-bold text-foreground">{mast.towerHeight}m</p>
            <p className="text-xs text-muted-foreground mt-1">Tower Height</p>
          </div>
          <div className="glass-panel p-4 text-center">
            <p className={`text-3xl font-bold ${mast.generatorFuel > 30 ? "text-success" : "text-destructive"}`}>
              {mast.generatorFuel}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">Generator Fuel</p>
          </div>
        </div>
      </div>

      {/* Live Feed */}
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12">
          <LiveVideoFeed />
        </div>
      </div>

      {/* Device Status + Asset Health */}
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-5">
          <SensorStatusPanel sensors={sensors} />
        </div>
        <div className="col-span-12 lg:col-span-7">
          <AssetHealth />
        </div>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 md:col-span-6">
          <AlarmControls />
        </div>
        <div className="col-span-12 md:col-span-6">
          <div className="glass-panel p-4">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-3">Security Timeline</p>
            <div className="space-y-2">
              {[
                { time: "14:32", event: "Perimeter scan completed", status: "secure" },
                { time: "13:15", event: "Generator refueled", status: "secure" },
                { time: "11:48", event: "Motion detected - Sector B", status: "alert" },
                { time: "09:20", event: "Daily system check passed", status: "secure" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground font-mono w-12">{item.time}</span>
                  <span className={`h-1.5 w-1.5 rounded-full ${item.status === "alert" ? "bg-warning" : "bg-success"}`} />
                  <span className="text-foreground">{item.event}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MastDashboard;
