import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Signal, Eye } from "lucide-react";
import { GEOPOLITICAL_ZONES, ZONE_STATES, mockTelecomMasts, TELECOM_PROVIDERS } from "@tower-guard/data";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const zoneColors = [
  "border-primary/40 bg-primary/5",
  "border-destructive/40 bg-destructive/5",
  "border-success/40 bg-success/5",
  "border-warning/40 bg-warning/5",
  "border-purple-500/40 bg-purple-500/5",
  "border-cyan-500/40 bg-cyan-500/5",
];

const PIE_COLORS = ["hsl(0, 72%, 51%)", "hsl(25, 95%, 53%)", "hsl(271, 91%, 65%)", "hsl(346, 77%, 50%)", "hsl(207, 90%, 54%)"];
const BAR_COLOR = "hsl(207, 90%, 54%)";

function getIncidentsByType(zone: string) {
  const states = ZONE_STATES[zone] || [];
  const masts = mockTelecomMasts.filter(m => states.includes(m.state));
  const base = masts.length || 5;
  return [
    { name: "Intruder", value: Math.floor(Math.random() * base * 3) + 5 },
    { name: "Tampering", value: Math.floor(Math.random() * base * 2) + 8 },
    { name: "Vandalism", value: Math.floor(Math.random() * base * 2) + 3 },
    { name: "Armed attack", value: Math.floor(Math.random() * base) + 2 },
  ];
}

function getAlertsOverTime() {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return days.map(day => ({ day, alerts: Math.floor(Math.random() * 30) + 5 }));
}

