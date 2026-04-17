/**
 * NCC Providers Page
 *
 * Dedicated analytics view for each telecom provider (MTN, Glo, Airtel, 9mobile).
 * Shows mast distribution, health breakdown, incident stats, and SLA per provider.
 * Respects the global provider filter — when a provider is selected, only that
 * provider's card expands with detail; otherwise all four are shown side-by-side.
 */
import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Signal, Shield, AlertTriangle, Activity, MapPin,
  TrendingUp, TrendingDown, Zap, Battery, Fuel,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { mockTelecomMasts, TELECOM_PROVIDERS, type TelecomMast } from "@tower-guard/data";
import type { ProviderShort } from "../App";

// ── Provider-level analytics derived from real mast data ───────────────────
function computeProviderStats(masts: TelecomMast[]) {
  const total = masts.length;
  const secure = masts.filter(m => m.status === "secure").length;
  const alert = masts.filter(m => m.status === "alert").length;
  const critical = masts.filter(m => m.status === "critical").length;
  const tampered = masts.filter(m => m.tampered > 0).length;
  const avgFuel = total > 0 ? Math.round(masts.reduce((s, m) => s + m.generatorFuel, 0) / total) : 0;
  const avgBattery = total > 0 ? Math.round(masts.reduce((s, m) => s + m.batteryCharge, 0) / total) : 0;
  const lowFuel = masts.filter(m => m.generatorFuel < 20).length;
  const lowBattery = masts.filter(m => m.batteryCharge < 20).length;

  // Top 5 states by mast count
  const byState = new Map<string, number>();
  for (const m of masts) byState.set(m.state, (byState.get(m.state) ?? 0) + 1);
  const topStates = [...byState.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([state, count]) => ({ state, count }));

  return { total, secure, alert, critical, tampered, avgFuel, avgBattery, lowFuel, lowBattery, topStates };
}

interface ProvidersProps {
  provider?: ProviderShort | null;
  state?: string | null;
}

export default function Providers({ provider, state: stateFilter }: ProvidersProps) {
  const providers = useMemo(() => {
    const list = provider
      ? TELECOM_PROVIDERS.filter(p => p.shortName === provider)
      : TELECOM_PROVIDERS;

    return list.map(p => {
      let masts = mockTelecomMasts.filter(m => m.providerShort === p.shortName);
      if (stateFilter) masts = masts.filter(m => m.state === stateFilter);
      return { ...p, stats: computeProviderStats(masts) };
    });
  }, [provider, stateFilter]);

  const isFiltered = !!provider;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Signal className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-bold text-foreground">Telecom Providers</h1>
        </div>
        <span className="text-[10px] px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 font-semibold">
          NCC READ-ONLY
        </span>
      </div>

      {/* Provider cards */}
      <div className={`grid gap-4 ${isFiltered ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-2"}`}>
        {providers.map((p, idx) => {
          const s = p.stats;
          const healthPercent = s.total > 0 ? Math.round((s.secure / s.total) * 100) : 0;

          return (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08 }}
              className="glass-panel overflow-hidden"
            >
              {/* Provider header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
                <div className="flex items-center gap-3">
                  <div
                    className="h-9 w-9 rounded-lg flex items-center justify-center font-bold text-sm text-white"
                    style={{ backgroundColor: p.color }}
                  >
                    {p.shortName}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{p.name}</p>
                    <p className="text-[10px] text-muted-foreground">{s.total} monitored masts</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs font-bold ${healthPercent >= 80 ? "text-success" : healthPercent >= 60 ? "text-warning" : "text-destructive"}`}>
                    {healthPercent}%
                  </span>
                  <span className="text-[9px] text-muted-foreground">healthy</span>
                </div>
              </div>

              {/* KPI row */}
              <div className="grid grid-cols-3 md:grid-cols-6 gap-px bg-border/30">
                {[
                  { label: "Secure", value: s.secure, icon: Shield, color: "text-success" },
                  { label: "Alert", value: s.alert, icon: AlertTriangle, color: "text-warning" },
                  { label: "Critical", value: s.critical, icon: Activity, color: "text-destructive" },
                  { label: "Vandalised", value: s.tampered, icon: AlertTriangle, color: "text-rose-700" },
                  { label: "Low Fuel", value: s.lowFuel, icon: Fuel, color: "text-orange-500" },
                  { label: "Low Battery", value: s.lowBattery, icon: Battery, color: "text-yellow-500" },
                ].map(k => (
                  <div key={k.label} className="bg-background px-3 py-2.5 flex items-center gap-2">
                    <k.icon className={`h-3.5 w-3.5 ${k.color} shrink-0`} />
                    <div>
                      <p className="text-[9px] text-muted-foreground">{k.label}</p>
                      <p className="text-sm font-bold text-foreground">{k.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Avg gauges */}
              <div className="grid grid-cols-2 gap-4 px-4 py-3">
                <div>
                  <p className="text-[9px] text-muted-foreground mb-1">Avg Generator Fuel</p>
                  <div className="h-2 rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${s.avgFuel}%`,
                        backgroundColor: s.avgFuel >= 50 ? "#22c55e" : s.avgFuel >= 25 ? "#f97316" : "#ef4444",
                      }}
                    />
                  </div>
                  <p className="text-[10px] font-mono text-foreground mt-0.5">{s.avgFuel}%</p>
                </div>
                <div>
                  <p className="text-[9px] text-muted-foreground mb-1">Avg Battery Charge</p>
                  <div className="h-2 rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${s.avgBattery}%`,
                        backgroundColor: s.avgBattery >= 50 ? "#22c55e" : s.avgBattery >= 25 ? "#f97316" : "#ef4444",
                      }}
                    />
                  </div>
                  <p className="text-[10px] font-mono text-foreground mt-0.5">{s.avgBattery}%</p>
                </div>
              </div>

              {/* Top states bar chart */}
              <div className="px-4 pb-4">
                <p className="text-[10px] text-muted-foreground font-semibold mb-2 uppercase tracking-wider">
                  Top States by Mast Count
                </p>
                <div className="h-36">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={s.topStates} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis type="category" dataKey="state" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} width={60} />
                      <Tooltip
                        contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 11 }}
                      />
                      <Bar dataKey="count" fill={p.color} radius={[0, 4, 4, 0]} name="Masts" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
