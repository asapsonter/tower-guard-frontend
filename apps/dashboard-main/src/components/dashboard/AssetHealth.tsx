import { useState, useEffect } from "react";
import { Activity, Fuel, Radio } from "lucide-react";

interface AssetMetric {
  id: string;
  name: string;
  icon: typeof Fuel;
  metrics: { label: string; value: number; unit: string; max: number; warning: number; critical: number }[];
}

const ASSETS: AssetMetric[] = [
  {
    id: "gen", name: "Generator", icon: Fuel,
    metrics: [
      { label: "Fuel Level", value: 75, unit: "%", max: 100, warning: 30, critical: 15 },
      { label: "Engine Temp", value: 82, unit: "°C", max: 120, warning: 95, critical: 105 },
      { label: "Runtime", value: 342, unit: "hrs", max: 500, warning: 420, critical: 475 },
    ],
  },
  {
    id: "twr", name: "Tower", icon: Radio,
    metrics: [
      { label: "Structural Integrity", value: 99.5, unit: "%", max: 100, warning: 90, critical: 80 },
      { label: "Tilt Angle", value: 0.2, unit: "°", max: 5, warning: 2, critical: 3.5 },
      { label: "Vibration", value: 0.03, unit: "g", max: 1, warning: 0.5, critical: 0.8 },
    ],
  },
];

function getStatusColor(value: number, metric: { warning: number; critical: number; max: number }) {
  const isInverse = metric.warning < metric.max * 0.8;
  if (isInverse) {
    if (value >= metric.critical) return "destructive";
    if (value >= metric.warning) return "warning";
    return "success";
  }
  if (value <= metric.critical) return "destructive";
  if (value <= metric.warning) return "warning";
  return "success";
}

function getDeviceStatus(asset: AssetMetric): "active" | "dead" {
  // If any metric is in critical range, device is "dead"
  return asset.metrics.some(m => {
    const isInverse = m.warning < m.max * 0.8;
    return isInverse ? m.value >= m.critical : m.value <= m.critical;
  }) ? "dead" : "active";
}

const AssetHealth = () => {
  const [assets, setAssets] = useState(ASSETS);

  useEffect(() => {
    const interval = setInterval(() => {
      setAssets(prev => prev.map(asset => ({
        ...asset,
        metrics: asset.metrics.map(m => ({
          ...m,
          value: Math.max(0, Math.min(m.max, +(m.value + (Math.random() - 0.5) * (m.max * 0.01)).toFixed(1))),
        })),
      })));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="glass-panel flex flex-col">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50">
        <Activity className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold text-foreground">Asset Health Status</span>
        <span className="text-[10px] text-muted-foreground ml-auto font-mono">PREDICTIVE MAINTENANCE</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-0 divide-x divide-border/30">
        {assets.map(asset => {
          const deviceStatus = getDeviceStatus(asset);
          return (
            <div key={asset.id} className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <asset.icon className="h-4 w-4 text-primary" />
                  <span className="text-xs font-bold text-foreground">{asset.name}</span>
                </div>
                <span className={`flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  deviceStatus === "active" 
                    ? "bg-success/10 text-success border border-success/30" 
                    : "bg-destructive/10 text-destructive border border-destructive/30"
                }`}>
                  <span className={`h-2 w-2 rounded-full ${deviceStatus === "active" ? "bg-success" : "bg-destructive animate-blink"}`} />
                  {deviceStatus === "active" ? "Active" : "Dead"}
                </span>
              </div>
              {asset.metrics.map(metric => {
                const status = getStatusColor(metric.value, metric);
                const pct = (metric.value / metric.max) * 100;
                return (
                  <div key={metric.label} className="space-y-1">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-muted-foreground">{metric.label}</span>
                      <span className={`font-mono font-bold ${
                        status === "destructive" ? "text-destructive" :
                        status === "warning" ? "text-warning" : "text-success"
                      }`}>
                        {metric.value}{metric.unit}
                      </span>
                    </div>
                    <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          status === "destructive" ? "bg-destructive" :
                          status === "warning" ? "bg-warning" : "bg-success"
                        }`}
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AssetHealth;