const ZonalCenters = () => {
  const [selectedZone, setSelectedZone] = useState<string>(GEOPOLITICAL_ZONES[0]);
  const navigate = useNavigate();

  const pieData = useMemo(() => getIncidentsByType(selectedZone), [selectedZone]);
  const barData = useMemo(() => getAlertsOverTime(), [selectedZone]);

  const states = ZONE_STATES[selectedZone] || [];
  const masts = mockTelecomMasts.filter(m => states.includes(m.state));
  const critical = masts.filter(m => m.status === "critical").length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-foreground">Zonal Coverage</h1>
        <p className="text-[10px] text-muted-foreground italic">Some data may be restricted based on your user role.</p>
      </div>

      {/* Zone Selector */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] font-mono text-muted-foreground">SELECT ZONE:</span>
        {GEOPOLITICAL_ZONES.map((zone) => (
          <button key={zone} onClick={() => setSelectedZone(zone)}
            className={`px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all ${selectedZone === zone ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}>
            {zone}
          </button>
        ))}
      </div>

      {/* Zone Summary */}
      <div className="glass-panel p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            <span className="text-sm font-bold text-foreground">{selectedZone} Zone</span>
          </div>
          <div className="flex items-center gap-3 text-[10px] font-mono text-muted-foreground">
            <span className="flex items-center gap-1"><Signal className="h-3 w-3" />{masts.length} Masts</span>
            <span>{states.length} States</span>
            {critical > 0 && (
              <span className="text-[10px] font-mono bg-destructive/20 text-destructive px-2 py-0.5 rounded-full">{critical} CRITICAL</span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {states.map(s => (
            <span key={s} className="px-2 py-0.5 rounded bg-secondary text-[10px] text-secondary-foreground">{s}</span>
          ))}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-panel p-4">
          <h3 className="text-xs font-bold text-foreground mb-4">Incidents by Type (Last 30 Days)</h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value" stroke="none">
                  {pieData.map((_, i) => (<Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "11px", color: "hsl(var(--foreground))" }} />
                <Legend wrapperStyle={{ fontSize: "10px" }} formatter={(value) => <span className="text-muted-foreground">{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel p-4">
          <h3 className="text-xs font-bold text-foreground mb-4">Alerts Over Time (Past Week)</h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "11px", color: "hsl(var(--foreground))" }} />
                <Bar dataKey="alerts" fill={BAR_COLOR} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* All Masts in Selected Zone */}
      <div className="glass-panel p-4">
        <h3 className="text-xs font-bold text-foreground mb-3">All Telecom Masts in {selectedZone} ({masts.length})</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-3 text-muted-foreground font-mono">Name</th>
                <th className="text-left py-2 px-3 text-muted-foreground font-mono">Provider</th>
                <th className="text-left py-2 px-3 text-muted-foreground font-mono">State</th>
                <th className="text-left py-2 px-3 text-muted-foreground font-mono">LGA</th>
                <th className="text-left py-2 px-3 text-muted-foreground font-mono">Status</th>
                <th className="text-left py-2 px-3 text-muted-foreground font-mono">Fuel</th>
                <th className="text-left py-2 px-3 text-muted-foreground font-mono">Battery</th>
                <th className="text-left py-2 px-3 text-muted-foreground font-mono">Incidents</th>
                <th className="text-right py-2 px-3 text-muted-foreground font-mono">Action</th>
              </tr>
            </thead>
            <tbody>
              {masts.map(mast => {
                const provider = TELECOM_PROVIDERS.find(p => p.shortName === mast.providerShort);
                return (
                  <tr key={mast.id} className="border-b border-border/50 hover:bg-secondary/50 transition-colors">
                    <td className="py-2 px-3 font-semibold text-foreground">{mast.name}</td>
                    <td className="py-2 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold" style={{ backgroundColor: provider?.color + "20", color: provider?.color }}>
                        {mast.providerShort}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-muted-foreground">{mast.state}</td>
                    <td className="py-2 px-3 text-muted-foreground">{mast.lga}</td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        mast.status === "critical" ? "bg-destructive/20 text-destructive" : mast.status === "alert" ? "bg-warning/20 text-warning" : "bg-success/20 text-success"
                      }`}>
                        {mast.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-1">
                        <div className="w-12 h-1.5 rounded-full bg-secondary overflow-hidden">
                          <div className={`h-full rounded-full ${mast.generatorFuel < 30 ? "bg-destructive" : mast.generatorFuel < 50 ? "bg-warning" : "bg-success"}`}
                            style={{ width: `${mast.generatorFuel}%` }} />
                        </div>
                        <span className="text-muted-foreground">{mast.generatorFuel}%</span>
                      </div>
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-1">
                        <div className="w-12 h-1.5 rounded-full bg-secondary overflow-hidden">
                          <div className={`h-full rounded-full ${mast.batteryCharge < 50 ? "bg-destructive" : mast.batteryCharge < 75 ? "bg-warning" : "bg-success"}`}
                            style={{ width: `${mast.batteryCharge}%` }} />
                        </div>
                        <span className="text-muted-foreground">{mast.batteryCharge}%</span>
                      </div>
                    </td>
                    <td className="py-2 px-3 text-muted-foreground">T:{mast.tampered} I:{mast.intruders}</td>
                    <td className="py-2 px-3 text-right">
                      <button onClick={() => navigate(`/mast/${mast.id}`)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-primary/10 text-primary text-[10px] font-semibold hover:bg-primary/20 transition-colors">
                        <Eye className="h-3 w-3" /> View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Zone Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {GEOPOLITICAL_ZONES.map((zone, i) => {
          const zStates = ZONE_STATES[zone] || [];
          const zMasts = mockTelecomMasts.filter(m => zStates.includes(m.state));
          const zCritical = zMasts.filter(m => m.status === "critical").length;

          return (
            <div key={zone} className={`glass-panel border ${zoneColors[i]} p-4 space-y-3 cursor-pointer transition-all ${selectedZone === zone ? "ring-1 ring-primary" : "hover:ring-1 hover:ring-border"}`}
              onClick={() => setSelectedZone(zone)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  <span className="text-sm font-bold text-foreground">{zone}</span>
                </div>
                {zCritical > 0 && (
                  <span className="text-[10px] font-mono bg-destructive/20 text-destructive px-2 py-0.5 rounded-full">{zCritical} CRITICAL</span>
                )}
              </div>
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1"><Signal className="h-3 w-3" />{zMasts.length} Masts</span>
                <span>{zStates.length} States</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {zStates.map(s => (
                  <span key={s} className="px-2 py-0.5 rounded bg-secondary text-[10px] text-secondary-foreground">{s}</span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ZonalCenters;
